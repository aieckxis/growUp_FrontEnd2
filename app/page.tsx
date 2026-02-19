"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import React from 'react';

const RootPageRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-700">
      <Home className="w-8 h-8 animate-bounce text-emerald-600 mb-4" />
      <h1 className="text-xl font-semibold">Redirecting to Dashboard...</h1>
    </div>
  );
};

export default RootPageRedirect;