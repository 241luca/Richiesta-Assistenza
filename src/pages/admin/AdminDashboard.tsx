import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  UserIcon, 
  ClipboardDocumentListIcon, 
  CurrencyEuroIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon,
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiClient as api } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalRequests: number;
    totalQuotes: number;
    totalRevenue: number;
    usersByRole: {
      clients: number;
      professionals: number;
      staff: number;
    };
    requestsByStatus: {
      pending: number;
      assigned: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
    monthlyGrowth: {
      users: number;
      requests: number;
      revenue: number;
    };
  };
  recentActivity: {
    recentUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    recentRequests: Array<{
      id: string;
      title: string;
      status: string;
      createdAt: string;
    }>;
    recentQuotes: Array<{
      id: string;
      requestTitle: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  };
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'neutral' 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs flex items-center mt-1 ${
            changeType === 'increase' ? 'text-green-600' : 
            changeType === 'decrease' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {changeType === 'increase' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
            {changeType === 'decrease' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      // AGGIORNATO: Gestisce il formato ResponseFormatter
      return response.data.data || response.data; // Compatibilità con vecchio e nuovo formato
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
        <Alert variant="destructive">
          <AlertDescription>
            Errore nel caricamento dei dati. Riprova più tardi.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = data?.stats || {
    totalUsers: 0,
    totalRequests: 0,
    totalQuotes: 0,
    totalRevenue: 0,
    usersByRole: { clients: 0, professionals: 0, staff: 0 },
    requestsByStatus: {
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    },
    monthlyGrowth: { users: 0, requests: 0, revenue: 0 }
  };

  const activity = data?.recentActivity || {
    recentUsers: [],
    recentRequests: [],
    recentQuotes: []
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>

      {/* Statistiche principali */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Utenti Totali" 
          value={stats.totalUsers}
          icon={UserIcon}
          change={`${stats.monthlyGrowth.users > 0 ? '+' : ''}${stats.monthlyGrowth.users}% questo mese`}
          changeType={stats.monthlyGrowth.users > 0 ? 'increase' : stats.monthlyGrowth.users < 0 ? 'decrease' : 'neutral'}
        />
        <StatCard 
          title="Richieste Totali" 
          value={stats.totalRequests}
          icon={ClipboardDocumentListIcon}
          change={`${stats.monthlyGrowth.requests > 0 ? '+' : ''}${stats.monthlyGrowth.requests}% questo mese`}
          changeType={stats.monthlyGrowth.requests > 0 ? 'increase' : stats.monthlyGrowth.requests < 0 ? 'decrease' : 'neutral'}
        />
        <StatCard 
          title="Preventivi Totali" 
          value={stats.totalQuotes}
          icon={ChartBarIcon}
        />
        <StatCard 
          title="Fatturato Totale" 
          value={`€${(stats.totalRevenue / 100).toLocaleString('it-IT')}`}
          icon={CurrencyEuroIcon}
          change={`${stats.monthlyGrowth.revenue > 0 ? '+' : ''}${stats.monthlyGrowth.revenue}% questo mese`}
          changeType={stats.monthlyGrowth.revenue > 0 ? 'increase' : stats.monthlyGrowth.revenue < 0 ? 'decrease' : 'neutral'}
        />
      </div>

      {/* Card AI System */}
      <div className="grid gap-4 mb-8">
        <div 
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/admin/ai')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Sistema AI</h3>
            <SparklesIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">Operativo</div>
          <p className="text-xs text-gray-500 mt-2">OpenAI Configurato</p>
          <div className="mt-3">
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Clicca per gestire
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Distribuzione Utenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              Distribuzione Utenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Clienti</span>
                <span className="font-semibold">{stats.usersByRole.clients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Professionisti</span>
                <span className="font-semibold">{stats.usersByRole.professionals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Staff</span>
                <span className="font-semibold">{stats.usersByRole.staff}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stato Richieste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Stato Richieste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">In attesa</span>
                <span className="font-semibold text-yellow-600">{stats.requestsByStatus.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Assegnate</span>
                <span className="font-semibold text-blue-600">{stats.requestsByStatus.assigned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">In corso</span>
                <span className="font-semibold text-orange-600">{stats.requestsByStatus.in_progress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completate</span>
                <span className="font-semibold text-green-600">{stats.requestsByStatus.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Annullate</span>
                <span className="font-semibold text-gray-600">{stats.requestsByStatus.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attività Recente */}
        <Card>
          <CardHeader>
            <CardTitle>Attività Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.recentUsers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Nuovi Utenti</h4>
                  {activity.recentUsers.slice(0, 3).map((user) => (
                    <div key={user.id} className="text-xs text-gray-600 mb-1">
                      {user.name} ({user.role})
                    </div>
                  ))}
                </div>
              )}
              
              {activity.recentRequests.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Richieste Recenti</h4>
                  {activity.recentRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="text-xs text-gray-600 mb-1">
                      {request.title} - {request.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabella dettagliata preventivi recenti */}
      {activity.recentQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preventivi Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Richiesta</th>
                    <th className="text-left pb-2">Importo</th>
                    <th className="text-left pb-2">Stato</th>
                    <th className="text-left pb-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.recentQuotes.map((quote) => (
                    <tr key={quote.id} className="border-b">
                      <td className="py-2">{quote.requestTitle}</td>
                      <td className="py-2">€{(quote.amount / 100).toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-2">{new Date(quote.createdAt).toLocaleDateString('it-IT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
