import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

let activePlayer: AudioPlayer | null = null;

export async function stopPlayback(): Promise<void> {
  if (!activePlayer) return;
  try {
    activePlayer.pause();
  } catch {
    // ignore
  }
  try {
    activePlayer.release();
  } catch {
    // ignore
  }
  activePlayer = null;
}

/** Play a local (or remote) audio URI. Stops any previous playback first. */
export async function playLocalAudio(uri: string): Promise<AudioPlayer> {
  await stopPlayback();
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
  });
  const player = createAudioPlayer({ uri });
  activePlayer = player;
  player.play();
  return player;
}

export function isPlaybackActive(): boolean {
  return activePlayer != null && activePlayer.playing;
}
