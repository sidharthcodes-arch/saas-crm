import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export function Card({ children, title, subtitle, footer, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`} {...props}>
      {title || subtitle ? (
        <div className="px-6 py-4 border-b border-gray-200">
          {title ? <h3 className="text-base font-semibold text-gray-900">{title}</h3> : null}
          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      ) : null}
      
      <div className="px-6 py-4">
        {children}
      </div>

      {footer ? (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
export default Card;
