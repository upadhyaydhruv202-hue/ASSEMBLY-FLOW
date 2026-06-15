import { cn, getStatusColor, COMPONENT_TYPES } from '@/lib/utils';

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'outline' && 'border border-input text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getStatusColor(status))}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const CELL_LIGHT_COLORS: Record<string, string> = {
  Green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  White: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  Yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export function CellLightBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', CELL_LIGHT_COLORS[value] || 'bg-muted text-muted-foreground')}>
      {value}
    </span>
  );
}

export function ComponentBadge({ type }: { type: keyof typeof COMPONENT_TYPES | string }) {
  const label = COMPONENT_TYPES[type as keyof typeof COMPONENT_TYPES] || type.replace(/_/g, ' ');
  const color = type === 'DOOR_LEAF'
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    : 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', color)}>
      {label}
    </span>
  );
}
