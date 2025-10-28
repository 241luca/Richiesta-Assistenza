import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TextArea } from '../ui/textarea';
import { Label } from '../ui/label';
import { X, Save } from 'lucide-react';
import { ContainerInstance, UpdateInstanceData } from '../../services/containerInstances.service';
import containerInstancesService from '../../services/containerInstances.service';
import { toast } from '../../utils/toast';

interface EditInstanceModalProps {
  instance: ContainerInstance;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditInstanceModal({ instance, onClose, onSuccess }: EditInstanceModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState(instance.name);
  const [description, setDescription] = useState(instance.description || '');
  const [aiPrompt, setAiPrompt] = useState(instance.ai_prompt || '');
  const [aiModel, setAiModel] = useState(instance.ai_model);
  const [aiTemperature, setAiTemperature] = useState(Number(instance.ai_temperature));
  const [aiMaxTokens, setAiMaxTokens] = useState(Number(instance.ai_max_tokens));
  const [knowledgeBaseIds, setKnowledgeBaseIds] = useState<string[]>(instance.knowledge_base_ids || []);
  const [memoriesEnabled, setMemoriesEnabled] = useState(instance.memories_enabled || false);
  const [chunkSize, setChunkSize] = useState(Number(instance.chunk_size));
  const [chunkOverlap, setChunkOverlap] = useState(Number(instance.chunk_overlap));
  const [allowedFormats, setAllowedFormats] = useState<string[]>(instance.allowed_formats);
  const [documentTypes, setDocumentTypes] = useState<string[]>(instance.document_types);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name || name.trim().length < 3) {
      newErrors.name = 'Nome richiesto (min 3 caratteri)';
    }
    if (aiTemperature < 0 || aiTemperature > 1) {
      newErrors.temperature = 'Temperature deve essere tra 0 e 1';
    }
    if (aiMaxTokens < 1 || aiMaxTokens > 4000) {
      newErrors.maxTokens = 'Max tokens tra 1 e 4000';
    }
    if (chunkSize < 100 || chunkSize > 3000) {
      newErrors.chunkSize = 'Chunk size tra 100 e 3000';
    }
    if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
      newErrors.chunkOverlap = 'Overlap deve essere < chunk size';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const updates: UpdateInstanceData = {
        name,
        description: description || undefined,
        ai_prompt: aiPrompt || undefined,
        ai_model: aiModel,
        ai_temperature: aiTemperature,
        ai_max_tokens: aiMaxTokens,
        knowledge_base_ids: knowledgeBaseIds,
        memories_enabled: memoriesEnabled,
        allowed_formats: allowedFormats,
        document_types: documentTypes,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap
      };

      await containerInstancesService.update(instance.id, updates);
      toast.success('Container aggiornato con successo!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating instance:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiornamento');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Modifica Container</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Base */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Container *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="description">Descrizione</Label>
                <TextArea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurazione AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">AI Prompt</Label>
                <TextArea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="Prompt personalizzato per l'AI..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai-model">Modello AI</Label>
                  <select
                    id="ai-model"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature: {aiTemperature.toFixed(2)}</Label>
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiTemperature}
                    onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  {errors.temperature && <p className="text-sm text-red-500">{errors.temperature}</p>}
                </div>

                <div>
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={aiMaxTokens}
                    onChange={(e) => setAiMaxTokens(parseInt(e.target.value))}
                    min="1"
                    max="4000"
                    className={errors.maxTokens ? 'border-red-500' : ''}
                  />
                  {errors.maxTokens && <p className="text-sm text-red-500">{errors.maxTokens}</p>}
                </div>
              </div>

              {/* Knowledge Base & Memories */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Knowledge Base e Memories</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="kb-ids">Knowledge Base IDs (separati da virgola)</Label>
                    <Input
                      id="kb-ids"
                      value={knowledgeBaseIds.join(', ')}
                      onChange={(e) => setKnowledgeBaseIds(
                        e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                      )}
                      placeholder="kb-1, kb-2, kb-3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Inserisci gli ID delle knowledge base separate da virgola
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="memories-enabled"
                      checked={memoriesEnabled}
                      onChange={(e) => setMemoriesEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="memories-enabled" className="cursor-pointer">
                      Abilita Memories (conversazioni persistenti)
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formati e Tipi */}
          <Card>
            <CardHeader>
              <CardTitle>Formati e Tipi Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Formati Accettati</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx'].map(format => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => toggleFormat(format)}
                      className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                        allowedFormats.includes(format)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      .{format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tipi Documento</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['document', 'manual', 'report', 'contract', 'invoice', 'presentation'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleDocType(type)}
                      className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                        documentTypes.includes(type)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAG Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni RAG</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chunk-size">Chunk Size</Label>
                  <Input
                    id="chunk-size"
                    type="number"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    min="100"
                    max="3000"
                    className={errors.chunkSize ? 'border-red-500' : ''}
                  />
                  {errors.chunkSize && <p className="text-sm text-red-500">{errors.chunkSize}</p>}
                </div>

                <div>
                  <Label htmlFor="chunk-overlap">Chunk Overlap</Label>
                  <Input
                    id="chunk-overlap"
                    type="number"
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                    min="0"
                    max={chunkSize - 1}
                    className={errors.chunkOverlap ? 'border-red-500' : ''}
                  />
                  {errors.chunkOverlap && <p className="text-sm text-red-500">{errors.chunkOverlap}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salva Modifiche
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
