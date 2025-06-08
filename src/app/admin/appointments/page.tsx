'use client';

import { useEffect, useState } from 'react';
import { Calendar, Search, Check, X, Clock, List, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
// Using native select instead of custom Select component
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import type { AppointmentItem } from '@/models/appointment';
import type { PropertyItem } from '@/models/property';
import AppointmentCalendar from '@/components/AppointmentCalendar';

interface RecentAppointment extends Omit<AppointmentItem, 'propertyId'> {
  _id: string;
  propertyId: PropertyItem | string | null;
}

// Agent Schedule Cell Component
function AgentScheduleCell({
  appointment,
  onUpdate,
}: {
  appointment: RecentAppointment;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Generate quarter-hour time options (9 AM to 6 PM)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime =
          hour > 12
            ? `${hour - 12}:${minute.toString().padStart(2, '0')} PM`
            : hour === 12
              ? `12:${minute.toString().padStart(2, '0')} PM`
              : `${hour}:${minute.toString().padStart(2, '0')} AM`;
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    // Check agentScheduledDateTime field
    if (appointment.agentScheduledDateTime) {
      const date = new Date(appointment.agentScheduledDateTime);
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
      );

      // Extract date and time separately
      const dateStr = localDate.toISOString().split('T')[0];
      const timeStr = localDate.toTimeString().slice(0, 5);

      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
    }
  }, [appointment.agentScheduledDateTime]);

  const handleSave = async () => {
    if (isLoading) return; // Prevent multiple submissions

    try {
      setIsLoading(true);
      const updateData: any = {};

      if (selectedDate && selectedTime) {
        // Combine date and time
        const dateTimeString = `${selectedDate}T${selectedTime}:00`;
        updateData.agentScheduledDateTime = new Date(
          dateTimeString,
        ).toISOString();
      } else {
        updateData.agentScheduledDateTime = null;
      }

      const response = await axios.patch(
        `/api/admin/appointments/${appointment._id}`,
        updateData,
      );

      // Enhanced success message based on API response
      let successMessage = 'Agent scheduled time updated successfully';
      if (response.data.proposalEmailSent) {
        successMessage += ' and proposal email sent to customer';
      }

      toast.success(successMessage);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating agent scheduled time:', error);
      toast.error('Failed to update scheduled time');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsLoading(false);
    // Reset to original values
    if (appointment.agentScheduledDateTime) {
      const date = new Date(appointment.agentScheduledDateTime);
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
      );

      const dateStr = localDate.toISOString().split('T')[0];
      const timeStr = localDate.toTimeString().slice(0, 5);

      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
    } else {
      setSelectedDate('');
      setSelectedTime('');
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2 min-w-[250px]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Time
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select time</option>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!selectedDate || !selectedTime || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Check agentScheduledDateTime field
  const timeToDisplay = appointment.agentScheduledDateTime;

  return (
    <div className="text-sm min-w-[150px]">
      {timeToDisplay ? (
        <div className="space-y-1">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <p className="font-medium text-blue-700 text-sm">
              {new Date(timeToDisplay).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-xs text-blue-600">
              {new Date(timeToDisplay).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            disabled={isLoading}
          >
            {isLoading ? '...' : '✏️ Edit'}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="h-8 px-3 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : '📅 Set Time'}
        </Button>
      )}
    </div>
  );
}

export default function AdminAppointments() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [filteredAppointments, setFilteredAppointments] = useState<
    RecentAppointment[]
  >([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [agents, setAgents] = useState<
    Array<{ _id: string; firstName: string; lastName: string }>
  >([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [stagingArea, setStagingArea] = useState<any[]>([]);

  const isAdmin = session?.user?.role === 'admin';
  const itemsPerPage = 20;

  useEffect(() => {
    fetchAppointments();
    fetchAgents();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when agent changes
    fetchAppointments();
  }, [selectedAgent]);

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, viewMode, selectedAgent]);

  const handleCalendarWeekChange = (_startDate: Date, _endDate: Date) => {
    // Week change handler for calendar - currently not used for additional filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchAppointments();
    }, 500); // 500ms debounce

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm]);

  // Immediate fetch for status filter changes
  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  // Set filtered appointments to all appointments since filtering is now done on backend
  useEffect(() => {
    setFilteredAppointments(appointments);
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedAgent !== 'all') {
        params.append('agentId', selectedAgent);
      }

      // Add search and status filters for backend processing
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (viewMode === 'list') {
        // List view pagination
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
      } else if (viewMode === 'calendar') {
        // For calendar view, load more data to ensure we see appointments
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30); // 30 days before
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 90); // 90 days after

        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await axios.get(
        `/api/admin/appointments?${params.toString()}`,
      );

      setAppointments(response.data.data || []);

      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalCount(response.data.pagination.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/admin/users?role=agent');
      setAgents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // If user doesn't have permission to fetch agents, just set empty array
      // This can happen if the user role doesn't allow accessing user data
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAgents([]);
      }
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: 'confirmed' | 'cancelled',
  ) => {
    try {
      const appointment = appointments.find((apt) => apt._id === appointmentId);
      const updateData: any = { status };

      // If confirming and no agentScheduledDateTime is set, use the first preferred date
      if (
        status === 'confirmed' &&
        appointment &&
        !appointment.agentScheduledDateTime &&
        appointment.customerPreferredDates?.length > 0
      ) {
        const firstPreferredDate = appointment.customerPreferredDates[0];
        const scheduledDateTime = new Date(
          `${firstPreferredDate.date}T${firstPreferredDate.time}`,
        );
        updateData.agentScheduledDateTime = scheduledDateTime.toISOString();
      }

      await axios.patch(`/api/admin/appointments/${appointmentId}`, updateData);

      let successMessage = `Appointment ${status} successfully`;
      if (status === 'confirmed' && updateData.agentScheduledDateTime) {
        successMessage += ' and scheduled date set from preferred date';
      }

      toast.success(successMessage);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleCalendarSave = async (
    changes: Array<{
      appointmentId: string;
      newDateTime: Date;
      status?: string;
    }>,
  ) => {
    try {
      let emailsSent = 0;
      let appointmentsUpdated = 0;

      // Process each change
      for (const change of changes) {
        const appointment = appointments.find(
          (apt) => apt._id === change.appointmentId,
        );
        if (!appointment) continue;

        // Update appointment in database
        const updateData: any = {};
        if (change.status) {
          updateData.status = change.status;
        }

        // For time changes, we set the agent scheduled date
        if (change.newDateTime) {
          updateData.agentScheduledDateTime = change.newDateTime.toISOString();
          console.log(
            `Setting agentScheduledDateTime for ${change.appointmentId}:`,
            change.newDateTime.toISOString(),
          );
        }

        const response = await axios.patch(
          `/api/admin/appointments/${change.appointmentId}`,
          updateData,
        );

        appointmentsUpdated++;

        // Check if email was sent (API returns this info)
        if (response.data.proposalEmailSent) {
          emailsSent++;
        }

        console.log(`Appointment ${change.appointmentId} updated:`, {
          agentScheduledDateTime: response.data.agentScheduledDateTime,
          proposalEmailSent: response.data.proposalEmailSent,
        });
      }

      // Enhanced success message
      let successMessage = `${appointmentsUpdated} appointment${appointmentsUpdated > 1 ? 's' : ''} updated successfully`;
      if (emailsSent > 0) {
        successMessage += ` and ${emailsSent} proposal email${emailsSent > 1 ? 's' : ''} sent to customer${emailsSent > 1 ? 's' : ''}`;
      }

      toast.success(successMessage);
      fetchAppointments();
    } catch (error) {
      console.error('Error saving calendar changes:', error);
      toast.error('Failed to save changes');
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">
            Manage property viewing appointments and customer requests
          </p>
        </div>

        {/* View Mode Toggle - Enhanced Visibility */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">View:</div>
          <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4" />
              <span>List View</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-2 ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Calendar View</span>
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>
              Drag and drop appointments to reschedule. Click appointments to
              change status.
            </CardDescription>

            {/* Agent Filter for Calendar View - Only for Admin */}
            {isAdmin && (
              <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Filter by Agent:
                  </span>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-[200px] h-9 px-3 py-1 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.firstName} {agent.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <AppointmentCalendar
              appointments={appointments}
              onSaveChanges={handleCalendarSave}
              onWeekChange={handleCalendarWeekChange}
              stagingArea={stagingArea}
              onStagingAreaChange={setStagingArea}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Appointment Requests</CardTitle>
            <CardDescription>
              View and manage all appointment requests from customers
            </CardDescription>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name, email, phone, or property address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Agent Filter - Only for Admin */}
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-[180px] h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.firstName} {agent.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-[180px] h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Preferred Dates</TableHead>
                  <TableHead>Agent Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      {searchTerm || statusFilter !== 'all'
                        ? 'No appointments found matching your criteria'
                        : 'No appointments found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment._id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{`${appointment.firstName} ${appointment.lastName}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate font-medium">
                            {getPropertyAddress(appointment.propertyId)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{appointment.phone}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {(appointment.customerPreferredDates || []).map(
                            (apt, index) => (
                              <p key={index}>
                                {new Date(apt.date).toLocaleDateString()} at{' '}
                                {apt.time}
                              </p>
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AgentScheduleCell
                          appointment={appointment}
                          onUpdate={fetchAppointments}
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(appointment.status || 'pending')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(appointment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateAppointmentStatus(
                                    appointment._id,
                                    'confirmed',
                                  )
                                }
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateAppointmentStatus(
                                    appointment._id,
                                    'cancelled',
                                  )
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination for List View */}
            {viewMode === 'list' && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of{' '}
                  {totalCount} appointments
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                      i;
                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : ''
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter((apt) => apt.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter((apt) => apt.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
