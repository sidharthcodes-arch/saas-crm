import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label ? (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 
            ${error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
