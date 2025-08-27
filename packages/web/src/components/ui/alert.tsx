import React from 'react';
import { clsx } from 'clsx';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export function Alert({ children, className, variant = 'default', ...props }: AlertProps) {
  const variants = {
    default: 'border-border text-foreground',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive'
  };
  
  return (
    <div 
      className={clsx(
        'relative w-full rounded-lg border p-4',
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('text-sm [&_p]:leading-relaxed', className)} {...props}>
      {children}
    </div>
  );
}

export function AlertTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={clsx('mb-1 font-medium leading-none tracking-tight', className)} {...props}>
      {children}
    </h5>
  );
}

export default Alert;