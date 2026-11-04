import { RecordingPresets, type RecordingOptions } from 'expo-audio';

/** Persist recordings under the app document directory (survives cache eviction). */
export const DOCUMENT_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: 'document',
};
