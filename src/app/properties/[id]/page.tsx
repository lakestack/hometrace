'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import PriceCard from '@/components/PriceCard';
import { PropertyItem } from '@/models/property';
import ImageGallery from '@/components/ImageGallery';

interface Property extends Omit<PropertyItem, keyof Document> {
  _id: string;
  images?: string[];
}

export default function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await axios.get(`/api/properties?id=${id}`);
        const { data } = response?.data || {};
        if (Array.isArray(data) && data.length > 0) {
          setProperty(data[0]);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        setError('Failed to load property details');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">
          {error || 'Property not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-block mb-6 text-gray-600 hover:text-gray-800"
        >
          ◄ Back to listings
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-grow space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <ImageGallery
                images={property.images || []}
                alt={
                  property.address
                    ? `${property.address.street}, ${property.address.suburb}`
                    : 'Property images'
                }
              />
            </div>

            {/* PriceCard - Mobile Only */}
            <div className="lg:hidden">
              <PriceCard
                id={property._id}
                price={property.price}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                area={property.area}
                landSize={property.landSize}
                propertyType={property.propertyType}
                address={property.address}
              />
            </div>

            {/* Property Details */}
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-semibold mb-4">Features</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-gray-700"
                      >
                        <span className="mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column Info Cards - Only shown on desktop */}
          <div className="hidden lg:block lg:w-[380px]">
            <PriceCard
              id={property._id}
              price={property.price}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              area={property.area}
              landSize={property.landSize}
              propertyType={property.propertyType}
              address={property.address}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
