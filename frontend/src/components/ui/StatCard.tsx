import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'accent' | 'warning' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'primary',
}) => {
  const iconColors = {
    primary: 'bg-blue-50 text-[#1e3a5f]',
    accent: 'bg-emerald-50 text-[#10b981]',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900 mt-1.5">{value}</h4>
        </div>
        {icon && (
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', iconColors[color])}>
            {icon}
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3.5 flex items-center text-xs gap-1.5 pt-3 border-t border-gray-100">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center font-semibold gap-0.5',
                trend === 'up' && 'text-emerald-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-gray-500'
              )}
            >
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-gray-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
