import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Appointment from '@/models/appointment';
import connectMongo from '@/lib/connectMongo';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    console.log('Starting appointment cleanup...');

    // Find appointments with empty or missing customerPreferredDates
    const problematicAppointments = await Appointment.find({
      $or: [
        { customerPreferredDates: { $exists: false } },
        { customerPreferredDates: { $size: 0 } },
        { customerPreferredDates: null },
      ],
    });

    console.log(`Found ${problematicAppointments.length} appointments with empty customerPreferredDates`);

    let fixedCount = 0;
    let deletedCount = 0;

    for (const appointment of problematicAppointments) {
      console.log(`Processing appointment ${appointment._id}:`, {
        customerPreferredDates: appointment.customerPreferredDates,
        agentScheduledDateTime: appointment.agentScheduledDateTime,
        status: appointment.status,
      });

      // If the appointment has an agentScheduledDateTime, we can create a default preferred date
      if (appointment.agentScheduledDateTime) {
        const scheduledDate = new Date(appointment.agentScheduledDateTime);
        const defaultPreferredDate = {
          date: scheduledDate.toISOString().split('T')[0], // YYYY-MM-DD format
          time: scheduledDate.toTimeString().slice(0, 5), // HH:MM format
        };

        appointment.customerPreferredDates = [defaultPreferredDate];
        
        // Temporarily disable validation for this save
        await appointment.save({ validateBeforeSave: false });
        
        console.log(`Fixed appointment ${appointment._id} with default preferred date:`, defaultPreferredDate);
        fixedCount++;
      } else {
        // If no agentScheduledDateTime, create a default preferred date for tomorrow at 10:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const defaultPreferredDate = {
          date: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD format
          time: '10:00',
        };

        appointment.customerPreferredDates = [defaultPreferredDate];
        
        // Temporarily disable validation for this save
        await appointment.save({ validateBeforeSave: false });
        
        console.log(`Fixed appointment ${appointment._id} with default preferred date for tomorrow:`, defaultPreferredDate);
        fixedCount++;
      }
    }

    console.log(`Cleanup completed: ${fixedCount} appointments fixed, ${deletedCount} appointments deleted`);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      results: {
        totalProblematic: problematicAppointments.length,
        fixed: fixedCount,
        deleted: deletedCount,
      },
    });
  } catch (error) {
    console.error('Error during appointment cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup appointments' },
      { status: 500 },
    );
  }
}
