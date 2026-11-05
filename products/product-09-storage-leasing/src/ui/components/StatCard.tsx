import { Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'money' | 'warn' | 'danger';
  icon?: ReactNode;
}) {
  const valueClass =
    tone === 'money' ? 'kpi-tile__value kpi-tile__value--money' : 'kpi-tile__value';
  return (
    <div className="kpi-tile">
      <Text className="kpi-tile__label">
        {icon}
        {label}
      </Text>
      <Text className={valueClass}>{value}</Text>
      {hint && (
        <Tooltip label={hint} position="bottom-start">
          <Text className="kpi-tile__hint">{hint}</Text>
        </Tooltip>
      )}
    </div>
  );
}