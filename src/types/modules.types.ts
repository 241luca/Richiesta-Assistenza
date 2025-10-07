export type ModuleCategory = 
  | 'CORE'
  | 'BUSINESS'
  | 'COMMUNICATION'
  | 'ADVANCED'
  | 'REPORTING'
  | 'AUTOMATION'
  | 'INTEGRATIONS'
  | 'ADMIN';

export interface SystemModule {
  code: string;
  name: string;
  description: string;
  category: ModuleCategory;
  isEnabled: boolean;
  isCore: boolean;
  dependsOn: string[];
  requiredFor?: string[];
  icon: string;
  color: string;
  order: number;
  _count?: {
    settings: number;
  };
}

export interface ModuleSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  isRequired: boolean;
  isSecret: boolean;
}