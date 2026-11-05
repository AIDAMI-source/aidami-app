export {
  ANNEX_AUDIENCE_LABELS,
  ANNEX_LINKS,
  annexLinkGroupsForProfile,
  annexLinksForProfile,
} from './annexLinks';
export type { AnnexAudience, AnnexLink } from './annexLinks';
export {
  getOpenAiApiKey,
  getOpenAiModel,
  isOpenAiConfigured,
} from './config';
export {
  createAdviceProvider,
  createOfflineAdviceProvider,
  createOpenAiAdviceProvider,
  tryCreateOpenAiAdviceProvider,
} from './providers';
export {
  ADVICE_DISCLAIMER_FR,
  buildAdviceSystemPrompt,
} from './systemPrompt';
export {
  TIP_SHEET_AUDIENCE_LABELS,
  TIP_SHEETS,
  tipSheetGroupsForProfile,
  tipSheetsForProfile,
} from './tipSheets';
export type { TipSheet, TipSheetAudience } from './tipSheets';
export type {
  AdviceChatMessage,
  AdviceChatRole,
  AdviceProvider,
  AdviceReplyRequest,
  AdviceReplyResult,
} from './types';
