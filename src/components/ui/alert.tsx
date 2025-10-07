import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-blue-50 text-blue-900 border-blue-200',
  destructive: 'bg-red-50 text-red-900 border-red-200',
  success: 'bg-green-50 text-green-900 border-green-200',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200'
};

const variantIcons = {
  default: InformationCircleIcon,
  destructive: XCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon
};

export function Alert({ children, variant = 'default', className = '' }: AlertProps) {
  const Icon = variantIcons[variant];
  
  return (
    <div className={`relative w-full rounded-lg border p-4 flex ${variantStyles[variant]} ${className}`}>
      <Icon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export function AlertTitle({ children, className = '' }: AlertTitleProps) {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
}
