const APIFY_BASE_URL = 'https://api.apify.com/v2';

interface ApifyRunResult {
  items: Record<string, unknown>[];
}

async function runActor(actorId: string, input: Record<string, unknown>): Promise<ApifyRunResult> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_API_TOKEN not configured');

  const response = await fetch(
    `${APIFY_BASE_URL}/acts/${actorId}/runs?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(`Apify actor "${actorId}" failed [${response.status} ${response.statusText}]: ${body}`);
    throw new Error(`Apify actor run failed: ${response.statusText} (${response.status}) — ${body.slice(0, 200)}`);
  }

  const run = await response.json();
  const runId = run.data?.id;
  if (!runId) throw new Error('No run ID returned from Apify');

  // Poll for completion
  let status = 'RUNNING';
  while (status === 'RUNNING' || status === 'READY') {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${runId}?token=${encodeURIComponent(token)}`
    );
    const statusData = await statusRes.json();
    status = statusData.data?.status;
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Apify run finished with status: ${status}`);
  }

  // Get dataset items
  const datasetRes = await fetch(
    `${APIFY_BASE_URL}/actor-runs/${runId}/dataset/items?token=${encodeURIComponent(token)}`
  );
  const items = await datasetRes.json();
  return { items: Array.isArray(items) ? items : [] };
}

export async function scrapeInstagramReels(keywords: string[], handles: string[]) {
  // Primary: hashtag search
  const result = await runActor('apify~instagram-scraper', {
    searchType: 'hashtag',
    searchQueries: keywords,
    resultsLimit: 20,
    addParentData: false,
    isUserTaggedFeedURL: false,
    loginRequired: false,
  });

  // Fallback: if primary returns 0 results, try reel scraper with handles
  if (result.items.length === 0 && handles.length > 0) {
    return runActor('apify~instagram-reel-scraper', {
      username: handles.map((h) => h.replace('@', '')),
      resultsLimit: 20,
    });
  }

  return result;
}

export async function scrapeYouTubeShorts(keywords: string[]) {
  return runActor('streamers~youtube-scraper', {
    searchKeywords: keywords.join(', '),
    maxResults: 20,
    dateFilter: 'month',
  });
}
