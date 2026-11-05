/**
 * Privacy-safe caregiver label for Communauté.
 * Shows first name only — never email. Falls back to « Aidant ».
 */
export function caregiverDisplayName(
  fullName: string | null | undefined,
): string {
  if (!fullName?.trim()) return 'Aidant';
  const first = fullName.trim().split(/\s+/)[0];
  if (!first || first.includes('@')) return 'Aidant';
  return first;
}

/** Two-letter initials from a display name (FR-friendly). */
export function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function formatTimeFr(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dayKey(value: string | null | undefined): string {
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const local = startOfLocalDay(date);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, '0');
  const d = String(local.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDayHeading(value: string | null | undefined, now = new Date()): string {
  if (!value) return 'Sans date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sans date';

  const today = startOfLocalDay(now).getTime();
  const target = startOfLocalDay(date).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekday = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (target === today) {
    return `Aujourd'hui — ${weekday}`;
  }
  if (target === today - dayMs) {
    return `Hier — ${weekday}`;
  }
  if (target === today + dayMs) {
    return `Demain — ${weekday}`;
  }
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function formatDayGroupShort(
  value: string | null | undefined,
  now = new Date(),
): string {
  if (!value) return 'Sans date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sans date';

  const today = startOfLocalDay(now).getTime();
  const target = startOfLocalDay(date).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (target === today) return "Aujourd'hui";
  if (target === today - dayMs) return 'Hier';
  if (target === today + dayMs) return 'Demain';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export function avatarColorForId(
  id: string,
  palette: readonly string[],
): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length] ?? palette[0];
}
