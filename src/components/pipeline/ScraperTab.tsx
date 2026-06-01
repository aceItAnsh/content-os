'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface ScrapedPost {
  platform: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  er: number;
  date: string;
  viral: boolean;
}

export function ScraperTab() {
  const [keywords, setKeywords] = useState(
    'AI tools, Claude Code, automation, AI agents, vibe coding'
  );
  const [platforms, setPlatforms] = useState({ instagram: true, youtube: true });
  const [dateRange, setDateRange] = useState('7');
  const [competitors, setCompetitors] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapedPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof ScrapedPost>('views');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pipeline/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.split(',').map((k) => k.trim()),
          platforms,
          dateRange: parseInt(dateRange),
          competitors: competitors
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      setHasRun(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scraper failed');
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...results].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    }
    return 0;
  });

  const handleSort = (key: keyof ScrapedPost) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6 bg-[#111111] border border-white/5 rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-medium">Keywords (comma separated)</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-medium">Competitor Handles (comma separated)</label>
          <input
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
            placeholder="@handle1, @handle2"
            className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400 font-medium">Platforms:</span>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={platforms.instagram}
              onCheckedChange={(v) =>
                setPlatforms({ ...platforms, instagram: !!v })
              }
              className="border-white/10 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
            />
            <span className="text-sm text-zinc-300">Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={platforms.youtube}
              onCheckedChange={(v) =>
                setPlatforms({ ...platforms, youtube: !!v })
              }
              className="border-white/10 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
            />
            <span className="text-sm text-zinc-300">YouTube</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Date Range:</span>
          <input
            type="number"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-16 h-9 px-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white text-center focus:outline-none focus:border-indigo-500/50 transition-colors"
            min={1}
          />
          <span className="text-xs text-zinc-500">days</span>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Run Scraper
      </button>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-4 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Scraping in progress — this takes 30–60 seconds…</span>
        </div>
      )}

      {!loading && hasRun && results.length === 0 && (
        <div className="text-sm text-zinc-500 bg-white/[0.02] border border-white/5 rounded-lg p-4 text-center">
          No results found. Try different keywords or handles.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-white">{results.length}</span> result{results.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={async () => {
                setSaving(true);
                setSaveMsg(null);
                try {
                  await fetch('/api/pipeline/scrape', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      saveOnly: true,
                      results,
                      keywords: keywords.split(',').map((k) => k.trim()),
                    }),
                  });
                  setSaveMsg('Saved to history');
                  setTimeout(() => setSaveMsg(null), 3000);
                } catch {
                  setSaveMsg('Save failed');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="h-8 px-3 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {saveMsg ?? 'Save results'}
            </button>
          </div>
        <div className="border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  { key: 'platform', label: 'Platform' },
                  { key: 'title', label: 'Title/Hook' },
                  { key: 'views', label: 'Views' },
                  { key: 'likes', label: 'Likes' },
                  { key: 'er', label: 'ER%' },
                  { key: 'date', label: 'Date' },
                  { key: 'viral', label: 'Viral' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof ScrapedPost)}
                    className="text-left text-[11px] font-medium text-zinc-500 px-4 py-3 cursor-pointer hover:text-zinc-300 uppercase tracking-wider"
                  >
                    {col.label}
                    {sortKey === col.key && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((post, i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      post.platform === 'instagram'
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {post.platform === 'instagram' ? 'IG' : 'YT'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-zinc-300 max-w-[300px] truncate">
                    {post.title}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-zinc-300 tabular-nums">
                    {post.views >= 1000
                      ? `${(post.views / 1000).toFixed(1)}K`
                      : post.views}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-zinc-300 tabular-nums">{post.likes}</td>
                  <td className="px-4 py-2.5 text-sm text-zinc-300 tabular-nums">{post.er.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-sm text-zinc-500">
                    {post.date}
                  </td>
                  <td className="px-4 py-2.5">
                    {post.viral && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-green-500/10 text-green-400 ring-1 ring-green-500/30 animate-pulse">
                        VIRAL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}
