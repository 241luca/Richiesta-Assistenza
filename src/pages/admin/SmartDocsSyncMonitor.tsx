import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from '../../utils/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import smartDocsService from '../../services/smartdocs.service';
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface SyncJob {
  id: string;
  container_id: string;
  source_app: string;
  entity_type: string;
  entity_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  chunks_created: number | null;
}

interface SyncStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export default function SmartDocsSyncMonitor() {
  const [stats, setStats] = useState<SyncStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['sync-jobs', statusFilter, entityTypeFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (entityTypeFilter !== 'all') params.entity_type = entityTypeFilter;
      const data = await smartDocsService.listSyncJobs(params);
      return Array.isArray(data) ? data : (data?.jobs ?? data?.data ?? []);
    },
    refetchInterval: autoRefresh ? 5000 : false
  });

  // Aggiorna statistiche quando cambiano i jobs
  React.useEffect(() => {
    const newStats = {
      total: jobs.length,
      pending: jobs.filter((j: any) => j.status === 'pending').length,
      processing: jobs.filter((j: any) => j.status === 'processing').length,
      completed: jobs.filter((j: any) => j.status === 'completed').length,
      failed: jobs.filter((j: any) => j.status === 'failed').length
    };
    setStats(newStats);
  }, [jobs]);

  const handleRefresh = () => {
    refetch();
  };

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => smartDocsService.retrySyncJob(jobId),
    onSuccess: () => {
      toast.success('Job reinserito in coda');
      queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
    },
    onError: () => {
      toast.error('Errore nel retry del job');
    }
  });

  const handleRetryJob = (jobId: string) => {
    retryMutation.mutate(jobId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
      completed: 'success',
      failed: 'danger',
      processing: 'default',
      pending: 'warning'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In corso...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT');
  };

  // Filtering logic
  const filteredJobs = jobs.filter((job: any) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (entityTypeFilter !== 'all' && job.entity_type !== entityTypeFilter) return false;
    if (searchTerm && !(job.entity_id || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Monitor</h1>
          <p className="text-muted-foreground">
            Monitoraggio real-time dei job di sincronizzazione
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ChartBarIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-gray-500">Totale</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ClockIcon className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-gray-500">In Attesa</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.processing}</div>
              <div className="text-xs text-gray-500">Processing</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-gray-500">Completati</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircleIcon className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold">{stats.failed}</div>
              <div className="text-xs text-gray-500">Falliti</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cerca per Entity ID</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="batch-request-1..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full p-2 border rounded"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tutti</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo Entità</label>
              <select
                className="w-full p-2 border rounded"
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
              >
                <option value="all">Tutti</option>
                <option value="request">Request</option>
                <option value="chat">Chat</option>
                <option value="quote">Quote</option>
                <option value="report">Report</option>
                <option value="profile">Profile</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Job di Sincronizzazione ({filteredJobs.length})</CardTitle>
            <Button variant="outline" size="sm">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Esporta CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nessun job trovato con i filtri selezionati.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Entity ID</th>
                    <th className="text-left p-3">Chunks</th>
                    <th className="text-left p-3">Durata</th>
                    <th className="text-left p-3">Inizio</th>
                    <th className="text-left p-3">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job: any) => (
                    <tr key={job.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          {getStatusBadge(job.status)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="info">{job.entity_type}</Badge>
                      </td>
                      <td className="p-3 font-mono text-sm">{job.entity_id}</td>
                      <td className="p-3">
                        {job.chunks_created !== null ? (
                          <span className="font-semibold">{job.chunks_created}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {formatDuration(job.started_at ?? job.created_at, job.completed_at ?? job.updated_at ?? null)}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {formatTimestamp(job.started_at ?? job.created_at)}
                      </td>
                      <td className="p-3">
                        {job.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                          >
                            <ArrowPathIcon className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Error messages */}
          {filteredJobs.some((j: any) => j.status === 'failed') && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">Errori:</h4>
              {filteredJobs
                .filter((j: any) => j.status === 'failed' && j.error_message)
                .map((job: any) => (
                  <Alert key={job.id} variant="destructive">
                    <AlertDescription>
                      <span className="font-mono text-xs">{job.entity_id}</span>: {job.error_message}
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
