import Link from 'next/link';
import React from 'react';
import { PropertyItem, PropertyTypeValue, Address } from '@/models/property';

type PriceCardProps = {
  id: string;
  price: PropertyItem['price'];
  bedrooms?: PropertyItem['bedrooms'];
  bathrooms?: PropertyItem['bathrooms'];
  area?: PropertyItem['area'];
  landSize?: PropertyItem['landSize'];
  propertyType?: PropertyTypeValue;
  address?: Address;
};

export default function PriceCard({
  id,
  price,
  bedrooms,
  bathrooms,
  area,
  landSize,
  propertyType,
  address,
}: PriceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Price Section */}
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {typeof price === 'number'
            ? `$${price.toLocaleString()}`
            : price || 'Contact for Price'}
        </h2>
      </div>

      <div className="px-4 pb-4">
        <Link href={`/properties/${id}/appointments`}>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer">
            Schedule a Viewing
          </button>
        </Link>
      </div>

      {/* Location Section */}
      {address && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">Location</h2>
          <div className="space-y-1 text-gray-700">
            <p>{address.street}</p>
            <p>{address.suburb}</p>
            <p>
              {address.state} {address.postcode}
            </p>
            {address.country && <p>{address.country}</p>}
          </div>
        </div>
      )}

      {/* Property Details Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {bedrooms && (
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-sm text-gray-500">Bedrooms</div>
              <div className="font-semibold">{bedrooms}</div>
            </div>
          )}
          {bathrooms && (
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-sm text-gray-500">Bathrooms</div>
              <div className="font-semibold">{bathrooms}</div>
            </div>
          )}
          {area && (
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-sm text-gray-500">Area</div>
              <div className="font-semibold">{area} m²</div>
            </div>
          )}
          {landSize && (
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-sm text-gray-500">Land Size</div>
              <div className="font-semibold">{landSize} m²</div>
            </div>
          )}
        </div>
        {propertyType && (
          <div className="mt-3 pt-3">
            <div className="text-sm text-gray-500">Property Type</div>
            <div className="font-semibold">{propertyType}</div>
          </div>
        )}
      </div>
    </div>
  );
}
