'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getVoiceSamples, createVoiceSample } from '@/lib/supabase/api';
import { VoiceSample } from '@/lib/types';
import { Loader2, Plus } from 'lucide-react';

export function ScriptTab({ scraperResults, scraperTimestamp }: { scraperResults?: { platform: string; title: string }[]; scraperTimestamp?: number | null }) {
  const [topic, setTopic] = useState('');
  const [toneNotes, setToneNotes] = useState('');
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [addSampleOpen, setAddSampleOpen] = useState(false);
  const [newSample, setNewSample] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVoiceSamples().then(setVoiceSamples).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const samples = voiceSamples.filter((s) =>
        selectedSamples.includes(s.id)
      );
      const res = await fetch('/api/pipeline/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          voiceSamples: samples.map((s) => s.content),
          toneNotes,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScript(data.script || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Script generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCard = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pipeline/script', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, script }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Card created successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSample = async () => {
    if (!newSample.title.trim() || !newSample.content.trim()) return;
    try {
      const created = await createVoiceSample(newSample);
      setVoiceSamples((prev) => [created, ...prev]);
      setAddSampleOpen(false);
      setNewSample({ title: '', content: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSample = (id: string) => {
    setSelectedSamples((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  /** Parse [BEAT 1] / [BEAT 2] / [BEAT 3] / [CTA] markers and render styled blocks. */
  const renderScriptBeats = (text: string) => {
    const borderColors: Record<string, string> = {
      'BEAT 1': 'border-blue-500/20 bg-blue-500/5',
      'BEAT 2': 'border-indigo-500/20 bg-indigo-500/5',
      'BEAT 3': 'border-violet-500/20 bg-violet-500/5',
      CTA: 'border-green-500/20 bg-green-500/5',
    };
    const labelColors: Record<string, string> = {
      'BEAT 1': 'text-blue-400',
      'BEAT 2': 'text-indigo-400',
      'BEAT 3': 'text-violet-400',
      CTA: 'text-green-400',
    };

    const parts = text.split(/(\[(?:BEAT \d+|CTA)\])/);
    const blocks: { label: string; content: string }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (/^\[(?:BEAT \d+|CTA)\]$/.test(part)) {
        const label = part.slice(1, -1);
        const content = (parts[i + 1] ?? '').trim();
        blocks.push({ label, content });
        i++;
      }
    }

    if (blocks.length === 0) {
      return (
        <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-300">{text}</pre>
      );
    }

    return (
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <div
            key={i}
            className={`border rounded-xl p-4 ${
              borderColors[block.label] ?? 'border-white/5 bg-[#111111]'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest mb-2 block ${
                labelColors[block.label] ?? 'text-zinc-400'
              }`}
            >
              {block.label}
            </span>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {block.content}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-[#111111] border border-white/5 rounded-xl p-6">
      {scraperResults && scraperResults.length > 0 && scraperTimestamp && (Date.now() - scraperTimestamp < 3600000) && (
        <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-4 py-2.5">
          <span className="text-xs text-indigo-300">
            Using results from latest scrape — <span className="font-semibold text-white">{scraperResults.length}</span> posts found
          </span>
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-medium">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic or paste from validator recommendation"
            className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 font-medium">Voice Samples</label>
            <button
              onClick={() => setAddSampleOpen(true)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Sample
            </button>
          </div>
          {voiceSamples.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No voice samples yet. Add your past scripts or captions to train the AI on your voice.
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {voiceSamples.map((sample) => (
                <div key={sample.id} className="flex items-center gap-2.5">
                  <Checkbox
                    checked={selectedSamples.includes(sample.id)}
                    onCheckedChange={() => toggleSample(sample.id)}
                    className="border-white/10 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                  <span className="text-sm text-zinc-300">{sample.title}</span>
                  <span className="text-xs text-zinc-600">
                    ({sample.content.split(/\s+/).length} words)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-medium">Tone Notes (optional)</label>
          <textarea
            value={toneNotes}
            onChange={(e) => setToneNotes(e.target.value)}
            placeholder="e.g., More conversational, use 'you' a lot, high energy"
            rows={2}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Generate Script
        </button>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      {script && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
          {renderScriptBeats(script)}
          <div className="flex justify-end">
            <button
              onClick={handleSaveToCard}
              disabled={saving}
              className="h-9 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save to Card'}
            </button>
          </div>
        </div>
      )}

      <Dialog open={addSampleOpen} onOpenChange={setAddSampleOpen}>
        <DialogContent className="bg-[#111111] border border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Voice Sample</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Title</label>
              <input
                value={newSample.title}
                onChange={(e) =>
                  setNewSample({ ...newSample, title: e.target.value })
                }
                placeholder="e.g., 'My AI Tools Reel Caption'"
                className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Content</label>
              <textarea
                value={newSample.content}
                onChange={(e) =>
                  setNewSample({ ...newSample, content: e.target.value })
                }
                placeholder="Paste a past script or caption..."
                rows={8}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setAddSampleOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
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
    </div>
  );
}
