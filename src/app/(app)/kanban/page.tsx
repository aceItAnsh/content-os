'use client';

import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Drag and drop content cards through your pipeline
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
