import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center [&_button]:w-full sm:[&_button]:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  children?: React.ReactNode;
}

export function SearchFilters({
  search,
  onSearchChange,
  onSearch,
  placeholder = 'Search...',
  children,
}: SearchFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-end">
      <div className="flex-1 sm:max-w-sm">
        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 bg-background pl-9"
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
      </div>
      {children}
      <Button className="h-9 w-full shrink-0 sm:w-auto" onClick={onSearch}>Search</Button>
    </div>
  );
}
