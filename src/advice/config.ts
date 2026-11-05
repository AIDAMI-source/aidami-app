/**
 * Public OpenAI env (safe to ship in the client for demo).
 * Empty / missing → offline demo replies.
 */
export function getOpenAiApiKey(): string | null {
  const value = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim();
  return value ? value : null;
}

export function getOpenAiModel(): string {
  const value = process.env.EXPO_PUBLIC_OPENAI_MODEL?.trim();
  return value || 'gpt-4o-mini';
}

/** True when an API key is present (live provider available). */
export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}
