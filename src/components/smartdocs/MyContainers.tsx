import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Loader2,
  FolderOpen,
  Settings,
  BarChart3
} from 'lucide-react';
import containerInstancesService, { ContainerInstance } from '../../services/containerInstances.service';
import InstanceWizard from './InstanceWizard';
import { toast } from '../../utils/toast';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditInstanceModal from './EditInstanceModal';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import { DocumentQuery } from './DocumentQuery';

interface MyContainersProps {
  userId: string; // Changed from number to string to support UUID
  userType: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
}

export default function MyContainers({ userId, userType }: MyContainersProps) {
  const [instances, setInstances] = useState<ContainerInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ContainerInstance | null>(null);
  const [viewingInstance, setViewingInstance] = useState<ContainerInstance | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<{ id: string; name: string } | null>(null);
  const [instanceStats, setInstanceStats] = useState<Record<string, any>>({});

  useEffect(() => {
    loadInstances();
  }, [userId, userType]);

  const loadInstances = async () => {
    setLoading(true);
    try {
      console.log('[MyContainers] Loading instances with params:', { owner_id: userId, owner_type: userType });
      const data = await containerInstancesService.list({
        owner_id: userId,
        owner_type: userType
      });
      console.log('[MyContainers] Instances loaded:', data);
      console.log('[MyContainers] Instances count:', data?.length || 0);
      setInstances(data);
    } catch (error) {
      console.error('[MyContainers] Failed to load instances:', error);
      toast.error('Errore caricamento container');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (instanceId: string) => {
    try {
      const stats = await containerInstancesService.getStats(instanceId);
      setInstanceStats(prev => ({ ...prev, [instanceId]: stats }));
    } catch (error: any) {
      // 404 è normale per container senza documenti, non mostrare errore
      if (error.response?.status !== 404) {
        console.error('Failed to load stats:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingInstance) return;

    try {
      await containerInstancesService.delete(deletingInstance.id);
      toast.success('Container eliminato con successo!');
      setDeletingInstance(null);
      loadInstances();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleView = (instance: ContainerInstance) => {
    setViewingInstance(instance);
    loadStats(instance.id);
  };

  const filteredInstances = (instances || []).filter(instance => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      instance.name.toLowerCase().includes(search) ||
      instance.description?.toLowerCase().includes(search) ||
      instance.template_code.toLowerCase().includes(search)
    );
  });

  if (showWizard) {
    return (
      <InstanceWizard
        userId={userId}
        userType={userType}
        onComplete={() => {
          setShowWizard(false);
          loadInstances();
        }}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">I Miei Container</h2>
          <p className="text-muted-foreground">
            Gestisci i tuoi container SmartDocs personali
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Container
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Cerca per nome, descrizione o template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista Container */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredInstances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nessun risultato' : 'Nessun container trovato'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Prova a modificare i termini di ricerca'
                : 'Crea il tuo primo container per iniziare'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crea Primo Container
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstances.map((instance) => (
            <Card key={instance.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{instance.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {instance.description || 'Nessuna descrizione'}
                    </CardDescription>
                  </div>
                  <Badge variant={instance.is_active ? 'default' : 'secondary'}>
                    {instance.is_active ? 'Attivo' : 'Inattivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Template */}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{instance.template_code}</Badge>
                  </div>

                  {/* AI Model */}
                  <div className="text-sm text-gray-600">
                    <strong>Modello:</strong> {instance.ai_model}
                  </div>

                  {/* Formati */}
                  <div className="text-sm text-gray-600">
                    <strong>Formati:</strong> {instance.allowed_formats.slice(0, 3).join(', ')}
                    {instance.allowed_formats.length > 3 && ` +${instance.allowed_formats.length - 3}`}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-500">
                    Creato il {new Date(instance.created_at).toLocaleDateString('it-IT')}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(instance)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizza
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingInstance(instance)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingInstance({ id: instance.id, name: instance.name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Visualizzazione */}
      {viewingInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Dettagli Container</h2>
              <Button variant="outline" size="sm" onClick={() => setViewingInstance(null)}>
                Chiudi
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Base */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nome</Label>
                  <p className="text-lg font-semibold mt-1">{viewingInstance.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Template</Label>
                  <div className="mt-1">
                    <Badge>{viewingInstance.template_code}</Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-muted-foreground">Descrizione</Label>
                  <p className="mt-1">{viewingInstance.description || 'Nessuna descrizione'}</p>
                </div>
              </div>

              {/* AI Settings */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Configurazione AI</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Modello</Label>
                    <p className="mt-1">{viewingInstance.ai_model}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Temperature</Label>
                    <p className="mt-1">{viewingInstance.ai_temperature}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Max Tokens</Label>
                    <p className="mt-1">{viewingInstance.ai_max_tokens}</p>
                  </div>
                </div>
                {viewingInstance.ai_prompt && (
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground">AI Prompt</Label>
                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{viewingInstance.ai_prompt}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Formati e Tipi */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Formati e Tipi Documento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Formati Accettati</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {viewingInstance.allowed_formats.map(format => (
                        <Badge key={format} variant="outline">.{format.toUpperCase()}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Tipi Documento</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {viewingInstance.document_types.map(type => (
                        <Badge key={type} variant="outline">{type}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RAG Settings */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Impostazioni RAG</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Chunk Size</Label>
                    <p className="mt-1">{viewingInstance.chunk_size}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Chunk Overlap</Label>
                    <p className="mt-1">{viewingInstance.chunk_overlap}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Max Results</Label>
                    <p className="mt-1">{viewingInstance.max_results}</p>
                  </div>
                </div>
              </div>

              {/* Statistiche */}
              {instanceStats[viewingInstance.id] && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Statistiche
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Documenti</p>
                        <p className="text-2xl font-bold">
                          {instanceStats[viewingInstance.id].total_documents || 0}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Manuali</p>
                        <p className="text-2xl font-bold">
                          {instanceStats[viewingInstance.id].manuals || 0}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Rapportini</p>
                        <p className="text-2xl font-bold">
                          {instanceStats[viewingInstance.id].reports || 0}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Chunks</p>
                        <p className="text-2xl font-bold">
                          {instanceStats[viewingInstance.id].total_chunks || 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Storage Path */}
              <div className="border-t pt-4">
                <Label className="text-sm text-muted-foreground">Percorso Storage</Label>
                <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                  {viewingInstance.storage_path}
                </p>
              </div>

              {/* Documents Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-xl font-semibold">Documents</h3>
                
                {/* Upload Component */}
                <DocumentUploader 
                  containerId={viewingInstance.id}
                  onUploadComplete={() => {
                    // Refresh stats after upload
                    loadStats(viewingInstance.id);
                  }}
                />

                {/* Documents List */}
                <DocumentList 
                  containerId={viewingInstance.id}
                  refreshTrigger={instanceStats[viewingInstance.id]?.total_documents}
                />
              </div>

              {/* Query RAG Section */}
              <div className="border-t pt-6">
                <DocumentQuery
                  containerId={viewingInstance.id}
                  containerName={viewingInstance.name}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editingInstance && (
        <EditInstanceModal
          instance={editingInstance}
          onClose={() => setEditingInstance(null)}
          onSuccess={loadInstances}
        />
      )}

      {/* Modal Conferma Eliminazione */}
      {deletingInstance && (
        <DeleteConfirmModal
          title="Elimina Container"
          message="Vuoi eliminare questo container?"
          containerName={deletingInstance.name}
          loading={false}
          onConfirm={handleDelete}
          onCancel={() => setDeletingInstance(null)}
        />
      )}
    </div>
  );
}
