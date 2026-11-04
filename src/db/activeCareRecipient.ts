/**
 * In-memory active care recipient for the current app session.
 * Mirrors the local-user link pattern used by Auth.
 */
let activeCareRecipientId: string | null = null;

export function getActiveCareRecipientId(): string | null {
  return activeCareRecipientId;
}

export function setActiveCareRecipientId(id: string | null): void {
  activeCareRecipientId = id;
}

export function clearActiveCareRecipientId(): void {
  activeCareRecipientId = null;
}
