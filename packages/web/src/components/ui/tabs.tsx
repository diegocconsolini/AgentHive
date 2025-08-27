import React, { useState, createContext, useContext } from 'react';
import { clsx } from 'clsx';

type TabsContextType = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ children, defaultValue, value, onValueChange, className, ...props }: TabsProps) {
  const [activeTab, setActiveTab] = useState(value || defaultValue || '');
  
  const handleTabChange = (newValue: string) => {
    if (value === undefined) {
      setActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ activeTab: value || activeTab, setActiveTab: handleTabChange }}>
      <div className={clsx('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={clsx('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, className, ...props }: { children: React.ReactNode; value: string } & React.HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;
  
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
        className
      )}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className, ...props }: { children: React.ReactNode; value: string } & React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  const { activeTab } = context;
  
  if (activeTab !== value) return null;
  
  return (
    <div 
      className={clsx('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export default Tabs;