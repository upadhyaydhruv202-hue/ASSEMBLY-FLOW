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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end mb-4">
      <div className="flex-1 max-w-sm">
        <Label className="sr-only">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
      </div>
      {children}
      <Button variant="secondary" onClick={onSearch}>Search</Button>
    </div>
  );
}
