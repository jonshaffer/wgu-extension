import React from 'react';
import { cn } from '~/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-6',      // 24px
  md: 'h-8',      // 32px  
  lg: 'h-10',     // 40px
  xl: 'h-16',     // 64px
};

export function Logo({ className = "", size = 'md' }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center justify-center bg-muted rounded-lg p-2", className)}>
      <img 
        src="/images/wgu-extension-logo.png" 
        alt="Unofficial WGU Extension"
        className={cn(sizeClasses[size], "w-auto")}
      />
    </div>
  );
}