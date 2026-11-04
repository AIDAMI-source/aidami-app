import { File } from 'expo-file-system';

/**
 * Delete a local audio file by URI. No-ops for null/remote/missing paths.
 * Safe to call offline / in demo mode.
 */
export async function deleteLocalAudioFile(
  uri: string | null | undefined,
): Promise<void> {
  if (!uri) return;
  if (!uri.startsWith('file:')) return;

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore missing / unreadable files — URI may already be cleared.
  }
}
