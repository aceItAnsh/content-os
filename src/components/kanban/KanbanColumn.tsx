'use client';

import { ContentCard, Status } from '@/lib/types';
import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: Status;
  label: string;
  cards: ContentCard[];
  onCardClick: (card: ContentCard) => void;
  onAddCard: (status: Status) => void;
}

const STATUS_HEADER_COLORS: Record<Status, string> = {
  idea: 'bg-zinc-500/10 text-zinc-400',
  scripted: 'bg-blue-500/10 text-blue-400',
  filmed: 'bg-amber-500/10 text-amber-400',
  edited: 'bg-violet-500/10 text-violet-400',
  posted: 'bg-green-500/10 text-green-400',
};

export function KanbanColumn({
  status,
  label,
  cards,
  onCardClick,
  onAddCard,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_HEADER_COLORS[status]}`}>
            {label}
          </span>
          <span className="text-xs text-zinc-500 font-medium">
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(status)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2.5 min-h-[200px] p-2.5 rounded-xl transition-all duration-150 ${
              snapshot.isDraggingOver
                ? 'bg-indigo-500/5 border-2 border-dashed border-indigo-500/30'
                : 'bg-[#0d0d0d] border border-white/5'
            }`}
          >
            {cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24 border border-dashed border-white/10 rounded-lg">
                <span className="text-xs text-zinc-600">Drop ideas here</span>
              </div>
            )}
            {cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                onClick={() => onCardClick(card)}
              />
            ))}
            {provided.placeholder}

            {/* Add card button at bottom */}
            <button
              onClick={() => onAddCard(status)}
              className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300 hover:border-white/20 transition-all"
            >
              + Add card
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
