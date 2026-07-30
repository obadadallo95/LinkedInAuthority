export type AnalyticsEvent = 
  | 'landing_view'
  | 'public_demo_started'
  | 'repository_url_entered'
  | 'post_intent_selected'
  | 'human_context_answered'
  | 'human_context_skipped'
  | 'generation_started'
  | 'generation_succeeded'
  | 'generation_failed'
  | 'generated_post_edited'
  | 'generated_post_copied'
  | 'github_connect_clicked'
  | 'authentication_started';

export const trackEvent = (eventName: AnalyticsEvent, properties?: Record<string, any>) => {
  // Simple abstraction for tracking events without external provider yet
  if (import.meta.env.DEV) {
    console.log(`[Analytics Event]: ${eventName}`, properties || '');
  }
  // TODO: Integrate actual analytics provider (e.g. PostHog, Mixpanel, etc.) when approved
};
