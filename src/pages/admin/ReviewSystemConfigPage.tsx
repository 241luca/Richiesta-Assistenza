import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TextArea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RefreshCw, Settings, Shield, Eye, Trophy, Bell, UserX, Plus, Trash2, Search, Calendar, AlertTriangle } from 'lucide-react';

interface ReviewSystemConfig {
  id: string;
  isEnabled: boolean;
  anonymousReviews: boolean;
  showLastNameInitial: boolean;
  requireComment: boolean;
  minCommentLength: number;
  maxCommentLength: number;
  maxDaysToReview: number;
  autoModeration: boolean;
  publicReviews: boolean;
  bannedWords: string[];
  contentFilter: boolean;
  requireManualApproval: boolean;
  autoApproveThreshold: number;
  notifyAdminForLowRatings: boolean;
  lowRatingThreshold: number;
  showStarsInName: boolean;
  minReviewsToShowAverage: number;
  defaultSortOrder: string;
  reviewsPerPage: number;
  enableBadges: boolean;
  topRatedThreshold: number;
  enableLoyaltyPoints: boolean;
  pointsPerReview: number;
  notifyProfessionalOnReview: boolean;
  remindClientAfterDays: number;
  notifyAdminOnProblematic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewExclusion {
  id: string;
  userId: string;
  type: 'CLIENT' | 'PROFESSIONAL' | 'BOTH';
  reason: string;
  isActive: boolean;
  isTemporary: boolean;
  expiresAt?: string;
  createdAt: string;
  excludedBy: string;
  User_ReviewExclusion_userIdToUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  User_ReviewExclusion_excludedByToUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface CreateExclusionData {
  userId: string;
  type: 'CLIENT' | 'PROFESSIONAL' | 'BOTH';
  reason: string;
  isTemporary: boolean;
  expiresAt?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  createdAt?: string;
}

export default function ReviewSystemConfigPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<Partial<ReviewSystemConfig>>({});
  const [bannedWordsText, setBannedWordsText] = useState('');
  
  // Stati per gestione esclusioni
  const [showAddExclusionModal, setShowAddExclusionModal] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [exclusionForm, setExclusionForm] = useState<CreateExclusionData>({
    userId: '',
    type: 'CLIENT',
    reason: '',
    isTemporary: false,
    expiresAt: undefined
  });

  // Query per ottenere la configurazione attuale
  const { data: currentConfig, isLoading, error } = useQuery({
    queryKey: ['review-system-config'],
    queryFn: () => api.get('/admin/reviews/config'),
  });

  // Query per ottenere le esclusioni
  const { data: exclusionsData, isLoading: exclusionsLoading } = useQuery({
    queryKey: ['review-exclusions'],
    queryFn: () => api.get('/admin/reviews/exclusions'),
  });

  // Query per cercare utenti - 🔧 FIX: Gestione corretta della risposta
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['search-users', searchUser],
    queryFn: async () => {
      const response = await api.get(`/admin/users/search?q=${searchUser}&role=CLIENT`);
      return response;
    },
    enabled: searchUser.length >= 2,
    // 🔧 FIX: Trasforma i dati per gestire sia singolo oggetto che array
    select: (response: any) => {
      // Assicurati che sia sempre un array
      if (response?.data?.data) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          return data;
        } else if (typeof data === 'object' && data.id) {
          // Se è un oggetto singolo, convertilo in array
          return [data];
        }
      }
      return [];
    }
  });

  // Effetto per aggiornare lo stato quando i dati arrivano
  useEffect(() => {
    if (currentConfig?.data?.data) {
      const configData = currentConfig.data.data;
      setConfig(configData);
      setBannedWordsText(configData.bannedWords?.join('\n') || '');
    }
  }, [currentConfig]);

  // Mutation per aggiornare la configurazione
  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<ReviewSystemConfig>) => api.post('/admin/reviews/config', data),
    onSuccess: (response) => {
      toast.success('Configurazione aggiornata con successo!');
      
      // ✅ IMPORTANTE: Aggiorna lo stato locale con i dati salvati
      if (response.data?.data) {
        setConfig(response.data.data);
        setBannedWordsText(response.data.data.bannedWords?.join('\n') || '');
      }
      
      // Invalida la query per ricaricare dai server se necessario
      queryClient.invalidateQueries({ queryKey: ['review-system-config'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento');
    }
  });

  // Mutation per creare esclusione
  const createExclusionMutation = useMutation({
    mutationFn: (data: CreateExclusionData) => api.post('/admin/reviews/exclusions', data),
    onSuccess: () => {
      toast.success('Esclusione creata con successo!');
      setShowAddExclusionModal(false);
      setSearchUser('');
      setSelectedUser(null);
      setExclusionForm({
        userId: '',
        type: 'CLIENT',
        reason: '',
        isTemporary: false,
        expiresAt: undefined
      });
      queryClient.invalidateQueries({ queryKey: ['review-exclusions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione dell\'esclusione');
    }
  });

  // Mutation per rimuovere esclusione
  const removeExclusionMutation = useMutation({
    mutationFn: (exclusionId: string) => api.delete(`/admin/reviews/exclusions/${exclusionId}`),
    onSuccess: () => {
      toast.success('Esclusione rimossa con successo!');
      queryClient.invalidateQueries({ queryKey: ['review-exclusions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella rimozione dell\'esclusione');
    }
  });

  const handleSave = () => {
    // Converti banned words da testo a array
    const bannedWords = bannedWordsText
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    const dataToSend = {
      ...config,
      bannedWords
    };

    updateConfigMutation.mutate(dataToSend);
  };

  const handleInputChange = (field: keyof ReviewSystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Funzioni per gestione esclusioni
  const handleCreateExclusion = () => {
    if (!selectedUser || !exclusionForm.reason.trim()) {
      toast.error('Seleziona un utente e inserisci un motivo');
      return;
    }

    if (exclusionForm.isTemporary && !exclusionForm.expiresAt) {
      toast.error('Inserisci una data di scadenza per l\'esclusione temporanea');
      return;
    }

    createExclusionMutation.mutate({
      ...exclusionForm,
      userId: selectedUser.id
    });
  };

  const handleRemoveExclusion = (exclusionId: string) => {
    if (confirm('Sei sicuro di voler rimuovere questa esclusione?')) {
      removeExclusionMutation.mutate(exclusionId);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchUser(`${user.firstName} ${user.lastName} (${user.email})`);
    setExclusionForm(prev => ({ ...prev, userId: user.id }));
  };

  const handleDeselectUser = () => {
    setSelectedUser(null);
    setSearchUser('');
    setExclusionForm(prev => ({ ...prev, userId: '' }));
  };

  const handleBannedWordsChange = (value: string) => {
    setBannedWordsText(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Caricamento configurazione...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertDescription>
          Errore nel caricamento della configurazione. Riprova più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurazione Sistema Recensioni</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci le impostazioni avanzate del sistema di recensioni
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['review-system-config'] })}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Ricarica
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salva Modifiche
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Generale
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Moderazione
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualizzazione
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Gamification
          </TabsTrigger>
          <TabsTrigger value="exclusions" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Esclusioni
          </TabsTrigger>
        </TabsList>

        {/* Tab Generale */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Generali</CardTitle>
              <CardDescription>
                Configurazioni di base per il funzionamento del sistema recensioni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Abilita Sistema Recensioni</Label>
                      <p className="text-sm text-muted-foreground">
                        Attiva/disattiva completamente il sistema
                      </p>
                    </div>
                    <Switch
                      checked={config.isEnabled ?? true}
                      onCheckedChange={(checked) => handleInputChange('isEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recensioni Anonime</Label>
                      <p className="text-sm text-muted-foreground">
                        Permetti recensioni senza mostrare il nome
                      </p>
                    </div>
                    <Switch
                      checked={config.anonymousReviews ?? false}
                      onCheckedChange={(checked) => handleInputChange('anonymousReviews', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Commento Obbligatorio</Label>
                      <p className="text-sm text-muted-foreground">
                        Richiedi sempre un commento testuale
                      </p>
                    </div>
                    <Switch
                      checked={config.requireComment ?? false}
                      onCheckedChange={(checked) => handleInputChange('requireComment', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Giorni Disponibili per Recensire</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={config.maxDaysToReview ?? 30}
                      onChange={(e) => handleInputChange('maxDaysToReview', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Giorni dopo il completamento per lasciare una recensione
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Lunghezza Minima Commento</Label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={config.minCommentLength ?? 10}
                        onChange={(e) => handleInputChange('minCommentLength', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lunghezza Massima Commento</Label>
                      <Input
                        type="number"
                        min="1"
                        max="2000"
                        value={config.maxCommentLength ?? 1000}
                        onChange={(e) => handleInputChange('maxCommentLength', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Moderazione */}
        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sistema di Moderazione</CardTitle>
              <CardDescription>
                Controlli automatici e manuali per la qualità delle recensioni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Moderazione Automatica</Label>
                      <p className="text-sm text-muted-foreground">
                        Attiva filtri automatici sui contenuti
                      </p>
                    </div>
                    <Switch
                      checked={config.autoModeration ?? true}
                      onCheckedChange={(checked) => handleInputChange('autoModeration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Filtro Contenuto Offensivo</Label>
                      <p className="text-sm text-muted-foreground">
                        Blocca automaticamente parole inappropriate
                      </p>
                    </div>
                    <Switch
                      checked={config.contentFilter ?? true}
                      onCheckedChange={(checked) => handleInputChange('contentFilter', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Approvazione Manuale</Label>
                      <p className="text-sm text-muted-foreground">
                        Richiedi approvazione admin per nuove recensioni
                      </p>
                    </div>
                    <Switch
                      checked={config.requireManualApproval ?? false}
                      onCheckedChange={(checked) => handleInputChange('requireManualApproval', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Soglia Auto-Approvazione</Label>
                    <Select
                      value={(config.autoApproveThreshold ?? 3).toString()}
                      onValueChange={(value) => handleInputChange('autoApproveThreshold', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 stella</SelectItem>
                        <SelectItem value="2">2 stelle</SelectItem>
                        <SelectItem value="3">3 stelle</SelectItem>
                        <SelectItem value="4">4 stelle</SelectItem>
                        <SelectItem value="5">5 stelle</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Recensioni con rating ≥ soglia vengono auto-approvate
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifica Admin per Rating Bassi</Label>
                      <p className="text-sm text-muted-foreground">
                        Avvisa admin per recensioni negative
                      </p>
                    </div>
                    <Switch
                      checked={config.notifyAdminForLowRatings ?? true}
                      onCheckedChange={(checked) => handleInputChange('notifyAdminForLowRatings', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Soglia Rating Basso</Label>
                    <Select
                      value={(config.lowRatingThreshold ?? 2).toString()}
                      onValueChange={(value) => handleInputChange('lowRatingThreshold', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 stella</SelectItem>
                        <SelectItem value="2">2 stelle</SelectItem>
                        <SelectItem value="3">3 stelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Parole Proibite (una per riga)</Label>
                <TextArea
                  placeholder="Inserisci parole proibite, una per riga"
                  value={bannedWordsText}
                  onChange={(e) => handleBannedWordsChange(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Recensioni contenenti queste parole verranno bloccate automaticamente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Visualizzazione */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Visualizzazione</CardTitle>
              <CardDescription>
                Come vengono mostrate le recensioni agli utenti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mostra Stelle nel Nome</Label>
                      <p className="text-sm text-muted-foreground">
                        Visualizza rating accanto al nome professionista
                      </p>
                    </div>
                    <Switch
                      checked={config.showStarsInName ?? true}
                      onCheckedChange={(checked) => handleInputChange('showStarsInName', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ordinamento Predefinito</Label>
                    <Select
                      value={config.defaultSortOrder ?? 'recent'}
                      onValueChange={(value) => handleInputChange('defaultSortOrder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Più Recenti</SelectItem>
                        <SelectItem value="rating_high">Stelle Alte</SelectItem>
                        <SelectItem value="rating_low">Stelle Basse</SelectItem>
                        <SelectItem value="helpful">Più Utili</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recensioni per Pagina</Label>
                    <Input
                      type="number"
                      min="5"
                      max="100"
                      value={config.reviewsPerPage ?? 10}
                      onChange={(e) => handleInputChange('reviewsPerPage', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Min. Recensioni per Media</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={config.minReviewsToShowAverage ?? 3}
                      onChange={(e) => handleInputChange('minReviewsToShowAverage', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Numero minimo di recensioni per mostrare la media
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Gamification */}
        <TabsContent value="gamification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sistema Gamification</CardTitle>
              <CardDescription>
                Premi e ricompense per incoraggiare le recensioni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Abilita Badge Professionisti</Label>
                      <p className="text-sm text-muted-foreground">
                        Sistema di badge per professionisti meritevoli
                      </p>
                    </div>
                    <Switch
                      checked={config.enableBadges ?? true}
                      onCheckedChange={(checked) => handleInputChange('enableBadges', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Soglia "Top Rated"</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={config.topRatedThreshold ?? 4.5}
                      onChange={(e) => handleInputChange('topRatedThreshold', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Media minima per badge "Top Rated"
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Punti Fedeltà</Label>
                      <p className="text-sm text-muted-foreground">
                        Sistema punti premio per recensioni
                      </p>
                    </div>
                    <Switch
                      checked={config.enableLoyaltyPoints ?? false}
                      onCheckedChange={(checked) => handleInputChange('enableLoyaltyPoints', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Punti per Recensione</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      value={config.pointsPerReview ?? 10}
                      onChange={(e) => handleInputChange('pointsPerReview', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Sistema Notifiche
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Notifica Professionista</Label>
                      <p className="text-sm text-muted-foreground">
                        Avvisa professionista di nuove recensioni
                      </p>
                    </div>
                    <Switch
                      checked={config.notifyProfessionalOnReview ?? true}
                      onCheckedChange={(checked) => handleInputChange('notifyProfessionalOnReview', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Promemoria Cliente</Label>
                      <p className="text-sm text-muted-foreground">
                        Ricorda al cliente di recensire
                      </p>
                    </div>
                    <Switch
                      checked={config.remindClientAfterDays ? true : false}
                      onCheckedChange={(checked) => handleInputChange('remindClientAfterDays', checked ? 3 : 0)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Notifica Problemi</Label>
                      <p className="text-sm text-muted-foreground">
                        Avvisa admin di recensioni problematiche
                      </p>
                    </div>
                    <Switch
                      checked={config.notifyAdminOnProblematic ?? true}
                      onCheckedChange={(checked) => handleInputChange('notifyAdminOnProblematic', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Esclusioni */}
        <TabsContent value="exclusions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Esclusioni dal Sistema Recensioni</CardTitle>
              <CardDescription>
                Escludi specifici utenti dal sistema di recensioni per motivi di moderazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Utenti Esclusi</h3>
                  <p className="text-sm text-muted-foreground">
                    Lista degli utenti che non possono partecipare al sistema recensioni
                  </p>
                </div>
                <Button 
                  onClick={() => setShowAddExclusionModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi Esclusione
                </Button>
              </div>

              <div className="space-y-4">
                {exclusionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Caricamento esclusioni...</span>
                  </div>
                ) : (exclusionsData as any)?.data?.data?.length > 0 ? (
                  <div className="space-y-3">
                    {(exclusionsData as any).data.data.map((exclusion: ReviewExclusion) => (
                      <div key={exclusion.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-medium">
                                {exclusion.User_ReviewExclusion_userIdToUser.firstName} {exclusion.User_ReviewExclusion_userIdToUser.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {exclusion.User_ReviewExclusion_userIdToUser.email} • {exclusion.User_ReviewExclusion_userIdToUser.role}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                               <Badge variant={exclusion.type === 'CLIENT' ? 'default' : exclusion.type === 'PROFESSIONAL' ? 'info' : 'danger'}>
                                 {exclusion.type}
                               </Badge>
                               {exclusion.isTemporary && (
                                 <Badge variant="warning" className="flex items-center gap-1">
                                   <Calendar className="h-3 w-3" />
                                   Temporanea
                                 </Badge>
                               )}
                               {!exclusion.isActive && (
                                 <Badge variant="info">Scaduta</Badge>
                               )}
                             </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              <strong>Motivo:</strong> {exclusion.reason}
                            </p>
                            {exclusion.isTemporary && exclusion.expiresAt && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Scade il:</strong> {new Date(exclusion.expiresAt).toLocaleDateString('it-IT')}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              <strong>Creata da:</strong> {exclusion.User_ReviewExclusion_excludedByToUser.firstName} {exclusion.User_ReviewExclusion_excludedByToUser.lastName} 
                              il {new Date(exclusion.createdAt).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                        </div>
                        <Button
                           variant="danger"
                           size="sm"
                           onClick={() => handleRemoveExclusion(exclusion.id)}
                           disabled={removeExclusionMutation.isPending}
                           className="ml-4"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun utente escluso dal sistema recensioni</p>
                    <p className="text-sm">Gli utenti esclusi appariranno qui</p>
                  </div>
                )}
              </div>

              <Alert>
                <UserX className="h-4 w-4" />
                <AlertDescription>
                  <strong>Nota:</strong> Gli utenti esclusi non possono né lasciare né ricevere recensioni.
                  Questa funzionalità è utile per gestire casi di moderazione o utenti problematici.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Modal per aggiungere esclusione */}
          {showAddExclusionModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={() => setShowAddExclusionModal(false)}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                  <div className="bg-white px-6 pt-6 pb-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <UserX className="h-6 w-6 text-red-600" />
                        <h3 className="text-xl font-semibold text-gray-900">
                          Aggiungi Esclusione Utente
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddExclusionModal(false)}
                        className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition"
                      >
                        <span className="sr-only">Chiudi</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Alert informativo */}
                    <Alert className="mb-6">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Attenzione:</strong> L'utente escluso non potrà più lasciare o ricevere recensioni. 
                        Questa azione può essere temporanea o permanente.
                      </AlertDescription>
                    </Alert>

                    {/* Form content */}
                    <div className="space-y-6">
                      {/* Ricerca Utente */}
                      <div>
                        <Label htmlFor="searchUser" className="text-base font-medium">
                          Cerca Utente da Escludere
                        </Label>
                        <div className="mt-2 relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="searchUser"
                              type="text"
                              placeholder="Cerca per nome, cognome o email..."
                              value={searchUser}
                              onChange={(e) => setSearchUser(e.target.value)}
                              disabled={!!selectedUser}
                              className={`pl-10 ${selectedUser ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            />
                            {selectedUser && (
                              <button
                                type="button"
                                onClick={handleDeselectUser}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                                title="Deseleziona utente"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Indicazione utente selezionato */}
                        {selectedUser && (
                          <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-semibold text-green-800 truncate">
                                    {selectedUser.firstName} {selectedUser.lastName}
                                  </p>
                                  <p className="text-sm text-green-600 truncate">
                                    {selectedUser.email} • {selectedUser.role}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {usersLoading && searchUser.length >= 2 && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Ricerca in corso...
                          </div>
                        )}
                        
                        {/* Lista risultati ricerca - 🔧 FIX: Gestione corretta degli utenti */}
                        {Array.isArray(usersData) && usersData.length > 0 && searchUser.length >= 2 && !selectedUser && (
                          <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto relative z-50">
                            {usersData.map((user: User) => (
                              <div
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                      <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {user.email} • {user.role}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Messaggio quando non ci sono risultati */}
                        {!usersLoading && searchUser.length >= 2 && !selectedUser && (!Array.isArray(usersData) || usersData.length === 0) && (
                          <div className="mt-2 p-3 text-center text-sm text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                            Nessun utente trovato con "{searchUser}"
                          </div>
                        )}
                      </div>

                      {/* Tipo esclusione */}
                      <div>
                        <Label htmlFor="exclusion-type" className="text-base font-medium">
                          Tipo Esclusione
                        </Label>
                        <div className="mt-2">
                          <Select
                            value={exclusionForm.type}
                            onValueChange={(value: string) => 
                              setExclusionForm(prev => ({ ...prev, type: value as 'CLIENT' | 'PROFESSIONAL' | 'BOTH' }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleziona il tipo di esclusione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLIENT">Cliente - Non può lasciare recensioni</SelectItem>
                              <SelectItem value="PROFESSIONAL">Professionista - Non può ricevere recensioni</SelectItem>
                              <SelectItem value="BOTH">Entrambi - Esclusione completa dal sistema</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Motivo */}
                      <div>
                        <Label htmlFor="exclusion-reason" className="text-base font-medium">
                          Motivo dell'Esclusione
                        </Label>
                        <div className="mt-2">
                          <TextArea
                            id="exclusion-reason"
                            placeholder="Descrivi il motivo dell'esclusione (es. comportamento inappropriato, violazione delle regole, ecc.)"
                            value={exclusionForm.reason}
                            onChange={(e) => setExclusionForm(prev => ({ ...prev, reason: e.target.value }))}
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                      </div>

                      {/* Esclusione temporanea */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={exclusionForm.isTemporary}
                            onCheckedChange={(checked) => setExclusionForm(prev => ({ ...prev, isTemporary: checked }))}
                          />
                          <div>
                            <Label htmlFor="is-temporary" className="text-base font-medium cursor-pointer">
                              Esclusione Temporanea
                            </Label>
                            <p className="text-sm text-gray-500">
                              Se attivata, l'esclusione scadrà automaticamente alla data specificata
                            </p>
                          </div>
                        </div>

                        {exclusionForm.isTemporary && (
                          <div>
                            <Label htmlFor="expires-at" className="text-base font-medium">
                              Data di Scadenza
                            </Label>
                            <div className="mt-2">
                              <Input
                                id="expires-at"
                                type="datetime-local"
                                value={exclusionForm.expiresAt}
                                onChange={(e) => setExclusionForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                     {/* Footer con pulsanti */}
                     <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 mt-6">
                       <Button
                         type="button"
                         variant="secondary"
                         onClick={() => setShowAddExclusionModal(false)}
                         disabled={createExclusionMutation.isPending}
                       >
                         Annulla
                       </Button>
                       <Button
                         type="button"
                         onClick={handleCreateExclusion}
                         disabled={!selectedUser || !exclusionForm.reason.trim() || createExclusionMutation.isPending}
                         className="bg-red-600 hover:bg-red-700 text-white"
                       >
                         {createExclusionMutation.isPending ? (
                           <>
                             <Loader2 className="h-4 w-4 animate-spin mr-2" />
                             Creazione...
                           </>
                         ) : (
                           <>
                             <UserX className="h-4 w-4 mr-2" />
                             Crea Esclusione
                           </>
                         )}
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}
        </TabsContent>

      </Tabs>

      {/* Status Badge */}
      <div className="flex justify-center">
        <Badge variant={config.isEnabled ? "success" : "default"} className="px-4 py-2">
          Sistema {config.isEnabled ? "ABILITATO" : "DISABILITATO"}
        </Badge>
      </div>
    </div>
  );
}
