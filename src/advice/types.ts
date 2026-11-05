import type { ProfileType } from '../types/models';

export type AdviceChatRole = 'user' | 'assistant' | 'system';

export type AdviceChatMessage = {
  role: AdviceChatRole;
  content: string;
};

export type AdviceReplyRequest = {
  messages: AdviceChatMessage[];
  profileType?: ProfileType | null;
  careRecipientFirstName?: string | null;
};

export type AdviceReplyResult = {
  content: string;
  provider: 'openai' | 'offline';
};

export interface AdviceProvider {
  readonly name: 'openai' | 'offline';
  reply(request: AdviceReplyRequest): Promise<AdviceReplyResult>;
}
