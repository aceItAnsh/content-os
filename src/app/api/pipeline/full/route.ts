import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGemini } from '@/lib/gemini/client';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Script generation (skip scrape/validate for full pipeline since they need external APIs)
        controller.enqueue(encoder.encode('STEP:Writing script...\n'));

        const scriptPrompt = `You are a short-form video script writer for Instagram Reels and YouTube Shorts.

RULES:
- Structure: [BEAT 1] → [BEAT 2] → [BEAT 3] → [CTA]
- Each beat: 2-3 sentences maximum
- CTA must be comment-trigger style
- Do NOT include a hook
- Language: English
- Keep it speakable — under 60 seconds when spoken`;

        const script = await callGemini(scriptPrompt, `Write a short-form video script about: ${topic}`);

        // Step 2: Hook generation
        controller.enqueue(encoder.encode('STEP:Generating hooks...\n'));

        const hookPrompt = `You are a hook generator for short-form video content.
Generate exactly 5 hooks using these patterns:
1. Aspirational — shows the better version
2. Pain point — names a frustration the viewer feels
3. Exclusivity — insider knowledge feel
4. Time/Money — specific number, specific result
5. Curiosity gap — unanswerable without watching

RULES:
- Each hook: maximum 2 lines, speakable in under 4 seconds
- Language: English

Return ONLY a JSON array with 5 objects, each having:
- "text": hook text
- "pattern": pattern name
- "confidence": score 1-10`;

        const hookResponse = await callGemini(
          hookPrompt,
          `Generate 5 hooks for: ${topic}\n\nScript context:\n${script}`
        );

        let hooks;
        try {
          const cleaned = hookResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          hooks = JSON.parse(cleaned);
        } catch {
          hooks = [{ text: hookResponse.slice(0, 100), pattern: 'General', confidence: 5 }];
        }

        // Find recommended hook (highest confidence)
        const recommendedHook = hooks.reduce(
          (best: { confidence: number; text: string }, h: { confidence: number; text: string }) =>
            h.confidence > best.confidence ? h : best,
          hooks[0]
        ).text;

        // Save to ai_runs
        await supabase.from('ai_runs').insert({
          user_id: user.id,
          run_type: 'full_pipeline',
          topic,
          output: { script, hooks, recommendedHook },
        });

        const result = { topic, script, hooks, recommendedHook };
        controller.enqueue(
          encoder.encode(`RESULT:${JSON.stringify(result)}\n`)
        );
        controller.close();
      } catch (error) {
        console.error('Full pipeline error:', error);
        controller.enqueue(
          encoder.encode(`ERROR:${error instanceof Error ? error.message : 'Pipeline failed'}\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
