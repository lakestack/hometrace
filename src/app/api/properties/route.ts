import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/connectMongo';
import Property from '@/models/property';

export async function GET(req: NextRequest) {
  try {
    await connectMongo();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const propertyType = searchParams.get('propertyType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const postcode = searchParams.get('postcode');
    const suburb = searchParams.get('suburb');
    const state = searchParams.get('state');
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query: any = {};

    // If ID is provided, return specific property
    if (id) {
      const property = await Property.findById(id);
      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 },
        );
      }
      return NextResponse.json({
        data: [property],
        meta: { total: 1, page: 1, limit: 1 },
      });
    }

    // Build search query for address-only search with powerful partial matching
    if (search) {
      query.$or = [
        { 'address.street': { $regex: search, $options: 'i' } },
        { 'address.suburb': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
        { 'address.postcode': { $regex: search, $options: 'i' } },
      ];
    }

    // Specific location filters (separate from keyword search)
    if (postcode) {
      query['address.postcode'] = { $regex: postcode, $options: 'i' };
    }

    if (suburb) {
      query['address.suburb'] = { $regex: suburb, $options: 'i' };
    }

    if (state) {
      query['address.state'] = { $regex: state, $options: 'i' };
    }

    // Property type filter
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Bedrooms filter
    if (bedrooms) {
      query.bedrooms = { $gte: parseInt(bedrooms) };
    }

    // Bathrooms filter
    if (bathrooms) {
      query.bathrooms = { $gte: parseInt(bathrooms) };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Property.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get properties with pagination
    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      data: properties,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
      // Legacy fields for backward compatibility
      total: totalCount,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 },
    );
  }
}
