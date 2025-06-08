import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Property from '@/models/property';
import connectMongo from '@/lib/connectMongo';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !session.user.role ||
      !['admin', 'agent'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    let query = {};

    // If user is an agent, only show their properties
    if (session.user.role === 'agent') {
      query = { agentId: session.user.id };
    }
    // If user is admin, show all properties (no filter)

    const properties = await Property.find(query)
      .populate('agentId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !session.user.role ||
      !['admin', 'agent'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();

    // If user is an agent, automatically assign the property to them
    if (session.user.role === 'agent') {
      body.agentId = session.user.id;
    }

    const property = new Property(body);
    await property.save();

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 },
    );
  }
}
