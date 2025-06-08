import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/connectMongo';
import User from '@/models/user';
import Property from '@/models/property';
import Appointment from '@/models/appointment';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['admin', 'agent'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    let propertyQuery = {};
    let appointmentQuery = {};

    // If user is an agent, only count their properties and appointments
    if (session.user.role === 'agent') {
      propertyQuery = { agentId: session.user.id };
      appointmentQuery = { agentId: session.user.id };
    }
    // If user is admin, count all (no filter)

    const [users, properties, appointments, pendingAppointments] =
      await Promise.all([
        // Only admin can see user count
        session.user.role === 'admin'
          ? User.countDocuments()
          : Promise.resolve(0),
        Property.countDocuments(propertyQuery),
        Appointment.countDocuments(appointmentQuery),
        Appointment.countDocuments({ ...appointmentQuery, status: 'pending' }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProperties: properties,
        totalAppointments: appointments,
        pendingAppointments: pendingAppointments,
        totalUsers: users,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 },
    );
  }
}
