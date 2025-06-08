import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

export interface UserSession {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
  name?: string;
}

export async function requireAuth(req: NextRequest): Promise<UserSession> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as 'admin' | 'agent' | 'customer',
    name: session.user.name,
  };
}

export async function requireAdminOrAgent(req: NextRequest): Promise<UserSession> {
  const user = await requireAuth(req);
  
  if (!['admin', 'agent'].includes(user.role)) {
    throw new Error('Admin or Agent access required');
  }

  return user;
}

export async function requireAdmin(req: NextRequest): Promise<UserSession> {
  const user = await requireAuth(req);
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

export function canAccessProperty(userRole: string, userId: string, property: any): boolean {
  // Admin can access all properties
  if (userRole === 'admin') {
    return true;
  }
  
  // Agent can only access their own properties
  if (userRole === 'agent') {
    return property.agentId?.toString() === userId;
  }
  
  return false;
}

export function canAccessAppointment(userRole: string, userId: string, appointment: any): boolean {
  // Admin can access all appointments
  if (userRole === 'admin') {
    return true;
  }
  
  // Agent can only access appointments for their properties
  if (userRole === 'agent') {
    return appointment.agentId?.toString() === userId;
  }
  
  return false;
}

export function getPropertyFilter(userRole: string, userId: string): object {
  // Admin sees all properties
  if (userRole === 'admin') {
    return {};
  }
  
  // Agent only sees their properties
  if (userRole === 'agent') {
    return { agentId: userId };
  }
  
  return {};
}

export function getAppointmentFilter(userRole: string, userId: string): object {
  // Admin sees all appointments
  if (userRole === 'admin') {
    return {};
  }
  
  // Agent only sees appointments for their properties
  if (userRole === 'agent') {
    return { agentId: userId };
  }
  
  return {};
}
