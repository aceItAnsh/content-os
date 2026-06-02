'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';

interface Hook {
  text: string;
  pattern: string;
  confidence: number;
  matchedReel: string;
}

export function HookTab({ scraperResults, scraperTimestamp }: { scraperResults?: { platform: string; title: string }[]; scraperTimestamp?: number | null }) {
  const [topic, setTopic] = useState('');
  const [scriptContext, setScriptContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedHook, setSavedHook] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pipeline/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, script: scriptContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHooks(data.hooks || []);
      setSavedHook(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hook generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUseHook = async (hook: Hook) => {
    try {
      const res = await fetch('/api/pipeline/hooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hook: hook.text, topic }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSavedHook(hook.text);
    } catch (err) {
      console.error(err);
    }
  };

  const patternColors: Record<string, string> = {
    Aspirational: 'bg-blue-500/10 text-blue-400',
    'Pain point': 'bg-red-500/10 text-red-400',
    Exclusivity: 'bg-purple-500/10 text-purple-400',
    'Time/Money': 'bg-green-500/10 text-green-400',
    'Curiosity gap': 'bg-amber-500/10 text-amber-400',
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
          <label className="text-xs text-zinc-400 font-medium">Script Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What's the topic of your content?"
            className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-medium">Script (optional context)</label>
          <textarea
            value={scriptContext}
            onChange={(e) => setScriptContext(e.target.value)}
            placeholder="Paste your script here for better context..."
            rows={4}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/5 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Generate Hooks
        </button>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      {hooks.length > 0 && (
        <div className="space-y-3">
          {hooks.map((hook, i) => (
            <div
              key={i}
              className={`bg-[#0a0a0a] border rounded-xl p-4 transition-colors ${
                savedHook === hook.text ? 'border-green-500/30' : 'border-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        patternColors[hook.pattern] || 'bg-white/5 text-zinc-400'
                      }`}
                    >
                      {hook.pattern}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Confidence: {hook.confidence}/10
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium">{hook.text}</p>
                  {hook.matchedReel && (
                    <p className="text-[11px] text-zinc-500">
                      Matches style of: {hook.matchedReel}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleUseHook(hook)}
                  disabled={savedHook === hook.text}
                  className={`shrink-0 h-8 px-3 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    savedHook === hook.text
                      ? 'bg-green-500/10 text-green-400 cursor-default'
                      : 'border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {savedHook === hook.text ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </>
                  ) : (
                    'Use this hook'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
