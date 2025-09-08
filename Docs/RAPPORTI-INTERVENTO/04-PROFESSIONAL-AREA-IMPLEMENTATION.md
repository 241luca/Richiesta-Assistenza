# 📋 FASE 4 - PROFESSIONAL AREA IMPLEMENTATION

## OBIETTIVO
Creare l'area dedicata ai professionisti per la gestione personalizzata dei rapporti di intervento.

## DURATA STIMATA: 24 ore

---

## 📁 STRUTTURA FILE DA CREARE

```
src/
├── pages/
│   └── professional/
│       └── reports/
│           ├── index.tsx                 # Dashboard rapporti professionista
│           ├── my-reports.tsx            # Lista rapporti personali
│           ├── create.tsx                # Creazione nuovo rapporto
│           ├── edit/[id].tsx             # Modifica rapporto
│           ├── templates/
│           │   ├── index.tsx            # Template personalizzati
│           │   └── customize.tsx        # Personalizza template
│           ├── phrases/
│           │   ├── index.tsx            # Frasi ricorrenti
│           │   └── categories.tsx       # Categorie frasi
│           ├── materials/
│           │   ├── index.tsx            # Materiali personali
│           │   └── pricing.tsx          # Gestione prezzi
│           └── settings/
│               ├── index.tsx            # Impostazioni rapporti
│               ├── signature.tsx        # Configurazione firma
│               └── business.tsx         # Dati aziendali
│
└── components/
    └── professional/
        └── reports/
            ├── ReportsDashboard.tsx      # Dashboard overview
            ├── ReportsTable.tsx          # Tabella rapporti
            ├── ReportForm.tsx            # Form compilazione
            ├── QuickPhrases.tsx          # Widget frasi veloci
            ├── QuickMaterials.tsx        # Widget materiali veloci
            ├── TimerWidget.tsx           # Timer intervento
            ├── SignatureSetup.tsx        # Setup firma digitale
            ├── TemplateCustomizer.tsx    # Personalizzazione template
            ├── MaterialsPricing.tsx      # Gestione prezzi materiali
            └── BusinessSettings.tsx      # Impostazioni aziendali
```

---

## STEP 4.1 - DASHBOARD PROFESSIONISTA (4 ore)

### Creare `src/pages/professional/reports/index.tsx`:

