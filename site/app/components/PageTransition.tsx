import React from 'react';
import { LayoutGroup } from 'motion/react';
import { useLocation } from 'react-router';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <LayoutGroup>
      <div key={location.pathname}>
        {children}
      </div>
    </LayoutGroup>
  );
}