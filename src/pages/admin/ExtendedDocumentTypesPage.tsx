import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useExtendedDocumentTypes,
  useFormTemplatesForType,
  useLinkFormTemplate,
  useUnlinkFormTemplate,
  useSetDefaultFormTemplate
} from '@/hooks/useDocumentIntegration';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Plus,
  Link as LinkIcon,
  Unlink,
  Star,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ExtendedDocumentTypesPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedFormTemplate, setSelectedFormTemplate] = useState('');

  // Filters
  const filters = React.useMemo(() => {
    const f: any = {};
    if (activeFilter === 'active') f.isActive = true;
    if (activeFilter === 'inactive') f.isActive = false;
    return f;
  }, [activeFilter]);

  // Queries
  const { data: types = [], isLoading, error } = useExtendedDocumentTypes(filters);
  const { data: templates } = useFormTemplatesForType(selectedType || '');

  // Mutations
  const linkMutation = useLinkFormTemplate();
  const unlinkMutation = useUnlinkFormTemplate();
  const setDefaultMutation = useSetDefaultFormTemplate();

  // Filtered types
  const filteredTypes = React.useMemo(() => {
    if (!searchTerm) return types;
    const term = searchTerm.toLowerCase();
    return types.filter(
      (type) =>
        type.displayName.toLowerCase().includes(term) ||
        type.code.toLowerCase().includes(term) ||
        type.description?.toLowerCase().includes(term)
    );
  }, [types, searchTerm]);

  // Handle link template
  const handleLinkTemplate = async () => {
    if (!selectedType || !selectedFormTemplate) {
      toast.error('Seleziona tipo documento e template');
      return;
    }

    try {
      await linkMutation.mutateAsync({
        documentTypeId: selectedType,
        data: {
          formTemplateId: selectedFormTemplate,
          isDefault: false
        }
      });
      toast.success('Template collegato con successo');
      setShowLinkModal(false);
      setSelectedFormTemplate('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nel collegamento template');
    }
  };

  // Handle unlink template
  const handleUnlinkTemplate = async (documentTypeId: string, templateId: string) => {
    if (!confirm('Sei sicuro di voler scollegare questo template?')) return;

    try {
      await unlinkMutation.mutateAsync({ documentTypeId, templateId });
      toast.success('Template scollegato con successo');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nello scollegamento template');
    }
  };

  // Handle set default
  const handleSetDefault = async (documentTypeId: string, templateId: string) => {
    try {
      await setDefaultMutation.mutateAsync({ documentTypeId, formTemplateId: templateId });
      toast.success('Template impostato come predefinito');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nell\'impostazione predefinito');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Errore Caricamento</h2>
          <p className="text-gray-600 text-center">
            Impossibile caricare i tipi di documento. Riprova più tardi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Tipi Documento con Template
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestisci i collegamenti tra tipi di documento e template form
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/document-types')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Gestione Base
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per nome, codice o descrizione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setActiveFilter('active')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Attivi
              </button>
              <button
                onClick={() => setActiveFilter('inactive')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeFilter === 'inactive'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inattivi
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            {filteredTypes.length} {filteredTypes.length === 1 ? 'tipo trovato' : 'tipi trovati'}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Document Types Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {type.icon && <span className="text-2xl">{type.icon}</span>}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {type.displayName}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500">{type.code}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      type.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {type.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>

                {/* Description */}
                {type.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {type.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-blue-50 rounded p-2">
                    <div className="text-lg font-bold text-blue-600">
                      {type.documentCount}
                    </div>
                    <div className="text-xs text-gray-600">Documenti</div>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <div className="text-lg font-bold text-purple-600">
                      {type.templateCount}
                    </div>
                    <div className="text-xs text-gray-600">Template</div>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <div className="text-lg font-bold text-green-600">
                      {type.formTemplateFields || 0}
                    </div>
                    <div className="text-xs text-gray-600">Campi</div>
                  </div>
                </div>

                {/* Template Info */}
                {type.formTemplateName ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Template Collegato
                      </span>
                    </div>
                    <p className="text-sm text-green-700">{type.formTemplateName}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Nessun template collegato
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedType(type.id);
                      setShowLinkModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Collega
                  </button>
                  <button
                    onClick={() => setSelectedType(type.id === selectedType ? null : type.id)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Dettagli
                  </button>
                </div>

                {/* Expanded Details */}
                {selectedType === type.id && templates && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Template Disponibili ({templates.availableTemplates.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {templates.defaultTemplate && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-600 fill-current" />
                              <span className="text-sm font-medium">
                                {templates.defaultTemplate.name}
                              </span>
                            </div>
                            <button
                              onClick={() => handleUnlinkTemplate(type.id, templates.defaultTemplate!.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      {templates.availableTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="bg-gray-50 border border-gray-200 rounded p-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{template.name}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSetDefault(type.id, template.id)}
                                className="text-yellow-600 hover:text-yellow-700"
                                title="Imposta come predefinito"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUnlinkTemplate(type.id, template.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Scollega"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTypes.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nessun tipo documento trovato
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non ci sono tipi di documento disponibili'}
            </p>
          </div>
        )}
      </div>

      {/* Link Template Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Collega Template Form</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona Template
              </label>
              <select
                value={selectedFormTemplate}
                onChange={(e) => setSelectedFormTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Seleziona un template --</option>
                {/* Qui andrebbero caricati i template form disponibili */}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedFormTemplate('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleLinkTemplate}
                disabled={!selectedFormTemplate || linkMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linkMutation.isPending ? 'Collegamento...' : 'Collega'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
