import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DocumentQuery } from '../components/smartdocs/DocumentQuery';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function MyKnowledgeBase() {
  const { user } = useAuth();
  const [userConfig, setUserConfig] = useState<any>(null);
  const [containerId, setContainerId] = useState<string>('');
  const [containerName, setContainerName] = useState<string>('My Knowledge Base');

  useEffect(() => {
    if (user) {
      loadUserConfig();
    }
  }, [user]);

  const loadUserConfig = async () => {
    try {
      const userType = user?.role === 'CLIENT' ? 'client' : 'professional';
      const response = await api.get(`/smartdocs/config/user-config/${user?.id}/${userType}`);
      
      if (response.data.success && response.data.data && response.data.data.container_id) {
        setUserConfig(response.data.data);
        setContainerId(response.data.data.container_id);
      } else {
        // No container_id in config, try to get any container
        const containersResponse = await api.get('http://localhost:3500/api/container-instances');
        if (containersResponse.data.success && containersResponse.data.data.length > 0) {
          setContainerId(containersResponse.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load user config:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">La Mia Knowledge Base</h1>
        <p className="text-muted-foreground">
          Cerca informazioni nei tuoi documenti e nelle tue richieste
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cerca</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentQuery containerId={containerId} containerName={containerName} />
        </CardContent>
      </Card>
    </div>
  );
}
