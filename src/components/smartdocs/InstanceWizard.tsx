import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TextArea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Loader2, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';

interface Template {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  group_name?: string;
  default_ai_prompt?: string;
}

interface InstanceWizardProps {
  userId: string; // Changed from number to string to support UUID
  userType: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
  onComplete: () => void;
  onCancel: () => void;
}

export default function InstanceWizard({
  userId,
  userType,
  onComplete,
  onCancel
}: InstanceWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groupedTemplates, setGroupedTemplates] = useState<Record<string, Template[]>>({});

  // Step 1: Template selezionato
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Step 2: Configurazione base
  const [instanceName, setInstanceName] = useState('');
  const [instanceDescription, setInstanceDescription] = useState('');

  // Step 3: AI Settings
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4');
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [aiMaxTokens, setAiMaxTokens] = useState(2000);

  // Step 4: Formati e Tipi
  const [allowedFormats, setAllowedFormats] = useState<string[]>(['pdf', 'doc', 'docx', 'txt']);
  const [documentTypes, setDocumentTypes] = useState<string[]>(['document', 'manual', 'report']);

  // Step 5: RAG Settings
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.default_ai_prompt) {
      setAiPrompt(selectedTemplate.default_ai_prompt);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const response = await api.get('http://localhost:3500/api/container-categories/grouped');
      if (response.data.success) {
        setGroupedTemplates(response.data.data);
        const allTemplates: Template[] = [];
        Object.values(response.data.data).forEach((cats: any) => {
          allTemplates.push(...cats.filter((c: any) => c.is_active));
        });
        setTemplates(allTemplates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Errore caricamento template');
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!selectedTemplate) {
        newErrors.template = 'Seleziona un template';
      }
    }

    if (currentStep === 2) {
      if (!instanceName || instanceName.trim().length < 3) {
        newErrors.name = 'Nome richiesto (min 3 caratteri)';
      }
      if (instanceDescription && instanceDescription.length > 500) {
        newErrors.description = 'Descrizione max 500 caratteri';
      }
    }

    if (currentStep === 3) {
      if (aiTemperature < 0 || aiTemperature > 1) {
        newErrors.temperature = 'Temperature deve essere tra 0 e 1';
      }
      if (aiMaxTokens < 1 || aiMaxTokens > 4000) {
        newErrors.maxTokens = 'Max tokens tra 1 e 4000';
      }
    }

    if (currentStep === 4) {
      if (allowedFormats.length === 0) {
        newErrors.formats = 'Seleziona almeno un formato';
      }
      if (documentTypes.length === 0) {
        newErrors.types = 'Seleziona almeno un tipo documento';
      }
    }

    if (currentStep === 5) {
      if (chunkSize < 100 || chunkSize > 3000) {
        newErrors.chunkSize = 'Chunk size tra 100 e 3000';
      }
      if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
        newErrors.chunkOverlap = 'Overlap deve essere < chunk size';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreate = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      const data = {
        template_code: selectedTemplate!.code,
        owner_id: userId,
        owner_type: userType,
        name: instanceName,
        description: instanceDescription || undefined,
        ai_prompt: aiPrompt || undefined,
        ai_model: aiModel,
        ai_temperature: aiTemperature,
        ai_max_tokens: aiMaxTokens,
        allowed_formats: allowedFormats,
        document_types: documentTypes,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap
      };

      console.log('[InstanceWizard] Creating container with data:', data);
      const response = await api.post('/smartdocs/instances', data);
      console.log('[InstanceWizard] Container created successfully:', response.data);
      
      toast.success('Container creato con successo!');
      onComplete();
    } catch (error: any) {
      console.error('[InstanceWizard] Error creating container:', error);
      console.error('[InstanceWizard] Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  const toggleFormat = (format: string) => {
    setAllowedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const toggleDocType = (type: string) => {
    setDocumentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 5 && (
                <div
                  className={`h-1 w-16 mx-2 ${
                    s < step ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={step === 1 ? 'font-semibold' : 'text-gray-600'}>Template</span>
          <span className={step === 2 ? 'font-semibold' : 'text-gray-600'}>Info Base</span>
          <span className={step === 3 ? 'font-semibold' : 'text-gray-600'}>AI Settings</span>
          <span className={step === 4 ? 'font-semibold' : 'text-gray-600'}>Formati</span>
          <span className={step === 5 ? 'font-semibold' : 'text-gray-600'}>RAG</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Seleziona Template'}
            {step === 2 && 'Informazioni Base'}
            {step === 3 && 'Configurazione AI'}
            {step === 4 && 'Formati e Tipi Documento'}
            {step === 5 && 'Impostazioni RAG'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Scegli il template più adatto alle tue esigenze'}
            {step === 2 && 'Dai un nome e descrizione al tuo container'}
            {step === 3 && 'Personalizza il comportamento dell\'AI'}
            {step === 4 && 'Seleziona i formati e tipi di documento accettati'}
            {step === 5 && 'Configura le impostazioni di chunking e retrieval'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* STEP 1: Selezione Template */}
          {step === 1 && (
            <div className="space-y-4">
              {Object.entries(groupedTemplates).map(([group, tmpls]) => (
                <div key={group}>
                  <h3 className="font-semibold text-lg mb-3">{group}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tmpls.map((template: Template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{template.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {template.description || 'Nessuna descrizione'}
                            </p>
                          </div>
                          {template.icon && (
                            <div className="ml-3 text-2xl">{template.icon}</div>
                          )}
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <div className="mt-3">
                            <Badge variant="default">Selezionato</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {errors.template && (
                <p className="text-sm text-red-500">{errors.template}</p>
              )}
            </div>
          )}

          {/* STEP 2: Info Base */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="instance-name">
                  Nome Container <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="instance-name"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="es: Manuali Caldaie Cliente Rossi"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="instance-description">Descrizione</Label>
                <TextArea
                  id="instance-description"
                  value={instanceDescription}
                  onChange={(e) => setInstanceDescription(e.target.value)}
                  placeholder="Descrizione del container..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {instanceDescription.length}/500 caratteri
                </p>
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm">
                  <strong>Template selezionato:</strong> {selectedTemplate?.name}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: AI Settings */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">
                  AI Prompt Personalizzato
                  <Sparkles className="w-4 h-4 inline ml-1 text-yellow-500" />
                </Label>
                <TextArea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Personalizza il comportamento dell'AI..."
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Questo prompt verrà usato quando interroghi i documenti. Se vuoto, usa quello del template.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai-model">Modello AI</Label>
                  <select
                    id="ai-model"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="gpt-4">GPT-4 (consigliato)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (economico)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="ai-temperature">
                    Temperature: {aiTemperature.toFixed(2)}
                  </Label>
                  <input
                    type="range"
                    id="ai-temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiTemperature}
                    onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    0 = Preciso, 1 = Creativo
                  </p>
                  {errors.temperature && (
                    <p className="text-sm text-red-500">{errors.temperature}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ai-max-tokens">Max Tokens</Label>
                  <Input
                    type="number"
                    id="ai-max-tokens"
                    value={aiMaxTokens}
                    onChange={(e) => setAiMaxTokens(parseInt(e.target.value))}
                    min="1"
                    max="4000"
                    className={errors.maxTokens ? 'border-red-500' : ''}
                  />
                  {errors.maxTokens && (
                    <p className="text-sm text-red-500">{errors.maxTokens}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Formati e Tipi */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Formati File Accettati *</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'csv', 'jpg', 'png'].map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => toggleFormat(format)}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        allowedFormats.includes(format)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      .{format.toUpperCase()}
                    </button>
                  ))}
                </div>
                {errors.formats && (
                  <p className="text-sm text-red-500 mt-2">{errors.formats}</p>
                )}
              </div>

              <div>
                <Label className="mb-3 block">Tipi Documento Accettati *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'document', label: 'Documento Generico' },
                    { value: 'manual', label: 'Manuale' },
                    { value: 'report', label: 'Rapportino' },
                    { value: 'contract', label: 'Contratto' },
                    { value: 'invoice', label: 'Fattura' },
                    { value: 'technical', label: 'Documentazione Tecnica' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleDocType(type.value)}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        documentTypes.includes(type.value)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                {errors.types && (
                  <p className="text-sm text-red-500 mt-2">{errors.types}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: RAG Settings */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  ⚙️ <strong>Impostazioni Avanzate:</strong> Queste configurazioni influenzano come i documenti vengono processati e recuperati durante le query.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chunk-size">Chunk Size (caratteri)</Label>
                  <Input
                    type="number"
                    id="chunk-size"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    min="100"
                    max="3000"
                    className={errors.chunkSize ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: 1000. Dimensione di ogni chunk di testo.
                  </p>
                  {errors.chunkSize && (
                    <p className="text-sm text-red-500">{errors.chunkSize}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="chunk-overlap">Chunk Overlap (caratteri)</Label>
                  <Input
                    type="number"
                    id="chunk-overlap"
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                    min="0"
                    max={chunkSize - 1}
                    className={errors.chunkOverlap ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: 200. Sovrapposizione tra chunk consecutivi.
                  </p>
                  {errors.chunkOverlap && (
                    <p className="text-sm text-red-500">{errors.chunkOverlap}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-2">
                <h4 className="font-semibold">Riepilogo Configurazione:</h4>
                <p className="text-sm"><strong>Template:</strong> {selectedTemplate?.name}</p>
                <p className="text-sm"><strong>Nome:</strong> {instanceName}</p>
                <p className="text-sm"><strong>Modello AI:</strong> {aiModel}</p>
                <p className="text-sm"><strong>Formati:</strong> {allowedFormats.join(', ')}</p>
                <p className="text-sm"><strong>Tipi:</strong> {documentTypes.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
              )}
              {step === 1 && (
                <Button variant="outline" onClick={onCancel}>
                  Annulla
                </Button>
              )}
            </div>

            <div>
              {step < 5 ? (
                <Button onClick={handleNext}>
                  Avanti
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creazione...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Crea Container
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
