import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/models/appointment';
import Property from '@/models/property';
import User from '@/models/user';
import connectMongo from '@/lib/connectMongo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectMongo();
    const { id } = await params;

    const appointment = await Appointment.findById(id).populate('propertyId');

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectMongo();

    const body = await req.json();
    const {
      status,
      message,
      customerPreferredDates,
      agentScheduledDateTime,
    } = body;
    const { id } = await params;

    console.log('Updating appointment:', id, 'with data:', JSON.stringify(body, null, 2));

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 },
      );
    }

    // Update appointment fields
    if (status !== undefined) {
      appointment.status = status;
      console.log('Updated status to:', status);
    }
    
    if (message !== undefined) {
      appointment.message = message;
      console.log('Updated message to:', message);
    }

    // Handle customer preferred dates with validation
    if (customerPreferredDates !== undefined) {
      if (Array.isArray(customerPreferredDates)) {
        // Validate each preferred date
        for (const [index, prefDate] of customerPreferredDates.entries()) {
          if (!prefDate.date || !prefDate.time) {
            return NextResponse.json(
              { error: `Each preferred date must have date and time. Issue with item ${index + 1}` },
              { status: 400 },
            );
          }
          
          // Validate date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(prefDate.date)) {
            return NextResponse.json(
              { error: `Invalid date format for item ${index + 1}. Expected YYYY-MM-DD format` },
              { status: 400 },
            );
          }
          
          // Validate time format (HH:MM)
          const timeRegex = /^\d{2}:\d{2}$/;
          if (!timeRegex.test(prefDate.time)) {
            return NextResponse.json(
              { error: `Invalid time format for item ${index + 1}. Expected HH:MM format` },
              { status: 400 },
            );
          }
        }
        
        appointment.customerPreferredDates = customerPreferredDates;
        console.log('Updated customerPreferredDates to:', customerPreferredDates);
      } else {
        return NextResponse.json(
          { error: 'customerPreferredDates must be an array' },
          { status: 400 },
        );
      }
    }

    // Handle agent scheduled date/time updates with validation
    if (agentScheduledDateTime !== undefined) {
      if (agentScheduledDateTime === null) {
        appointment.agentScheduledDateTime = null;
        console.log('Cleared agentScheduledDateTime');
      } else {
        try {
          const scheduledDate = new Date(agentScheduledDateTime);
          if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json(
              { error: 'Invalid agentScheduledDateTime format' },
              { status: 400 },
            );
          }
          appointment.agentScheduledDateTime = scheduledDate;
          console.log('Updated agentScheduledDateTime to:', scheduledDate.toISOString());
        } catch (dateError) {
          console.error('Error parsing agentScheduledDateTime:', dateError);
          return NextResponse.json(
            { error: 'Invalid agentScheduledDateTime format' },
            { status: 400 },
          );
        }
      }
    }

    console.log('Saving appointment with updates...');
    await appointment.save();
    console.log('Appointment saved successfully');

    // Return populated appointment
    const updatedAppointment = await Appointment.findById(id).populate('propertyId');

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      agentScheduledDateTime: appointment.agentScheduledDateTime,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectMongo();
    const { id } = await params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 },
      );
    }

    await Appointment.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 },
    );
  }
}
