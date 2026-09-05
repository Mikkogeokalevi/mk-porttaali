let wakeLock = null;
let wakeLockRequested = false;
let releaseHandler = null;

export function getZoomBySpeed(speedMps) {
  const speedKmh = (speedMps || 0) * 3.6;
  if (speedKmh <= 40) return 18;
  if (speedKmh <= 70) return 17;
  if (speedKmh <= 100) return 16;
  return 14;
}

async function acquireWakeLock() {
  try {
    if (!('wakeLock' in navigator)) return;
    wakeLock = await navigator.wakeLock.request('screen');
    releaseHandler = () => {
      wakeLock = null;
      if (wakeLockRequested && document.visibilityState === 'visible') {
        requestScreenWakeLock();
      }
    };
    wakeLock.addEventListener('release', releaseHandler);
  } catch (err) {
    console.warn('Näytön hereillä pito epäonnistui:', err);
  }
}

export async function requestScreenWakeLock() {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API ei ole tuettu tässä selaimessa.');
    return;
  }
  wakeLockRequested = true;
  if (document.visibilityState === 'visible') {
    await acquireWakeLock();
  }
}

export async function releaseScreenWakeLock() {
  wakeLockRequested = false;
  if (wakeLock && releaseHandler) {
    try {
      wakeLock.removeEventListener('release', releaseHandler);
    } catch {}
  }
  releaseHandler = null;
  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch {}
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', async () => {
  if (!wakeLockRequested) return;
  if (document.visibilityState === 'visible' && !wakeLock) {
    await acquireWakeLock();
  }
});
