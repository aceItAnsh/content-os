'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PlatformFilterContextType {
  platformFilter: string;
  setPlatformFilter: (platform: string) => void;
}

const PlatformFilterContext = createContext<PlatformFilterContextType>({
  platformFilter: 'all',
  setPlatformFilter: () => {},
});

export function PlatformFilterProvider({ children }: { children: ReactNode }) {
  const [platformFilter, setPlatformFilter] = useState('all');
  return (
    <PlatformFilterContext.Provider value={{ platformFilter, setPlatformFilter }}>
      {children}
    </PlatformFilterContext.Provider>
  );
}

export function usePlatformFilter() {
  return useContext(PlatformFilterContext);
}
