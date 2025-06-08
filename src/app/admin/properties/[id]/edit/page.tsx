'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Property {
  _id: string;
  description: string;
  price: number | string | null;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: string;
  images?: string[];
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country?: string;
  };
  propertyType?: string;
  landSize?: number;
  features?: string[];
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    street: '',
    suburb: '',
    state: '',
    postcode: '',
    propertyType: '',
    landSize: '',
    features: '',
  });

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`/api/properties?id=${propertyId}`);
      const propertyData = response.data.data[0];

      if (propertyData) {
        setProperty(propertyData);
        setFormData({
          description: propertyData.description || '',
          price: propertyData.price?.toString() || '',
          area: propertyData.area?.toString() || '',
          bedrooms: propertyData.bedrooms?.toString() || '',
          bathrooms: propertyData.bathrooms?.toString() || '',
          parking: propertyData.parking || '',
          street: propertyData.address?.street || '',
          suburb: propertyData.address?.suburb || '',
          state: propertyData.address?.state || '',
          postcode: propertyData.address?.postcode || '',
          propertyType: propertyData.propertyType || '',
          landSize: propertyData.landSize?.toString() || '',
          features: propertyData.features?.join(', ') || '',
        });
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        description: formData.description,
        price: formData.price
          ? isNaN(Number(formData.price))
            ? formData.price
            : Number(formData.price)
          : null,
        area: formData.area ? Number(formData.area) : undefined,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        parking: formData.parking || undefined,
        address: {
          street: formData.street,
          suburb: formData.suburb,
          state: formData.state,
          postcode: formData.postcode,
          country: 'Australia',
        },
        propertyType: formData.propertyType || undefined,
        landSize: formData.landSize ? Number(formData.landSize) : undefined,
        features: formData.features
          ? formData.features
              .split(',')
              .map((f) => f.trim())
              .filter((f) => f)
          : [],
      };

      await axios.put(`/api/admin/properties/${propertyId}`, updateData);
      toast.success('Property updated successfully');
      router.push('/admin/properties');
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Property not found
        </h3>
        <Link href="/admin/properties">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/properties">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Property</h2>
          <p className="text-muted-foreground">Update property information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Property details and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Property description..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g. 500000 or 400000-600000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="area">Area (sqm)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="e.g. 120"
                  />
                </div>
                <div>
                  <Label htmlFor="landSize">Land Size (sqm)</Label>
                  <Input
                    id="landSize"
                    type="number"
                    value={formData.landSize}
                    onChange={(e) =>
                      handleInputChange('landSize', e.target.value)
                    }
                    placeholder="e.g. 600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) =>
                      handleInputChange('bedrooms', e.target.value)
                    }
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) =>
                      handleInputChange('bathrooms', e.target.value)
                    }
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <Label htmlFor="parking">Parking</Label>
                  <Input
                    id="parking"
                    value={formData.parking}
                    onChange={(e) =>
                      handleInputChange('parking', e.target.value)
                    }
                    placeholder="e.g. Garage"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) =>
                    handleInputChange('propertyType', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select property type</option>
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Unit">Unit</option>
                  <option value="Villa">Villa</option>
                  <option value="Studio">Studio</option>
                  <option value="Duplex">Duplex</option>
                </select>
              </div>

              <div>
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) =>
                    handleInputChange('features', e.target.value)
                  }
                  placeholder="e.g. Air Conditioning, Balcony, Dishwasher"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Property location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="e.g. 123 Main Street"
                  required
                />
              </div>

              <div>
                <Label htmlFor="suburb">Suburb</Label>
                <Input
                  id="suburb"
                  value={formData.suburb}
                  onChange={(e) => handleInputChange('suburb', e.target.value)}
                  placeholder="e.g. Glebe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select state</option>
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="QLD">QLD</option>
                    <option value="WA">WA</option>
                    <option value="SA">SA</option>
                    <option value="TAS">TAS</option>
                    <option value="ACT">ACT</option>
                    <option value="NT">NT</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) =>
                      handleInputChange('postcode', e.target.value)
                    }
                    placeholder="e.g. 2000"
                    pattern="[0-9]{4}"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Link href="/admin/properties">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
