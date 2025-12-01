import { ReactNode } from 'react';

interface LoadingWrapperProps {
  loading: boolean;
  children: ReactNode;
  loadingText?: string;
}

export const LoadingWrapper = ({ 
  loading, 
  children, 
  loadingText = 'Loading...' 
}: LoadingWrapperProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">{loadingText}</p>
      </div>
    );
  }

  return <>{children}</>;
};