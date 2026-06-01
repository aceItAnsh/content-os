'use client';

import { CalendarGrid } from '@/components/calendar/CalendarGrid';

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">Your content schedule at a glance</p>
      </div>
      <CalendarGrid />
    </div>
  );
}
