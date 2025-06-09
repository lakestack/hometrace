import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Property from '@/models/property';
import connectMongo from '@/lib/connectMongo';
// Import models registry to ensure all models are registered
import '@/lib/models';

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

    // Get pagination parameters
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const search = req.nextUrl.searchParams.get('search');

    console.log('Properties API - Pagination params:', { page, limit, search });

    let query: any = {};

    // If user is an agent, only show their properties
    if (session.user.role === 'agent') {
      query.agentId = session.user.id;
    }
    // If user is admin, show all properties (no additional filter)

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: searchRegex },
        { 'address.street': searchRegex },
        { 'address.suburb': searchRegex },
        { 'address.state': searchRegex },
        { 'address.postcode': searchRegex },
        { propertyType: searchRegex },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Property.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get properties with pagination
    const properties = await Property.find(query)
      .populate('agentId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const paginationInfo = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit,
    };

    console.log('Properties API - Response:', {
      propertiesCount: properties.length,
      pagination: paginationInfo,
    });

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: paginationInfo,
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
