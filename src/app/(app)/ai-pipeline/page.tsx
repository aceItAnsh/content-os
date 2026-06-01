'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScraperTab } from '@/components/pipeline/ScraperTab';
import { ValidatorTab } from '@/components/pipeline/ValidatorTab';
import { ScriptTab } from '@/components/pipeline/ScriptTab';
import { HookTab } from '@/components/pipeline/HookTab';
import { Loader2, Sparkles, Check } from 'lucide-react';

export default function AiPipelinePage() {
  const [fullPipelineTopic, setFullPipelineTopic] = useState('');
  const [fullPipelineRunning, setFullPipelineRunning] = useState(false);
  const [fullPipelineStep, setFullPipelineStep] = useState('');
  const [fullPipelineError, setFullPipelineError] = useState<string | null>(null);
  const [fullPipelineResult, setFullPipelineResult] = useState<{
    topic: string;
    script: string;
    hooks: { text: string; pattern: string; confidence: number }[];
    recommendedHook: string;
  } | null>(null);
  const [creatingCard, setCreatingCard] = useState(false);

  const handleFullPipeline = async () => {
    if (!fullPipelineTopic.trim()) return;
    setFullPipelineRunning(true);
    setFullPipelineResult(null);
    setFullPipelineError(null);

    try {
      setFullPipelineStep('Running full pipeline...');
      const res = await fetch('/api/pipeline/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: fullPipelineTopic }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullText += chunk;

          const lines = fullText.split('\n').filter(Boolean);
          for (const line of lines) {
            if (line.startsWith('STEP:')) {
              setFullPipelineStep(line.replace('STEP:', '').trim());
            }
          }
        }
      }

      const lastLine = fullText.split('\n').filter(Boolean).pop();
      if (lastLine && lastLine.startsWith('RESULT:')) {
        const result = JSON.parse(lastLine.replace('RESULT:', ''));
        setFullPipelineResult(result);
      }
    } catch (err) {
      setFullPipelineError(err instanceof Error ? err.message : 'Pipeline failed');
    } finally {
      setFullPipelineRunning(false);
      setFullPipelineStep('');
    }
  };

  const handleCreateCardFromPipeline = async () => {
    if (!fullPipelineResult) return;
    setCreatingCard(true);
    try {
      const res = await fetch('/api/pipeline/script', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: fullPipelineResult.topic,
          script: fullPipelineResult.script,
          hook: fullPipelineResult.recommendedHook,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Card created successfully!');
    } catch (err) {
      setFullPipelineError(err instanceof Error ? err.message : 'Failed to create card');
    } finally {
      setCreatingCard(false);
    }
  };

  const steps = ['Scraping', 'Validating', 'Writing Script', 'Generating Hooks'];
  const currentStepIndex = fullPipelineStep.toLowerCase().includes('scrap') ? 0
    : fullPipelineStep.toLowerCase().includes('valid') ? 1
    : fullPipelineStep.toLowerCase().includes('script') || fullPipelineStep.toLowerCase().includes('writ') ? 2
    : fullPipelineStep.toLowerCase().includes('hook') ? 3 : -1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Pipeline</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Scrape, validate, write, and generate — all powered by AI
        </p>
      </div>

      {/* Full Pipeline */}
      <div className="bg-[#111111] border border-indigo-500/20 rounded-xl p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Run Full Pipeline
            </label>
            <input
              value={fullPipelineTopic}
              onChange={(e) => setFullPipelineTopic(e.target.value)}
              placeholder="Enter a topic to run the complete pipeline"
              className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <button
            onClick={handleFullPipeline}
            disabled={fullPipelineRunning || !fullPipelineTopic.trim()}
            className="shrink-0 h-11 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {fullPipelineRunning && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {fullPipelineRunning ? fullPipelineStep : 'Run Full Pipeline'}
          </button>
        </div>

        {/* Stepper Progress */}
        {fullPipelineRunning && (
          <div className="mt-5 flex items-center gap-2">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                  i < currentStepIndex ? 'bg-green-500/20 text-green-400' :
                  i === currentStepIndex ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30' :
                  'bg-white/5 text-zinc-500'
                }`}>
                  {i < currentStepIndex ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium ${
                  i === currentStepIndex ? 'text-indigo-400' : i < currentStepIndex ? 'text-green-400' : 'text-zinc-500'
                }`}>{step}</span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px ${i < currentStepIndex ? 'bg-green-500/30' : 'bg-white/5'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {fullPipelineError && (
          <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {fullPipelineError}
          </div>
        )}

        {fullPipelineResult && (
          <div className="mt-6 space-y-4 border-t border-white/5 pt-5">
            <div>
              <h3 className="text-sm font-medium text-zinc-400">
                Topic: <span className="text-white">{fullPipelineResult.topic}</span>
              </h3>
            </div>
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Generated Script</h4>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-[#0a0a0a] border border-white/5 text-zinc-300 p-4 rounded-xl">
                {fullPipelineResult.script}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Generated Hooks</h4>
              <div className="space-y-2">
                {fullPipelineResult.hooks.map((hook, i) => (
                  <div
                    key={i}
                    className={`text-sm p-3 rounded-xl border ${
                      hook.text === fullPipelineResult.recommendedHook
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-white/5 bg-[#0a0a0a]'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {hook.pattern}
                    </span>
                    <p className="mt-1 text-zinc-200">{hook.text}</p>
                    {hook.text === fullPipelineResult.recommendedHook && (
                      <span className="text-[10px] text-green-400 mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Recommended
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreateCardFromPipeline}
              disabled={creatingCard}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
            >
              {creatingCard ? 'Creating...' : 'Create Card From This'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scraper">
        <TabsList className="bg-transparent border-b border-white/5 rounded-none w-full justify-start gap-0 p-0 h-auto">
          <TabsTrigger value="scraper" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-400 pb-3 px-4">
            Scraper
          </TabsTrigger>
          <TabsTrigger value="validator" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-400 pb-3 px-4">
            Validator
          </TabsTrigger>
          <TabsTrigger value="script" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-400 pb-3 px-4">
            Script Writer
          </TabsTrigger>
          <TabsTrigger value="hooks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-400 pb-3 px-4">
            Hook Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scraper" className="mt-6">
          <ScraperTab />
        </TabsContent>

        <TabsContent value="validator" className="mt-6">
          <ValidatorTab />
        </TabsContent>

        <TabsContent value="script" className="mt-6">
          <ScriptTab />
        </TabsContent>

        <TabsContent value="hooks" className="mt-6">
          <HookTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
