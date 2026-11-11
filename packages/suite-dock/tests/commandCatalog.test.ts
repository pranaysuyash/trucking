import { describe, expect, it, vi } from 'vitest';
import { buildCommandCatalog } from '../src/CommandPalette';

describe('suite command destinations', () => {
  it('routes carrier commands to Carrier Trust without invented selected identities', () => {
    const openUrl = vi.fn();
    const commands = buildCommandCatalog({ openUrl });
    for (const id of ['act-carrier-audit', 'ent-carrier-apex', 'ent-carrier-veloce']) {
      const command = commands.find(item => item.id === id);
      expect(command, id).toBeDefined();
      command!.onSelect();
    }
    expect(openUrl.mock.calls).toEqual([
      ['http://localhost:5180'],
      ['http://localhost:5180'],
      ['http://localhost:5180'],
    ]);
    expect(commands.find(item => item.id === 'act-carrier-audit')?.badge).toBe('P08 Carrier Trust');
    expect(commands.find(item => item.id === 'act-warehouse-putaway')?.badge).toBe('P06 Warehouse');
  });

  it('preserves product selection callbacks and all product-specific actions', () => {
    const onSelectProduct = vi.fn();
    const openUrl = vi.fn();
    const commands = buildCommandCatalog({ openUrl, onSelectProduct });
    commands.find(item => item.id === 'prod-product-08-carrier-trust')!.onSelect();
    expect(onSelectProduct).toHaveBeenCalledWith('product-08-carrier-trust');
    expect(commands.find(item => item.id === 'prod-product-09-storage-leasing')!.subtitle).not.toContain('Pro');
    commands.find(item => item.id === 'act-warehouse-putaway')!.onSelect();
    expect(openUrl).toHaveBeenCalledWith('http://localhost:5178');
  });

  it('opens every product shortcut at the registry route for its intended product', () => {
    const openUrl = vi.fn();
    const commands = buildCommandCatalog({ openUrl });
    const destinations: Record<string, string> = {
      'act-cargo-solve': 'http://localhost:5173',
      'act-carrier-audit': 'http://localhost:5180',
      'act-rate-con': 'http://localhost:5174',
      'act-hos-sim': 'http://localhost:5175',
      'act-telematics-tele': 'http://localhost:5177',
      'act-warehouse-putaway': 'http://localhost:5178',
      'act-command-center': 'http://localhost:5170',
      'ent-trailer-everest': 'http://localhost:5176',
    };
    for (const [id, url] of Object.entries(destinations)) {
      openUrl.mockClear();
      const command = commands.find(item => item.id === id);
      expect(command, id).toBeDefined();
      command!.onSelect();
      expect(openUrl, id).toHaveBeenCalledOnce();
      expect(openUrl, id).toHaveBeenCalledWith(url);
    }
  });
});
