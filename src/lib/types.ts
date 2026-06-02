export type Platform = 'instagram' | 'youtube';
export type Status = 'idea' | 'scripted' | 'filmed' | 'edited' | 'posted';
export type Priority = 'high' | 'normal';
export type RunType = 'scrape' | 'validate' | 'script' | 'hooks' | 'full_pipeline';

export interface Checklist {
  script_written: boolean;
  hook_chosen: boolean;
  filmed: boolean;
  edited: boolean;
  caption_ready: boolean;
  posted: boolean;
}

export type ContentType = 'reel' | 'youtube_shorts' | 'youtube_video';

export interface ContentCard {
  id: string;
  user_id: string;
  title: string;
  platform: Platform;
  status: Status;
  scheduled_date: string | null;
  notes: string | null;
  script: string | null;
  hook: string | null;
  priority: Priority;
  post_url: string | null;
  checklist: Checklist;
  content_type: ContentType | null;
  created_at: string;
  updated_at: string;
}

export interface AiRun {
  id: string;
  user_id: string;
  run_type: RunType;
  topic: string;
  output: Record<string, unknown>;
  created_at: string;
}

export interface VoiceSample {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export const DEFAULT_CHECKLIST: Checklist = {
  script_written: false,
  hook_chosen: false,
  filmed: false,
  edited: false,
  caption_ready: false,
  posted: false,
};

export const STATUS_COLUMNS: { id: Status; label: string }[] = [
  { id: 'idea', label: 'Idea' },
  { id: 'scripted', label: 'Scripted' },
  { id: 'filmed', label: 'Filmed' },
  { id: 'edited', label: 'Edited' },
  { id: 'posted', label: 'Posted' },
];

export const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
};
