'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ContentCard, Checklist, Platform, Priority, Status, ContentType } from '@/lib/types';
import { updateCard, deleteCard } from '@/lib/supabase/api';
import { Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

/** Compute checklist from status (cumulative) */
function getChecklistForStatus(status: Status): Checklist {
  const base: Checklist = {
    script_written: false,
    hook_chosen: false,
    filmed: false,
    edited: false,
    caption_ready: false,
    posted: false,
  };
  switch (status) {
    case 'scripted':
      return { ...base, script_written: true };
    case 'filmed':
      return { ...base, script_written: true, hook_chosen: true, filmed: true };
    case 'edited':
      return { ...base, script_written: true, hook_chosen: true, filmed: true, edited: true };
    case 'posted':
      return { ...base, script_written: true, hook_chosen: true, filmed: true, edited: true, caption_ready: true, posted: true };
    default:
      return base;
  }
}

/** Derive status from checklist state (highest achieved) */
function getStatusFromChecklist(cl: Checklist): Status {
  if (cl.posted) return 'posted';
  if (cl.edited) return 'edited';
  if (cl.filmed) return 'filmed';
  if (cl.script_written) return 'scripted';
  return 'idea';
}

/** Checklist item order (low to high) */
const CHECKLIST_ORDER: (keyof Checklist)[] = [
  'script_written',
  'hook_chosen',
  'filmed',
  'edited',
  'caption_ready',
  'posted',
];

interface CardModalProps {
  card: ContentCard;
  open: boolean;
  onClose: () => void;
  onUpdate: (card: ContentCard) => void;
  onDelete: (id: string) => void;
}

export function CardModal({ card, open, onClose, onUpdate, onDelete }: CardModalProps) {
  const [form, setForm] = useState({ ...card });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirmUncheck, setConfirmUncheck] = useState<{ key: keyof Checklist; label: string; targetStatus: Status } | null>(null);

  // Sync form with card prop and recompute checklist when modal opens
  useEffect(() => {
    if (open) {
      const syncedChecklist = getChecklistForStatus(card.status);
      setForm({ ...card, checklist: syncedChecklist });
    }
  }, [open, card]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateCard(card.id, {
        title: form.title,
        platform: form.platform,
        scheduled_date: form.scheduled_date,
        notes: form.notes,
        script: form.script,
        hook: form.hook,
        priority: form.priority,
        post_url: form.post_url,
        checklist: form.checklist,
        status: form.status,
        content_type: form.content_type,
      });
      onUpdate(updated);
      showToast('Changes saved!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBlurSave = async () => {
    try {
      const updated = await updateCard(card.id, {
        title: form.title,
        platform: form.platform,
        scheduled_date: form.scheduled_date,
        notes: form.notes,
        script: form.script,
        hook: form.hook,
        priority: form.priority,
        post_url: form.post_url,
        checklist: form.checklist,
        status: form.status,
        content_type: form.content_type,
      });
      onUpdate(updated);
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return;
    try {
      await deleteCard(card.id);
      onDelete(card.id);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete card', 'error');
    }
  };

  const toggleChecklist = async (key: keyof Checklist) => {
    const isChecking = !form.checklist[key];

    if (isChecking) {
      // Check this item AND all items below it in hierarchy (cumulative)
      const idx = CHECKLIST_ORDER.indexOf(key);
      const newChecklist: Checklist = { ...form.checklist };
      for (let i = 0; i <= idx; i++) {
        newChecklist[CHECKLIST_ORDER[i]] = true;
      }
      const newStatus = getStatusFromChecklist(newChecklist);

      setForm((prev) => ({ ...prev, checklist: newChecklist, status: newStatus }));

      try {
        const updated = await updateCard(card.id, { checklist: newChecklist, status: newStatus });
        onUpdate(updated);
      } catch (err) {
        console.error('Checklist save failed:', err);
        setForm((prev) => ({ ...prev, checklist: form.checklist, status: form.status }));
      }
    } else {
      // Unchecking — show confirmation
      const idx = CHECKLIST_ORDER.indexOf(key);
      // Compute what status would be after unchecking this and all above
      const newChecklist: Checklist = { ...form.checklist };
      for (let i = idx; i < CHECKLIST_ORDER.length; i++) {
        newChecklist[CHECKLIST_ORDER[i]] = false;
      }
      const targetStatus = getStatusFromChecklist(newChecklist);

      const checklistItems: Record<keyof Checklist, string> = {
        script_written: 'Script written',
        hook_chosen: 'Hook chosen',
        filmed: 'Filmed',
        edited: 'Edited',
        caption_ready: 'Caption ready',
        posted: 'Posted',
      };

      setConfirmUncheck({ key, label: checklistItems[key], targetStatus });
    }
  };

  const confirmUncheckAction = async () => {
    if (!confirmUncheck) return;
    const { key } = confirmUncheck;
    const idx = CHECKLIST_ORDER.indexOf(key);
    const newChecklist: Checklist = { ...form.checklist };
    for (let i = idx; i < CHECKLIST_ORDER.length; i++) {
      newChecklist[CHECKLIST_ORDER[i]] = false;
    }
    const newStatus = getStatusFromChecklist(newChecklist);

    setForm((prev) => ({ ...prev, checklist: newChecklist, status: newStatus }));
    setConfirmUncheck(null);

    try {
      const updated = await updateCard(card.id, { checklist: newChecklist, status: newStatus });
      onUpdate(updated);
    } catch (err) {
      console.error('Checklist save failed:', err);
      setForm((prev) => ({ ...prev, checklist: form.checklist, status: form.status }));
    }
  };

  const checklistItems: { key: keyof Checklist; label: string }[] = [
    { key: 'script_written', label: 'Script written' },
    { key: 'hook_chosen', label: 'Hook chosen' },
    { key: 'filmed', label: 'Filmed' },
    { key: 'edited', label: 'Edited' },
    { key: 'caption_ready', label: 'Caption ready' },
    { key: 'posted', label: 'Posted' },
  ];

  const selectedDate = form.scheduled_date ? new Date(form.scheduled_date + 'T12:00:00') : undefined;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111111] border border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={handleBlurSave}
              className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-white placeholder:text-zinc-500"
              placeholder="Card title"
            />
            <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
              form.platform === 'instagram'
                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {form.platform === 'instagram' ? 'IG' : 'YT'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => {
                  const newPlatform = v as Platform;
                  const newContentType: ContentType | null = newPlatform === 'instagram' ? 'reel' : (form.content_type === 'reel' ? 'youtube_shorts' : form.content_type);
                  setForm({ ...form, platform: newPlatform, content_type: newContentType });
                }}
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

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.platform === 'youtube' && (
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Video Type</Label>
              <Select
                value={form.content_type || 'youtube_shorts'}
                onValueChange={(v) => setForm({ ...form, content_type: v as ContentType })}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                  <SelectItem value="youtube_video">YouTube Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Scheduled Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-md text-sm hover:border-white/20 transition-colors">
                    <CalendarIcon className="w-4 h-4 text-zinc-400" />
                    <span className={selectedDate ? 'text-white' : 'text-zinc-500'}>
                      {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#111111] border border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        setForm({ ...form, scheduled_date: dateStr });
                        setDateOpen(false);
                        updateCard(card.id, { scheduled_date: dateStr }).then(onUpdate).catch(console.error);
                      } else {
                        setForm({ ...form, scheduled_date: null });
                        setDateOpen(false);
                      }
                    }}
                    className="bg-[#111111] text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Status</Label>
              <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize ${
                form.status === 'idea' ? 'bg-zinc-500/10 text-zinc-400' :
                form.status === 'scripted' ? 'bg-blue-500/10 text-blue-400' :
                form.status === 'filmed' ? 'bg-amber-500/10 text-amber-400' :
                form.status === 'edited' ? 'bg-violet-500/10 text-violet-400' :
                'bg-green-500/10 text-green-400'
              }`}>
                {form.status}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Hook</Label>
            <Input
              value={form.hook || ''}
              onChange={(e) => setForm({ ...form, hook: e.target.value })}
              onBlur={handleBlurSave}
              placeholder="The final chosen hook for this content"
              className="bg-[#0a0a0a] border-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Script</Label>
            <Textarea
              value={form.script || ''}
              onChange={(e) => setForm({ ...form, script: e.target.value })}
              onBlur={handleBlurSave}
              placeholder="Write your script here..."
              rows={8}
              className="font-mono text-sm bg-[#0a0a0a] border-white/5 rounded-lg min-h-[192px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              onBlur={handleBlurSave}
              placeholder="Caption ideas, references, etc."
              rows={3}
              className="bg-[#0a0a0a] border-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Post URL</Label>
            <Input
              value={form.post_url || ''}
              onChange={(e) => setForm({ ...form, post_url: e.target.value })}
              onBlur={handleBlurSave}
              placeholder="https://..."
              className="bg-[#0a0a0a] border-white/5"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-zinc-400">Checklist</Label>
            <div className="grid grid-cols-2 gap-2">
              {checklistItems.map((item) => (
                <div key={item.key} className="flex items-center gap-2.5">
                  <Checkbox
                    checked={form.checklist[item.key]}
                    onCheckedChange={() => toggleChecklist(item.key)}
                    className="border-white/10 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                  <span className={`text-sm ${form.checklist[item.key] ? 'text-zinc-300 line-through' : 'text-zinc-300'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Uncheck confirmation dialog */}
          {confirmUncheck && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-white">Are you sure?</p>
              <p className="text-xs text-zinc-400">
                Unchecking &ldquo;{confirmUncheck.label}&rdquo; will move this card back to &ldquo;{confirmUncheck.targetStatus}&rdquo;. Do you want to continue?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={confirmUncheckAction}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                >
                  Yes, move back
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmUncheck(null)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {toast && (
            <div
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                toast.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {toast.message}
            </div>
          )}

          <div className="flex justify-between pt-5 border-t border-white/5">
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
