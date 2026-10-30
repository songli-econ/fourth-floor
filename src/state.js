// Game state, local save, and save-file export/import.

export const SAVE_KEY = 'fourth-floor.save.v1';
export const SETTINGS_KEY = 'fourth-floor.settings.v1';
const VERSION = 1;

export function defaultSettings() {
  return {
    pace: 'real',          // 'real' = one day per real day; 'free' = no waiting
    textSpeed: 32,         // ms per character; 0 = instant
    sound: false,
    llm: { enabled: false, provider: 'none', model: '', key: '', endpoint: '' }
  };
}

export function newState(name = '') {
  return {
    v: VERSION,
    name,
    startedOn: null,
    lastVisit: null,
    done: {},
    dayDoneOn: {},
    flags: {},
    aff: { ache: 0, xiaoman: 0, laozhou: 0, nico: 0, cat: 0 },
    mem: {},
    chats: {},             // per-character small talk count, for idle line rotation
    settings: defaultSettings()
  };
}

function safeStorage(storage) {
  return {
    get(k) { try { return storage?.getItem(k) ?? null; } catch { return null; } },
    set(k, v) { try { storage?.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { storage?.removeItem(k); } catch { /* ignore */ } }
  };
}

// The API key lives apart from the save so that exported save files never carry it.
export function load(storage) {
  const s = safeStorage(storage);
  let state = null;
  const raw = s.get(SAVE_KEY);
  if (raw) {
    try { state = migrate(JSON.parse(raw)); } catch { state = null; }
  }
  state = state || newState();
  const rawSettings = s.get(SETTINGS_KEY);
  if (rawSettings) {
    try {
      const saved = JSON.parse(rawSettings);
      state.settings = { ...defaultSettings(), ...saved, llm: { ...defaultSettings().llm, ...(saved.llm || {}) } };
    } catch { /* keep defaults */ }
  }
  return state;
}

export function save(storage, state) {
  const s = safeStorage(storage);
  const { settings, ...rest } = state;
  const ok1 = s.set(SAVE_KEY, JSON.stringify(rest));
  const ok2 = s.set(SETTINGS_KEY, JSON.stringify(settings));
  return ok1 && ok2;
}

export function reset(storage) {
  safeStorage(storage).del(SAVE_KEY);
}

export function migrate(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('not a save');
  if (obj.v !== VERSION) throw new Error(`unsupported save version ${obj.v}`);
  const base = newState();
  return {
    ...base,
    ...obj,
    aff: { ...base.aff, ...(obj.aff || {}) },
    settings: base.settings
  };
}

export function exportSave(state) {
  const { settings, ...rest } = state;
  return JSON.stringify({ kind: 'fourth-floor-save', exportedAt: new Date().toISOString(), state: rest }, null, 2);
}

export function importSave(text, currentSettings) {
  const obj = JSON.parse(text);
  if (obj.kind !== 'fourth-floor-save') throw new Error('这不是四楼的存档文件');
  const state = migrate(obj.state);
  state.settings = currentSettings || defaultSettings();
  return state;
}
