const API_BASE = "";

let syncEnabled = false;
let syncInitialized = false;

export function getSyncStatus() {
  return { enabled: syncEnabled, initialized: syncInitialized };
}

/* ── Ping server ── */
async function pingServer(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── Pull all data from server → localStorage ── */
export async function pullFromServer() {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = await res.json();
    if (typeof data !== "object" || data === null) return false;

    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("jarash_")) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          count++;
        } catch { /* skip if value is not valid */ }
      }
    }
    console.log(`[DataSync] Pulled ${count} keys from server`);
    return true;
  } catch {
    return false;
  }
}

/* ── Push single key to server ── */
async function pushToServer(key: string, value: unknown) {
  try {
    await fetch(`${API_BASE}/api/sync/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // silent — offline is fine
  }
}

/* ── Wrap localStorage.setItem to sync to server ── */
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
  originalSetItem.call(this, key, value);
  if (syncEnabled && key.startsWith("jarash_")) {
    try {
      const parsed = JSON.parse(value);
      pushToServer(key, parsed);
    } catch { /* value may not be JSON */ }
  }
};

/* ── Manual one-time sync (pull then enable push) ── */
export async function syncNow() {
  const ok = await pullFromServer();
  if (ok) {
    syncEnabled = true;
    syncInitialized = true;
    console.log("[DataSync] Sync enabled — all devices now share data");
  } else {
    console.log("[DataSync] Server not reachable — running offline");
  }
  return ok;
}
