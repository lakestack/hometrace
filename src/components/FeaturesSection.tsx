'use client';

import {
  Search,
  Shield,
  Users,
  TrendingUp,
  Clock,
  Award,
  MapPin,
  Heart,
} from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: 'Property Search',
      description:
        'Find properties with our search filters including location, price, and property type.',
      color: 'bg-blue-500',
    },
    {
      icon: Shield,
      title: 'Verified Listings',
      description:
        'All properties are verified to ensure you get accurate information.',
      color: 'bg-green-500',
    },
    {
      icon: TrendingUp,
      title: 'Easy Management',
      description:
        'Simple and intuitive property management for administrators.',
      color: 'bg-orange-500',
    },
  ];

  const stats = [
    {
      icon: MapPin,
      number: '100+',
      label: 'Properties',
      description: 'Available listings',
    },
    {
      icon: TrendingUp,
      number: '50+',
      label: 'Appointments',
      description: 'Scheduled viewings',
    },
    {
      icon: Award,
      number: '24/7',
      label: 'Available',
      description: 'Online platform',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Features */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Hometrace?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide everything you need to find, buy, sell, or rent
            properties with confidence and ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <div
                className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h3>
            <p className="text-lg text-gray-600">
              Join the growing community of satisfied customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
