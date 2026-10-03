export async function continueClassicWithHeart(roundId: string, revision: number): Promise<void> {
  const response = await fetch('/api/commerce?action=classic-continue', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-ColorMerge': '1' },
    body: JSON.stringify({ roundId, revision }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Could not use a heart. Retry the connection or start again for free.');
}
