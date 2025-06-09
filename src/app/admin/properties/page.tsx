'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { PropertyItem } from '@/models/property';

interface Property extends Omit<PropertyItem, keyof Document | 'agentId'> {
  _id: string;
  agentId?:
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      }
    | string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 15,
  });

  useEffect(() => {
    fetchProperties();
  }, [currentPage]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page when searching
      } else {
        fetchProperties();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15', // Reduced to 15 properties per page
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      // Use admin-specific endpoint that filters by user role
      const response = await axios.get(`/api/admin/properties?${params}`);

      // Check if we got a redirect response (authentication error)
      if (
        typeof response.data === 'string' &&
        response.data.includes('/api/auth/signin')
      ) {
        toast.error('Please log in to view properties');
        setProperties([]);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Properties response:', response.data);
      }

      const propertiesData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setProperties(propertiesData);

      const paginationData = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 15,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('Setting pagination:', paginationData);
      }
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Please log in to view properties');
      } else {
        toast.error('Failed to load properties');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/properties/${propertyId}`);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const formatPrice = (price: number | string | null) => {
    if (typeof price === 'number') {
      return `$${price.toLocaleString()}`;
    }
    return price || 'Contact for Price';
  };

  const getPropertyTypeBadge = (type?: string) => {
    if (!type) return null;

    const colors: Record<string, string> = {
      House: 'bg-blue-100 text-blue-800',
      Apartment: 'bg-green-100 text-green-800',
      Townhouse: 'bg-purple-100 text-purple-800',
      Unit: 'bg-orange-100 text-orange-800',
      Villa: 'bg-pink-100 text-pink-800',
      Studio: 'bg-yellow-100 text-yellow-800',
      Duplex: 'bg-indigo-100 text-indigo-800',
    };

    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
            <p className="text-muted-foreground">
              Manage your property listings and details
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/admin/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Listings</CardTitle>
            <CardDescription>
              View and manage all properties in the system
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      {searchTerm
                        ? 'No properties found matching your search'
                        : 'No properties found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((property: Property) => (
                    <TableRow key={property._id || `property-${Math.random()}`}>
                      <TableCell className="font-medium">
                        <div className="max-w-xs">
                          <p className="truncate">
                            {property.address?.street || 'No address'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {property.address?.suburb || ''},{' '}
                            {property.address?.state || ''}{' '}
                            {property.address?.postcode || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPropertyTypeBadge(property.propertyType)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(property.price)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {property.bedrooms || 0} bed •{' '}
                            {property.bathrooms || 0} bath
                          </p>
                          {property.area && <p>{property.area} m²</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{property.address?.suburb || 'No suburb'}</p>
                          <p className="text-muted-foreground">
                            {property.address?.state || ''}{' '}
                            {property.address?.postcode || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {property.agentId &&
                          typeof property.agentId === 'object' ? (
                            <>
                              <p className="font-medium">
                                {property.agentId.firstName}{' '}
                                {property.agentId.lastName}
                              </p>
                              <p className="text-muted-foreground">
                                {property.agentId.email}
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">
                              No agent assigned
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/properties/${property._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/admin/properties/${property._id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(property._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination and Count Info */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pagination.totalCount > 0 ? (
              <>
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalCount,
                )}{' '}
                of {pagination.totalCount} properties
              </>
            ) : (
              'No properties found'
            )}
          </div>

          {/* Pagination Controls - Always show if more than 1 page */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                    if (pageNum > pagination.totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pageNum === currentPage ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={`w-10 h-8 p-0 text-sm font-medium ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  },
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            Debug: Current Page: {currentPage}, Total Pages:{' '}
            {pagination.totalPages}, Total Count: {pagination.totalCount},
            Properties Length: {properties.length}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
