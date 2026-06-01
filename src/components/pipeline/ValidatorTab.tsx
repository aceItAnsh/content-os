'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAiRuns } from '@/lib/supabase/api';
import { AiRun } from '@/lib/types';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';

interface ValidatorOutput {
  recommendation: string;
  topTopics: { topic: string; avgViews: number }[];
  topFormats: { format: string; shares: number }[];
  repeatSignals: string[];
  sustainedTrends: string[];
}

export function ValidatorTab() {
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<ValidatorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAiRuns('scrape').then(setRuns).catch(console.error);
  }, []);

  const handleRun = async () => {
    if (!selectedRunId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pipeline/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: selectedRunId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOutput(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-[#111111] border border-white/5 rounded-xl p-6">
      <div className="flex items-end gap-4">
        <div className="space-y-2 flex-1 max-w-md">
          <label className="text-xs text-zinc-400 font-medium">Select Scraper Run</label>
          <Select value={selectedRunId} onValueChange={setSelectedRunId}>
            <SelectTrigger className="bg-[#0a0a0a] border-white/5">
              <SelectValue placeholder="Choose a previous scrape..." />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => (
                <SelectItem key={run.id} value={run.id}>
                  {run.topic || 'Scrape'} — {new Date(run.created_at).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={handleRun}
          disabled={loading || !selectedRunId}
          className="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Run Validator
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {output && (
        <div className="space-y-4">
          <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Recommendation</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  {output.recommendation}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
              <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Top 5 Topics by Average Views
              </h4>
              <div className="space-y-2.5">
                {output.topTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{t.topic}</span>
                    <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md tabular-nums">
                      {t.avgViews >= 1000
                        ? `${(t.avgViews / 1000).toFixed(1)}K`
                        : t.avgViews}{' '}
                      avg views
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Top 3 Formats by Shares</h4>
              <div className="space-y-2.5">
                {output.topFormats.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{f.format}</span>
                    <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md tabular-nums">
                      {f.shares} shares
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {output.repeatSignals.length > 0 && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Repeat Viral Signals</h4>
              <div className="flex flex-wrap gap-2">
                {output.repeatSignals.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-zinc-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {output.sustainedTrends.length > 0 && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Sustained Trends</h4>
              <div className="flex flex-wrap gap-2">
                {output.sustainedTrends.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
