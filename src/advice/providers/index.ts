import { isOpenAiConfigured } from '../config';
import type { AdviceProvider } from '../types';
import { createOfflineAdviceProvider } from './offlineProvider';
import { tryCreateOpenAiAdviceProvider } from './openaiProvider';

/**
 * Pluggable advice backend: OpenAI when `EXPO_PUBLIC_OPENAI_API_KEY` is set,
 * otherwise offline canned / heuristic replies.
 */
export function createAdviceProvider(): AdviceProvider {
  if (isOpenAiConfigured()) {
    const live = tryCreateOpenAiAdviceProvider();
    if (live) return live;
  }
  return createOfflineAdviceProvider();
}

export { createOfflineAdviceProvider } from './offlineProvider';
export {
  createOpenAiAdviceProvider,
  tryCreateOpenAiAdviceProvider,
} from './openaiProvider';
