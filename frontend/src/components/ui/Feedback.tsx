import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <Loader2 className={clsx('animate-spin text-[#1e3a5f]', sizes[size], className)} />
  );
};

export const Skeleton: React.FC<{
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}> = ({ className, variant = 'rect' }) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-lg',
        variant === 'text' && 'rounded h-4 w-full',
        className
      )}
    />
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 my-4">
      {icon && <div className="text-gray-400 mb-3">{icon}</div>}
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      {description && <p className="text-xs text-gray-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
