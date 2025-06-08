import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Appointment from '@/models/appointment';
import Property from '@/models/property';
import User from '@/models/user';
import connectMongo from '@/lib/connectMongo';
import {
  sendAppointmentUpdateNotification,
  sendTimeProposalNotification,
} from '@/lib/emailService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const session = await getServerSession(authOptions);

    if (!session?.user || !['admin', 'agent'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();
    const {
      status,
      message,
      customerPreferredDates,
      agentScheduledDateTime,
      sendNotification,
    } = body;
    const { id } = await params;

    console.log(
      'Admin updating appointment:',
      id,
      'with data:',
      JSON.stringify(body, null, 2),
    );

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 },
      );
    }

    console.log('Current appointment data:', {
      id: appointment._id,
      status: appointment.status,
      customerPreferredDates: appointment.customerPreferredDates,
      agentScheduledDateTime: appointment.agentScheduledDateTime,
    });

    // Handle legacy appointments with empty customerPreferredDates
    if (
      !appointment.customerPreferredDates ||
      appointment.customerPreferredDates.length === 0
    ) {
      console.log(
        'Warning: Appointment has empty customerPreferredDates, fixing legacy data...',
      );

      // Create a default preferred date based on agentScheduledDateTime or tomorrow
      let defaultDate, defaultTime;

      if (appointment.agentScheduledDateTime) {
        const scheduledDate = new Date(appointment.agentScheduledDateTime);
        defaultDate = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD
        defaultTime = scheduledDate.toTimeString().slice(0, 5); // HH:MM
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        defaultDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
        defaultTime = '10:00';
      }

      appointment.customerPreferredDates = [
        {
          date: defaultDate,
          time: defaultTime,
        },
      ];

      console.log(
        'Fixed customerPreferredDates with default:',
        appointment.customerPreferredDates,
      );
    }

    // If user is an agent, check if they own this appointment
    if (
      session.user.role === 'agent' &&
      appointment.agentId?.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own appointments' },
        { status: 403 },
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
              {
                error: `Each preferred date must have date and time. Issue with item ${index + 1}`,
              },
              { status: 400 },
            );
          }

          // Validate date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(prefDate.date)) {
            return NextResponse.json(
              {
                error: `Invalid date format for item ${index + 1}. Expected YYYY-MM-DD format`,
              },
              { status: 400 },
            );
          }

          // Validate time format (HH:MM)
          const timeRegex = /^\d{2}:\d{2}$/;
          if (!timeRegex.test(prefDate.time)) {
            return NextResponse.json(
              {
                error: `Invalid time format for item ${index + 1}. Expected HH:MM format`,
              },
              { status: 400 },
            );
          }
        }

        appointment.customerPreferredDates = customerPreferredDates;
        console.log(
          'Updated customerPreferredDates to:',
          customerPreferredDates,
        );
      } else {
        return NextResponse.json(
          { error: 'customerPreferredDates must be an array' },
          { status: 400 },
        );
      }
    }

    // Handle agent scheduled date/time updates
    let shouldSendProposalEmail = false;

    if (agentScheduledDateTime !== undefined) {
      const oldScheduledDateTime = appointment.agentScheduledDateTime;

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
          console.log(
            'Updated agentScheduledDateTime to:',
            scheduledDate.toISOString(),
          );

          // Send proposal email when agent sets/updates scheduled time
          if (
            !oldScheduledDateTime ||
            oldScheduledDateTime.getTime() !== scheduledDate.getTime()
          ) {
            shouldSendProposalEmail = true;
            console.log('Will send proposal email due to time change');
          }
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

    // Send proposal email when agent sets/updates scheduled time
    let proposalEmailSent = false;
    if (shouldSendProposalEmail) {
      try {
        // Get property and agent information
        const property = await Property.findById(appointment.propertyId);
        const agent = await User.findById(appointment.agentId);

        if (property && agent) {
          const propertyAddress = `${property.address.street}, ${property.address.suburb}`;

          // Send time proposal email to customer
          const proposedDateTime = agentScheduledDateTime
            ? new Date(agentScheduledDateTime)
            : appointment.agentScheduledDateTime;

          const emailResult = await sendTimeProposalNotification({
            customerEmail: appointment.email,
            customerName: `${appointment.firstName} ${appointment.lastName}`,
            appointmentId: appointment._id.toString(),
            propertyAddress,
            proposedDateTime,
            agentName: `${agent.firstName} ${agent.lastName}`,
            agentEmail: agent.email,
          });

          proposalEmailSent = emailResult.success;
          console.log(
            'Time proposal email sent successfully:',
            emailResult.messageId,
          );
        }
      } catch (emailError) {
        console.error('Error sending proposal email:', emailError);
        // Don't fail the update if email fails
      }
    }

    // Send email notification if requested
    if (sendNotification) {
      try {
        // Get property and agent information
        const property = await Property.findById(appointment.propertyId);
        const agent = await User.findById(appointment.agentId);

        if (property && agent) {
          const propertyAddress = `${property.address.street}, ${property.address.suburb}`;

          await sendAppointmentUpdateNotification({
            customerEmail: appointment.email,
            customerName: `${appointment.firstName} ${appointment.lastName}`,
            appointments: [
              {
                appointmentId: appointment._id.toString(),
                propertyAddress,
                newDateTime:
                  appointment.agentScheduledDateTime ||
                  new Date(
                    `${appointment.customerPreferredDates[0].date}T${appointment.customerPreferredDates[0].time}`,
                  ),
                status: appointment.status || 'pending',
                agentName: `${agent.firstName} ${agent.lastName}`,
              },
            ],
          });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the update if email fails
      }
    }

    // Return populated appointment
    const updatedAppointment =
      await Appointment.findById(id).populate('propertyId');

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      proposalEmailSent,
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
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
