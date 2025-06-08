'use client';

import { useEffect, useState } from 'react';
import { Building2, Calendar, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AppointmentItem } from '@/models/appointment';
import type { PropertyItem } from '@/models/property';

interface DashboardStats {
  totalProperties: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalUsers: number;
}

// Extended AppointmentItem with populated propertyId
interface RecentAppointment extends Omit<AppointmentItem, 'propertyId'> {
  _id: string;
  propertyId: PropertyItem | string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    totalUsers: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const [statsRes, appointmentsRes] = await Promise.all([
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/appointments?limit=5'),
      ]);

      setStats(statsRes.data.data); // Access nested data property

      // Check if we got a proper JSON response or a redirect
      if (
        typeof appointmentsRes.data === 'string' &&
        appointmentsRes.data.includes('/api/auth/signin')
      ) {
        toast.error('Please log in as an admin to view appointments');
        setRecentAppointments([]);
      } else if (appointmentsRes.data && appointmentsRes.data.data) {
        setRecentAppointments(appointmentsRes.data.data);
      } else {
        setRecentAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Showing cached information.');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyAddress = (
    propertyId: PropertyItem | string | null,
  ): string => {
    if (
      propertyId &&
      typeof propertyId === 'object' &&
      'address' in propertyId
    ) {
      const addr = propertyId.address;
      return `${addr.street}, ${addr.suburb}`;
    }
    return 'Property address not available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your property management system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Appointments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingAppointments}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        {/* Only show user stats to admin */}
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
          <CardDescription>
            Latest appointment requests from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAppointments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No recent appointments
                  </TableCell>
                </TableRow>
              ) : (
                recentAppointments.map((appointment) => {
                  return (
                    <TableRow key={appointment._id}>
                      <TableCell className="font-medium">
                        {getPropertyAddress(appointment.propertyId)}
                      </TableCell>
                      <TableCell>
                        {`${appointment.firstName} ${appointment.lastName}`}
                      </TableCell>
                      <TableCell>{appointment.phone}</TableCell>
                      <TableCell>
                        {appointment.customerPreferredDates?.[0]
                          ? new Date(
                              appointment.customerPreferredDates[0].date,
                            ).toLocaleDateString()
                          : new Date(
                              appointment.createdAt,
                            ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(appointment.status || 'pending')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {new Date(appointment.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
