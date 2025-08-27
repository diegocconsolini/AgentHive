import React from 'react';
import { clsx } from 'clsx';

export interface CalendarProps extends React.HTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: (value: string) => void;
}

export function Calendar({ className, value, onChange, ...props }: CalendarProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={clsx(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export default Calendar;