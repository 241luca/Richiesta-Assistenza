import { logger } from '../utils/logger';

export interface SystemEnumData {
  name: string;
  description?: string;
  category?: string;
  isEditable?: boolean;
}

export interface EnumValueData {
  enumId: string;
  value: string;
  label: string;
  description?: string;
  color?: string;
  textColor?: string;
  bgColor?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: any;
}

// Definizione degli enum del sistema basata su schema Prisma
const SYSTEM_ENUMS = {
  'PRIORITY': {
    id: 'priority',
    name: 'PRIORITY',
    description: 'Livelli di priorità delle richieste',
    Category: 'request',
    isEditable: false,
    values: [
      { value: 'LOW', label: 'Bassa', color: '#10b981', textColor: '#ffffff', order: 1 },
      { value: 'MEDIUM', label: 'Media', color: '#f59e0b', textColor: '#ffffff', order: 2, isDefault: true },
      { value: 'HIGH', label: 'Alta', color: '#ef4444', textColor: '#ffffff', order: 3 },
      { value: 'URGENT', label: 'Urgente', color: '#dc2626', textColor: '#ffffff', order: 4 }
    ]
  },
  'REQUEST_STATUS': {
    id: 'request_status',
    name: 'REQUEST_STATUS',
    description: 'Stati delle richieste di assistenza',
    Category: 'request',
    isEditable: false,
    values: [
      { value: 'PENDING', label: 'In Attesa', color: '#6b7280', textColor: '#ffffff', order: 1, isDefault: true },
      { value: 'ASSIGNED', label: 'Assegnata', color: '#3b82f6', textColor: '#ffffff', order: 2 },
      { value: 'IN_PROGRESS', label: 'In Corso', color: '#f59e0b', textColor: '#ffffff', order: 3 },
      { value: 'COMPLETED', label: 'Completata', color: '#10b981', textColor: '#ffffff', order: 4 },
      { value: 'CANCELLED', label: 'Annullata', color: '#ef4444', textColor: '#ffffff', order: 5 }
    ]
  },
  'QUOTE_STATUS': {
    id: 'quote_status',
    name: 'QUOTE_STATUS',
    description: 'Stati dei preventivi',
    Category: 'quote',
    isEditable: false,
    values: [
      { value: 'DRAFT', label: 'Bozza', color: '#6b7280', textColor: '#ffffff', order: 1, isDefault: true },
      { value: 'PENDING', label: 'In Attesa', color: '#3b82f6', textColor: '#ffffff', order: 2 },
      { value: 'ACCEPTED', label: 'Accettato', color: '#10b981', textColor: '#ffffff', order: 3 },
      { value: 'REJECTED', label: 'Rifiutato', color: '#ef4444', textColor: '#ffffff', order: 4 },
      { value: 'EXPIRED', label: 'Scaduto', color: '#6b7280', textColor: '#ffffff', order: 5 }
    ]
  },
  'PAYMENT_STATUS': {
    id: 'payment_status',
    name: 'PAYMENT_STATUS',
    description: 'Stati dei pagamenti',
    Category: 'payment',
    isEditable: false,
    values: [
      { value: 'PENDING', label: 'In Attesa', color: '#f59e0b', textColor: '#ffffff', order: 1, isDefault: true },
      { value: 'PROCESSING', label: 'In Elaborazione', color: '#3b82f6', textColor: '#ffffff', order: 2 },
      { value: 'COMPLETED', label: 'Completato', color: '#10b981', textColor: '#ffffff', order: 3 },
      { value: 'FAILED', label: 'Fallito', color: '#ef4444', textColor: '#ffffff', order: 4 },
      { value: 'REFUNDED', label: 'Rimborsato', color: '#6b7280', textColor: '#ffffff', order: 5 }
    ]
  },
  'PAYMENT_TYPE': {
    id: 'payment_type',
    name: 'PAYMENT_TYPE',
    description: 'Tipologie di pagamento',
    Category: 'payment',
    isEditable: false,
    values: [
      { value: 'DEPOSIT', label: 'Acconto', color: '#3b82f6', textColor: '#ffffff', order: 1 },
      { value: 'FULL_PAYMENT', label: 'Pagamento Completo', color: '#10b981', textColor: '#ffffff', order: 2, isDefault: true },
      { value: 'PARTIAL_PAYMENT', label: 'Pagamento Parziale', color: '#f59e0b', textColor: '#ffffff', order: 3 }
    ]
  },
  'USER_ROLE': {
    id: 'user_role',
    name: 'USER_ROLE',
    description: 'Ruoli utenti del sistema',
    Category: 'user',
    isEditable: false,
    values: [
      { value: 'CLIENT', label: 'Cliente', color: '#3b82f6', textColor: '#ffffff', order: 1, isDefault: true },
      { value: 'PROFESSIONAL', label: 'Professionista', color: '#10b981', textColor: '#ffffff', order: 2 },
      { value: 'ADMIN', label: 'Amministratore', color: '#f59e0b', textColor: '#ffffff', order: 3 },
      { value: 'SUPER_ADMIN', label: 'Super Admin', color: '#dc2626', textColor: '#ffffff', order: 4 }
    ]
  },
  'NOTIFICATION_PRIORITY': {
    id: 'notification_priority',
    name: 'NOTIFICATION_PRIORITY', 
    description: 'Priorità delle notifiche',
    Category: 'notification',
    isEditable: false,
    values: [
      { value: 'LOW', label: 'Bassa', color: '#6b7280', textColor: '#ffffff', order: 1 },
      { value: 'NORMAL', label: 'Normale', color: '#3b82f6', textColor: '#ffffff', order: 2, isDefault: true },
      { value: 'HIGH', label: 'Alta', color: '#f59e0b', textColor: '#ffffff', order: 3 },
      { value: 'URGENT', label: 'Urgente', color: '#dc2626', textColor: '#ffffff', order: 4 }
    ]
  }
};

