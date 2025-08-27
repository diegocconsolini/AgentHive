import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open, onOpenChange }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  
  return (
    <div className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === PopoverTrigger) {
            return React.cloneElement(child, { onClick: () => handleOpenChange(!isOpen) });
          }
          if (child.type === PopoverContent) {
            return isOpen ? child : null;
          }
        }
        return child;
      })}
    </div>
  );
}

export function PopoverContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={clsx(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function PopoverTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={clsx('cursor-pointer', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export default Popover;