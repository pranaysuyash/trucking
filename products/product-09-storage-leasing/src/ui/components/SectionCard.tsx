import { Card, Group, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

export function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="section-card" withBorder radius="lg" p="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Stack gap={2}>
          <Title order={4} className="section-card__title">
            {title}
          </Title>
          {subtitle && (
            <Text size="xs" c="dimmed" className="section-card__subtitle">
              {subtitle}
            </Text>
          )}
        </Stack>
        {action}
      </Group>
      {children}
    </Card>
  );
}