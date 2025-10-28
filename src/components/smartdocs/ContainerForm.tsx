import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TextArea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Loader2, Plus, Save, X } from 'lucide-react';

interface ContainerFormProps {
  mode: 'create' | 'edit';
  groupedCategories: Record<string, any[]>;
  initialData?: {
    type: string;
    name: string;
    description: string;
    ai_prompt: string;
  };
  loading: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export default function ContainerForm({
  mode,
  groupedCategories,
  initialData,
  loading,
  onSubmit,
  onCancel
}: ContainerFormProps) {
  const [formData, setFormData] = useState(initialData || {
    type: '',
    name: '',
    description: '',
    ai_prompt: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Categoria richiesta';
    }

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Nome richiesto';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Il nome deve contenere almeno 3 caratteri';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descrizione non può superare 500 caratteri';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error on field change
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Crea Nuovo Container' : 'Modifica Container'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'I container raggruppano documenti per scopo/contesto (es: progetto cliente, normative, manutenzione). Possono contenere documenti di qualsiasi tipo.'
            : 'Modifica le informazioni del container'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="container-type">
            Categoria Container <span className="text-red-500">*</span>
          </Label>
          <select
            id="container-type"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.type ? 'border-red-500' : 'border-gray-300'
            }`}
            value={formData.type}
            onChange={(e) => handleFieldChange('type', e.target.value)}
            disabled={mode === 'edit'}
          >
            <option value="">-- Seleziona categoria --</option>
            {Object.entries(groupedCategories).map(([group, cats]) => (
              <optgroup key={group} label={group}>
                {(cats as any[]).filter(c => c.is_active).map((cat) => (
                  <option key={cat.id} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type}</p>
          )}
          <p className="text-xs text-muted-foreground">
            💡 La categoria serve per organizzare i container. Ogni container può contenere documenti di qualsiasi tipo (PDF, DOC, XLSX, ecc.).
          </p>
          <p className="text-xs text-blue-600">
            ⚙️ Puoi gestire le categorie nel tab "Settings"
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="container-name">
            Nome <span className="text-red-500">*</span>
          </Label>
          <Input
            id="container-name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="es: Manuali Qualità"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="container-description">Descrizione</Label>
          <TextArea
            id="container-description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Descrizione del container..."
            rows={3}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/500 caratteri
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="container-prompt">AI Prompt (opzionale)</Label>
          <TextArea
            id="container-prompt"
            value={formData.ai_prompt}
            onChange={(e) => handleFieldChange('ai_prompt', e.target.value)}
            placeholder="es: Sei un assistente esperto in manutenzione impianti. Analizza i documenti e rispondi in modo tecnico e preciso..."
            rows={6}
          />
          <p className="text-xs text-muted-foreground">
            🤖 Il prompt personalizzato viene usato dall'AI quando interroga i documenti in questo container. Se vuoto, verrà usato il prompt di default.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'create' ? 'Creazione...' : 'Salvataggio...'}
              </>
            ) : (
              <>
                {mode === 'create' ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crea Container
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salva Modifiche
                  </>
                )}
              </>
            )}
          </Button>
          {mode === 'edit' && onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Annulla
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
