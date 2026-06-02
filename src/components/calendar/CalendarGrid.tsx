'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { ContentCard } from '@/lib/types';
import { getCards } from '@/lib/supabase/api';
import { CardModal } from '@/components/kanban/CardModal';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCard } from '@/lib/supabase/api';
import { Platform } from '@/lib/types';
import { usePlatformFilter } from '@/lib/platform-filter-context';

export function CalendarGrid() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [newCard, setNewCard] = useState({ title: '', platform: 'instagram' as Platform });
  const { platformFilter } = usePlatformFilter();

  const loadCards = useCallback(async () => {
    try {
      const data = await getCards();
      setCards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const getCardsForDate = (date: Date) =>
    cards.filter(
      (c) => {
        if (!c.scheduled_date) return false;
        if (!isSameDay(new Date(c.scheduled_date + 'T12:00:00'), date)) return false;
        if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
        return true;
      }
    );

  const handlePrev = () => {
    setCurrentDate((d) => (viewMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  };

  const handleNext = () => {
    setCurrentDate((d) => (viewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  };

  const handleAddContent = (dateStr: string) => {
    setAddDate(dateStr);
    setAddDialogOpen(true);
  };

  const handleCreateCard = async () => {
    if (!newCard.title.trim()) return;
    try {
      const created = await createCard({
        title: newCard.title,
        platform: newCard.platform,
        scheduled_date: addDate,
      });
      setCards((prev) => [created, ...prev]);
      setAddDialogOpen(false);
      setNewCard({ title: '', platform: 'instagram' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardUpdate = (updated: ContentCard) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleCardDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const renderDays = () => {
    const days = [];
    let start: Date;
    let end: Date;

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 1 });
      end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    }

    let day = start;
    while (day <= end) {
      const dayCards = getCardsForDate(day);
      const isToday = isSameDay(day, new Date());
      const isCurrentMonth = isSameMonth(day, currentDate);
      const dateStr = format(day, 'yyyy-MM-dd');
      const maxVisible = 3;
      const overflow = dayCards.length - maxVisible;

      days.push(
        <div
          key={dateStr}
          className={`group bg-[#111111] border border-white/5 rounded-lg p-1 sm:p-2 min-h-[100px] sm:min-h-[120px] ${
            viewMode === 'week' ? 'min-h-[200px]' : ''
          } ${!isCurrentMonth && viewMode === 'month' ? 'opacity-40' : ''} ${
            isToday ? 'border-indigo-500/50 bg-indigo-500/5' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-xs font-medium ${
                isToday
                  ? 'bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                  : 'text-zinc-500'
              }`}
            >
              {format(day, 'd')}
            </span>
            <button
              onClick={() => handleAddContent(dateStr)}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded hover:bg-white/5"
            >
              <Plus className="w-3 h-3 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>
          <div className="space-y-1">
            {dayCards.slice(0, maxVisible).map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium transition-colors ${
                  card.platform === 'instagram'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 hover:from-purple-500/30 hover:to-pink-500/30'
                    : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                }`}
              >
                {card.title}
              </button>
            ))}
            {overflow > 0 && (
              <span className="text-[10px] text-zinc-500 font-medium pl-1">
                +{overflow} more
              </span>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }

    return days;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="bg-[#111111] border border-white/5 rounded-lg min-h-[120px] p-2 animate-pulse">
            <div className="h-4 w-4 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
            <ChevronLeft className="h-4 w-4 text-zinc-400" />
          </button>
          <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
          </h2>
          <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg hidden sm:flex">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'month' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'week' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 overflow-x-hidden">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-zinc-500 py-2"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
        {renderDays()}
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-[#111111] border border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Content for {addDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Title</Label>
              <Input
                value={newCard.title}
                onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                placeholder="Content idea"
                autoFocus
                className="bg-[#0a0a0a] border-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Platform</Label>
              <Select
                value={newCard.platform}
                onValueChange={(v) => setNewCard({ ...newCard, platform: v as Platform })}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAddDialogOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                Cancel
              </Button>
              <Button onClick={handleCreateCard} disabled={!newCard.title.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
