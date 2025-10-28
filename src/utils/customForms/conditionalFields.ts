/**
 * Custom Forms - Conditional Fields Logic
 * Valuta le condizioni showIf e requiredIf per i campi condizionali
 * 
 * @module utils/customForms/conditionalFields
 * @version 1.0.0
 */

export interface FieldCondition {
  field: string;      // Field code da controllare
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value?: any;        // Valore da confrontare (opzionale per isEmpty/isNotEmpty)
  logic?: 'AND' | 'OR'; // Logica per combinare con la prossima condizione
}

export interface FieldConditions {
  conditions: FieldCondition[];
}

/**
 * Valuta se un campo deve essere mostrato basandosi sulla condizione showIf
 * 
 * @param showIf - Condizioni di visibilità del campo
 * @param formValues - Valori correnti del form
 * @returns true se il campo deve essere mostrato, false altrimenti
 * 
 * @example
 * evaluateShowIf({
 *   conditions: [
 *     { field: 'hasVehicle', operator: 'equals', value: 'yes' }
 *   ]
 * }, { hasVehicle: 'yes' })
 * // returns true
 */
export function evaluateShowIf(
  showIf: FieldConditions | null | undefined,
  formValues: Record<string, any>
): boolean {
  // Se non ci sono condizioni, il campo è sempre visibile
  if (!showIf || !showIf.conditions || showIf.conditions.length === 0) {
    return true;
  }

  return evaluateConditions(showIf.conditions, formValues);
}

/**
 * Valuta se un campo deve essere obbligatorio basandosi sulla condizione requiredIf
 * 
 * @param requiredIf - Condizioni di obbligatorietà del campo
 * @param formValues - Valori correnti del form
 * @returns true se il campo deve essere obbligatorio, false altrimenti
 * 
 * @example
 * evaluateRequiredIf({
 *   conditions: [
 *     { field: 'buildingType', operator: 'equals', value: 'condominium' }
 *   ]
 * }, { buildingType: 'condominium' })
 * // returns true
 */
export function evaluateRequiredIf(
  requiredIf: FieldConditions | null | undefined,
  formValues: Record<string, any>
): boolean {
  // Se non ci sono condizioni, usa il valore isRequired statico
  if (!requiredIf || !requiredIf.conditions || requiredIf.conditions.length === 0) {
    return false; // Non aggiunge requirement dinamico
  }

  return evaluateConditions(requiredIf.conditions, formValues);
}

/**
 * Valuta un array di condizioni con logica AND/OR
 * 
 * @param conditions - Array di condizioni da valutare
 * @param formValues - Valori correnti del form
 * @returns true se le condizioni sono soddisfatte, false altrimenti
 */
function evaluateConditions(
  conditions: FieldCondition[],
  formValues: Record<string, any>
): boolean {
  if (conditions.length === 0) return true;

  let result = evaluateSingleCondition(conditions[0], formValues);

  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    const prevCondition = conditions[i - 1];
    const conditionResult = evaluateSingleCondition(condition, formValues);

    // Se la condizione precedente ha logic definito, usalo
    const logic = prevCondition.logic || 'AND';

    if (logic === 'AND') {
      result = result && conditionResult;
    } else if (logic === 'OR') {
      result = result || conditionResult;
    }
  }

  return result;
}

/**
 * Valuta una singola condizione
 * 
 * @param condition - Condizione da valutare
 * @param formValues - Valori correnti del form
 * @returns true se la condizione è soddisfatta, false altrimenti
 */
function evaluateSingleCondition(
  condition: FieldCondition,
  formValues: Record<string, any>
): boolean {
  const fieldValue = formValues[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'notEquals':
      return fieldValue !== condition.value;

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(String(condition.value));
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;

    case 'notContains':
      if (typeof fieldValue === 'string') {
        return !fieldValue.includes(String(condition.value));
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(condition.value);
      }
      return true;

    case 'greaterThan':
      return Number(fieldValue) > Number(condition.value);

    case 'lessThan':
      return Number(fieldValue) < Number(condition.value);

    case 'isEmpty':
      return (
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    case 'isNotEmpty':
      return (
        fieldValue !== null &&
        fieldValue !== undefined &&
        fieldValue !== '' &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Ottiene tutti i campi visibili in base ai valori correnti del form
 * 
 * @param fields - Array di campi del form
 * @param formValues - Valori correnti del form
 * @returns Array di campi visibili
 */
export function getVisibleFields(
  fields: Array<{
    code: string;
    isHidden?: boolean;
    showIf?: FieldConditions;
    [key: string]: any;
  }>,
  formValues: Record<string, any>
) {
  return fields.filter(field => {
    // Se il campo è nascosto staticamente, non mostrarlo
    if (field.isHidden) return false;

    // Valuta la condizione showIf
    return evaluateShowIf(field.showIf, formValues);
  });
}

/**
 * Ottiene tutti i campi obbligatori in base ai valori correnti del form
 * 
 * @param fields - Array di campi del form
 * @param formValues - Valori correnti del form
 * @returns Set di codici campo obbligatori
 */
export function getRequiredFields(
  fields: Array<{
    code: string;
    isRequired?: boolean;
    requiredIf?: FieldConditions;
    [key: string]: any;
  }>,
  formValues: Record<string, any>
): Set<string> {
  const requiredFields = new Set<string>();

  fields.forEach(field => {
    // Campo obbligatorio statico
    if (field.isRequired) {
      requiredFields.add(field.code);
    }

    // Campo obbligatorio condizionale
    if (evaluateRequiredIf(field.requiredIf, formValues)) {
      requiredFields.add(field.code);
    }
  });

  return requiredFields;
}

/**
 * Valida che tutti i campi obbligatori siano compilati
 * 
 * @param fields - Array di campi del form
 * @param formValues - Valori correnti del form
 * @returns Array di codici campo obbligatori mancanti
 */
export function validateRequiredFields(
  fields: Array<{
    code: string;
    label: string;
    isRequired?: boolean;
    requiredIf?: FieldConditions;
    showIf?: FieldConditions;
    [key: string]: any;
  }>,
  formValues: Record<string, any>
): Array<{ code: string; label: string; message: string }> {
  const errors: Array<{ code: string; label: string; message: string }> = [];

  // Solo campi visibili
  const visibleFields = getVisibleFields(fields, formValues);

  // Ottieni campi obbligatori
  const requiredFieldCodes = getRequiredFields(visibleFields, formValues);

  // Controlla che siano tutti compilati
  requiredFieldCodes.forEach(code => {
    const field = fields.find(f => f.code === code);
    if (!field) return;

    const value = formValues[code];
    const isEmpty = 
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      errors.push({
        code,
        label: field.label,
        message: `Il campo "${field.label}" è obbligatorio`
      });
    }
  });

  return errors;
}
