import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import api from '../../services/api';
import { HardDrive, FileText, Database, Zap } from 'lucide-react';
import { StorageStats } from '../../components/smartdocs/StorageStats';

export default function SmartDocsStorageDashboard() {
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      const response = await api.get('http://localhost:3500/api/container-instances');
      if (response.data.success) {
        setContainers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load containers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Storage Dashboard</h1>
        <p className="text-muted-foreground">
          Monitoraggio dello spazio occupato da documenti auto-sync e manuali
        </p>
      </div>

      <div className="grid gap-6">
        {containers.map((container) => (
          <Card key={container.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{container.name}</CardTitle>
                <Badge>{container.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <StorageStats containerId={container.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
