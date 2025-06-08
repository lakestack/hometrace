import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/user';
import connectMongo from '@/lib/connectMongo';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    let query: any = {};

    // If user is an agent, they can only see other agents (for appointment filtering)
    if (session.user.role === 'agent') {
      if (roleFilter === 'agent') {
        query.role = 'agent';
      } else {
        // Agents can only access agent users, not all users
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (session.user.role === 'admin') {
      // Admin can see all users, with optional role filtering
      if (roleFilter) {
        query.role = roleFilter;
      }
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();
    const { firstName, lastName, email, role = 'customer' } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 },
      );
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      role,
      password: 'temp-password', // Should be changed on first login
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      {
        success: true,
        data: userResponse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    );
  }
}
