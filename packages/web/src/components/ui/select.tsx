import React from 'react';
import { clsx } from 'clsx';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectItem({ children, value, ...props }: { children: React.ReactNode; value: string } & React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option value={value} {...props}>{children}</option>;
}

export function SelectContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function SelectTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm', className)} {...props}>{children}</div>;
}

export function SelectValue({ placeholder, ...props }: { placeholder?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...props}>{placeholder}</span>;
}

export default Select;