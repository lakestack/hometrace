import { NextRequest, NextResponse } from 'next/server';
import {
  seedAdminUser,
  seedAgentUsers,
  seedSampleProperties,
  seedSampleAppointments,
} from '@/scripts/seedFunctions';
import connectMongo from '@/lib/connectMongo';

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    // Seed in sequence to ensure dependencies are met
    const adminResult = await seedAdminUser();
    const agentResult = await seedAgentUsers();
    const propertyResult = await seedSampleProperties();
    const appointmentResult = await seedSampleAppointments();

    return NextResponse.json({
      success: true,
      results: {
        admin: adminResult,
        agents: agentResult,
        properties: propertyResult,
        appointments: appointmentResult,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Seed failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
