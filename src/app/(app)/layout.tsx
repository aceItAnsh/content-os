'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { PlatformFilterProvider, usePlatformFilter } from '@/lib/platform-filter-context';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { platformFilter, setPlatformFilter } = usePlatformFilter();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <div className="md:ml-[52px] lg:ml-60 pb-16 md:pb-0">
        <TopBar
          platformFilter={platformFilter}
          onPlatformFilterChange={setPlatformFilter}
        />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformFilterProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </PlatformFilterProvider>
  );
}
