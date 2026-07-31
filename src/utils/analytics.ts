/// <reference types="vite/client" />

export type AnalyticsEvent = 
  | 'landing_view'
  | 'public_demo_started'
  | 'repository_url_entered'
  | 'post_intent_selected'
  | 'repository_analysis_started'
  | 'repository_analysis_succeeded'
  | 'repository_analysis_failed'
  | 'candidate_angle_selected'
  | 'custom_angle_entered'
  | 'adaptive_question_answered'
  | 'post_generation_started'
  | 'post_generation_succeeded'
  | 'post_generation_failed'
  | 'generation_needs_context'
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
