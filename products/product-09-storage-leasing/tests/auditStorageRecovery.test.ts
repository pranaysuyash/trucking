import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyState, loadState, resetState, saveState, storageConfig } from '../src/engine/storageClient';

afterEach(() => vi.unstubAllGlobals());

function local(raw: string | null) {
  vi.stubGlobal('localStorage', { getItem: () => raw, setItem: vi.fn(), removeItem: vi.fn() });
}
const revisionHeaders = new Headers({ ETag: '"revision-1"' });

describe('storage recovery on startup', () => {
  it('preserves an unsupported future local schema and blocks subsequent writes', async () => {
    const raw = JSON.stringify({ ...emptyState(), schemaVersion: 2, futureData: { mustKeep: true } });
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem, removeItem: vi.fn() });
    const fetchMock = vi.fn(async () => { throw new Error('offline'); });
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadState()).rejects.toThrow(/version|format/i);
    const { schemaVersion: _version, ...state } = emptyState();
    await expect(saveState(state)).rejects.toThrow(/not saved|review/i);
    expect(setItem).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not accept an unsupported future server schema', async () => {
    local(null);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, headers: revisionHeaders, json: async () => ({ ...emptyState(), schemaVersion: 2 }) })));
    await expect(loadState()).rejects.toThrow(/version|format|state/i);
    const { schemaVersion: _version, ...state } = emptyState();
    await expect(saveState(state)).rejects.toThrow(/not saved|review/i);
  });
  it('preserves unrecognized schema-1 fields when an offline workspace is saved', async () => {
    let raw: string | null = JSON.stringify({ ...emptyState(), extraLegacyData: { records: ['keep'] } });
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; }, removeItem: vi.fn() });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const loaded = await loadState();
    expect(loaded).not.toBeNull();
    const { schemaVersion: _version, ...knownState } = emptyState();
    await saveState({ ...knownState, receipts: ['new receipt'] });
    expect(JSON.parse(raw!).extraLegacyData).toEqual({ records: ['keep'] });
    expect(JSON.parse(raw!).receipts).toEqual(['new receipt']);
  });
  it('does not reset an offline workspace containing unrecognized fields', async () => {
    const raw = JSON.stringify({ ...emptyState(), extraLegacyData: { records: ['keep'] } });
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: vi.fn(), removeItem });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    await loadState();
    const result = await resetState();
    expect(result.localDeleted).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/unrecognized|review/i);
    expect(removeItem).not.toHaveBeenCalled();
  });
  it('does not overwrite a local copy changed after the session loaded', async () => {
    let raw: string | null = JSON.stringify(emptyState());
    const setItem = vi.fn((_key: string, value: string) => { raw = value; });
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem, removeItem: vi.fn() });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    await loadState();
    const otherTab = JSON.stringify({ ...emptyState(), receipts: ['other tab'] });
    raw = otherTab;
    const { schemaVersion: _version, ...state } = emptyState();
    await expect(saveState({ ...state, receipts: ['this tab'] })).rejects.toThrow(/changed|review/i);
    expect(raw).toBe(otherTab);
    expect(setItem).not.toHaveBeenCalled();
  });
  it('does not reset a local copy changed after the session loaded', async () => {
    let raw: string | null = JSON.stringify(emptyState());
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: vi.fn(), removeItem });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    await loadState();
    raw = JSON.stringify({ ...emptyState(), receipts: ['other tab'] });
    const result = await resetState();
    expect(result.localDeleted).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/changed|review/i);
    expect(removeItem).not.toHaveBeenCalled();
  });
  it('does not post to the server if another local copy appeared after loading', async () => {
    let raw: string | null = null;
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: vi.fn(), removeItem: vi.fn() });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      return { ok: true, headers: revisionHeaders };
    });
    vi.stubGlobal('fetch', fetchMock);
    await loadState();
    raw = JSON.stringify({ ...emptyState(), receipts: ['other tab'] });
    const { schemaVersion: _version, ...state } = emptyState();
    await expect(saveState({ ...state, receipts: ['this tab'] })).rejects.toThrow(/changed|review/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('blocks further writes if a local copy changes while a server save is in flight', async () => {
    let raw: string | null = null;
    let finish!: () => void;
    const serverDone = new Promise<void>(resolve => { finish = resolve; });
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: vi.fn(), removeItem: vi.fn() });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      await serverDone;
      return { ok: true, headers: revisionHeaders };
    });
    vi.stubGlobal('fetch', fetchMock);
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    const save = saveState({ ...state, receipts: ['server write'] });
    await new Promise(resolve => setTimeout(resolve, 0));
    raw = JSON.stringify({ ...emptyState(), receipts: ['other tab'] });
    finish();
    await expect(save).rejects.toThrow(/server.*may|changed.*review/i);
    await expect(saveState(state)).rejects.toThrow(/review/i);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('preserves a local copy changed while a server reset is in flight', async () => {
    let raw: string | null = null;
    let finish!: () => void;
    const serverDone = new Promise<void>(resolve => { finish = resolve; });
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: vi.fn(), removeItem });
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      await serverDone;
      return { ok: true, headers: revisionHeaders };
    }));
    await loadState();
    const resetting = resetState();
    await new Promise(resolve => setTimeout(resolve, 0));
    raw = JSON.stringify({ ...emptyState(), receipts: ['other tab'] });
    finish();
    const result = await resetting;
    expect(result.serverDeleted).toBe(true);
    expect(result.localDeleted).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/server|local.*changed|review/i);
    expect(removeItem).not.toHaveBeenCalled();
  });
  it('refuses to discard an offline copy that differs from the returning server', async () => {
    local(JSON.stringify({ ...emptyState(), receipts: ['offline receipt'] }));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => emptyState() })));
    await expect(loadState()).rejects.toThrow(/conflict|differ/i);
  });
  it('does not treat unreadable local data as an empty workspace', async () => {
    local('{');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    await expect(loadState()).rejects.toThrow(/local|stored/i);
    expect(storageConfig.STORAGE_KEY).toBe('p09-state-v2');
  });
  it('does not fall back to an empty copy when the server returns malformed data', async () => {
    local(null);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ malformed: true }) })));
    await expect(loadState()).rejects.toThrow(/server/i);
  });
  it('keeps an offline edit branch local rather than overwriting a server that returns mid-session', async () => {
    let raw: string | null = null;
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; }, removeItem: vi.fn() });
    const fetchMock = vi.fn(async () => { throw new Error('offline'); });
    vi.stubGlobal('fetch', fetchMock);
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    await saveState({ ...state, receipts: ['offline-1'] });
    fetchMock.mockImplementation(async () => ({ ok: true }) as never);
    await saveState({ ...state, receipts: ['offline-2'] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(raw).toContain('offline-2');
  });
  it('reports failure if neither server nor local storage accepts a save', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: vi.fn() });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    await expect(saveState(state)).rejects.toThrow(/not saved|could not save/i);
  });
  it('does not start a later server save before an earlier one completes', async () => {
    local(null);
    let finishFirst!: () => void;
    const firstDone = new Promise<void>(resolve => { finishFirst = resolve; });
    const bodies: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      bodies.push(String(init?.body));
      if (bodies.length === 1) await firstDone;
      return { ok: true, headers: revisionHeaders };
    }));
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    const first = saveState({ ...state, receipts: ['first'] });
    const second = saveState({ ...state, receipts: ['second'] });
    await new Promise(resolve => setTimeout(resolve, 0));
    const countBeforeRelease = bodies.length;
    finishFirst();
    await Promise.all([first, second]);
    expect(countBeforeRelease).toBe(1);
    expect(JSON.parse(bodies[1]).receipts).toEqual(['second']);
  });
  it('switches to a local branch after an ambiguous failed server response', async () => {
    let raw: string | null = null;
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; }, removeItem: vi.fn() });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      throw new Error('connection lost after potential commit');
    });
    vi.stubGlobal('fetch', fetchMock);
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    expect(await saveState({ ...state, receipts: ['first'] })).toBe('local');
    expect(await saveState({ ...state, receipts: ['second'] })).toBe('local');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(raw).toContain('second');
  });
  it('blocks saves after the initial copy comparison fails', async () => {
    local(JSON.stringify({ ...emptyState(), receipts: ['local'] }));
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => emptyState() }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadState()).rejects.toThrow(/differ/i);
    const { schemaVersion: _version, ...state } = emptyState();
    await expect(saveState(state)).rejects.toThrow(/not saved/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('does not contact a returning server for an offline session reset', async () => {
    local(null);
    const fetchMock = vi.fn(async () => { throw new Error('offline'); });
    vi.stubGlobal('fetch', fetchMock);
    await loadState();
    fetchMock.mockImplementation(async () => ({ ok: true }) as never);
    const result = await resetState();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.serverDeleted).toBeNull();
    expect(result.localDeleted).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/server/i);
  });
  it('waits for a pending save before attempting a server reset', async () => {
    local(null);
    let finishSave!: () => void;
    const saveDone = new Promise<void>(resolve => { finishSave = resolve; });
    const methods: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      methods.push(method);
      if (method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      if (method === 'POST') await saveDone;
      return { ok: true, headers: revisionHeaders };
    }));
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    const save = saveState(state);
    const reset = resetState();
    await new Promise(resolve => setTimeout(resolve, 0));
    const methodsBeforeRelease = [...methods];
    finishSave();
    await Promise.all([save, reset]);
    expect(methodsBeforeRelease).toEqual(['GET', 'POST']);
    expect(methods).toEqual(['GET', 'POST', 'DELETE']);
  });
  it('preserves local recovery data if the server reset response is ambiguous', async () => {
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem });
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      throw new Error('response lost after possible reset');
    }));
    await loadState();
    const result = await resetState();
    expect(result.localDeleted).toBe(false);
    expect(removeItem).not.toHaveBeenCalled();
    expect(result.warnings.join(' ')).toMatch(/review|preserv/i);
    const { schemaVersion: _version, ...state } = emptyState();
    await expect(saveState(state)).rejects.toThrow(/not saved|review/i);
  });
  it('rejects a new save while reset is in flight rather than resurrecting old data', async () => {
    local(null);
    let finishReset!: () => void;
    const resetDone = new Promise<void>(resolve => { finishReset = resolve; });
    const methods: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      methods.push(method);
      if (method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      if (method === 'DELETE') await resetDone;
      return { ok: true, headers: revisionHeaders };
    }));
    await loadState();
    const reset = resetState();
    const { schemaVersion: _version, ...state } = emptyState();
    const save = saveState({ ...state, receipts: ['old data'] });
    // Attach a rejection handler before releasing the reset.
    const saveResult = save.then(() => 'saved', () => 'rejected');
    await new Promise(resolve => setTimeout(resolve, 0));
    finishReset();
    await reset;
    expect(await saveResult).toBe('rejected');
    expect(methods).toEqual(['GET', 'DELETE']);
  });
  it('sends the last server revision and keeps stale writes local', async () => {
    let raw: string | null = null;
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; }, removeItem: vi.fn() });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'GET') return { ok: true, headers: revisionHeaders, json: async () => emptyState() };
      return { ok: false, status: 412 };
    });
    vi.stubGlobal('fetch', fetchMock);
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    expect(await saveState({ ...state, receipts: ['branch'] })).toBe('local');
    expect((fetchMock.mock.calls[1][1]?.headers as Record<string, string>)['If-Match']).toBe('"revision-1"');
    expect(raw).toContain('branch');
  });
  it('does not write to an older server without revision support', async () => {
    let raw: string | null = null;
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; }, removeItem: vi.fn() });
    const fetchMock = vi.fn(async () => ({ ok: true, headers: new Headers(), json: async () => emptyState() }));
    vi.stubGlobal('fetch', fetchMock);
    await loadState();
    const { schemaVersion: _version, ...state } = emptyState();
    expect(await saveState({ ...state, receipts: ['local'] })).toBe('local');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(raw).toContain('local');
  });
});
