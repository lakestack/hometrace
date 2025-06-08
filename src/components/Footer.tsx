'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Company Info */}
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Hometrace</span>
            </Link>
            <p className="text-gray-400 mt-2 max-w-md">
              Your trusted partner in finding the perfect home.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex space-x-8">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/properties"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Properties
            </Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-6 pt-6 text-center">
          <div className="text-gray-400 text-sm">
            © {currentYear} Hometrace. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
