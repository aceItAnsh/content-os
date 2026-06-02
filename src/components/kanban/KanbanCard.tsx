'use client';

import { ContentCard } from '@/lib/types';
import { Draggable } from '@hello-pangea/dnd';
import { CalendarDays, GripVertical, Pencil } from 'lucide-react';

interface KanbanCardProps {
  card: ContentCard;
  index: number;
  onClick: () => void;
}

export function KanbanCard({ card, index, onClick }: KanbanCardProps) {
  const checklistDone = Object.values(card.checklist).filter(Boolean).length;
  const checklistTotal = Object.values(card.checklist).length;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative bg-[#161616] border rounded-xl transition-all duration-150 ${
            snapshot.isDragging
              ? 'border-indigo-500/50 shadow-xl scale-105'
              : 'border-white/5 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]'
          }`}
        >
          {/* Edit button — visible on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="absolute top-2 right-2 z-10 p-1 rounded-md bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all duration-150"
            title="Edit card"
          >
            <Pencil className="w-3 h-3" />
          </button>

          <div className="flex items-stretch">
            {/* Drag handle — separate from clickable area */}
            <div
              {...provided.dragHandleProps}
              className="flex items-center px-2 text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Card content — clickable */}
            <div
              onClick={onClick}
              className="flex-1 py-3 pr-8 space-y-3 cursor-pointer min-w-0"
            >
              {/* Platform + priority */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    card.platform === 'instagram'
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {card.platform === 'instagram'
                    ? 'Instagram'
                    : card.content_type === 'youtube_video'
                    ? 'YT Video'
                    : 'YT Shorts'}
                </span>
                {card.priority === 'high' && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
              </div>

              {/* Title */}
              <h4 className="text-[13px] font-semibold text-white line-clamp-2 leading-snug">
                {card.title}
              </h4>

              {/* Date + checklist count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  {card.scheduled_date ? (
                    new Date(card.scheduled_date + 'T12:00:00').toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  ) : (
                    <span className="text-zinc-600">No date set</span>
                  )}
                </div>
                {checklistTotal > 0 && (
                  <span className="text-[10px] text-zinc-500">
                    {checklistDone}/{checklistTotal} done
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {checklistTotal > 0 && (
            <div className="px-3 pb-3">
              <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
