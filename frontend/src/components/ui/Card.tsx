import React from 'react';
import clsx from 'clsx';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  noPadding = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200/80 shadow-xs transition-shadow duration-200 hover:shadow-sm',
        className
      )}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && 'p-6')}>{children}</div>
    </div>
  );
};
