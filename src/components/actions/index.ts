export { QuickActions } from './QuickActions';
export { default as QuickActions } from './QuickActions';

// Interfacce utili per l'uso esterno
export interface QuickActionItem {
  icon: React.ComponentType<any>;
  label: string;
  action: string;
  color: string;
  confirmMessage?: string;
  disabled?: boolean;
}

export type QuickActionType = 'quote' | 'request' | 'appointment';

export interface QuickActionsProps {
  type: QuickActionType;
  itemId: string;
  status?: string;
  onActionComplete?: (action: string) => void;
  className?: string;
}