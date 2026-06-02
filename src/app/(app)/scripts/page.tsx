'use client';

import { useState, useEffect } from 'react';
import { ContentCard } from '@/lib/types';
import { getCards } from '@/lib/supabase/api';
import { CardModal } from '@/components/kanban/CardModal';
import { Search, FileText } from 'lucide-react';
import { usePlatformFilter } from '@/lib/platform-filter-context';

export default function ScriptsPage() {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { platformFilter } = usePlatformFilter();
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);

  useEffect(() => {
    getCards()
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scriptsCards = cards.filter(
    (c) =>
      (c.status === 'scripted' || c.status === 'filmed' || c.status === 'edited' || c.status === 'posted') &&
      c.script &&
      c.script.trim().length > 0
  );

  const filtered = scriptsCards.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.script && c.script.toLowerCase().includes(search.toLowerCase()));
    const matchPlatform = platformFilter === 'all' || c.platform === platformFilter;
    return matchSearch && matchPlatform;
  });

  const wordCount = (text: string) => text.trim().split(/\s+/).length;

  const handleCardUpdate = (updated: ContentCard) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleCardDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="h-11 bg-[#111111] border border-white/5 rounded-xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#111111] border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Scripts Library</h1>
        <p className="text-zinc-400 text-sm mt-1">All scripts linked to your content cards</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scripts..."
            className="w-full h-11 pl-10 pr-4 bg-[#111111] border border-white/5 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <FileText className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">
            {scriptsCards.length === 0
              ? 'No scripts yet. Write a script in a card to see it here.'
              : 'No scripts match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-[#111111] border border-white/5 rounded-xl hover:bg-[#161616] hover:border-white/10 transition-all group text-left"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white group-hover:text-white">
                  {card.title}
                </span>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                  {card.script?.slice(0, 80)}...
                </p>
              </div>
              <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                card.platform === 'instagram'
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {card.platform === 'instagram' ? 'IG' : 'YT'}
              </span>
              <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                {card.script ? wordCount(card.script) : 0} words
              </span>
              <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                card.status === 'idea' ? 'bg-zinc-500/10 text-zinc-400' :
                card.status === 'scripted' ? 'bg-blue-500/10 text-blue-400' :
                card.status === 'filmed' ? 'bg-amber-500/10 text-amber-400' :
                card.status === 'edited' ? 'bg-violet-500/10 text-violet-400' :
                'bg-green-500/10 text-green-400'
              }`}>
                {card.status}
              </span>
            </button>
          ))}
        </div>
      )}

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
