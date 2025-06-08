'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Home, TrendingUp } from 'lucide-react';

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(
        `/properties?search=${encodeURIComponent(searchTerm.trim())}`,
      );
    } else {
      router.push('/properties');
    }
  };

  const handleQuickSearch = (propertyType: string) => {
    router.push(`/properties?propertyType=${encodeURIComponent(propertyType)}`);
  };

  const stats = [
    { icon: Home, label: 'Properties Available', value: '100+' },
    { icon: TrendingUp, label: 'Appointments Booked', value: '50+' },
    { icon: MapPin, label: 'Areas Covered', value: '10+' },
  ];

  return (
    <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent"></div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find Your
            <span className="block text-yellow-400">Dream Home</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto">
            Discover the perfect property with our comprehensive real estate
            platform. From cozy apartments to luxury homes, we have it all.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by address - street, suburb, state, or postcode..."
                className="w-full pl-12 pr-20 py-4 text-lg rounded-full border-0 bg-white/95 backdrop-blur-sm text-gray-800 placeholder-gray-600 focus:ring-4 focus:ring-yellow-400/50 focus:outline-none focus:bg-white shadow-2xl transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-2 flex items-center cursor-pointer"
              >
                <div className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full p-3 transition-colors duration-200 shadow-lg hover:shadow-xl">
                  <Search className="h-6 w-6" />
                </div>
              </button>
            </div>
          </form>

          {/* Quick Search Tags - Ordered by average price (low to high) */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {[
              'Studio',
              'Unit',
              'Apartment',
              'Duplex',
              'Townhouse',
              'House',
              'Villa',
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickSearch(tag)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 text-gray-50"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            fill="currentColor"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            fill="currentColor"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
