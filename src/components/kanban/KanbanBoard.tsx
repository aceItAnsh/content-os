'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { CardModal } from './CardModal';
import { ContentCard, Status, STATUS_COLUMNS, Platform, Priority } from '@/lib/types';
import { getCards, createCard, updateCard } from '@/lib/supabase/api';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function KanbanBoard() {
  const [supabase] = useState(() => createClient());
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addStatus, setAddStatus] = useState<Status>('idea');
  const [newCard, setNewCard] = useState({
    title: '',
    platform: 'instagram' as Platform,
    scheduled_date: '',
    priority: 'normal' as Priority,
  });

  const loadCards = useCallback(async () => {
    try {
      const data = await getCards();
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Real-time subscription — keeps all open tabs in sync
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('kanban_cards_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'content_cards',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as ContentCard;
              setCards((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              );
              setSelectedCard((prev) => (prev?.id === updated.id ? updated : prev));
            } else if (payload.eventType === 'INSERT') {
              const inserted = payload.new as ContentCard;
              setCards((prev) => {
                if (prev.some((c) => c.id === inserted.id)) return prev;
                return [inserted, ...prev];
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setCards((prev) => prev.filter((c) => c.id !== deletedId));
              setSelectedCard((prev) => (prev?.id === deletedId ? null : prev));
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  const getColumnCards = (status: Status) =>
    cards.filter((c) => c.status === status);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const cardId = result.draggableId;
    const newStatus = result.destination.droppableId as Status;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.status === newStatus) return;

    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
    );

    try {
      await updateCard(cardId, { status: newStatus });
    } catch (err) {
      console.error(err);
      loadCards(); // Revert on error
    }
  };

  const handleAddCard = async () => {
    if (!newCard.title.trim()) return;
    try {
      const created = await createCard({
        title: newCard.title,
        platform: newCard.platform,
        status: addStatus,
        scheduled_date: newCard.scheduled_date || null,
        priority: newCard.priority,
      });
      setCards((prev) => [created, ...prev]);
      setAddDialogOpen(false);
      setNewCard({ title: '', platform: 'instagram', scheduled_date: '', priority: 'normal' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = (status: Status) => {
    setAddStatus(status);
    setAddDialogOpen(true);
  };

  const handleCardUpdate = (updated: ContentCard) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    // Keep selectedCard in sync so the open modal always reflects the latest data
    setSelectedCard((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleCardDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-72 shrink-0 space-y-3">
            <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
            <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-2.5 space-y-2.5 min-h-[200px]">
              {[1, 2].map((j) => (
                <div key={j} className="bg-[#161616] border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                  <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3 bg-red-500/5 border border-red-500/20 rounded-xl p-8">
          <p className="text-red-400 font-medium">Error loading cards</p>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.id}
              label={col.label}
              cards={getColumnCards(col.id)}
              onCardClick={setSelectedCard}
              onAddCard={handleOpenAdd}
            />
          ))}
        </div>
      </DragDropContext>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newCard.title}
                onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                placeholder="Content idea or topic"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={newCard.platform}
                  onValueChange={(v) =>
                    setNewCard({ ...newCard, platform: v as Platform })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram Reels</SelectItem>
                    <SelectItem value="youtube">YouTube Shorts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newCard.priority}
                  onValueChange={(v) =>
                    setNewCard({ ...newCard, priority: v as Priority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={newCard.scheduled_date}
                onChange={(e) =>
                  setNewCard({ ...newCard, scheduled_date: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCard} disabled={!newCard.title.trim()}>
                Add Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
