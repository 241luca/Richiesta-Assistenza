import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { apiClient as api } from '@/services/api';
import { GuaranteeBanner } from '@/components/guarantees';
import { OnboardingChecklist } from '@/components/onboarding';

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
    pendingInterventions?: number; // NUOVO: Solo per CLIENT
    pendingQuotes?: number; // NUOVO: Solo per CLIENT
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
  // NUOVO: Interventi da confermare
  interventionsToConfirm?: Array<{
    id: string;
    requestId: string;
    requestTitle: string;
    proposedDate: string;
    description?: string;
    estimatedDuration?: number;
    professionalName: string;
    address: string;
    status: string;
    urgent: boolean;
  }>;
  // NUOVO: Preventivi da accettare
  quotesToAccept?: Array<{
    id: string;
    requestId: string;
    requestTitle: string;
    requestDescription?: string;
    amount: number;
    professionalName: string;
    professionalPhone?: string;
    professionalEmail?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    expiresAt?: string;
    validUntil?: string;
    createdAt: string;
    status: string;
    urgent: boolean;
  }>;
  // NUOVO: Documenti legali da accettare
  pendingLegalDocuments?: Array<{
    documentId: string;
    versionId: string;
    type: string;
    displayName: string;
    description?: string;
    version: string;
    isRequired: boolean;
    effectiveDate: string;
    summary?: string;
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

  // Handler per completamento task onboarding
  const handleTaskComplete = (taskId: string) => {
    // Qui potresti aggiungere logica per tracciare il completamento
    console.log(`Task completata: ${taskId}`);
    
    // Potresti anche fare una chiamata API per salvare il progresso sul server
    // await api.post('/onboarding/complete-task', { taskId });
  };

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
    completedJobs: 0,
    pendingInterventions: 0
  };

  const recentRequests = data?.recentRequests || [];
  const recentQuotes = data?.recentQuotes || [];
  const upcomingAppointments = data?.upcomingAppointments || [];
  const interventionsToConfirm = data?.interventionsToConfirm || []; // NUOVO
  const quotesToAccept = data?.quotesToAccept || []; // NUOVO
  const pendingLegalDocuments = data?.pendingLegalDocuments || []; // NUOVO: Documenti legali

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

      {/* 🎯 ONBOARDING CHECKLIST - NUOVO! */}
      <OnboardingChecklist 
        userRole={user?.role || 'CLIENT'}
        userName={user?.firstName || user?.email?.split('@')[0] || 'utente'}
        onTaskComplete={handleTaskComplete}
      />

      {/* NUOVO: Alert per interventi da confermare - SOLO PER CLIENTI */}
      {isClient && interventionsToConfirm.length > 0 && (
        <div className="mb-8">
          <Alert className="border-orange-200 bg-orange-50">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            <div className="ml-3">
              <AlertDescription className="text-orange-800">
                <span className="font-semibold">Attenzione!</span> Hai{' '}
                <span className="font-bold text-orange-900">
                  {interventionsToConfirm.length} {interventionsToConfirm.length === 1 ? 'intervento' : 'interventi'} da confermare
                </span>
              </AlertDescription>
            </div>
          </Alert>
          
          {/* Card con gli interventi da confermare */}
          <Card className="mt-4 border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center text-orange-900">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Interventi Programmati da Confermare
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {interventionsToConfirm.slice(0, 3).map((intervention) => (
                  <div
                    key={intervention.id}
                    className="p-4 bg-white border-2 border-orange-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge className="bg-orange-100 text-orange-800">
                            DA CONFERMARE
                          </Badge>
                          <span className="ml-2 text-sm font-semibold text-gray-900">
                            {intervention.requestTitle}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Data proposta:</span>{' '}
                          <span className="font-semibold text-orange-900">
                            {new Date(intervention.proposedDate).toLocaleString('it-IT', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Professionista:</span> {intervention.professionalName}
                        </p>
                        {intervention.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Descrizione:</span> {intervention.description}
                          </p>
                        )}
                        {intervention.estimatedDuration && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Durata stimata:</span> {intervention.estimatedDuration} minuti
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Luogo:</span> {intervention.address}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link to={`/requests/${intervention.requestId}`}>
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                          >
                            Conferma ora
                          </Button>
                        </Link>
                        <Link to={`/requests/${intervention.requestId}?openChat=true&reason=intervention`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-orange-400 text-orange-700 hover:bg-orange-50 w-full"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            Proponi altra data
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {interventionsToConfirm.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Ci sono altri {interventionsToConfirm.length - 3} interventi da confermare
                  </p>
                  <Link to="/requests">
                    <Button variant="outline" className="border-orange-400 text-orange-700 hover:bg-orange-50">
                      Vedi tutti gli interventi
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* NUOVO: Alert per preventivi da accettare - SOLO PER CLIENTI */}
      {isClient && quotesToAccept.length > 0 && (
        <div className="mb-8">
          <Alert className="border-amber-200 bg-amber-50">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            <div className="ml-3">
              <AlertDescription className="text-amber-800">
                <span className="font-semibold">Attenzione!</span> Hai{' '}
                <span className="font-bold text-amber-900">
                  {quotesToAccept.length} {quotesToAccept.length === 1 ? 'preventivo' : 'preventivi'} da valutare
                </span>
              </AlertDescription>
            </div>
          </Alert>
          
          {/* Card con i preventivi da accettare */}
          <Card className="mt-4 border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center text-amber-900">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Preventivi da Valutare
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {quotesToAccept.slice(0, 3).map((quote) => (
                  <div
                    key={quote.id}
                    className="p-4 bg-white border-2 border-amber-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge className="bg-amber-100 text-amber-800">
                            DA VALUTARE
                          </Badge>
                          <span className="ml-2 text-sm font-semibold text-gray-900">
                            {quote.requestTitle}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-2xl font-bold text-amber-900">
                            €{(quote.amount / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Professionista:</span> {quote.professionalName}
                        </p>
                        {quote.professionalPhone && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Tel:</span> {quote.professionalPhone}
                          </p>
                        )}
                        {quote.items && quote.items.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-medium text-gray-700 mb-1">Dettagli preventivo:</p>
                            {quote.items.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="text-xs text-gray-600">
                                • {item.description} - €{(item.totalPrice / 100).toFixed(2)}
                              </p>
                            ))}
                            {quote.items.length > 2 && (
                              <p className="text-xs text-gray-500 italic">
                                ...e altri {quote.items.length - 2} elementi
                              </p>
                            )}
                          </div>
                        )}
                        {quote.expiresAt && (
                          <p className="text-xs text-amber-700 mt-2 font-medium">
                            ⏰ Scade il {new Date(quote.expiresAt).toLocaleDateString('it-IT')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link to={`/quotes/${quote.id}`}>
                          <Button 
                            size="sm" 
                            className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                          >
                            Valuta ora
                          </Button>
                        </Link>
                        <Link to={`/requests/${quote.requestId}?openChat=true&reason=quote`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-amber-400 text-amber-700 hover:bg-amber-50 w-full"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            Negozia preventivo
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {quotesToAccept.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Ci sono altri {quotesToAccept.length - 3} preventivi da valutare
                  </p>
                  <Link to="/quotes">
                    <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50">
                      Vedi tutti i preventivi
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* NUOVO: Alert per documenti legali da accettare - PER CLIENTI E PROFESSIONISTI */}
      {(isClient || isProfessional) && pendingLegalDocuments.length > 0 && (
        <div className="mb-8">
          <Alert className="border-purple-200 bg-purple-50">
            <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
            <div className="ml-3">
              <AlertDescription className="text-purple-800">
                <span className="font-semibold">Importante!</span> Hai{' '}
                <span className="font-bold text-purple-900">
                  {pendingLegalDocuments.length} {pendingLegalDocuments.length === 1 ? 'documento legale' : 'documenti legali'} da accettare
                </span>
                {pendingLegalDocuments.some(d => d.isRequired) && (
                  <span className="text-purple-700"> (alcuni sono obbligatori)</span>
                )}
              </AlertDescription>
            </div>
          </Alert>
          
          {/* Card con i documenti da accettare */}
          <Card className="mt-4 border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center text-purple-900">
                <DocumentCheckIcon className="h-5 w-5 mr-2" />
                Documenti Legali da Accettare
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {pendingLegalDocuments.slice(0, 3).map((doc) => (
                  <div
                    key={doc.versionId}
                    className="p-4 bg-white border-2 border-purple-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {doc.isRequired ? (
                            <Badge className="bg-red-100 text-red-800">
                              OBBLIGATORIO
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800">
                              DA ACCETTARE
                            </Badge>
                          )}
                          <span className="ml-2 text-sm font-semibold text-gray-900">
                            {doc.displayName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Versione:</span>{' '}
                          <span className="font-semibold text-purple-900">v{doc.version}</span>
                        </p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-1">
                            {doc.description}
                          </p>
                        )}
                        {doc.summary && (
                          <p className="text-sm text-gray-600 italic mb-1">
                            {doc.summary}
                          </p>
                        )}
                        <p className="text-xs text-purple-700 mt-2 font-medium">
                          📅 Effettivo dal {new Date(doc.effectiveDate).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link to={isClient ? `/my-legal-documents` : `/professional/legal-documents`}>
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                          >
                            Leggi e Accetta
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pendingLegalDocuments.length > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Ci sono altri {pendingLegalDocuments.length - 3} documenti da accettare
                  </p>
                  <Link to={isClient ? "/my-legal-documents" : "/professional/legal-documents"}>
                    <Button variant="outline" className="border-purple-400 text-purple-700 hover:bg-purple-50">
                      Vedi tutti i documenti
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions con attributi per il tour */}
      {isClient && (
        <div className="mb-8" data-tour="create-request">
          <Link to="/requests/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuova Richiesta
            </Button>
          </Link>
        </div>
      )}

      {/* Garanzie Banner - Visibile a tutti */}
      <div className="mb-8">
        <GuaranteeBanner />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Card 1: Richieste Totali */}
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

        {/* Card 2: Interventi/Preventivi da confermare o In Attesa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isClient && ((stats.pendingInterventions && stats.pendingInterventions > 0) || 
                           (stats.pendingQuotes && stats.pendingQuotes > 0))
                ? 'Da Confermare/Valutare' 
                : 'In Attesa'}
            </CardTitle>
            {isClient && ((stats.pendingInterventions && stats.pendingInterventions > 0) || 
                         (stats.pendingQuotes && stats.pendingQuotes > 0))
              ? <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" data-tour="notifications" />
              : <ClockIcon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isClient && ((stats.pendingInterventions && stats.pendingInterventions > 0) || 
                           (stats.pendingQuotes && stats.pendingQuotes > 0))
                ? (stats.pendingInterventions || 0) + (stats.pendingQuotes || 0)
                : stats.pendingRequests}
            </div>
            {isClient && stats.pendingInterventions && stats.pendingInterventions > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                {stats.pendingInterventions} interventi
              </p>
            )}
            {isClient && stats.pendingQuotes && stats.pendingQuotes > 0 && (
              <p className="text-xs text-amber-600">
                {stats.pendingQuotes} preventivi
              </p>
            )}
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
        <div className="grid gap-4 md:grid-cols-3 mb-8" data-tour="my-quotes">
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
        <Card data-tour="requests-list">
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
                    <Link 
                      key={quote.id} 
                      to={`/quotes/${quote.id}`}
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
                    </Link>
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
        <Card className="mt-6" data-tour="calendar">
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