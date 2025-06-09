import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Appointment from '@/models/appointment';
import connectMongo from '@/lib/connectMongo';
// Import models registry to ensure all models are registered
import '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    console.log('Admin appointments API called');

    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !session.user.role ||
      !['admin', 'agent'].includes(session.user.role)
    ) {
      console.log('Unauthorized access attempt:', {
        session: !!session,
        role: session?.user?.role,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', {
      role: session.user.role,
      userId: session.user.id,
    });

    await connectMongo();
    console.log('MongoDB connected successfully');

    // Test basic appointment count
    const testCount = await Appointment.countDocuments({});
    console.log('Total appointments in database:', testCount);

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const agentId = req.nextUrl.searchParams.get('agentId');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');
    const search = req.nextUrl.searchParams.get('search');
    const status = req.nextUrl.searchParams.get('status');

    console.log('Query parameters:', {
      page,
      limit,
      agentId,
      startDate,
      endDate,
      search,
      status,
    });

    // Build query object for role-based filtering
    let query: any = {};

    // If user is an agent, only show appointments for their properties
    if (session.user.role === 'agent') {
      query.agentId = session.user.id; // session.user.id contains the user ID
    } else if (session.user.role === 'admin' && agentId && agentId !== 'all') {
      // Admin can filter by specific agent
      query.agentId = agentId;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Validate date range if provided
    if (startDate && endDate) {
      try {
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

      // Build match conditions for aggregation
      const matchConditions: any[] = [];

      // Add role-based filters
      if (query.agentId) {
        matchConditions.push({ agentId: query.agentId });
      }

      // Add status filter
      if (query.status) {
        matchConditions.push({ status: query.status });
      }

      // Add date filters - handle them properly for aggregation
      if (startDate && endDate) {
        try {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);

          if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
            matchConditions.push({
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
            });
          }
        } catch (dateError) {
          console.error(
            'Error processing date range in aggregation:',
            dateError,
          );
        }
      }

      const aggregationPipeline: any[] = [
        {
          $lookup: {
            from: 'properties',
            localField: 'propertyId',
            foreignField: '_id',
            as: 'propertyData',
          },
        },
        {
          $unwind: {
            path: '$propertyData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $and: [
              // Apply all match conditions
              ...matchConditions,
              // Apply search across customer and property fields
              {
                $or: [
                  { firstName: searchRegex },
                  { lastName: searchRegex },
                  { email: searchRegex },
                  { phone: searchRegex },
                  { 'propertyData.address.street': searchRegex },
                  { 'propertyData.address.suburb': searchRegex },
                  { 'propertyData.address.state': searchRegex },
                  { 'propertyData.address.postcode': searchRegex },
                  { 'propertyData.description': searchRegex },
                ],
              },
            ].filter(
              (condition) => condition && Object.keys(condition).length > 0,
            ),
          },
        },
        {
          $addFields: {
            propertyId: '$propertyData',
          },
        },
        {
          $project: {
            propertyData: 0, // Remove the temporary field
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

      console.log(
        'Executing aggregation pipeline:',
        JSON.stringify(resultPipeline, null, 2),
      );
      appointments = await Appointment.aggregate(resultPipeline);
      console.log(
        'Aggregation completed, found',
        appointments.length,
        'appointments',
      );
    } else {
      // Use regular query when no search - fix the query structure
      let finalQuery = {};

      // Add role-based filters
      if (query.agentId) {
        finalQuery = { ...finalQuery, agentId: query.agentId };
      }

      // Add status filter
      if (query.status) {
        finalQuery = { ...finalQuery, status: query.status };
      }

      // Add date filters properly
      if (startDate && endDate) {
        try {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);

          if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
            finalQuery = {
              ...finalQuery,
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
          }
        } catch (dateError) {
          console.error(
            'Error processing date range in regular query:',
            dateError,
          );
        }
      }

      console.log(
        'Executing regular query:',
        JSON.stringify(finalQuery, null, 2),
      );
      totalCount = await Appointment.countDocuments(finalQuery);
      console.log('Count query completed, total:', totalCount);

      appointments = await Appointment.find(finalQuery)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('propertyId');
      console.log(
        'Find query completed, found',
        appointments.length,
        'appointments',
      );
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
