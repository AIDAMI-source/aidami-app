import { Alert, Linking, Platform } from 'react-native';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';

export type MicPermissionResult =
  | { granted: true }
  | { granted: false; reason: 'denied' | 'blocked' };

/**
 * Ensure microphone access for voice memos.
 * Shows clear French copy when permission is missing.
 */
export async function ensureMicPermission(): Promise<MicPermissionResult> {
  const current = await getRecordingPermissionsAsync();
  if (current.granted) return { granted: true };

  if (current.canAskAgain) {
    const requested = await requestRecordingPermissionsAsync();
    if (requested.granted) return { granted: true };
  }

  const blocked = !current.canAskAgain;
  Alert.alert(
    'Micro non autorisé',
    blocked
      ? "Aid'Ami a besoin du micro pour enregistrer les mémos vocaux. Ouvrez les réglages de l'appareil pour autoriser le micro."
      : "Aid'Ami a besoin du micro pour enregistrer les mémos vocaux familiaux et les messages rassurants.",
    blocked
      ? [
          { text: 'Plus tard', style: 'cancel' },
          {
            text: 'Ouvrir les réglages',
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]
      : [{ text: 'Compris', style: 'cancel' }],
  );

  return { granted: false, reason: blocked ? 'blocked' : 'denied' };
}

/** Short FR hint shown near record controls. */
export const MIC_HINT_FR =
  Platform.OS === 'web'
    ? 'Sur le web, autorisez le micro dans le navigateur pour enregistrer.'
    : 'Le mémo vocal reste sur cet appareil (hors-ligne).';
