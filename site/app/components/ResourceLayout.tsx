import React from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

interface ResourceLayoutProps {
  children: React.ReactNode;
}

export function ResourceLayout({ children }: ResourceLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {children}
      <Footer />
    </div>
  );
}