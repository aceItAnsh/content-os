'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getVoiceSamples, createVoiceSample, deleteVoiceSample, updateVoiceSample } from '@/lib/supabase/api';
import { createClient } from '@/lib/supabase/client';
import { VoiceSample } from '@/lib/types';
import { Plus, Trash2, Pencil, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSample, setEditingSample] = useState<VoiceSample | null>(null);
  const [newSample, setNewSample] = useState({ title: '', content: '' });
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    getVoiceSamples().then(setVoiceSamples).catch(console.error);
  }, [supabase]);

  const handleAddSample = async () => {
    if (!newSample.title.trim() || !newSample.content.trim()) return;
    try {
      const created = await createVoiceSample(newSample);
      setVoiceSamples((prev) => [created, ...prev]);
      setAddOpen(false);
      setNewSample({ title: '', content: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSample = async (id: string) => {
    if (!confirm('Delete this voice sample?')) return;
    try {
      await deleteVoiceSample(id);
      setVoiceSamples((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSample = async () => {
    if (!editingSample) return;
    try {
      const updated = await updateVoiceSample(editingSample.id, {
        title: editingSample.title,
        content: editingSample.content,
      });
      setVoiceSamples((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setEditOpen(false);
      setEditingSample(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your account and voice samples</p>
      </div>

      {/* Account Info */}
      <div className="bg-[#111111] border border-white/5 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-zinc-400" />
          Account
        </h3>
        {user && (
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-zinc-400">
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-white">
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Voice Samples */}
      <div className="bg-[#111111] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-300">Voice Samples</h3>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Sample
          </button>
        </div>

        {voiceSamples.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-500">
              No voice samples yet. Add past scripts or captions to train the AI on your unique voice.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {voiceSamples.map((sample) => (
              <div
                key={sample.id}
                className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{sample.title}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {sample.content.split(/\s+/).length} words &middot;{' '}
                      {new Date(sample.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 transition-colors"
                      onClick={() => {
                        setEditingSample(sample);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 transition-colors"
                      onClick={() => handleDeleteSample(sample.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                  {sample.content}
                </p>
              </div>
            ))}

            {/* Add card placeholder */}
            <button
              onClick={() => setAddOpen(true)}
              className="border border-dashed border-white/10 rounded-xl p-4 flex items-center justify-center min-h-[100px] hover:bg-white/[0.02] hover:border-white/20 transition-all"
            >
              <Plus className="w-5 h-5 text-zinc-600" />
            </button>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#111111] border border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Voice Sample</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Script Name (e.g. AI tools reel May 2026)</label>
              <input
                value={newSample.title}
                onChange={(e) => setNewSample({ ...newSample, title: e.target.value })}
                placeholder="Give this sample a recognizable name"
                className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Paste your script or caption here</label>
              <textarea
                value={newSample.content}
                onChange={(e) => setNewSample({ ...newSample, content: e.target.value })}
                placeholder="Paste a past script, caption, or voiceover text (min 50 characters)..."
                rows={8}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
              <div className="flex items-center justify-between">
                <span className={`text-[11px] ${newSample.content.length > 0 && newSample.content.length < 50 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {newSample.content.length > 0 && newSample.content.length < 50 && '⚠ Min 50 characters recommended'}
                </span>
                <span className="text-[11px] text-zinc-500">{newSample.content.length} chars</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAddOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                Cancel
              </Button>
              <Button
                onClick={handleAddSample}
                disabled={!newSample.title.trim() || !newSample.content.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Save Sample
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#111111] border border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Voice Sample</DialogTitle>
          </DialogHeader>
          {editingSample && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Title</label>
                <input
                  value={editingSample.title}
                  onChange={(e) =>
                    setEditingSample({ ...editingSample, title: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Content</label>
                <textarea
                  value={editingSample.content}
                  onChange={(e) =>
                    setEditingSample({ ...editingSample, content: e.target.value })
                  }
                  rows={8}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSample}
                  disabled={!editingSample.title.trim() || !editingSample.content.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Update Sample
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
