import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/models/appointment';
import connectMongo from '@/lib/connectMongo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 },
      );
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

    // Check if appointment has agent scheduled time
    if (!appointment.agentScheduledDateTime) {
      return NextResponse.json(
        { error: 'No proposed time found for this appointment' },
        { status: 400 },
      );
    }

    // Update appointment status based on customer response
    if (action === 'accept') {
      appointment.status = 'confirmed';
    } else if (action === 'decline') {
      appointment.status = 'cancelled';
    }

    await appointment.save();

    // Return a user-friendly HTML response
    const responseHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Response - HomeTrace</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .success {
            color: #10b981;
          }
          .cancelled {
            color: #ef4444;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 20px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .appointment-details {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
          }
          .btn {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon ${action === 'accept' ? 'success' : 'cancelled'}">
            ${action === 'accept' ? '✓' : '✗'}
          </div>
          <h1>
            ${action === 'accept' ? 'Appointment Confirmed!' : 'Appointment Declined'}
          </h1>
          <p>
            ${
              action === 'accept'
                ? 'Thank you for confirming your appointment. We look forward to seeing you!'
                : 'Your appointment has been cancelled. If you would like to reschedule, please contact your agent directly.'
            }
          </p>
          <div class="appointment-details">
            <strong>Status:</strong> ${appointment.status.toUpperCase()}<br>
            <strong>Proposed Time:</strong> ${new Date(appointment.agentScheduledDateTime).toLocaleDateString()} at ${new Date(appointment.agentScheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <a href="${process.env.NEXTAUTH_URL}" class="btn">
            Return to HomeTrace
          </a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(responseHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error processing appointment response:', error);
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 },
    );
  }
}
