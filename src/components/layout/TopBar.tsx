'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const platforms = ['All', 'Instagram', 'YouTube'] as const;

interface TopBarProps {
  platformFilter: string;
  onPlatformFilterChange: (platform: string) => void;
  showFilter: boolean;
}

export function TopBar({ platformFilter, onPlatformFilterChange, showFilter }: TopBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-xl px-6 py-3 border-b border-white/5">
      {showFilter ? (
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {platforms.map((p) => {
            const value = p.toLowerCase() === 'all' ? 'all' : p.toLowerCase();
            const isActive = platformFilter === value;
            return (
              <button
                key={p}
                onClick={() => onPlatformFilterChange(value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-zinc-400 hidden sm:block">
          {user?.user_metadata?.full_name || user?.email || ''}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-zinc-400">
                  {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border border-white/10">
            <DropdownMenuLabel className="text-zinc-200 font-semibold">
              {user?.user_metadata?.full_name || 'User'}
            </DropdownMenuLabel>
            <p className="px-2 pb-2 text-[11px] text-zinc-500">{user?.email}</p>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild className="text-zinc-300 focus:text-white focus:bg-white/5 cursor-pointer">
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
