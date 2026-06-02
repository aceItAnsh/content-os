'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCards } from '@/lib/supabase/api';
import { ContentCard, STATUS_COLUMNS } from '@/lib/types';
import { Columns3, CalendarDays, Film, FileText, Plus, AlertCircle } from 'lucide-react';
import { usePlatformFilter } from '@/lib/platform-filter-context';
import { CardModal } from '@/components/kanban/CardModal';
import Link from 'next/link';

export default function DashboardPage() {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);
  const { platformFilter } = usePlatformFilter();

  const loadCards = useCallback(() => {
    getCards()
      .then(setCards)
      .catch((err) => setError(err.message || 'Failed to load cards'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const filtered = platformFilter === 'all'
    ? cards
    : cards.filter((c) => c.platform === platformFilter);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const postsThisWeek = filtered.filter(
    (c) => c.status === 'posted' && new Date(c.updated_at) >= weekAgo
  ).length;

  const scriptsCount = filtered.filter((c) => c.script && c.script.trim().length > 0).length;

  const statusCounts = STATUS_COLUMNS.map((col) => ({
    ...col,
    count: filtered.filter((c) => c.status === col.id).length,
  }));

  const handleCardUpdate = (updated: ContentCard) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCard((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleCardDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSelectedCard(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-white/5 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-3">
              <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
              <div className="h-8 w-16 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-3">
              <div className="h-8 w-12 bg-white/5 rounded animate-pulse mx-auto" />
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3 bg-red-500/5 border border-red-500/20 rounded-xl p-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-red-400 font-medium">Error loading dashboard</p>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Overview of your content pipeline</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/5 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-400 font-medium">Total Content</span>
            <Columns3 className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{filtered.length}</p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-400 font-medium">In Progress</span>
            <Film className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">
            {filtered.filter((c) => c.status !== 'idea' && c.status !== 'posted').length}
          </p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-green-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-400 font-medium">Posted This Week</span>
            <CalendarDays className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{postsThisWeek}</p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-violet-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-400 font-medium">Scripts Saved</span>
            <FileText className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{scriptsCount}</p>
        </div>
      </div>

      {/* Pipeline Status */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Pipeline Status</h2>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {statusCounts.map((s) => (
            <div key={s.id} className="bg-[#111111] border border-white/5 rounded-xl p-4 text-center hover:-translate-y-0.5 transition-transform duration-150">
              <div className="text-2xl font-bold text-white">{s.count}</div>
              <p className="text-xs text-zinc-400 mt-1 capitalize">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Content */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Recent Content</h2>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        {filtered.length === 0 ? (
          <div className="bg-[#111111] border border-white/5 rounded-xl p-12 text-center">
            <Columns3 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium">No content yet</p>
            <p className="text-sm text-zinc-500 mt-1 mb-4">Get started by adding your first idea</p>
            <Link
              href="/kanban"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first idea
            </Link>
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
            {filtered.slice(0, 5).map((card, i) => (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/5 transition-colors ${
                  i !== Math.min(filtered.length - 1, 4) ? 'border-b border-white/5' : ''
                }`}
              >
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                  card.platform === 'instagram'
                    ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {card.platform === 'instagram' ? 'IG' : 'YT'}
                </span>
                <span className="flex-1 text-sm text-zinc-200 font-medium truncate">{card.title}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                  card.status === 'idea' ? 'bg-zinc-500/10 text-zinc-400' :
                  card.status === 'scripted' ? 'bg-blue-500/10 text-blue-400' :
                  card.status === 'filmed' ? 'bg-amber-500/10 text-amber-400' :
                  card.status === 'edited' ? 'bg-violet-500/10 text-violet-400' :
                  'bg-green-500/10 text-green-400'
                }`}>
                  {card.status}
                </span>
                <span className="text-xs text-zinc-500 hidden sm:block">
                  {new Date(card.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}
