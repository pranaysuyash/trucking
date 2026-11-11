import { vi } from 'vitest';

// Unit tests must never send carrier identifiers to a remote registry.
vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network access is disabled in Product 08 tests. Inject a fixture transport.'); }));
