'use client';

import { useState, useEffect, useRef } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isAfter,
  isToday,
  startOfDay,
  addWeeks,
  subWeeks,
  parseISO,
  subDays,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Clock,
  Calendar as CalendarIcon,
  FastForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { AppointmentItem } from '@/models/appointment';
import type { PropertyItem } from '@/models/property';
import { set } from 'mongoose';

interface RecentAppointment extends Omit<AppointmentItem, 'propertyId'> {
  _id: string;
  propertyId: PropertyItem | string | null;
}

interface CalendarEvent {
  id: string;
  appointmentId: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  customerName: string;
  propertyAddress: string;
  isOriginal: boolean; // true for user suggested times, false for agent modified times
  originalIndex?: number; // which of the 3 suggested times this represents
  isAgentScheduled?: boolean;
  durationSlots?: number; // Number of 30-minute slots this event spans
}

interface AppointmentCalendarProps {
  appointments: RecentAppointment[];
  onSaveChanges: (
    changes: Array<{
      appointmentId: string;
      newDateTime: Date;
      status?: string;
    }>,
  ) => void;
  onWeekChange?: (startDate: Date, endDate: Date) => void;
  stagingArea?: CalendarEvent[];
  onStagingAreaChange?: (stagingArea: CalendarEvent[]) => void;
}

