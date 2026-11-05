import { getOpenAiApiKey, getOpenAiModel } from '../config';
import { buildAdviceSystemPrompt } from '../systemPrompt';
import type {
  AdviceChatMessage,
  AdviceProvider,
  AdviceReplyRequest,
  AdviceReplyResult,
} from '../types';

type OpenAiChatResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
};

function toApiMessages(
  systemPrompt: string,
  messages: AdviceChatMessage[],
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  return [{ role: 'system', content: systemPrompt }, ...history];
}

export function createOpenAiAdviceProvider(apiKey: string): AdviceProvider {
  const model = getOpenAiModel();

  return {
    name: 'openai',
    async reply(request: AdviceReplyRequest): Promise<AdviceReplyResult> {
      const systemPrompt = buildAdviceSystemPrompt(
        request.profileType,
        request.careRecipientFirstName,
      );

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          max_tokens: 450,
          messages: toApiMessages(systemPrompt, request.messages),
        }),
      });

      const data = (await response.json()) as OpenAiChatResponse;

      if (!response.ok) {
        const detail = data.error?.message ?? `HTTP ${response.status}`;
        throw new Error(`OpenAI: ${detail}`);
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('OpenAI: réponse vide');
      }

      return { content, provider: 'openai' };
    },
  };
}

/** Returns an OpenAI provider when the env key is set; otherwise null. */
export function tryCreateOpenAiAdviceProvider(): AdviceProvider | null {
  const key = getOpenAiApiKey();
  if (!key) return null;
  return createOpenAiAdviceProvider(key);
}
