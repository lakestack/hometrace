import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import Appointment from '@/models/appointment';
import connectMongo from '@/lib/connectMongo';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || !token.role || !['admin', 'agent'].includes(token.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const agentId = req.nextUrl.searchParams.get('agentId');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');
    const search = req.nextUrl.searchParams.get('search');
    const status = req.nextUrl.searchParams.get('status');

    let query: any = {};

    // If user is an agent, only show appointments for their properties
    if (token.role === 'agent') {
      query.agentId = token.sub; // token.sub contains the user ID
    } else if (token.role === 'admin' && agentId && agentId !== 'all') {
      // Admin can filter by specific agent
      query.agentId = agentId;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Note: Search is handled in aggregation pipeline below when search term is present

    // Date range filter for calendar view
    if (startDate && endDate) {
      try {
        // For calendar view, we need to check both customer preferred dates and agent scheduled date
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Validate dates
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          console.error('Invalid date range:', { startDate, endDate });
          return NextResponse.json(
            { error: 'Invalid date range provided' },
            { status: 400 },
          );
        }

        const dateQuery = {
          $or: [
            {
              'customerPreferredDates.date': {
                $gte: startDateObj.toISOString().split('T')[0],
                $lte: endDateObj.toISOString().split('T')[0],
              },
            },
            {
              agentScheduledDateTime: {
                $gte: startDateObj,
                $lte: endDateObj,
              },
            },
          ],
        };

        if (query.$and) {
          query.$and.push(dateQuery);
        } else {
          query.$and = [dateQuery];
        }
      } catch (dateError) {
        console.error('Error processing date range:', dateError);
        return NextResponse.json(
          { error: 'Error processing date range' },
          { status: 400 },
        );
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    let appointments;
    let totalCount;

    if (search && search.trim()) {
      // Use aggregation for property search
      const searchRegex = new RegExp(search.trim(), 'i');

      const aggregationPipeline: any[] = [
        {
          $lookup: {
            from: 'properties',
            localField: 'propertyId',
            foreignField: '_id',
            as: 'propertyId',
          },
        },
        {
          $unwind: '$propertyId',
        },
        {
          $match: {
            $and: [
              // Apply role-based filters first
              ...(query.agentId ? [{ agentId: query.agentId }] : []),
              ...(query.status ? [{ status: query.status }] : []),
              // Apply date filters
              ...(query.$and || []),
              // Apply search across customer and property fields
              {
                $or: [
                  { firstName: searchRegex },
                  { lastName: searchRegex },
                  { email: searchRegex },
                  { phone: searchRegex },
                  { 'propertyId.address.street': searchRegex },
                  { 'propertyId.address.suburb': searchRegex },
                  { 'propertyId.address.state': searchRegex },
                  { 'propertyId.address.postcode': searchRegex },
                  { 'propertyId.description': searchRegex },
                ],
              },
            ].filter((condition) => Object.keys(condition).length > 0),
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ];

      // Get total count
      const countPipeline = [...aggregationPipeline, { $count: 'total' }];
      const countResult = await Appointment.aggregate(countPipeline);
      totalCount = countResult.length > 0 ? countResult[0].total : 0;

      // Get paginated results
      const resultPipeline = [
        ...aggregationPipeline,
        { $skip: skip },
        { $limit: limit },
      ];

      appointments = await Appointment.aggregate(resultPipeline);
    } else {
      // Use regular query when no search
      totalCount = await Appointment.countDocuments(query);
      appointments = await Appointment.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('propertyId');
    }

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

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointments',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 },
    );
  }
}
