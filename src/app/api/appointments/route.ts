import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/models/appointment';
import Property from '@/models/property';
import User from '@/models/user';
import connectMongo from '@/lib/connectMongo';
// Import models registry to ensure all models are registered
import '@/lib/models';
import { sendNewAppointmentNotification } from '@/lib/emailService';

export async function GET(request: NextRequest) {
  try {
    await connectMongo();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const propertyId = searchParams.get('propertyId');

    let query: any = {};

    if (propertyId) {
      query.propertyId = propertyId;
    }

    const skip = (page - 1) * limit;
    const totalCount = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('propertyId');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    const body = await request.json();

    console.log(
      'Creating appointment with data:',
      JSON.stringify(body, null, 2),
    );

    const requiredFields = [
      'propertyId',
      'firstName',
      'lastName',
      'email',
      'phone',
      'customerPreferredDates',
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    if (!Array.isArray(body.customerPreferredDates)) {
      return NextResponse.json(
        { error: 'Customer preferred dates must be an array' },
        { status: 400 },
      );
    }

    // Validate each preferred date
    for (const [index, appointment] of body.customerPreferredDates.entries()) {
      if (!appointment.date || !appointment.time) {
        return NextResponse.json(
          {
            error: `Each preferred date must have date and time. Issue with item ${index + 1}`,
          },
          { status: 400 },
        );
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointment.date)) {
        return NextResponse.json(
          {
            error: `Invalid date format for item ${index + 1}. Expected YYYY-MM-DD format`,
          },
          { status: 400 },
        );
      }

      // Validate time format (HH:MM)
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(appointment.time)) {
        return NextResponse.json(
          {
            error: `Invalid time format for item ${index + 1}. Expected HH:MM format`,
          },
          { status: 400 },
        );
      }

      // Validate quarter-hour intervals (minutes must be 00, 15, 30, or 45)
      const [hours, minutes] = appointment.time.split(':').map(Number);
      if (![0, 15, 30, 45].includes(minutes)) {
        return NextResponse.json(
          {
            error: `Invalid time for item ${index + 1}. Time must be in 15-minute intervals (e.g., 10:00, 10:15, 10:30, 10:45)`,
          },
          { status: 400 },
        );
      }

      // Validate business hours (9 AM to 6 PM)
      if (hours < 9 || hours > 18) {
        return NextResponse.json(
          {
            error: `Invalid time for item ${index + 1}. Time must be between 9:00 AM and 6:00 PM`,
          },
          { status: 400 },
        );
      }
    }

    // Get the property to find the associated agent
    const property = await Property.findById(body.propertyId);
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 },
      );
    }

    if (property.agentId) {
      body.agentId = property.agentId;
    }

    console.log('Creating appointment with validated data:', {
      propertyId: body.propertyId,
      agentId: body.agentId,
      customerPreferredDates: body.customerPreferredDates,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
    });

    const appointment = new Appointment(body);
    await appointment.save();

    console.log('Appointment saved successfully:', appointment._id);

    // Send email notification to agent if property has an agent
    if (property && property.agentId) {
      try {
        const agent = await User.findById(property.agentId);
        if (agent && agent.email) {
          const propertyAddress = `${property.address.street}, ${property.address.suburb}, ${property.address.state} ${property.address.postcode}`;

          await sendNewAppointmentNotification({
            agentEmail: agent.email,
            agentName: `${agent.firstName} ${agent.lastName}`,
            customerName: `${body.firstName} ${body.lastName}`,
            customerEmail: body.email,
            customerPhone: body.phone,
            propertyAddress,
            propertyId: body.propertyId,
            appointmentTimes: body.customerPreferredDates,
            message: body.message,
            appointmentId: (appointment._id as any).toString(),
          });

          console.log(`Email notification sent to agent: ${agent.email}`);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the appointment creation if email fails
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 },
    );
  }
}
