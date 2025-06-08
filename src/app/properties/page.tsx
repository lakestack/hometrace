'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import PropertyCard from '@/components/PropertyCard';
import { Search, Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { PropertyItem } from '@/models/property';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Omit Document specific fields and make a client-side type
type Property = Omit<PropertyItem, 'id' | '_doc'> & { _id: string };

function PropertiesContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Filter states
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [postcode, setPostcode] = useState('');
  const [suburb, setSuburb] = useState('');
  const [state, setState] = useState('');

  // Debounced values for location filters
  const debouncedPostcode = useDebounce(postcode, 500);
  const debouncedSuburb = useDebounce(suburb, 500);
  const debouncedState = useDebounce(state, 300);

  useEffect(() => {
    // Initialize filters from URL parameters
    const search = searchParams.get('search') || '';
    const propertyTypeParam = searchParams.get('propertyType') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const bedroomsParam = searchParams.get('bedrooms') || '';
    const bathroomsParam = searchParams.get('bathrooms') || '';
    const postcodeParam = searchParams.get('postcode') || '';
    const suburbParam = searchParams.get('suburb') || '';
    const stateParam = searchParams.get('state') || '';

    setSearchTerm(search);
    setPropertyType(propertyTypeParam);
    setPriceRange({ min: minPrice, max: maxPrice });
    setBedrooms(bedroomsParam);
    setBathrooms(bathroomsParam);
    setPostcode(postcodeParam);
    setSuburb(suburbParam);
    setState(stateParam);

    // Reset and fetch properties with URL parameters directly
    setProperties([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchPropertiesWithParams(1, true, {
      search,
      propertyType: propertyTypeParam,
      minPrice,
      maxPrice,
      bedrooms: bedroomsParam,
      bathrooms: bathroomsParam,
      postcode: postcodeParam,
      suburb: suburbParam,
      state: stateParam,
    });
  }, [searchParams]);

  // Effect for debounced location filters
  useEffect(() => {
    if (
      debouncedPostcode !== postcode ||
      debouncedSuburb !== suburb ||
      debouncedState !== state
    ) {
      return; // Skip if debounced values haven't caught up yet
    }

    // Only trigger if we have actual values and they're different from URL params
    const currentPostcode = searchParams.get('postcode') || '';
    const currentSuburb = searchParams.get('suburb') || '';
    const currentState = searchParams.get('state') || '';

    if (
      debouncedPostcode !== currentPostcode ||
      debouncedSuburb !== currentSuburb ||
      debouncedState !== currentState
    ) {
      updateURL({
        search: searchTerm,
        propertyType,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        bedrooms,
        bathrooms,
        postcode: debouncedPostcode,
        suburb: debouncedSuburb,
        state: debouncedState,
      });
    }
  }, [debouncedPostcode, debouncedSuburb, debouncedState]);

  const fetchPropertiesWithParams = async (
    page: number = 1,
    reset: boolean = false,
    params?: {
      search?: string;
      propertyType?: string;
      minPrice?: string;
      maxPrice?: string;
      bedrooms?: string;
      bathrooms?: string;
      postcode?: string;
      suburb?: string;
      state?: string;
    },
  ) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const urlParams = new URLSearchParams();
      urlParams.append('page', page.toString());
      urlParams.append('limit', '9'); // 9 properties per page

      // Use provided params or current state
      const searchValue = params?.search ?? searchTerm;
      const propertyTypeValue = params?.propertyType ?? propertyType;
      const minPriceValue = params?.minPrice ?? priceRange.min;
      const maxPriceValue = params?.maxPrice ?? priceRange.max;
      const bedroomsValue = params?.bedrooms ?? bedrooms;
      const bathroomsValue = params?.bathrooms ?? bathrooms;
      const postcodeValue = params?.postcode ?? postcode;
      const suburbValue = params?.suburb ?? suburb;
      const stateValue = params?.state ?? state;

      if (searchValue) urlParams.append('search', searchValue);
      if (propertyTypeValue)
        urlParams.append('propertyType', propertyTypeValue);
      if (minPriceValue) urlParams.append('minPrice', minPriceValue);
      if (maxPriceValue) urlParams.append('maxPrice', maxPriceValue);
      if (bedroomsValue) urlParams.append('bedrooms', bedroomsValue);
      if (bathroomsValue) urlParams.append('bathrooms', bathroomsValue);
      if (postcodeValue) urlParams.append('postcode', postcodeValue);
      if (suburbValue) urlParams.append('suburb', suburbValue);
      if (stateValue) urlParams.append('state', stateValue);

      const response = await axios.get(
        `/api/properties?${urlParams.toString()}`,
      );
      const newProperties = response?.data?.data || [];
      const total = response?.data?.meta?.total || response?.data?.total || 0;
      const limit = response?.data?.meta?.limit || 9;
      const totalPages = Math.ceil(total / limit);

      setTotalCount(total);

      if (reset) {
        setProperties(newProperties);
      } else {
        // Filter out any properties that already exist to prevent duplicates
        setProperties((prev) => {
          const existingIds = new Set(prev.map((p: Property) => p._id));
          const uniqueNewProperties = newProperties.filter(
            (p: Property) => !existingIds.has(p._id),
          );
          return [...prev, ...uniqueNewProperties];
        });
      }

      setHasMore(page < totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPropertiesWithParams(currentPage + 1, false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px 0px',
      },
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, currentPage, totalCount]);

  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams();

    // Add all non-empty parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim()) {
        newParams.set(key, value);
      }
    });

    const newURL = `/properties${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    router.push(newURL);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({
      search: searchTerm,
      propertyType,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      bedrooms,
      bathrooms,
      postcode,
      suburb,
      state,
    });
  };

  const handleFilterChange = () => {
    updateURL({
      search: searchTerm,
      propertyType,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      bedrooms,
      bathrooms,
      postcode,
      suburb,
      state,
    });
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setBedrooms('');
    setBathrooms('');
    setPropertyType('');
    setSearchTerm('');
    setPostcode('');
    setSuburb('');
    setState('');
    router.push('/properties');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            All Properties
          </h1>

          {/* Search and Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by address - street, suburb, state, or postcode..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Property Type Quick Filters - Ordered by average price (low to high) */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {[
                'Studio',
                'Unit',
                'Apartment',
                'Duplex',
                'Townhouse',
                'House',
                'Villa',
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setPropertyType(propertyType === type ? '' : type);
                    updateURL({
                      search: searchTerm,
                      propertyType: propertyType === type ? '' : type,
                      minPrice: priceRange.min,
                      maxPrice: priceRange.max,
                      bedrooms,
                      bathrooms,
                      postcode,
                      suburb,
                      state,
                    });
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    propertyType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Location Quick Filters */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Quick Location Search
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Postcode Search */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={postcode}
                  placeholder="e.g. 2000, 3000"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>

              {/* Suburb Search */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Suburb
                </label>
                <input
                  type="text"
                  value={suburb}
                  placeholder="e.g. Glebe"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setSuburb(e.target.value)}
                />
              </div>

              {/* State Search */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  State
                </label>
                <select
                  value={state}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">Select State</option>
                  <option value="NSW">New South Wales</option>
                  <option value="VIC">Victoria</option>
                  <option value="QLD">Queensland</option>
                  <option value="WA">Western Australia</option>
                  <option value="SA">South Australia</option>
                  <option value="TAS">Tasmania</option>
                  <option value="ACT">Australian Capital Territory</option>
                  <option value="NT">Northern Territory</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms
                  </label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Any Type</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Townhouse">Townhouse</option>
                  </select>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-col space-y-2 md:col-span-2 lg:col-span-1">
                  <button
                    onClick={handleFilterChange}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200 cursor-pointer"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm transition-colors duration-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(9)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="bg-gray-200 rounded-lg h-96 animate-pulse"
              ></div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {properties.length} of {totalCount} properties
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property, index) => (
                <PropertyCard
                  key={property._id || `property-${index}`}
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

            {/* Infinite Scroll Trigger */}
            <div className="mt-8 w-full">
              <div
                ref={loadMoreRef}
                className="h-32 w-full flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg"
              >
                {loadingMore && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more properties...</span>
                  </div>
                )}
                {!hasMore && properties.length > 0 && (
                  <p className="text-gray-500 text-center">
                    You've reached the end of all properties
                  </p>
                )}
                {hasMore && !loadingMore && (
                  <p className="text-gray-400 text-center">
                    Scroll down to load more properties...
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search criteria or filters to find more
                properties.
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading properties...</p>
          </div>
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