export class SystemEnumService {
  /**
   * Get all system enums with their values
   */
  async getAllEnums() {
    try {
      // Restituisce tutti gli enum del sistema definiti staticamente
      return Object.values(SYSTEM_ENUMS).map(enumDef => ({
        id: enumDef.id,
        name: enumDef.name,
        description: enumDef.description,
        Category: enumDef.category,
        isEditable: enumDef.isEditable,
        isActive: true,
        EnumValue: enumDef.values.map((val, idx) => ({
          id: `${enumDef.id}_${val.value}`,
          enumId: enumDef.id,
          value: val.value,
          label: val.label,
          description: val.description || null,
          color: val.color,
          textColor: val.textColor,
          bgColor: val.bgColor || null,
          icon: val.icon || null,
          order: val.order || idx,
          isActive: true,
          isDefault: val.isDefault || false,
          metadata: val.metadata || null
        }))
      }));
    } catch (error) {
      logger.error('Error getting all system enums:', error);
      throw new Error('Failed to fetch system enums');
    }
  }

  /**
   * Get enum values by enum name (es: 'PRIORITY', 'REQUEST_STATUS')
   */
  async getEnumValues(enumName: string) {
    try {
      const enumDef = SYSTEM_ENUMS[enumName];
      if (!enumDef) {
        throw new Error(`System enum '${enumName}' not found`);
      }

      return enumDef.values.map((val, idx) => ({
        id: `${enumDef.id}_${val.value}`,
        enumId: enumDef.id,
        value: val.value,
        label: val.label,
        description: val.description || null,
        color: val.color,
        textColor: val.textColor,
        bgColor: val.bgColor || null,
        icon: val.icon || null,
        order: val.order || idx,
        isActive: true,
        isDefault: val.isDefault || false,
        metadata: val.metadata || null
      }));
    } catch (error) {
      logger.error(`Error getting enum values for '${enumName}':`, error);
      throw error;
    }
  }

  /**
   * Get enum value configuration (color, icon, etc) by enum name and value
   */
  async getEnumValueConfig(enumName: string, value: string) {
    try {
      const enumDef = SYSTEM_ENUMS[enumName];
      if (!enumDef) {
        return null;
      }

      const enumValue = enumDef.values.find(val => val.value === value);
      if (!enumValue) {
        return null;
      }

      return {
        id: `${enumDef.id}_${enumValue.value}`,
        enumId: enumDef.id,
        value: enumValue.value,
        label: enumValue.label,
        description: enumValue.description || null,
        color: enumValue.color,
        textColor: enumValue.textColor,
        bgColor: enumValue.bgColor || null,
        icon: enumValue.icon || null,
        order: enumValue.order || 0,
        isActive: true,
        isDefault: enumValue.isDefault || false,
        metadata: enumValue.metadata || null,
        SystemEnum: {
          id: enumDef.id,
          name: enumDef.name,
          description: enumDef.description,
          Category: enumDef.category
        }
      };
    } catch (error) {
      logger.error(`Error getting enum value config for '${enumName}.${value}':`, error);
      throw error;
    }
  }

  /**
   * Create new system enum (non supportato per enum statici)
   */
  async createEnum(data: SystemEnumData) {
    logger.warn('Cannot create system enum: System enums are statically defined');
    throw new Error('System enums cannot be created dynamically');
  }

  /**
   * Update system enum (non supportato per enum statici)
   */
  async updateEnum(id: string, data: Partial<SystemEnumData>) {
    logger.warn(`Cannot update system enum ${id}: System enums are statically defined`);
    throw new Error('System enums cannot be updated');
  }

  /**
   * Create enum value (non supportato per enum statici)
   */
  async createEnumValue(data: EnumValueData) {
    logger.warn('Cannot create enum value: System enum values are statically defined');
    throw new Error('System enum values cannot be created dynamically');
  }

  /**
   * Update enum value (non supportato per enum statici)
   */
  async updateEnumValue(id: string, data: Partial<EnumValueData>) {
    logger.warn(`Cannot update enum value ${id}: System enum values are statically defined`);
    throw new Error('System enum values cannot be updated');
  }

  /**
   * Delete enum value (non supportato per enum statici)
   */
  async deleteEnumValue(id: string) {
    logger.warn(`Cannot delete enum value ${id}: System enum values are statically defined`);
    throw new Error('System enum values cannot be deleted');
  }

  /**
   * Get formatted enum values for use in components (Badge, Select, etc)
   */
  async getFormattedEnumValues(enumName: string) {
    try {
      const values = await this.getEnumValues(enumName);
      
      return values.map(value => ({
        value: value.value,
        label: value.label,
        color: value.color,
        textColor: value.textColor,
        bgColor: value.bgColor,
        icon: value.icon,
        isDefault: value.isDefault
      }));
    } catch (error) {
      logger.error(`Error getting formatted enum values for '${enumName}':`, error);
      throw error;
    }
  }

  /**
   * Validate enum value against current system values
   */
  async validateEnumValue(enumName: string, value: string): Promise<boolean> {
    try {
      const enumValue = await this.getEnumValueConfig(enumName, value);
      return !!enumValue;
    } catch (error) {
      return false;
    }
  }
}

export const systemEnumService = new SystemEnumService();
