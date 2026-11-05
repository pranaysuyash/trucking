import { Text } from '@mantine/core';
import { inr } from '../format';

export function Money({ value, compact }: { value: number; compact?: boolean }) {
  return (
    <Text
      component="span"
      className="mono"
      style={{ color: 'var(--p09-brass-light)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
    >
      {inr(value, { compact })}
    </Text>
  );
}