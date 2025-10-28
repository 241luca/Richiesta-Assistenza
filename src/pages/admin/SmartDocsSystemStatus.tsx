import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Square,
  Terminal,
  FileText
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  description: string;
  port?: number;
  type: 'api' | 'database' | 'cache' | 'storage' | 'vector' | 'worker';
  icon: any;
  details?: any;
}

interface SystemHealth {
  smartdocsApi: ServiceStatus;
  worker: ServiceStatus;
  database: ServiceStatus;
  redis: ServiceStatus;
  qdrant: ServiceStatus;
  minio: ServiceStatus;
}

export default function SmartDocsSystemStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      checkSystemHealth();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      // Check SmartDocs API
      const smartdocsHealth = await fetch('http://localhost:3500/health')
        .then(res => res.json())
        .catch(() => ({ services: {} }));

      const systemHealth: SystemHealth = {
        smartdocsApi: {
          name: 'SmartDocs API',
          status: smartdocsHealth.services?.api === 'healthy' ? 'healthy' : 'unhealthy',
          description: 'REST API per gestione documenti e RAG',
          port: 3500,
          type: 'api',
          icon: Server,
          details: smartdocsHealth
        },
        database: {
          name: 'PostgreSQL + pgvector',
          status: smartdocsHealth.services?.database === 'healthy' ? 'healthy' : 'unhealthy',
          description: 'Database principale con supporto vettoriale',
          port: 5433,
          type: 'database',
          icon: Database
        },
        redis: {
          name: 'Redis Cache',
          status: smartdocsHealth.services?.redis === 'healthy' ? 'healthy' : 'unhealthy',
          description: 'Cache per embedding e query',
          port: 6380,
          type: 'cache',
          icon: Activity
        },
        qdrant: {
          name: 'Qdrant Vector DB',
          status: smartdocsHealth.services?.vector === 'healthy' ? 'healthy' : 'unhealthy',
          description: 'Database vettoriale per semantic search',
          port: 6333,
          type: 'vector',
          icon: Cpu
        },
        minio: {
          name: 'MinIO Storage',
          status: await checkMinIOHealth(),
          description: 'Object storage per file e documenti',
          port: 9000,
          type: 'storage',
          icon: HardDrive
        },
        worker: {
          name: 'Sync Worker',
          status: await checkWorkerHealth(),
          description: 'Elaborazione asincrona job di sincronizzazione',
          type: 'worker',
          icon: Terminal
        }
      };

      setHealth(systemHealth);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Failed to check system health:', error);
      toast.error('Errore nel controllo dello stato del sistema');
    } finally {
      setLoading(false);
    }
  };

  const checkMinIOHealth = async (): Promise<'healthy' | 'unhealthy' | 'unknown'> => {
    try {
      const response = await fetch('http://localhost:9000/minio/health/live');
      return response.ok ? 'healthy' : 'unhealthy';
    } catch {
      return 'unhealthy';
    }
  };

  const checkWorkerHealth = async (): Promise<'healthy' | 'unhealthy' | 'unknown'> => {
    try {
      // Check if there are recent job processing activities
      const response = await fetch('http://localhost:3500/api/sync/jobs?limit=1');
      if (!response.ok) {
        return 'unknown';
      }
      const data = await response.json();
      // If we can query jobs, worker connection is ok
      return data.success ? 'healthy' : 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>;
    }
  };

  const getOverallStatus = () => {
    if (!health) return 'unknown';
    
    const services = Object.values(health);
    if (services.every(s => s.status === 'healthy')) return 'healthy';
    if (services.some(s => s.status === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  };

  const handleRestartService = async (serviceName: string) => {
    toast.info(`Riavvio ${serviceName} non implementato - usa Docker Compose o terminale`);
  };

  if (loading && !health) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Controllo stato sistema...</span>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SmartDocs System Status</h1>
          <p className="text-gray-600 mt-1">
            Monitoraggio in tempo reale di tutti i servizi SmartDocs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="border border-gray-300"
          >
            {autoRefresh ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-pulse" />
                Auto-refresh ON
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                Auto-refresh OFF
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={checkSystemHealth}
            disabled={loading}
            className="border border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={`border-2 ${
        overallStatus === 'healthy' ? 'border-green-500 bg-green-50' :
        overallStatus === 'unhealthy' ? 'border-red-500 bg-red-50' :
        'border-yellow-500 bg-yellow-50'
      }`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="text-2xl font-bold">
                  {overallStatus === 'healthy' ? 'Tutti i Servizi Operativi' :
                   overallStatus === 'unhealthy' ? 'Alcuni Servizi Non Disponibili' :
                   'Sistema Parzialmente Operativo'}
                </h2>
                {lastCheck && (
                  <p className="text-sm text-gray-600 mt-1">
                    Ultimo controllo: {lastCheck.toLocaleTimeString('it-IT')}
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge(overallStatus)}
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {health && Object.entries(health).map(([key, service]) => {
          const Icon = service.icon;
          return (
            <Card key={key} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      service.status === 'healthy' ? 'bg-green-100' :
                      service.status === 'unhealthy' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        service.status === 'healthy' ? 'text-green-600' :
                        service.status === 'unhealthy' ? 'text-red-600' :
                        'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.port && (
                        <Badge className="mt-1 bg-gray-100 text-gray-800">
                          :{service.port}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
                <CardDescription className="mt-2">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatusBadge(service.status)}
                  
                  {service.details && service.details.uptime && (
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Uptime:</strong> {Math.floor(service.details.uptime / 60)} min
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestartService(service.name)}
                      disabled
                      className="flex-1"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Restart
                    </Button>
                    {service.port && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`http://localhost:${service.port}`, '_blank')}
                        className="flex-1"
                      >
                        <Terminal className="w-3 h-3 mr-1" />
                        Open
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Docker Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Comandi Docker
            </CardTitle>
            <CardDescription>
              Gestione container via terminale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm space-y-2">
              <div>
                <div className="text-gray-400"># Avvia tutti i servizi</div>
                <div>cd smartdocs && docker-compose up -d</div>
              </div>
              <div>
                <div className="text-gray-400"># Ferma tutti i servizi</div>
                <div>docker-compose down</div>
              </div>
              <div>
                <div className="text-gray-400"># Vedi log</div>
                <div>docker-compose logs -f</div>
              </div>
              <div>
                <div className="text-gray-400"># Restart specifico</div>
                <div>docker-compose restart smartdocs-db</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Worker Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comandi Worker
            </CardTitle>
            <CardDescription>
              Gestione worker di sincronizzazione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm space-y-2">
              <div>
                <div className="text-gray-400"># Avvia worker</div>
                <div>cd smartdocs && npm run worker</div>
              </div>
              <div>
                <div className="text-gray-400"># Avvia in background</div>
                <div>npm run worker {'&'}</div>
              </div>
              <div>
                <div className="text-gray-400"># Ferma worker</div>
                <div>pkill -f "ts-node src/worker.ts"</div>
              </div>
              <div>
                <div className="text-gray-400"># Verifica processo</div>
                <div>ps aux | grep worker</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Architecture */}
      <Card>
        <CardHeader>
          <CardTitle>Architettura Sistema</CardTitle>
          <CardDescription>
            Panoramica componenti e dipendenze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="font-mono text-sm whitespace-pre">
{`┌─────────────────────────────────────────────────────────────┐
│              RICHIESTA ASSISTENZA BACKEND                    │
│                    (porta 3200)                              │
│   - Gestisce sync rules e configurazioni                    │
│   - Trigger sync jobs da eventi applicazione                │
│   - Proxy API per SmartDocs                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  SMARTDOCS ECOSYSTEM                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ SmartDocs API│  │ Sync Worker  │  │  PostgreSQL  │     │
│  │  :3500       │  │  Background  │  │  +pgvector   │     │
│  │  REST API    │  │  Processor   │  │  :5433       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │    Redis     │  │   Qdrant     │  │    MinIO     │     │
│  │    :6380     │  │  Vector DB   │  │   Storage    │     │
│  │    Cache     │  │  :6333-6334  │  │  :9000-9001  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘`}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
