'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import PropertyCard from '@/components/PropertyCard';
import Hero from '@/components/Hero';
import FeaturesSection from '@/components/FeaturesSection';
import type { PropertyItem } from '@/models/property';

// Omit Document specific fields and make a client-side type
type Property = Omit<PropertyItem, 'id' | '_doc'> & { _id: string };

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const response = await axios.get('/api/properties');
        const properties = response?.data?.data || [];
        setProperties(properties);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Featured Properties Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our handpicked selection of premium properties available
              for sale and rent
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-200 rounded-lg h-96 animate-pulse"
                ></div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.slice(0, 6).map((property) => (
                <PropertyCard
                  key={property._id}
                  _id={property._id}
                  price={property.price}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  area={property.area}
                  image={property.images?.[0]}
                  propertyType={property.propertyType}
                  address={property.address}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No properties found. Try adjusting your search.
              </p>
            </div>
          )}

          {properties.length > 6 && (
            <div className="text-center mt-12">
              <a
                href="/properties"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                View All Properties
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}
