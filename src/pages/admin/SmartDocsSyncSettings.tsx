import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import {
  Settings,
  Database,
  Shield,
  Users,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  Trash2
} from 'lucide-react';

interface SyncConfig {
  id: number;
  enabled: boolean;
  default_container_id: string | null;
  sync_requests: boolean;
  sync_chats: boolean;
  sync_quotes: boolean;
  sync_reports: boolean;
  sync_profiles: boolean;
  sync_forms: boolean;
  sync_payments: boolean;
  chunk_size: number;
  chunk_overlap: number;
  auto_sync_delay_ms: number;
  batch_sync_enabled: boolean;
  batch_sync_size: number;
}

interface CategoryExclusion {
  id: number;
  category_id: number | null;
  category_name: string | null;
  subcategory_id: number | null;
  subcategory_name: string | null;
  excluded: boolean;
  reason: string | null;
}

interface UserOverride {
  id: number;
  user_id: number;
  user_type: 'client' | 'professional';
  user_name: string;
  enabled: boolean;
  custom_container_id: string | null;
  sync_requests: boolean | null;
  sync_chats: boolean | null;
  sync_quotes: boolean | null;
  sync_reports: boolean | null;
  notes: string | null;
}

export default function SmartDocsSyncSettings() {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [categoryExclusions, setCategoryExclusions] = useState<CategoryExclusion[]>([]);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editedConfig, setEditedConfig] = useState<Partial<SyncConfig>>({});
  const [newCategoryExclusion, setNewCategoryExclusion] = useState({
    category_id: '',
    subcategory_id: '',
    reason: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadConfig(),
        loadCategoryExclusions(),
        loadUserOverrides(),
        loadCategories()
      ]);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dei dati');
      toast.error('Errore nel caricamento delle configurazioni');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    const response = await api.get('/smartdocs/config');
    if (response.data.success) {
      setConfig(response.data.data);
      setEditedConfig(response.data.data);
    }
  };

  const loadCategoryExclusions = async () => {
    const response = await api.get('/smartdocs/config/categories');
    if (response.data.success && Array.isArray(response.data.data)) {
      setCategoryExclusions(response.data.data);
    } else {
      setCategoryExclusions([]);
    }
  };

  const loadUserOverrides = async () => {
    const response = await api.get('/smartdocs/config/users');
    if (response.data.success) {
      setUserOverrides(response.data.data);
    }
  };

  const loadCategories = async () => {
    const [catResponse, subResponse] = await Promise.all([
      api.get('/categories'),
      api.get('/subcategories')
    ]);
    
    if (catResponse.data && Array.isArray(catResponse.data)) {
      setCategories(catResponse.data);
    } else {
      setCategories([]);
    }
    
    if (subResponse.data && Array.isArray(subResponse.data)) {
      setSubcategories(subResponse.data);
    } else {
      setSubcategories([]);
    }
  };

  const handleSaveGlobalConfig = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await api.put('/smartdocs/config', editedConfig);
      
      if (response.data.success) {
        setConfig(response.data.data);
        setEditedConfig(response.data.data);
        toast.success('Configurazione globale salvata con successo!');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Errore nel salvataggio';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategoryExclusion = async () => {
    if (!newCategoryExclusion.category_id && !newCategoryExclusion.subcategory_id) {
      toast.error('Seleziona una categoria o sottocategoria');
      return;
    }

    try {
      const response = await api.post('/smartdocs/config/categories', {
        category_id: newCategoryExclusion.category_id ? parseInt(newCategoryExclusion.category_id) : null,
        subcategory_id: newCategoryExclusion.subcategory_id ? parseInt(newCategoryExclusion.subcategory_id) : null,
        reason: newCategoryExclusion.reason || null
      });

      if (response.data.success) {
        await loadCategoryExclusions();
        setNewCategoryExclusion({ category_id: '', subcategory_id: '', reason: '' });
        toast.success('Esclusione categoria aggiunta!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nell\'aggiunta esclusione');
    }
  };

  const handleRemoveCategoryExclusion = async (id: number) => {
    if (!confirm('Rimuovere questa esclusione?')) return;

    try {
      await api.delete(`/smartdocs/config/categories/${id}`);
      await loadCategoryExclusions();
      toast.success('Esclusione rimossa!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nella rimozione');
    }
  };

  const handleDeleteUserOverride = async (userId: number, userType: string) => {
    if (!confirm('Rimuovere l\'override per questo utente?')) return;

    try {
      await api.delete(`/smartdocs/config/users/${userId}/${userType}`);
      await loadUserOverrides();
      toast.success('Override utente rimosso!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nella rimozione');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Impossibile caricare la configurazione. Assicurati che il database sia configurato correttamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SmartDocs Sync Settings</h1>
          <p className="text-muted-foreground">
            Configura il comportamento della sincronizzazione automatica
          </p>
        </div>
        <Badge variant={config.enabled ? 'default' : 'danger'} className="text-lg px-4 py-2">
          {config.enabled ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Sync Attivo
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Sync Disabilitato
            </>
          )}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global">
            <Settings className="w-4 h-4 mr-2" />
            Globale
          </TabsTrigger>
          <TabsTrigger value="data-types">
            <Database className="w-4 h-4 mr-2" />
            Tipi di Dati
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Shield className="w-4 h-4 mr-2" />
            Categorie Escluse
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Override Utenti
          </TabsTrigger>
        </TabsList>

        {/* TAB: Global Settings */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione Globale</CardTitle>
              <CardDescription>
                Impostazioni generali del sistema di sincronizzazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Sync */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Abilita Sincronizzazione Automatica
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Attiva/disattiva la sincronizzazione globale di tutti i dati
                  </p>
                </div>
                <Button
                  variant={editedConfig.enabled ? 'primary' : 'secondary'}
                  onClick={() => setEditedConfig({ ...editedConfig, enabled: !editedConfig.enabled })}
                >
                  {editedConfig.enabled ? 'Abilitato' : 'Disabilitato'}
                </Button>
              </div>

              {/* Chunk Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chunk_size">Chunk Size</Label>
                  <Input
                    id="chunk_size"
                    type="number"
                    value={editedConfig.chunk_size || 1000}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      chunk_size: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dimensione dei chunk in caratteri (default: 1000)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chunk_overlap">Chunk Overlap</Label>
                  <Input
                    id="chunk_overlap"
                    type="number"
                    value={editedConfig.chunk_overlap || 200}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      chunk_overlap: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sovrapposizione tra chunk (default: 200)
                  </p>
                </div>
              </div>

              {/* Auto Sync Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auto_sync_delay">Auto Sync Delay (ms)</Label>
                  <Input
                    id="auto_sync_delay"
                    type="number"
                    value={editedConfig.auto_sync_delay_ms || 5000}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      auto_sync_delay_ms: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ritardo prima della sincronizzazione (debounce)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch_size">Batch Size</Label>
                  <Input
                    id="batch_size"
                    type="number"
                    value={editedConfig.batch_sync_size || 50}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      batch_sync_size: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Numero massimo di elementi per batch
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditedConfig(config)}
                  disabled={saving}
                >
                  Annulla
                </Button>
                <Button onClick={handleSaveGlobalConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salva Configurazione
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Data Types */}
        <TabsContent value="data-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipi di Dati da Sincronizzare</CardTitle>
              <CardDescription>
                Seleziona quali tipi di dati vengono sincronizzati automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Queste impostazioni sono globali. Puoi creare override specifici per utente nella tab "Override Utenti".
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'sync_requests', label: 'Richieste Assistenza', icon: '📋' },
                  { key: 'sync_chats', label: 'Messaggi Chat', icon: '💬' },
                  { key: 'sync_quotes', label: 'Preventivi', icon: '💰' },
                  { key: 'sync_reports', label: 'Rapporti Intervento', icon: '📊' },
                  { key: 'sync_profiles', label: 'Profili Utente', icon: '👤' },
                  { key: 'sync_forms', label: 'Moduli Custom', icon: '📝' },
                  { key: 'sync_payments', label: 'Pagamenti', icon: '💳' }
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={(editedConfig as any)[item.key] ? 'primary' : 'secondary'}
                      onClick={() => setEditedConfig({
                        ...editedConfig,
                        [item.key]: !(editedConfig as any)[item.key]
                      })}
                    >
                      {(editedConfig as any)[item.key] ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Attivo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Disattivo
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditedConfig(config)}
                  disabled={saving}
                >
                  Annulla
                </Button>
                <Button onClick={handleSaveGlobalConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salva Modifiche
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Category Exclusions */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Esclusioni per Categoria</CardTitle>
              <CardDescription>
                Escludi categorie o sottocategorie specifiche dalla sincronizzazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Exclusion Form */}
              <div className="p-4 border rounded-lg space-y-4 bg-accent/50">
                <h3 className="font-medium">Aggiungi Nuova Esclusione</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newCategoryExclusion.category_id}
                      onChange={(e) => setNewCategoryExclusion({
                        ...newCategoryExclusion,
                        category_id: e.target.value
                      })}
                    >
                      <option value="">Seleziona categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sottocategoria (opzionale)</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newCategoryExclusion.subcategory_id}
                      onChange={(e) => setNewCategoryExclusion({
                        ...newCategoryExclusion,
                        subcategory_id: e.target.value
                      })}
                    >
                      <option value="">Seleziona sottocategoria</option>
                      {subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Motivo</Label>
                    <Input
                      placeholder="Es: Dati sensibili"
                      value={newCategoryExclusion.reason}
                      onChange={(e) => setNewCategoryExclusion({
                        ...newCategoryExclusion,
                        reason: e.target.value
                      })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddCategoryExclusion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Esclusione
                </Button>
              </div>

              {/* Exclusions List */}
              <div className="space-y-2">
                <h3 className="font-medium">Esclusioni Attive ({categoryExclusions.length})</h3>
                {categoryExclusions.length === 0 ? (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      Nessuna esclusione configurata. Tutte le categorie vengono sincronizzate.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {categoryExclusions.map((exclusion) => (
                      <div
                        key={exclusion.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {exclusion.subcategory_name || exclusion.category_name}
                          </p>
                          {exclusion.subcategory_name && (
                            <p className="text-sm text-muted-foreground">
                              Categoria: {exclusion.category_name}
                            </p>
                          )}
                          {exclusion.reason && (
                            <p className="text-sm text-muted-foreground italic">
                              {exclusion.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveCategoryExclusion(exclusion.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: User Overrides */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Override Utenti</CardTitle>
              <CardDescription>
                Configurazioni personalizzate per clienti e professionisti specifici
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Gli override utente hanno priorità sulle impostazioni globali. Se un campo è NULL, viene usato il valore globale.
                </AlertDescription>
              </Alert>

              {userOverrides.length === 0 ? (
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Nessun override configurato. Tutti gli utenti usano le impostazioni globali.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {userOverrides.map((override) => (
                    <div
                      key={`${override.user_id}-${override.user_type}`}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{override.user_name}</p>
                          <Badge variant="info" className="mt-1">
                            {override.user_type === 'client' ? 'Cliente' : 'Professionista'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={override.enabled ? 'default' : 'danger'}>
                            {override.enabled ? 'Sync Attivo' : 'Sync Disabilitato'}
                          </Badge>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUserOverride(override.user_id, override.user_type)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {override.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          {override.notes}
                        </p>
                      )}

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {[
                          { key: 'sync_requests', label: 'Richieste' },
                          { key: 'sync_chats', label: 'Chat' },
                          { key: 'sync_quotes', label: 'Preventivi' },
                          { key: 'sync_reports', label: 'Rapporti' }
                        ].map((item) => {
                          const value = (override as any)[item.key];
                          return (
                            <div key={item.key} className="flex items-center gap-1">
                              {value === null ? (
                                <span className="text-gray-400">○ {item.label} (globale)</span>
                              ) : value ? (
                                <span className="text-green-600">✓ {item.label}</span>
                              ) : (
                                <span className="text-red-600">✗ {item.label}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
