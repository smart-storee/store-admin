import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'danger' | 'success';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed hover-lift active:scale-95';
  
  const variants = {
    default: 'bg-[#4169E1] text-white hover:bg-[#3457C0] dark:bg-[#6366F1] dark:hover:bg-[#4F46E5] shadow-md hover:shadow-lg',
    outline: 'border-2 border-[#4169E1] text-[#4169E1] hover:bg-[#4169E1] hover:text-white dark:border-[#818cf8] dark:text-[#818cf8] dark:hover:bg-[#818cf8] dark:hover:text-white bg-transparent',
    ghost: 'text-[#4169E1] hover:bg-[#4169E120] dark:text-[#818cf8] dark:hover:bg-[#818cf820] bg-transparent',
    link: 'text-[#4169E1] underline-offset-4 hover:underline dark:text-[#818cf8] bg-transparent p-0',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] dark:bg-[#F87171] dark:hover:bg-[#EF4444] shadow-md hover:shadow-lg',
    success: 'bg-[#10B981] text-white hover:bg-[#059669] dark:bg-[#34D399] dark:hover:bg-[#10B981] shadow-md hover:shadow-lg',
  };

  const sizes = {
    default: 'h-10 py-2 px-4 text-sm',
    sm: 'h-8 px-3 text-xs rounded-md',
    lg: 'h-12 px-8 text-base rounded-lg',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
