import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Property from '@/models/property';
import connectMongo from '@/lib/connectMongo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    // Allow both admin and agent roles
    if (
      !session?.user ||
      !session.user.role ||
      !['admin', 'agent'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const resolvedParams = await params;
    const property = await Property.findById(resolvedParams.id);

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 },
      );
    }

    // If user is an agent, ensure they can only access their own properties
    if (session.user.role === 'agent') {
      if (property.agentId?.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only access your own properties' },
          { status: 403 },
        );
      }
    }
    // Admin can access any property (no additional check needed)

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    // Allow both admin and agent roles
    if (
      !session?.user ||
      !session.user.role ||
      !['admin', 'agent'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const resolvedParams = await params;

    // Check if property exists and user has permission to edit it
    const existingProperty = await Property.findById(resolvedParams.id);
    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 },
      );
    }

    // If user is an agent, ensure they can only edit their own properties
    if (session.user.role === 'agent') {
      if (existingProperty.agentId?.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only edit your own properties' },
          { status: 403 },
        );
      }
    }
    // Admin can edit any property (no additional check needed)

    const updateData = await req.json();

    // Validate required fields
    if (
      !updateData.description ||
      !updateData.address?.street ||
      !updateData.address?.suburb ||
      !updateData.address?.state ||
      !updateData.address?.postcode
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: description, street, suburb, state, postcode',
        },
        { status: 400 },
      );
    }

    // Validate postcode format
    if (!/^\d{4}$/.test(updateData.address.postcode)) {
      return NextResponse.json(
        { error: 'Postcode must be a 4-digit number' },
        { status: 400 },
      );
    }

    // Validate state
    const validStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
    if (!validStates.includes(updateData.address.state)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Prepare update data
    const updateFields: any = {
      description: updateData.description,
      address: {
        street: updateData.address.street,
        suburb: updateData.address.suburb,
        state: updateData.address.state.toUpperCase(),
        postcode: updateData.address.postcode,
        country: updateData.address.country || 'Australia',
      },
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (
      updateData.price !== undefined &&
      updateData.price !== null &&
      updateData.price !== ''
    ) {
      updateFields.price = updateData.price;
    }

    if (
      updateData.area !== undefined &&
      updateData.area !== null &&
      updateData.area !== ''
    ) {
      updateFields.area = Number(updateData.area);
    }

    if (
      updateData.bedrooms !== undefined &&
      updateData.bedrooms !== null &&
      updateData.bedrooms !== ''
    ) {
      updateFields.bedrooms = Number(updateData.bedrooms);
    }

    if (
      updateData.bathrooms !== undefined &&
      updateData.bathrooms !== null &&
      updateData.bathrooms !== ''
    ) {
      updateFields.bathrooms = Number(updateData.bathrooms);
    }

    if (
      updateData.parking !== undefined &&
      updateData.parking !== null &&
      updateData.parking !== ''
    ) {
      updateFields.parking = updateData.parking;
    }

    if (
      updateData.propertyType !== undefined &&
      updateData.propertyType !== null &&
      updateData.propertyType !== ''
    ) {
      updateFields.propertyType = updateData.propertyType;
    }

    if (
      updateData.landSize !== undefined &&
      updateData.landSize !== null &&
      updateData.landSize !== ''
    ) {
      updateFields.landSize = Number(updateData.landSize);
    }

    if (updateData.features !== undefined && updateData.features !== null) {
      updateFields.features = Array.isArray(updateData.features)
        ? updateData.features
        : [];
    }

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      resolvedParams.id,
      updateFields,
      { new: true, runValidators: true },
    );

    if (!updatedProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (error) {
    console.error('Error updating property:', error);

    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: 'Validation error: ' + error.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    // Allow both admin and agent roles
    if (
      !session?.user ||
      !session.user.role ||
      !['admin', 'agent'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const resolvedParams = await params;
    const property = await Property.findById(resolvedParams.id);

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 },
      );
    }

    // If user is an agent, ensure they can only delete their own properties
    if (session.user.role === 'agent') {
      if (property.agentId?.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only delete your own properties' },
          { status: 403 },
        );
      }
    }
    // Admin can delete any property (no additional check needed)

    await Property.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 },
    );
  }
}
