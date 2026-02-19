"use client"

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Camera, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';

// --- Local Navbar Component ---
const Navbar: React.FC<{ time: string }> = ({ time }) => (
  <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
    <span className="font-bold text-gray-900">GROWUP</span>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      <span className="text-xs text-gray-600">{time}</span>
    </div>
  </div>
);

// --- Local BottomNavigation Component ---
const tabs: {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
    { id: "dashboard", label: "Home", href: "/dashboard", icon: Home },
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "camera", label: "Camera", href: "/camera", icon: Camera },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ];

const BottomNavigation = () => {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around py-3">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700"
                }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN LAYOUT WRAPPER ---
interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <Navbar time={currentTime.toLocaleTimeString()} />

      <div className="px-4 py-5 pb-24">
        {children}
      </div>

      <BottomNavigation />
    </div>
  );
};
