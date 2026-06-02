'use client';

import { useState } from 'react';
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
import { ContentCard, Checklist, Platform, Priority, Status } from '@/lib/types';
import { updateCard, deleteCard } from '@/lib/supabase/api';
import { Trash2 } from 'lucide-react';

/**
 * Maps checklist state to the highest achieved status.
 * Posted > Edited > Filmed > Scripted > Idea
 */
function checklistToStatus(cl: Checklist): Status {
  if (cl.posted) return 'posted';
  if (cl.edited) return 'edited';
  if (cl.filmed) return 'filmed';
  if (cl.script_written) return 'scripted';
  return 'idea';
}

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
    const newChecklist: Checklist = { ...form.checklist, [key]: !form.checklist[key] };
    const newStatus = checklistToStatus(newChecklist);
    const prevChecklist = form.checklist;
    const prevStatus = form.status;

    // Optimistic update — card moves columns instantly
    setForm((prev) => ({ ...prev, checklist: newChecklist, status: newStatus }));

    try {
      const updated = await updateCard(card.id, { checklist: newChecklist, status: newStatus });
      onUpdate(updated);
    } catch (err) {
      console.error('Checklist save failed:', err);
      // Revert on failure
      setForm((prev) => ({ ...prev, checklist: prevChecklist, status: prevStatus }));
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
                onValueChange={(v) => setForm({ ...form, platform: v as Platform })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Scheduled Date</Label>
              <Input
                type="date"
                value={form.scheduled_date || ''}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value || null })}
                className="bg-[#0a0a0a] border-white/5"
              />
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
