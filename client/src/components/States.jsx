import React from 'react';

export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-3">
    <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" style={{borderWidth:'3px'}} />
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

export const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-3">
    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
      <span className="text-red-600 text-lg font-bold">!</span>
    </div>
    <p className="text-sm font-medium text-slate-700">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-sm text-blue-600 hover:text-blue-700 underline">
        Try again
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon, title = 'No data found', message, action }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
    {icon && <div className="text-slate-300 mb-2">{icon}</div>}
    <p className="text-sm font-semibold text-slate-600">{title}</p>
    {message && <p className="text-xs text-slate-400 max-w-xs">{message}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
    <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
    <div className="h-8 bg-slate-100 rounded w-1/2 mb-2" />
    <div className="h-3 bg-slate-100 rounded w-3/4" />
  </div>
);
