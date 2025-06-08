import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PropertyItem, PropertyTypeValue, Address } from '@/models/property';
import { Bed, Bath, Square, MapPin } from 'lucide-react';

type PropertyCardProps = {
  _id: string;
  price: PropertyItem['price'];
  bedrooms?: PropertyItem['bedrooms'];
  bathrooms?: PropertyItem['bathrooms'];
  area?: PropertyItem['area'];
  image?: string;
  propertyType?: PropertyTypeValue;
  address?: Address;
};

const PropertyCard: React.FC<PropertyCardProps> = ({
  _id,
  price = 'N/A',
  bedrooms = 0,
  bathrooms = 0,
  area = 0,
  image,
  propertyType,
  address,
}) => {
  const CardContent = (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
      {/* Image section */}
      <div className="relative">
        {image ? (
          <div className="flex-none h-64 w-full relative overflow-hidden">
            <Image
              src={image}
              alt={
                address ? `${address.street}, ${address.suburb}` : 'Property'
              }
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ) : (
          <div className="flex-none h-64 w-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">No Image</span>
          </div>
        )}

        {/* Property Type Badge */}
        {propertyType && (
          <div className="absolute top-4 left-4">
            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg">
              {propertyType}
            </span>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-6">
        {/* Price */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-gray-900">
            {typeof price === 'number' ? `$${price.toLocaleString()}` : price}
          </div>
        </div>

        {/* Address */}
        {address && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
              {address.street}
            </h3>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {address.suburb}, {address.state} {address.postcode}
              </span>
            </div>
          </div>
        )}

        {/* Property Details */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Bed className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{bedrooms}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Bath className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{bathrooms}</span>
            </div>
            {area > 0 && (
              <div className="flex items-center text-gray-600">
                <Square className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{area}m²</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/properties/${_id}`} passHref>
      {CardContent}
    </Link>
  );
};

export default PropertyCard;
