import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Wireframe Skeleton Component
 * Adheres strictly to antislop-ui guidelines: clean matte slate surfaces,
 * subtle opacity pulse, zero neon borders or AI glare.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

export const MetricCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3 ${className}`}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-28 rounded" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
    <Skeleton className="h-9 w-20 rounded-md" />
    <Skeleton className="h-3 w-36 rounded" />
  </div>
);

export const EventCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4 ${className}`}
    aria-hidden="true"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-5 w-44 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
    </div>
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{
  columns?: number;
  rows?: number;
  className?: string;
}> = ({ columns = 5, rows = 6, className = '' }) => (
  <div
    className={`w-full divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 ${className}`}
    aria-hidden="true"
  >
    <div className="py-3 px-4 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`head-${i}`} className="h-3.5 flex-1 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={`row-${r}`} className="py-3.5 px-4 flex items-center gap-4">
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton
            key={`cell-${r}-${c}`}
            className={`h-3.5 rounded ${c === 0 ? 'flex-2' : 'flex-1'}`}
          />
        ))}
      </div>
    ))}
  </div>
);
