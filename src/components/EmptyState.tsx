import React from 'react';
import { Search, AlertTriangle, FileText, Filter } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'filter' | 'data' | 'error';
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const icons = {
  search: Search,
  filter: Filter,
  data: FileText,
  error: AlertTriangle,
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'data',
  title = 'No data found',
  description = 'Try adjusting your filters or search query.',
  action,
}) => {
  const Icon = icons[type];

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors press-scale"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
