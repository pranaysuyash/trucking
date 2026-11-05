import { Text, Button } from '@mantine/core';
import type { ReactNode } from 'react';

export function EmptyState({
  title,
  hint,
  action,
  onAction,
}: {
  title: string;
  hint?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <Text className="empty-state__title">{title}</Text>
      {hint && <Text className="empty-state__hint">{hint}</Text>}
      {action && onAction && (
        <Button size="sm" color="teal" onClick={onAction} style={{ marginTop: 8 }}>
          {action}
        </Button>
      )}
    </div>
  );
}

export type EmptyStateProps = {
  title: string;
  hint?: string;
  action?: ReactNode;
};