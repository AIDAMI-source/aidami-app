import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import * as Network from 'expo-network';

import { flushSyncQueue } from './worker';

type LifecycleHandle = {
  stop: () => void;
};

let started = false;
let appSub: NativeEventSubscription | null = null;
let netSub: { remove: () => void } | null = null;
let lastAppState: AppStateStatus = normalizeAppState(AppState.currentState);

function normalizeAppState(state: string | null | undefined): AppStateStatus {
  if (state === 'active' || state === 'background' || state === 'inactive' || state === 'extension') {
    return state;
  }
  return 'active';
}

/**
 * Flush when the app returns to foreground or connectivity returns.
 * Safe to call once from the root component.
 */
export function startSyncLifecycle(): LifecycleHandle {
  if (started) {
    return { stop: stopSyncLifecycle };
  }
  started = true;
  lastAppState = normalizeAppState(AppState.currentState);

  appSub = AppState.addEventListener('change', onAppStateChange);
  netSub = Network.addNetworkStateListener((state) => {
    if (state.isConnected) {
      void flushSyncQueue();
    }
  });

  // Initial opportunistic flush (LogTransport works offline too).
  void flushSyncQueue();

  return { stop: stopSyncLifecycle };
}

export function stopSyncLifecycle(): void {
  appSub?.remove();
  appSub = null;
  netSub?.remove();
  netSub = null;
  started = false;
}

function onAppStateChange(next: AppStateStatus): void {
  const wasBackground =
    lastAppState === 'background' || lastAppState === 'inactive';
  lastAppState = next;
  if (wasBackground && next === 'active') {
    void flushSyncQueue();
  }
}