```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  Euro,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  BarChart
} from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import RecentReports from '@/components/professional/reports/RecentReports';
import QuickActions from '@/components/professional/reports/QuickActions';

export default function ProfessionalReportsDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month');

  // Query statistiche personali
  const { data: stats } = useQuery({
    queryKey: ['professional', 'reports', 'stats', dateRange],
    queryFn: () => apiRequest('/api/intervention-reports/professional/stats', {
      params: { range: dateRange }
    })
  });

  // Query rapporti recenti
  const { data: recentReports } = useQuery({
    queryKey: ['professional', 'reports', 'recent'],
    queryFn: () => apiRequest('/api/intervention-reports/professional/recent')
  });

  // Query richieste assegnate senza rapporto
  const { data: pendingRequests } = useQuery({
    queryKey: ['professional', 'requests', 'pending-reports'],
    queryFn: () => apiRequest('/api/requests/my-requests', {
      params: { withoutReport: true }
    })
  });

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            I Miei Rapporti di Intervento
          </h1>
          <p className="text-gray-600">
            Benvenuto {user?.fullName}, gestisci i tuoi rapporti di intervento
          </p>
        </div>
        
        <Link href="/professional/reports/settings">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Impostazioni
          </Button>
        </Link>
      </div>

      {/* Cards statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rapporti {dateRange === 'month' ? 'Questo Mese' : 'Oggi'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedReports || 0} completati, {stats?.draftReports || 0} bozze
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ore Lavorate
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              Media {stats?.avgHoursPerReport || 0}h per rapporto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Materiali Utilizzati
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ {stats?.materialsTotal || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.uniqueMaterials || 0} articoli diversi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasso Firma
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.signatureRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.signedReports || 0} su {stats?.totalReports || 0} firmati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Richieste senza rapporto */}
      {pendingRequests?.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Richieste in Attesa di Rapporto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((request: any) => (
                <div key={request.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-gray-600">
                      {request.client.fullName} - {request.address}
                    </p>
                  </div>
                  <Link href={`/professional/reports/create?requestId=${request.id}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Crea Rapporto
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {pendingRequests.length > 3 && (
              <Link href="/professional/requests">
                <Button variant="link" className="mt-4">
                  Vedi tutte le {pendingRequests.length} richieste →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs contenuto principale */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Rapporti Recenti</TabsTrigger>
          <TabsTrigger value="actions">Azioni Rapide</TabsTrigger>
          <TabsTrigger value="templates">I Miei Template</TabsTrigger>
          <TabsTrigger value="analytics">Analisi</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <RecentReports reports={recentReports} />
        </TabsContent>

        <TabsContent value="actions">
          <QuickActions />
        </TabsContent>

        <TabsContent value="templates">
          <MyTemplates />
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente Template
function MyTemplates() {
  const { data: templates } = useQuery({
    queryKey: ['professional', 'templates'],
    queryFn: () => apiRequest('/api/intervention-reports/professional/templates')
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates?.map((template: any) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Usato {template.usageCount} volte
              </span>
              <Link href={`/professional/reports/templates/customize?id=${template.id}`}>
                <Button variant="outline" size="sm">
                  Personalizza
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="border-dashed hover:shadow-lg transition-shadow cursor-pointer">
        <Link href="/professional/reports/templates/customize">
          <CardContent className="flex flex-col items-center justify-center h-full py-8">
            <Plus className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-600">Crea Nuovo Template</p>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
```

---

## STEP 4.2 - GESTIONE FRASI RICORRENTI (4 ore)

### Creare `src/pages/professional/reports/phrases/index.tsx`:

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Star, 
  Copy, 
  Edit, 
  Trash,
  Tag,
  FileText,
  Zap,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Phrase {
  id: string;
  category: string;
  code: string;
  title: string;
  content: string;
  tags: string[];
  usageCount: number;
  isFavorite: boolean;
  lastUsedAt?: string;
}

export default function ProfessionalPhrases() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  
  const queryClient = useQueryClient();

  // Query frasi
  const { data: phrases } = useQuery({
    queryKey: ['professional', 'phrases', selectedCategory, search],
    queryFn: () => apiRequest('/api/intervention-reports/professional/phrases', {
      params: { 
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search 
      }
    })
  });

  // Mutation toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: (phrase: Phrase) => 
      apiRequest(`/api/intervention-reports/professional/phrases/${phrase.id}/favorite`, {
        method: 'POST',
        data: { isFavorite: !phrase.isFavorite }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['professional', 'phrases']);
      toast.success('Preferito aggiornato');
    }
  });

  // Mutation elimina
  const deletePhrase = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/intervention-reports/professional/phrases/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['professional', 'phrases']);
      toast.success('Frase eliminata');
    }
  });

  // Categorie
  const categories = [
    { value: 'all', label: 'Tutte', icon: FileText },
    { value: 'problema', label: 'Problemi', icon: AlertCircle },
    { value: 'soluzione', label: 'Soluzioni', icon: CheckCircle },
    { value: 'raccomandazione', label: 'Raccomandazioni', icon: Lightbulb },
    { value: 'note', label: 'Note', icon: FileText }
  ];

  // Copy to clipboard
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiato negli appunti');
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Frasi Ricorrenti
        </h1>
        <p className="text-gray-600">
          Gestisci le tue frasi e testi utilizzati frequentemente nei rapporti
        </p>
      </div>

      {/* Toolbar */}
      <Card className="mb-6 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca frasi..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'favorites' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('favorites')}
              >
                <Star className="h-4 w-4 mr-1" />
                Preferiti
              </Button>
            </div>
          </div>

          <Button onClick={() => {
            setEditingPhrase(null);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Frase
          </Button>
        </div>
      </Card>

      {/* Tabs categorie */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-4">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <TabsTrigger key={cat.value} value={cat.value}>
                <Icon className="h-4 w-4 mr-1" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Grid frasi */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {phrases?.map((phrase: Phrase) => (
            <Card key={phrase.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {phrase.title}
                      {phrase.isFavorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {phrase.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        Usato {phrase.usageCount} volte
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {phrase.content}
                </p>
                
                {phrase.tags && phrase.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {phrase.tags.map(tag => (
                      <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(phrase.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite.mutate(phrase)}
                    >
                      <Star className={`h-4 w-4 ${phrase.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPhrase(phrase);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Eliminare questa frase?')) {
                          deletePhrase.mutate(phrase.id);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Tabs>

      {/* Dialog form */}
      <PhraseFormDialog 
        open={showForm}
        onOpenChange={setShowForm}
        phrase={editingPhrase}
        onSuccess={() => {
          setShowForm(false);
          setEditingPhrase(null);
          queryClient.invalidateQueries(['professional', 'phrases']);
        }}
      />
    </div>
  );
}

// Componente Dialog Form
function PhraseFormDialog({ open, onOpenChange, phrase, onSuccess }: any) {
  const [formData, setFormData] = useState({
    category: phrase?.category || 'problema',
    title: phrase?.title || '',
    content: phrase?.content || '',
    tags: phrase?.tags?.join(', ') || ''
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (phrase?.id) {
        return apiRequest(`/api/intervention-reports/professional/phrases/${phrase.id}`, {
          method: 'PUT',
          data
        });
      }
      return apiRequest('/api/intervention-reports/professional/phrases', {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      toast.success(phrase ? 'Frase aggiornata' : 'Frase creata');
      onSuccess();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {phrase ? 'Modifica Frase' : 'Nuova Frase Ricorrente'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="problema">Problema</option>
              <option value="soluzione">Soluzione</option>
              <option value="raccomandazione">Raccomandazione</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Titolo</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Titolo breve della frase"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contenuto</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Testo completo della frase..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (separati da virgola)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="es: manutenzione, controllo, garanzia"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">
              {phrase ? 'Aggiorna' : 'Crea'} Frase
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## STEP 4.3 - IMPOSTAZIONI E FIRMA DIGITALE (4 ore)

### Creare `src/pages/professional/reports/settings/index.tsx`:

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Building, 
  FileSignature, 
  Bell, 
  FileText,
  Save,
  Upload
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import SignaturePad from 'react-signature-canvas';

export default function ProfessionalReportSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [signaturePad, setSignaturePad] = useState<any>(null);

  // Query impostazioni
  const { data: settings, refetch } = useQuery({
    queryKey: ['professional', 'report-settings'],
    queryFn: () => apiRequest('/api/intervention-reports/professional/settings')
  });

  // Mutation salvataggio
  const saveMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/intervention-reports/professional/settings', {
        method: 'PUT',
        data
      }),
    onSuccess: () => {
      toast.success('Impostazioni salvate');
      refetch();
    }
  });

  // Salva firma
  const saveSignature = () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const signatureData = signaturePad.toDataURL();
      saveMutation.mutate({
        ...settings,
        signatureImage: signatureData
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Impostazioni Rapporti
        </h1>
        <p className="text-gray-600">
          Configura le tue preferenze per i rapporti di intervento
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Generale
          </TabsTrigger>
          <TabsTrigger value="business">
            <Building className="h-4 w-4 mr-2" />
            Azienda
          </TabsTrigger>
          <TabsTrigger value="signature">
            <FileSignature className="h-4 w-4 mr-2" />
            Firma
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifiche
          </TabsTrigger>
          <TabsTrigger value="pdf">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </TabsTrigger>
        </TabsList>

        {/* Tab Generale */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Preferenze Generali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Template Predefinito</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={settings?.defaultTemplateId || ''}
                    onChange={(e) => saveMutation.mutate({
                      ...settings,
                      defaultTemplateId: e.target.value
                    })}
                  >
                    <option value="">Nessuno</option>
                    {/* Options from API */}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Lingua Predefinita</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={settings?.defaultLanguage || 'it'}
                    onChange={(e) => saveMutation.mutate({
                      ...settings,
                      defaultLanguage: e.target.value
                    })}
                  >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Avvia Timer Automaticamente</Label>
                    <p className="text-sm text-gray-500">
                      Avvia il timer quando apri un rapporto
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoStartTimer || false}
                    onCheckedChange={(checked) => saveMutation.mutate({
                      ...settings,
                      autoStartTimer: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Posizione GPS Automatica</Label>
                    <p className="text-sm text-gray-500">
                      Rileva automaticamente la posizione GPS
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoGpsLocation || false}
                    onCheckedChange={(checked) => saveMutation.mutate({
                      ...settings,
                      autoGpsLocation: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Meteo Automatico</Label>
                    <p className="text-sm text-gray-500">
                      Registra automaticamente le condizioni meteo
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoWeather || false}
                    onCheckedChange={(checked) => saveMutation.mutate({
                      ...settings,
                      autoWeather: checked
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Azienda */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Dati Aziendali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ragione Sociale</Label>
                  <Input
                    value={settings?.businessName || ''}
                    onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                    placeholder="Nome azienda"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Partita IVA</Label>
                  <Input
                    value={settings?.vatNumber || ''}
                    onChange={(e) => setSettings({...settings, vatNumber: e.target.value})}
                    placeholder="12345678901"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Codice Fiscale</Label>
                  <Input
                    value={settings?.fiscalCode || ''}
                    onChange={(e) => setSettings({...settings, fiscalCode: e.target.value})}
                    placeholder="RSSMRA80A01H501A"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Numero REA</Label>
                  <Input
                    value={settings?.reaNumber || ''}
                    onChange={(e) => setSettings({...settings, reaNumber: e.target.value})}
                    placeholder="MI-1234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Indirizzo</Label>
                <Input
                  value={settings?.businessAddress || ''}
                  onChange={(e) => setSettings({...settings, businessAddress: e.target.value})}
                  placeholder="Via Roma 1, 20100 Milano (MI)"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={settings?.businessPhone || ''}
                    onChange={(e) => setSettings({...settings, businessPhone: e.target.value})}
                    placeholder="02 1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={settings?.businessEmail || ''}
                    onChange={(e) => setSettings({...settings, businessEmail: e.target.value})}
                    placeholder="info@azienda.it"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sito Web</Label>
                  <Input
                    value={settings?.businessWebsite || ''}
                    onChange={(e) => setSettings({...settings, businessWebsite: e.target.value})}
                    placeholder="www.azienda.it"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveMutation.mutate(settings)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Dati Aziendali
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Firma */}
        <TabsContent value="signature">
          <Card>
            <CardHeader>
              <CardTitle>Firma Digitale</CardTitle>
            </CardHeader>
            <CardContent>
              {settings?.signatureImage ? (
                <div className="space-y-4">
                  <div className="border rounded p-4">
                    <img 
                      src={settings.signatureImage} 
                      alt="Firma" 
                      className="max-h-32 mx-auto"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        saveMutation.mutate({
                          ...settings,
                          signatureImage: null
                        });
                      }}
                    >
                      Rimuovi Firma
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('Vuoi sostituire la firma esistente?')) {
                          saveMutation.mutate({
                            ...settings,
                            signatureImage: null
                          });
                        }
                      }}
                    >
                      Nuova Firma
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded p-4">
                    <SignaturePad
                      ref={setSignaturePad}
                      canvasProps={{
                        className: 'signature-canvas',
                        width: 600,
                        height: 200
                      }}
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => signaturePad?.clear()}
                    >
                      Cancella
                    </Button>
                    <Button onClick={saveSignature}>
                      Salva Firma
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Nome per Firma</Label>
                  <Input
                    value={settings?.signatureName || ''}
                    onChange={(e) => setSettings({...settings, signatureName: e.target.value})}
                    placeholder="Mario Rossi"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Titolo/Qualifica</Label>
                  <Input
                    value={settings?.signatureTitle || ''}
                    onChange={(e) => setSettings({...settings, signatureTitle: e.target.value})}
                    placeholder="Tecnico Specializzato"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## ✅ CHECKLIST COMPLETAMENTO FASE 4

### Dashboard Professionista
- [ ] Dashboard con statistiche personali
- [ ] Vista richieste senza rapporto
- [ ] Rapporti recenti
- [ ] Analytics personali

### Gestione Template
- [ ] Lista template personalizzati
- [ ] Creazione nuovo template
- [ ] Modifica template esistenti
- [ ] Copia da template base

### Frasi Ricorrenti
- [ ] CRUD frasi complete
- [ ] Categorizzazione frasi
- [ ] Sistema preferiti
- [ ] Ricerca e filtri
- [ ] Copy to clipboard

### Materiali Personali
- [ ] Gestione materiali personalizzati
- [ ] Prezzi personalizzati
- [ ] Categorie materiali
- [ ] Import/Export

### Impostazioni
- [ ] Preferenze generali
- [ ] Dati aziendali
- [ ] Firma digitale
- [ ] Configurazione notifiche
- [ ] Template PDF

### Testing
- [ ] Test dashboard
- [ ] Test frasi ricorrenti
- [ ] Test firma digitale
- [ ] Test impostazioni

---

## 📝 NOTE PER FASE SUCCESSIVA

La Fase 5 (Report Form) potrà iniziare con:
- Area professionista completa
- Template personalizzati pronti
- Frasi ricorrenti configurate
- Firma digitale salvata

Passare a: `05-REPORT-FORM-IMPLEMENTATION.md`
