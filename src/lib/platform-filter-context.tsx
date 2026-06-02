'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface PlatformFilterContextType {
  platformFilter: string;
  setPlatformFilter: (platform: string) => void;
  showFilter: boolean;
}

const PlatformFilterContext = createContext<PlatformFilterContextType>({
  platformFilter: 'all',
  setPlatformFilter: () => {},
  showFilter: true,
});

// Platform filter is only visible on these routes
const FILTER_VISIBLE_ROUTES = ['/dashboard', '/kanban', '/calendar', '/scripts'];

export function PlatformFilterProvider({ children }: { children: ReactNode }) {
  const [platformFilter, setPlatformFilter] = useState('all');
  const pathname = usePathname();
  const showFilter = FILTER_VISIBLE_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <PlatformFilterContext.Provider value={{ platformFilter, setPlatformFilter, showFilter }}>
      {children}
    </PlatformFilterContext.Provider>
  );
}

export function usePlatformFilter() {
  return useContext(PlatformFilterContext);
}
