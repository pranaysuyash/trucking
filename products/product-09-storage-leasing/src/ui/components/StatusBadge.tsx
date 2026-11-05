import { Badge } from '@mantine/core';

export type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'neutral';

const COLOR: Record<StatusTone, string> = {
  success: 'teal',
  warn: 'yellow',
  danger: 'red',
  info: 'cyan',
  neutral: 'gray',
};

export function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <Badge
      color={COLOR[tone]}
      variant="light"
      radius="xl"
      size="sm"
      styles={{ label: { textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 } }}
    >
      {children}
    </Badge>
  );
}