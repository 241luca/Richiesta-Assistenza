import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  BriefcaseIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { apiClient as api } from '@/services/api';

interface DashboardData {
  stats: {
    totalRequests: number;
    pendingRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    totalQuotes: number;
    acceptedQuotes: number;
    totalSpent?: number; // Solo per CLIENT
    totalEarned?: number; // Solo per PROFESSIONAL
    averageRating?: number; // Solo per PROFESSIONAL
    completedJobs?: number; // Solo per PROFESSIONAL
  };
  recentRequests: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    createdAt: string;
    professionalName?: string;
    clientName?: string;
  }>;
  recentQuotes: Array<{
    id: string;
    requestTitle: string;
    amount: number;
    status: string;
    createdAt: string;
    professionalName?: string;
  }>;
  upcomingAppointments: Array<{
    id: string;
    requestTitle: string;
    scheduledDate: string;
    address: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800'
};

const statusLabels: Record<string, string> = {
  pending: 'In attesa',
  assigned: 'Assegnato',
  in_progress: 'In corso',
  completed: 'Completato',
  cancelled: 'Annullato',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  draft: 'Bozza'
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      // AGGIORNATO: Gestisce il formato ResponseFormatter
      return response.data.data || response.data; // Compatibilità con vecchio e nuovo formato
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Errore nel caricamento dei dati. Riprova più tardi.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = data?.stats || {
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalQuotes: 0,
    acceptedQuotes: 0,
    totalSpent: 0,
    totalEarned: 0,
    averageRating: 0,
    completedJobs: 0
  };

  const recentRequests = data?.recentRequests || [];
  const recentQuotes = data?.recentQuotes || [];
  const upcomingAppointments = data?.upcomingAppointments || [];

  const isClient = user?.role === 'CLIENT';
  const isProfessional = user?.role === 'PROFESSIONAL';

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Benvenuto, {user?.firstName || user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          {isClient 
            ? 'Gestisci le tue richieste di assistenza e monitora lo stato dei servizi'
            : isProfessional 
            ? 'Gestisci i tuoi interventi e visualizza le nuove richieste'
            : 'Panoramica del tuo account'}
        </p>
      </div>

      {/* Quick Actions */}
      {isClient && (
        <div className="mb-8">
          <Link to="/requests/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuova Richiesta
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isClient ? 'Richieste Totali' : 'Interventi Totali'}
            </CardTitle>
            <ClipboardDocumentListIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Corso</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isClient ? 'Spesa Totale' : isProfessional ? 'Guadagni Totali' : 'Completati'}
            </CardTitle>
            {(isClient || isProfessional) ? (
              <CurrencyEuroIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isClient && stats.totalSpent !== undefined
                ? `€${(stats.totalSpent / 100).toLocaleString('it-IT')}`
                : isProfessional && stats.totalEarned !== undefined
                ? `€${(stats.totalEarned / 100).toLocaleString('it-IT')}`
                : stats.completedRequests}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats for Professionals */}
      {isProfessional && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preventivi Totali</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuotes}</div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.acceptedQuotes} accettati
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lavori Completati</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedJobs || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valutazione Media</CardTitle>
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'} ⭐
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Richieste Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.slice(0, 5).map((request) => (
                  <Link 
                    key={request.id} 
                    to={`/requests/${request.id}`}
                    className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{request.title}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {request.category} • {new Date(request.createdAt).toLocaleDateString('it-IT')}
                        </p>
                        {isClient && request.professionalName && (
                          <p className="text-xs text-gray-600 mt-1">
                            Professionista: {request.professionalName}
                          </p>
                        )}
                        {isProfessional && request.clientName && (
                          <p className="text-xs text-gray-600 mt-1">
                            Cliente: {request.clientName}
                          </p>
                        )}
                      </div>
                      <Badge className={statusColors[request.status] || 'bg-gray-100'}>
                        {statusLabels[request.status] || request.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nessuna richiesta recente</p>
            )}
            {recentRequests.length > 0 && (
              <Link to="/requests" className="block mt-4">
                <Button variant="outline" className="w-full">
                  Vedi tutte le richieste
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Quotes */}
        {(isClient || isProfessional) && (
          <Card>
            <CardHeader>
              <CardTitle>Preventivi Recenti</CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuotes.length > 0 ? (
                <div className="space-y-4">
                  {recentQuotes.slice(0, 5).map((quote) => (
                    <div 
                      key={quote.id} 
                      className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{quote.requestTitle}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            €{(quote.amount / 100).toFixed(2)} • {new Date(quote.createdAt).toLocaleDateString('it-IT')}
                          </p>
                          {isClient && quote.professionalName && (
                            <p className="text-xs text-gray-600 mt-1">
                              Da: {quote.professionalName}
                            </p>
                          )}
                        </div>
                        <Badge className={statusColors[quote.status] || 'bg-gray-100'}>
                          {statusLabels[quote.status] || quote.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nessun preventivo recente</p>
              )}
              {recentQuotes.length > 0 && (
                <Link to="/quotes" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    Vedi tutti i preventivi
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Appuntamenti Imminenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{appointment.requestTitle}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(appointment.scheduledDate).toLocaleString('it-IT')}
                    </p>
                    <p className="text-xs text-gray-600">{appointment.address}</p>
                  </div>
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
