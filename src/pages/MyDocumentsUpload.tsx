import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../utils/toast';
import api from '../services/api';
import DocumentUploader from '../components/smartdocs/DocumentUploader';
import DocumentList from '../components/smartdocs/DocumentList';
import { Upload, FileText, HardDrive, Info } from 'lucide-react';

export default function MyDocumentsUpload() {
  const { user } = useAuth();
  const [containerId, setContainerId] = useState<string>('');
  const [containerName, setContainerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploadKey, setUploadKey] = useState(0); // Force re-render after upload

  useEffect(() => {
    if (user) {
      loadUserContainer();
    }
  }, [user]);

  const loadUserContainer = async () => {
    try {
      const userType = user?.role === 'CLIENT' ? 'client' : 'professional';
      const response = await api.get(`/smartdocs/config/user-config/${user?.id}/${userType}`);
      
      if (response.data.success && response.data.data && response.data.data.container_id) {
        const config = response.data.data;
        setContainerId(config.container_id);
        
        // Load container name
        try {
          const containerResponse = await api.get(`http://localhost:3500/api/container-instances/${config.container_id}`);
          if (containerResponse.data.success) {
            setContainerName(containerResponse.data.data.name);
          }
        } catch (err) {
          console.warn('Failed to load container name, using ID');
          setContainerName(config.container_id);
        }
      } else {
        // No container_id in config, try to find containers directly
        const containersResponse = await api.get('http://localhost:3500/api/container-instances');
        if (containersResponse.data.success && containersResponse.data.data.length > 0) {
          // Use first available container
          const firstContainer = containersResponse.data.data[0];
          setContainerId(firstContainer.id);
          setContainerName(firstContainer.name);
        } else {
          // No containers found at all
          console.warn('No SmartDocs containers found');
        }
      }
    } catch (error) {
      console.error('Failed to load user container:', error);
      toast.error('Errore nel caricamento del container');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    toast.success('Documento caricato con successo!');
    // Force refresh of document list
    setUploadKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!containerId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Nessun container SmartDocs trovato. Contatta l'amministratore per configurare il tuo container.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">I Miei Documenti</h1>
        <p className="text-muted-foreground">
          Carica e gestisci i tuoi documenti personali
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          I documenti caricati qui vengono archiviati nel tuo container <strong>{containerName}</strong> e possono essere interrogati tramite AI nella sezione "Knowledge Base".
        </AlertDescription>
      </Alert>

      {/* Container Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Container Attivo</CardTitle>
              <CardDescription>
                I tuoi documenti vengono salvati in questo container
              </CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              <HardDrive className="w-4 h-4 mr-2" />
              {containerName}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Carica Nuovi Documenti
          </CardTitle>
          <CardDescription>
            Supportati: PDF, DOCX, TXT (max 10MB per file)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploader 
            containerId={containerId}
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documenti Caricati
          </CardTitle>
          <CardDescription>
            Gestisci i documenti nel tuo container
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList 
            key={uploadKey} 
            containerId={containerId} 
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/my-documents'}
          className="flex-1"
        >
          <FileText className="w-4 h-4 mr-2" />
          Vai alla Knowledge Base
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/settings/smartdocs'}
          className="flex-1"
        >
          <Info className="w-4 h-4 mr-2" />
          Preferenze Sync
        </Button>
      </div>
    </div>
  );
}
