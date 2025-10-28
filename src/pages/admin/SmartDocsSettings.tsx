import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import smartDocsService, { Container } from '../../services/smartdocs.service';
import ContainerCategoryManager from '../../components/smartdocs/ContainerCategoryManager';
import ContainerForm from '../../components/smartdocs/ContainerForm';
import ContainerList from '../../components/smartdocs/ContainerList';
import ContainerViewModal from '../../components/smartdocs/ContainerViewModal';
import DeleteConfirmModal from '../../components/smartdocs/DeleteConfirmModal';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import {
  Database,
  Server,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  Trash2
} from 'lucide-react';

export default function SmartDocsSettings() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<Record<string, any[]>>({});
  
  // Filtri container
  const [searchContainer, setSearchContainer] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Edit/View/Delete container
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);
  const [viewingContainer, setViewingContainer] = useState<Container | null>(null);
  const [deletingContainer, setDeletingContainer] = useState<{ id: string; name: string } | null>(null);
  const [clearingContainer, setClearingContainer] = useState<{ id: string; name: string; documentCount: number } | null>(null);
  
  // Loading states granulari
  const [loadingStates, setLoadingStates] = useState({
    creating: false,
    updating: false,
    deleting: false,
    clearing: false
  });

  useEffect(() => {
    loadHealthStatus();
    loadContainers();
    loadCategories();
  }, []);

  const loadHealthStatus = async () => {
    try {
      const status = await smartDocsService.healthCheck();
      setHealthStatus(status);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setHealthStatus({ enabled: false, error: err.message });
    }
  };

  const loadContainers = async () => {
    try {
      const response = await api.get('/smartdocs/containers');
      if (response.data.success) {
        setContainers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load containers:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/smartdocs/container-categories/grouped');
      if (response.data.success) {
        setGroupedCategories(response.data.data);
        const allCats: any[] = [];
        Object.values(response.data.data).forEach((cats: any) => {
          allCats.push(...cats);
        });
        setCategories(allCats);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleUpdateContainer = async (formData: any) => {
    if (!editingContainer) return;

    setLoadingStates(prev => ({ ...prev, updating: true }));
    setError(null);

    try {
      await smartDocsService.updateContainer(editingContainer.id, {
        name: formData.name,
        description: formData.description,
        ai_prompt: formData.ai_prompt
      });
      setEditingContainer(null);
      await loadContainers();
      toast.success('Container updated successfully!');
    } catch (err: any) {
      const errorMsg = err.message || 'Error updating container';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, updating: false }));
    }
  };

  const handleDeleteContainer = async () => {
    if (!deletingContainer) return;

    setLoadingStates(prev => ({ ...prev, deleting: true }));
    setError(null);

    try {
      await smartDocsService.deleteContainer(deletingContainer.id);
      await loadContainers();
      toast.success('Container deleted successfully!');
      setDeletingContainer(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Error deleting container';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: false }));
    }
  };

  const handleClearContainer = async () => {
    if (!clearingContainer) return;

    setLoadingStates(prev => ({ ...prev, clearing: true }));
    setError(null);

    try {
      const response = await api.delete(`/smartdocs/containers/${clearingContainer.id}/documents`);
      const result = response.data;

      if (result.success) {
        toast.success(`✅ Container cleared! ${result.data.deletedCount} documents removed`);
        setClearingContainer(null);
        await loadContainers();
      } else {
        throw new Error(result.error || 'Failed to clear container');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error clearing container';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingStates(prev => ({ ...prev, clearing: false }));
    }
  };

  const confirmDeleteContainer = (id: string, name: string) => {
    setDeletingContainer({ id, name });
  };

  const confirmClearContainer = async (id: string, name: string) => {
    try {
      const response = await api.get(`/smartdocs/containers/${id}/stats`);
      const stats = response.data.data;
      setClearingContainer({ id, name, documentCount: stats.document_count || 0 });
    } catch (err) {
      toast.error('Failed to load container stats');
    }
  };

  const handleCreateContainer = async (formData: any) => {
    setLoadingStates(prev => ({ ...prev, creating: true }));
    setError(null);

    try {
      await smartDocsService.createContainer(formData);
      await loadContainers();
      toast.success('Container created successfully!');
    } catch (err: any) {
      const errorMsg = err.message || 'Error creating container';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, creating: false }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            SmartDocs Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage containers, categories, and system configuration
          </p>
        </div>
        {healthStatus && (
          <Badge variant={healthStatus.enabled && healthStatus.message === 'OK' ? 'default' : 'danger'}>
            {healthStatus.enabled && healthStatus.message === 'OK' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Online
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Offline
              </>
            )}
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Server className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="containers">
            <Database className="w-4 h-4 mr-2" />
            Containers
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Settings className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                SmartDocs services status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Enabled</p>
                      <p className={healthStatus.enabled ? 'text-green-600' : 'text-red-600'}>
                        {healthStatus.enabled ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Environment</p>
                      <p>{healthStatus.environment || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Uptime</p>
                      <p>{healthStatus.uptime ? `${Math.floor(healthStatus.uptime)}s` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Message</p>
                      <p>{healthStatus.message || healthStatus.error || 'N/A'}</p>
                    </div>
                  </div>

                  {healthStatus.services && (
                    <div>
                      <p className="text-sm font-medium mb-2">Services</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(healthStatus.services).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            {value === 'healthy' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">{key}: {value as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Containers</CardTitle>
              <CardDescription>
                {containers.length} container(s) available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    className="p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{container.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {container.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{container.type}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmClearContainer(container.id, container.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="containers" className="space-y-4">
          {editingContainer ? (
            <ContainerForm
              mode="edit"
              groupedCategories={groupedCategories}
              initialData={{
                type: editingContainer.type,
                name: editingContainer.name,
                description: editingContainer.description || '',
                ai_prompt: (editingContainer as any).ai_prompt || ''
              }}
              loading={loadingStates.updating}
              onSubmit={handleUpdateContainer}
              onCancel={() => setEditingContainer(null)}
            />
          ) : (
            <ContainerForm
              mode="create"
              groupedCategories={groupedCategories}
              loading={loadingStates.creating}
              onSubmit={handleCreateContainer}
            />
          )}

          <ContainerList
            containers={containers}
            categories={categories}
            searchTerm={searchContainer}
            filterCategory={filterCategory}
            loading={loadingStates.deleting}
            onSearchChange={setSearchContainer}
            onFilterChange={setFilterCategory}
            onView={(container) => setViewingContainer(container)}
            onEdit={(container) => setEditingContainer(container)}
            onDelete={confirmDeleteContainer}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ContainerCategoryManager />
        </TabsContent>
      </Tabs>

      {viewingContainer && (
        <ContainerViewModal
          container={viewingContainer}
          categories={categories}
          onClose={() => setViewingContainer(null)}
          onEdit={(container) => {
            setViewingContainer(null);
            setEditingContainer(container);
          }}
        />
      )}

      {deletingContainer && (
        <DeleteConfirmModal
          title="Delete Container"
          message="Do you want to delete this container?"
          containerName={deletingContainer.name}
          loading={loadingStates.deleting}
          onConfirm={handleDeleteContainer}
          onCancel={() => setDeletingContainer(null)}
        />
      )}

      {clearingContainer && (
        <DeleteConfirmModal
          title="Clear Container"
          message={`This will delete all ${clearingContainer.documentCount} documents from this container. This action cannot be undone.`}
          containerName={clearingContainer.name}
          loading={loadingStates.clearing}
          onConfirm={handleClearContainer}
          onCancel={() => setClearingContainer(null)}
        />
      )}
    </div>
  );
}