export default function AppointmentCalendar({
  appointments,
  onSaveChanges,
  onWeekChange,
  stagingArea: externalStagingArea = [],
  onStagingAreaChange,
}: AppointmentCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Find the first appointment date or use today
    const today = new Date();
    if (appointments.length === 0) {
      return startOfWeek(today);
    }

    // Find the earliest appointment date that's today or in the future
    const futureAppointments = appointments
      .flatMap((apt) => apt.customerPreferredDates || [])
      .map((apt) => new Date(apt.date))
      .filter((date) => date >= startOfDay(today))
      .sort((a, b) => a.getTime() - b.getTime());

    if (futureAppointments.length > 0) {
      return startOfWeek(futureAppointments[0]);
    }

    return startOfWeek(today);
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [changes, setChanges] = useState<
    Array<{ appointmentId: string; newDateTime: Date; status?: string }>
  >([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [dragOverSlot, setDragOverSlot] = useState<{
    dayIndex: number;
    slotIndex: number;
    hour: number;
    minute: number;
  } | null>(null);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [quickNavDate, setQuickNavDate] = useState('');
  const [dragEdgeTimer, setDragEdgeTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const stagingArea = externalStagingArea;
  const setStagingArea = (
    updater: CalendarEvent[] | ((prev: CalendarEvent[]) => CalendarEvent[]),
  ) => {
    if (onStagingAreaChange) {
      if (typeof updater === 'function') {
        onStagingAreaChange(updater(stagingArea));
      } else {
        onStagingAreaChange(updater);
      }
    }
  };
  const dragRef = useRef<HTMLDivElement>(null);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  // Generate time slots (9 AM to 6 PM) with 15-minute intervals
  const timeSlots = Array.from({ length: 40 }, (_, i) => {
    const hour = Math.floor(i / 4) + 9; // Start from 9 AM
    const minute = (i % 4) * 15; // 0, 15, 30, or 45 minutes
    return {
      hour,
      minute,
      index: i,
      timeString: `${hour}:${minute.toString().padStart(2, '0')}`,
    };
  });

  useEffect(() => {
    generateEvents();

    // Update currentWeek when appointments change
    const today = new Date();
    if (appointments.length === 0) {
      setCurrentWeek(startOfWeek(today));
      return;
    }

    // Find the earliest appointment date that's today or in the future
    const futureAppointments = appointments
      .flatMap((apt) => {
        // Check if appointment has agentScheduledDateTime first
        if (apt.agentScheduledDateTime) {
          return [new Date(apt.agentScheduledDateTime)];
        }
        // Otherwise use customerPreferredDates
        return (apt.customerPreferredDates || []).map(
          (prefDate) => new Date(prefDate.date),
        );
      })
      .filter((date) => date >= startOfDay(today))
      .sort((a, b) => a.getTime() - b.getTime());

    if (futureAppointments.length > 0) {
      setCurrentWeek(startOfWeek(futureAppointments[0]));
    } else {
      setCurrentWeek(startOfWeek(today));
    }
  }, [appointments]);

  const generateEvents = () => {
    const newEvents: CalendarEvent[] = [];

    appointments.forEach((appointment) => {
      // Only show appointments from today onwards
      const today = startOfDay(new Date());
      const propertyAddress = getPropertyAddress(appointment.propertyId);

      // If agent has scheduled a specific date/time, use that; otherwise use customer preferred dates
      if (appointment.agentScheduledDateTime) {
        const eventDate = new Date(appointment.agentScheduledDateTime);

        // Only include future appointments
        if (isAfter(eventDate, today) || isSameDay(eventDate, today)) {
          const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour duration
          const durationSlots = Math.ceil(
            (endDate.getTime() - eventDate.getTime()) / (15 * 60 * 1000),
          ); // Calculate 15-minute slots

          newEvents.push({
            id: `${appointment._id}-agent-scheduled`,
            appointmentId: appointment._id,
            title: `${appointment.firstName} ${appointment.lastName}`,
            start: eventDate,
            end: endDate,
            status: appointment.status || 'pending',
            customerName: `${appointment.firstName} ${appointment.lastName}`,
            propertyAddress,
            isOriginal: false, // Agent scheduled time
            isAgentScheduled: true,
            durationSlots,
          });
        }
      } else {
        // Use customer preferred dates
        const preferredDates = appointment.customerPreferredDates || [];
        preferredDates.forEach((apt, index) => {
          const eventDate = new Date(apt.date);
          const [hours, minutes] = apt.time.split(':').map(Number);
          eventDate.setHours(hours, minutes, 0, 0);

          // Only include future appointments
          if (isAfter(eventDate, today) || isSameDay(eventDate, today)) {
            const endDate = new Date(eventDate);
            endDate.setHours(hours + 1, minutes, 0, 0); // Default 1-hour duration
            const durationSlots = Math.ceil(
              (endDate.getTime() - eventDate.getTime()) / (15 * 60 * 1000),
            ); // Calculate 15-minute slots

            newEvents.push({
              id: `${appointment._id}-${index}`,
              appointmentId: appointment._id,
              title: `${appointment.firstName} ${appointment.lastName}`,
              start: eventDate,
              end: endDate,
              status: appointment.status || 'pending',
              customerName: `${appointment.firstName} ${appointment.lastName}`,
              propertyAddress,
              isOriginal: true,
              isAgentScheduled: false,
              originalIndex: index,
              durationSlots,
            });
          }
        });
      }
    });

    setEvents(newEvents);
  };

  const getPropertyAddress = (
    propertyId: PropertyItem | string | null,
  ): string => {
    if (
      propertyId &&
      typeof propertyId === 'object' &&
      'address' in propertyId
    ) {
      const addr = propertyId.address;
      return `${addr.street}, ${addr.suburb}`;
    }
    return 'Property address not available';
  };

  const getEventPosition = (event: CalendarEvent, dayIndex: number) => {
    const dayEvents = events.filter(
      (e) =>
        isSameDay(e.start, weekDays[dayIndex]) &&
        e.start.getHours() === event.start.getHours() &&
        e.start.getMinutes() === event.start.getMinutes(),
    );

    // Sort events by ID for consistent positioning
    const sortedEvents = dayEvents.sort((a, b) => a.id.localeCompare(b.id));
    const eventIndex = sortedEvents.findIndex((e) => e.id === event.id);
    const totalEvents = Math.min(sortedEvents.length, 3); // Maximum 3 events

    // If more than 3 events, show only first 3
    if (eventIndex >= 3) {
      return {
        left: '0%',
        width: '0%',
        zIndex: 0,
        display: 'none',
      };
    }

    // Calculate block positioning
    const blockWidth = 100 / totalEvents;
    const leftPosition = eventIndex * blockWidth;

    return {
      left: `${leftPosition}%`,
      width: `${blockWidth}%`,
      zIndex: eventIndex + 1,
      display: 'block',
    };
  };

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (
    dayIndex: number,
    slot: { hour: number; minute: number; index: number },
    e: React.DragEvent,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({
      dayIndex,
      slotIndex: slot.index,
      hour: slot.hour,
      minute: slot.minute,
    });

    // Clear any existing edge timer
    if (dragEdgeTimer) {
      clearTimeout(dragEdgeTimer);
      setDragEdgeTimer(null);
    }

    // Check if dragging near edges for auto-navigation
    if (dayIndex === 0 && draggedEvent) {
      // Near left edge - go to previous week after delay
      const timer = setTimeout(() => {
        handleWeekChange('prev');
      }, 1000); // 1 second delay
      setDragEdgeTimer(timer);
    } else if (dayIndex === 6 && draggedEvent) {
      // Near right edge - go to next week after delay
      const timer = setTimeout(() => {
        handleWeekChange('next');
      }, 1000); // 1 second delay
      setDragEdgeTimer(timer);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Clear edge timer when leaving
    if (dragEdgeTimer) {
      clearTimeout(dragEdgeTimer);
      setDragEdgeTimer(null);
    }

    // Only clear if we're leaving the calendar grid entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = (
    dayIndex: number,
    slot: { hour: number; minute: number; index: number },
    e: React.DragEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedEvent) return;

    // Create new date more carefully to avoid timezone issues
    const targetDay = weekDays[dayIndex];
    const newDate = new Date(
      targetDay.getFullYear(),
      targetDay.getMonth(),
      targetDay.getDate(),
      slot.hour,
      slot.minute,
      0,
      0,
    );

    // Check if we're dropping on the same position
    const isSamePosition =
      isSameDay(draggedEvent.start, newDate) &&
      draggedEvent.start.getHours() === slot.hour &&
      draggedEvent.start.getMinutes() === slot.minute;

    if (isSamePosition) {
      setDraggedEvent(null);
      setDragOverSlot(null);
      return;
    }

    // Check if this event is coming from staging area
    const isFromStaging = stagingArea.find(
      (item) => item.id === draggedEvent.id,
    );

    if (isFromStaging) {
      // Handle drop from staging area
      moveFromStaging(draggedEvent, dayIndex, slot);
    } else {
      // Handle normal calendar drop
      // Create updated event
      const updatedDraggedEvent = {
        ...draggedEvent,
        start: newDate,
        end: new Date(newDate.getTime() + 60 * 60 * 1000), // Add 1 hour
        isOriginal: false, // Mark as modified by agent
      };

      // Remove all events for the same appointment (consolidate to single time)
      const otherEvents = events.filter(
        (event) => event.appointmentId !== draggedEvent.appointmentId,
      );

      // Add the updated event
      const newEvents = [...otherEvents, updatedDraggedEvent];
      setEvents(newEvents);

      // Track the change
      const newChange = {
        appointmentId: draggedEvent.appointmentId,
        newDateTime: newDate,
      };

      setChanges((prev) => {
        const existing = prev.findIndex(
          (c) => c.appointmentId === draggedEvent.appointmentId,
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newChange;
          return updated;
        }
        return [...prev, newChange];
      });
    }

    setDraggedEvent(null);
    setDragOverSlot(null);

    // Clear edge timer
    if (dragEdgeTimer) {
      clearTimeout(dragEdgeTimer);
      setDragEdgeTimer(null);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedEvent) return;

    const updatedEvents = events.map((e) =>
      e.id === selectedEvent.id ? { ...e, status: newStatus } : e,
    );
    setEvents(updatedEvents);

    // Track status change
    const statusChange = {
      appointmentId: selectedEvent.appointmentId,
      newDateTime: selectedEvent.start,
      status: newStatus,
    };

    setChanges((prev) => {
      const existing = prev.findIndex(
        (c) => c.appointmentId === selectedEvent.appointmentId,
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], status: newStatus };
        return updated;
      }
      return [...prev, statusChange];
    });

    setSelectedEvent(null);
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple clicks

    setIsSaving(true);
    try {
      await onSaveChanges(changes);
      setChanges([]);
      setStagingArea([]);
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = addDays(currentWeek, direction === 'prev' ? -7 : 7);
    setCurrentWeek(newWeek);

    if (onWeekChange) {
      const weekEnd = addDays(newWeek, 6);
      onWeekChange(newWeek, weekEnd);
    }
  };

  const handleQuickNavigation = () => {
    if (!quickNavDate) return;

    try {
      const targetDate = parseISO(quickNavDate);
      const newWeek = startOfWeek(targetDate);
      setCurrentWeek(newWeek);

      if (onWeekChange) {
        const weekEnd = addDays(newWeek, 6);
        onWeekChange(newWeek, weekEnd);
      }

      setShowQuickNav(false);
      setQuickNavDate('');
    } catch (error) {
      console.error('Invalid date format');
    }
  };

  const handleFastForward = (weeks: number) => {
    const newWeek = addWeeks(currentWeek, weeks);
    setCurrentWeek(newWeek);

    if (onWeekChange) {
      const weekEnd = addDays(newWeek, 6);
      onWeekChange(newWeek, weekEnd);
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    const newWeek = startOfWeek(today);
    setCurrentWeek(newWeek);

    if (onWeekChange) {
      const weekEnd = addDays(newWeek, 6);
      onWeekChange(newWeek, weekEnd);
    }
  };

  // Staging area functions
  const moveToStaging = (event: CalendarEvent) => {
    // Remove from calendar
    const updatedEvents = events.filter((e) => e.id !== event.id);
    setEvents(updatedEvents);

    // Add to staging area
    setStagingArea((prev) => [...prev, { ...event, isOriginal: false }]);
  };

  const moveFromStaging = (
    event: CalendarEvent,
    dayIndex: number,
    slot: { hour: number; minute: number; index: number },
  ) => {
    // Remove from staging
    const updatedStaging = stagingArea.filter((e) => e.id !== event.id);
    setStagingArea(updatedStaging);

    // Create new date for calendar placement
    const targetDay = weekDays[dayIndex];
    const newDate = new Date(
      targetDay.getFullYear(),
      targetDay.getMonth(),
      targetDay.getDate(),
      slot.hour,
      slot.minute,
      0,
      0,
    );

    // Add to calendar with new time
    const updatedEvent = {
      ...event,
      start: newDate,
      end: new Date(newDate.getTime() + 60 * 60 * 1000),
      isOriginal: false,
    };

    setEvents((prev) => [...prev, updatedEvent]);

    // Track the change
    const newChange = {
      appointmentId: event.appointmentId,
      newDateTime: newDate,
    };

    setChanges((prev) => {
      const existing = prev.findIndex(
        (c) => c.appointmentId === event.appointmentId,
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newChange;
        return updated;
      }
      return [...prev, newChange];
    });
  };

  const removeFromStaging = (eventId: string) => {
    setStagingArea((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleWeekChange('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentWeek, 'MMM d')} -{' '}
            {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleWeekChange('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Quick Navigation */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={jumpToToday}
              className="text-blue-600 hover:text-blue-700"
            >
              Today
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFastForward(2)}
              title="Jump 2 weeks forward"
            >
              <FastForward className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickNav(!showQuickNav)}
              title="Jump to specific date"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {changes.length > 0 && (
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : `Save Changes (${changes.length})`}
          </Button>
        )}
      </div>

      {/* Quick Navigation Input */}
      {showQuickNav && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Jump to date:
              </span>
            </div>
            <Input
              type="date"
              value={quickNavDate}
              onChange={(e) => setQuickNavDate(e.target.value)}
              className="w-40"
              placeholder="YYYY-MM-DD"
            />
            <Button
              onClick={handleQuickNavigation}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!quickNavDate}
            >
              Go
            </Button>
            <Button
              onClick={() => setShowQuickNav(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            💡 Tip: Use this to quickly navigate to any date when you need to
            move appointments far into the future
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Calendar Grid */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-white">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-3 text-sm font-medium text-gray-500">Time</div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-3 text-center border-l">
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-lg ${isToday(day) ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((slot) => (
            <div
              key={slot.index}
              className="grid grid-cols-8 border-b min-h-[40px]"
            >
              <div className="p-2 text-sm text-gray-500 border-r bg-gray-50">
                {slot.timeString}
              </div>
              {weekDays.map((day, dayIndex) => {
                const isDropTarget =
                  dragOverSlot?.dayIndex === dayIndex &&
                  dragOverSlot?.slotIndex === slot.index;
                const isDragActive = draggedEvent !== null;

                return (
                  <div
                    key={dayIndex}
                    className={`border-l relative p-1 transition-colors ${
                      isDropTarget
                        ? 'bg-blue-100 border-blue-300 border-2'
                        : isDragActive
                          ? 'hover:bg-blue-50'
                          : 'hover:bg-gray-50'
                    }`}
                    onDragOver={(e) => handleDragOver(dayIndex, slot, e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(dayIndex, slot, e)}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOverSlot({
                        dayIndex,
                        slotIndex: slot.index,
                        hour: slot.hour,
                        minute: slot.minute,
                      });
                    }}
                  >
                    {/* Drop indicator with time preview */}
                    {isDropTarget && draggedEvent && (
                      <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-75 rounded flex flex-col items-center justify-center z-50">
                        <div className="text-blue-600 text-xs font-bold">
                          {draggedEvent.title}
                        </div>
                        <div className="text-blue-700 text-xs font-medium">
                          {slot.hour}:{slot.minute.toString().padStart(2, '0')}{' '}
                          - {slot.hour + 1}:
                          {slot.minute.toString().padStart(2, '0')}
                        </div>
                        <div className="text-blue-500 text-xs">
                          Drop to schedule
                        </div>
                      </div>
                    )}
                    {/* Render events for this time slot */}
                    {(() => {
                      // Find events that start in this slot or span across this slot
                      const slotEvents = events.filter((event) => {
                        if (!isSameDay(event.start, day)) return false;

                        // Calculate event start slot with 15-minute precision
                        const eventHour = event.start.getHours();
                        const eventMinute = event.start.getMinutes();

                        // Only show events between 9 AM and 6 PM
                        if (eventHour < 9 || eventHour >= 18) return false;

                        const eventStartSlot =
                          (eventHour - 9) * 4 + // Hours since 9 AM * 4 slots per hour
                          Math.floor(eventMinute / 15); // 15-minute intervals
                        const eventEndSlot =
                          eventStartSlot + (event.durationSlots || 4); // Default 1 hour = 4 slots
                        const currentSlot = slot.index;

                        // Event spans across this slot
                        return (
                          currentSlot >= eventStartSlot &&
                          currentSlot < eventEndSlot
                        );
                      });

                      // Only render events that start in this slot (to avoid duplicates)
                      const eventsStartingHere = slotEvents.filter((event) => {
                        const eventHour = event.start.getHours();
                        const eventMinute = event.start.getMinutes();

                        // Skip events outside business hours
                        if (eventHour < 9 || eventHour >= 18) return false;

                        const eventStartSlot =
                          (eventHour - 9) * 4 + Math.floor(eventMinute / 15);
                        return slot.index === eventStartSlot;
                      });

                      const hasMoreThanThree = eventsStartingHere.length > 3;

                      return (
                        <>
                          {eventsStartingHere.map((event) => {
                            const position = getEventPosition(event, dayIndex);
                            if (position.display === 'none') return null;

                            const eventHeight = (event.durationSlots || 4) * 40; // 40px per 15-minute slot

                            return (
                              <div
                                key={event.id}
                                draggable
                                onDragStart={(e) => handleDragStart(event, e)}
                                onClick={() => handleEventClick(event)}
                                className={`absolute top-1 rounded p-2 text-xs transition-all cursor-move hover:shadow-md ${
                                  event.status === 'cancelled'
                                    ? 'opacity-50'
                                    : ''
                                } ${getStatusColor(event.status)} text-white`}
                                style={{
                                  left: position.left,
                                  width: position.width,
                                  height: `${eventHeight - 8}px`, // Subtract padding
                                  zIndex: position.zIndex,
                                  display: position.display,
                                }}
                              >
                                <div className="font-medium truncate">
                                  {event.title}
                                </div>
                                <div className="truncate opacity-90">
                                  {event.propertyAddress}
                                </div>
                                <div className="text-xs opacity-75 mt-1">
                                  {format(event.start, 'h:mm a')} -{' '}
                                  {format(event.end, 'h:mm a')}
                                </div>
                                {!event.isOriginal && (
                                  <div className="text-xs opacity-75">
                                    Modified
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Show "more" indicator if there are more than 3 events */}
                          {hasMoreThanThree && (
                            <div className="absolute bottom-1 right-1 bg-gray-600 text-white text-xs px-1 rounded">
                              +{eventsStartingHere.length - 3} more
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Staging Area */}
        <div className="w-80 border rounded-lg bg-gray-50">
          <div className="p-4 border-b bg-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Staging Area ({stagingArea.length})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Drag appointments here to move them across different weeks
            </p>
          </div>

          <div
            className="p-4 min-h-[400px] space-y-2"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (
                draggedEvent &&
                !stagingArea.find((item) => item.id === draggedEvent.id)
              ) {
                moveToStaging(draggedEvent);
                setDraggedEvent(null);
                setDragOverSlot(null);
              }
            }}
          >
            {stagingArea.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No appointments in staging</p>
                <p className="text-xs">Drag appointments here to move them</p>
              </div>
            ) : (
              stagingArea.map((event) => (
                <div
                  key={event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(event, e)}
                  className={`p-3 rounded border cursor-move hover:shadow-md transition-all relative group ${getStatusColor(event.status)} text-white`}
                >
                  <div className="font-medium text-sm truncate">
                    {event.title}
                  </div>
                  <div className="text-xs opacity-90 truncate">
                    {event.propertyAddress}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    Originally: {format(event.start, 'MMM d, h:mm a')}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromStaging(event.id);
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Appointment Details</h3>
            <div className="space-y-3">
              <div>
                <strong>Customer:</strong> {selectedEvent.customerName}
              </div>
              <div>
                <strong>Property:</strong> {selectedEvent.propertyAddress}
              </div>
              <div>
                <strong>Time:</strong>{' '}
                {format(selectedEvent.start, 'MMM d, yyyy h:mm a')}
              </div>
              <div>
                <strong>Status:</strong>
                <Badge
                  className={`ml-2 ${getStatusColor(selectedEvent.status)} text-white`}
                >
                  {selectedEvent.status}
                </Badge>
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <Button
                onClick={() => handleStatusChange('confirmed')}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm
              </Button>
              <Button
                onClick={() => handleStatusChange('cancelled')}
                variant="destructive"
              >
                Cancel
              </Button>
              <Button onClick={() => setSelectedEvent(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
