import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import {
  deleteLocalAudioFile,
  DOCUMENT_RECORDING_OPTIONS,
  ensureMicPermission,
  MIC_HINT_FR,
  playLocalAudio,
  stopPlayback,
} from '../audio';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';

export type AudioMemoControlProps = {
  /** Current persisted local URI (or null). */
  uri: string | null;
  /** Persist a new URI (or null after delete). Caller updates SQLite + sync_queue. */
  onChange: (uri: string | null) => void | Promise<void>;
  /** Short FR context for a11y, e.g. "mémo de la tâche Petit-déjeuner". */
  accessibilityContext: string;
  disabled?: boolean;
};

/**
 * Record / play / delete a local voice memo.
 * Works offline; files live in the document directory via expo-audio.
 */
export function AudioMemoControl({
  uri,
  onChange,
  accessibilityContext,
  disabled = false,
}: AudioMemoControlProps) {
  const recorder = useAudioRecorder(DOCUMENT_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void stopPlayback();
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || busy) return;
    setError(null);
    setBusy(true);
    try {
      await stopPlayback();
      setPlaying(false);

      const permission = await ensureMicPermission();
      if (!permission.granted) {
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer l'enregistrement.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, recorder]);

  const stopRecording = useCallback(async () => {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      await recorder.stop();
      const nextUri = recorder.uri;
      if (!nextUri) {
        setError("Aucun fichier audio n'a été produit.");
        return;
      }

      if (uri && uri !== nextUri) {
        await deleteLocalAudioFile(uri);
      }
      await onChange(nextUri);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'arrêter l'enregistrement.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, onChange, recorder, uri]);

  const onPlayToggle = useCallback(async () => {
    if (!uri || disabled || busy) return;
    setError(null);
    if (playing) {
      await stopPlayback();
      setPlaying(false);
      return;
    }
    setBusy(true);
    try {
      const player = await playLocalAudio(uri);
      setPlaying(true);
      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setPlaying(false);
          sub.remove();
        }
      });
    } catch (err) {
      setPlaying(false);
      setError(
        err instanceof Error ? err.message : "Impossible de lire l'audio.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, playing, uri]);

  const onDelete = useCallback(async () => {
    if (!uri || disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      await stopPlayback();
      setPlaying(false);
      await deleteLocalAudioFile(uri);
      await onChange(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l'audio.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, onChange, uri]);

  const recording = recorderState.isRecording;

  return (
    <View style={styles.wrap} accessibilityLabel={`Audio — ${accessibilityContext}`}>
      <Text style={styles.hint}>{MIC_HINT_FR}</Text>

      <View style={styles.row}>
        {recording ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.danger,
              pressed && styles.pressed,
              (disabled || busy) && styles.disabled,
            ]}
            onPress={() => void stopRecording()}
            disabled={disabled || busy}
            accessibilityRole="button"
            accessibilityLabel={`Arrêter l'enregistrement — ${accessibilityContext}`}
          >
            <Text style={styles.buttonLabel}>Arrêter</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.primary,
              pressed && styles.pressed,
              (disabled || busy) && styles.disabled,
            ]}
            onPress={() => void startRecording()}
            disabled={disabled || busy}
            accessibilityRole="button"
            accessibilityLabel={
              uri
                ? `Réenregistrer — ${accessibilityContext}`
                : `Enregistrer — ${accessibilityContext}`
            }
          >
            <Text style={styles.buttonLabel}>
              {uri ? 'Réenregistrer' : 'Enregistrer'}
            </Text>
          </Pressable>
        )}

        {uri && !recording ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.secondary,
                pressed && styles.pressed,
                (disabled || busy) && styles.disabled,
              ]}
              onPress={() => void onPlayToggle()}
              disabled={disabled || busy}
              accessibilityRole="button"
              accessibilityLabel={
                playing
                  ? `Arrêter la lecture — ${accessibilityContext}`
                  : `Écouter — ${accessibilityContext}`
              }
            >
              <Text style={styles.secondaryLabel}>
                {playing ? 'Pause' : 'Écouter'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.ghost,
                pressed && styles.pressed,
                (disabled || busy) && styles.disabled,
              ]}
              onPress={() => void onDelete()}
              disabled={disabled || busy}
              accessibilityRole="button"
              accessibilityLabel={`Supprimer l'audio — ${accessibilityContext}`}
            >
              <Text style={styles.ghostLabel}>Supprimer</Text>
            </Pressable>
          </>
        ) : null}

        {busy ? (
          <ActivityIndicator color={AidAmiTheme.colors.accent} />
        ) : null}
      </View>

      {recording ? (
        <Text style={styles.recording}>
          Enregistrement…{' '}
          {Math.floor(recorderState.durationMillis / 1000)} s
        </Text>
      ) : null}

      {uri && !recording ? (
        <Text style={styles.status}>Mémo vocal enregistré</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const minTouch = px(AidAmiTheme.touchTarget.minHeight);

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginTop: 8,
  },
  hint: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    minHeight: minTouch,
    minWidth: minTouch,
    paddingHorizontal: 16,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: AidAmiTheme.colors.accent,
  },
  secondary: {
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: AidAmiTheme.colors.border,
  },
  danger: {
    backgroundColor: AidAmiTheme.colors.emotionalOrange,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
  },
  secondaryLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  ghostLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.emotionalRed,
  },
  recording: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '700',
    color: AidAmiTheme.colors.emotionalOrange,
  },
  status: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.secondary,
  },
  error: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.emotionalRed,
  },
});
