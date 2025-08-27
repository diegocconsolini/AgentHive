import React from 'react';
import { clsx } from 'clsx';

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
}

export function Dialog({ children, open, className, ...props }: DialogProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className={clsx(
          'relative bg-background p-6 shadow-lg duration-200 rounded-lg border max-w-lg w-full mx-4',
          className
        )} 
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function DialogDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

export function DialogContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('grid gap-4 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTrigger({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>;
}

export default Dialog;