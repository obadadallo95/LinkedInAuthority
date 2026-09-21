import type { User } from 'firebase/auth';

export type ClientProductEvent =
  | 'signup_completed'
  | 'draft_saved'
  | 'draft_edited'
  | 'draft_copied'
  | 'repo_selected'
  | 'meaningful_angle_selected';

/** Optional authenticated bridge. Disabled by default to avoid extra writes/network work. */
export async function recordAuthenticatedProductEvent(
  user: User | null,
  event: ClientProductEvent,
  properties: Record<string, unknown> = {},
): Promise<void> {
  if (!user || import.meta.env.VITE_PRODUCT_TELEMETRY_ENABLED !== 'true') return;
  try {
    const token = await user.getIdToken();
    await fetch('/api/product-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ event, properties }),
      keepalive: true,
    });
  } catch {
    // Product telemetry is non-critical and must never interrupt editing/copying.
  }
}
