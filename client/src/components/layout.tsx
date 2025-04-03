import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { CheckSquare } from "lucide-react";
import { Tab } from '@/lib/types';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const activeTab: Tab = location === "/" 
    ? "voting" 
    : location === "/results" 
      ? "results" 
      : location === "/info" 
        ? "info" 
        : "voting";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CheckSquare className="text-primary h-6 w-6 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">VoteEase</h1>
            </div>
            <div className="hidden md:flex items-center text-sm text-gray-500">
              <span>Presidential Election 2023</span>
              <span className="mx-2">•</span>
              <span>Voting ends in 2h 45m</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <Link 
              href="/"
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'voting' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vote
            </Link>
            <Link 
              href="/results"
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'results' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Results
            </Link>
            <Link 
              href="/info"
              className={`px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'info' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Election Info
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="mb-4 md:mb-0">
              <p>&copy; {new Date().getFullYear()} VoteEase. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
              <a href="#" className="hover:text-gray-900">Help & Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
