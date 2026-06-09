import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function LoadingSkeleton({
  variant = 'rect',
  width = '100%',
  height = '1rem',
  className = '',
}: LoadingSkeletonProps) {
  const baseStyle = 'animate-pulse bg-gray-200';
  
  const variants = {
    text: 'rounded',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${className}`}
      style={style}
    />
  );
}
export default LoadingSkeleton;
