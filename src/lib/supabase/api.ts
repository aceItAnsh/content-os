import { createClient } from '@/lib/supabase/client';
import { ContentCard, DEFAULT_CHECKLIST, AiRun, VoiceSample } from '@/lib/types';

function getSupabase() {
  return createClient();
}

// ─── Content Cards ───

export async function getCards() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('content_cards')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ContentCard[];
}

export async function getCardsByStatus(status: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('content_cards')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ContentCard[];
}

export async function getCardsByDate(date: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('content_cards')
    .select('*')
    .eq('scheduled_date', date)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ContentCard[];
}

export async function createCard(card: Partial<ContentCard>) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('content_cards')
    .insert({
      user_id: user.id,
      title: card.title,
      platform: card.platform || 'instagram',
      status: card.status || 'idea',
      scheduled_date: card.scheduled_date || null,
      notes: card.notes || null,
      script: card.script || null,
      hook: card.hook || null,
      priority: card.priority || 'normal',
      post_url: card.post_url || null,
      checklist: card.checklist || DEFAULT_CHECKLIST,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContentCard;
}

export async function updateCard(id: string, updates: Partial<ContentCard>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('content_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ContentCard;
}

export async function deleteCard(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('content_cards')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── AI Runs ───

export async function getAiRuns(runType?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from('ai_runs')
    .select('*')
    .order('created_at', { ascending: false });
  if (runType) query = query.eq('run_type', runType);
  const { data, error } = await query;
  if (error) throw error;
  return data as AiRun[];
}

export async function createAiRun(run: Partial<AiRun>) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ai_runs')
    .insert({
      user_id: user.id,
      run_type: run.run_type,
      topic: run.topic || '',
      output: run.output || {},
    })
    .select()
    .single();
  if (error) throw error;
  return data as AiRun;
}

// ─── Voice Samples ───

export async function getVoiceSamples() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('voice_samples')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as VoiceSample[];
}

export async function createVoiceSample(sample: Partial<VoiceSample>) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('voice_samples')
    .insert({
      user_id: user.id,
      title: sample.title,
      content: sample.content,
    })
    .select()
    .single();
  if (error) throw error;
  return data as VoiceSample;
}

export async function deleteVoiceSample(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('voice_samples')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function updateVoiceSample(id: string, data: { title: string; content: string }) {
  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from('voice_samples')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated as VoiceSample;
}
