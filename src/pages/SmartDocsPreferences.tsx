import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../utils/toast';
import api from '../services/api';
import { Settings, Save, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';

export default function SmartDocsPreferences() {
  const { user } = useAuth();
  const [override, setOverride] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedOverride, setEditedOverride] = useState<any>({});

  useEffect(() => {
    if (user) {
      loadUserOverride();
    }
  }, [user]);

  const loadUserOverride = async () => {
    try {
      const userType = user?.role === 'CLIENT' ? 'client' : 'professional';
      const response = await api.get(`/smartdocs/config/users/${user?.id}/${userType}`);
      
      if (response.data.success && response.data.data) {
        setOverride(response.data.data);
        setEditedOverride(response.data.data);
      } else {
        setEditedOverride({ enabled: true });
      }
    } catch (error) {
      console.error('Failed to load user override:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userType = user?.role === 'CLIENT' ? 'client' : 'professional';
      const response = await api.put(`/smartdocs/config/users/${user?.id}/${userType}`, editedOverride);
      
      if (response.data.success) {
        setOverride(response.data.data);
        setEditedOverride(response.data.data);
        toast.success('Preferenze salvate!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preferenze SmartDocs</h1>
        <p className="text-muted-foreground">
          Configura quali dati vengono sincronizzati nel tuo knowledge base personale
        </p>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          La sincronizzazione automatica salva le tue richieste, chat e documenti in un knowledge base intelligente 
          che puoi interrogare in qualsiasi momento. Puoi disabilitare la sincronizzazione o scegliere quali dati includere.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sincronizzazione Automatica</CardTitle>
              <CardDescription>Controlla quali dati vengono salvati</CardDescription>
            </div>
            <Badge variant={editedOverride.enabled ? 'default' : 'danger'}>
              {editedOverride.enabled ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Attiva
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Disattivata
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Abilita Sincronizzazione</p>
              <p className="text-sm text-muted-foreground">
                Attiva/disattiva completamente la sincronizzazione dei tuoi dati
              </p>
            </div>
            <Button
              variant={editedOverride.enabled ? 'default' : 'outline'}
              onClick={() => setEditedOverride({ ...editedOverride, enabled: !editedOverride.enabled })}
            >
              {editedOverride.enabled ? 'Abilitata' : 'Disabilitata'}
            </Button>
          </div>

          {editedOverride.enabled && (
            <>
              <div className="space-y-3">
                <h3 className="font-medium">Dati da Sincronizzare</h3>
                {[
                  { key: 'sync_requests', label: 'Le Mie Richieste', description: 'Sincronizza le richieste di assistenza', icon: '📋' },
                  { key: 'sync_chats', label: 'Chat e Messaggi', description: 'Sincronizza le conversazioni', icon: '💬' },
                  { key: 'sync_quotes', label: 'Preventivi', description: 'Sincronizza preventivi ricevuti/inviati', icon: '💰' },
                  { key: 'sync_reports', label: 'Rapporti', description: 'Sincronizza i rapporti di intervento', icon: '📊' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={(editedOverride as any)[item.key] !== false ? 'default' : 'outline'}
                      onClick={() => {
                        const currentValue = (editedOverride as any)[item.key];
                        setEditedOverride({
                          ...editedOverride,
                          [item.key]: currentValue === false ? null : false
                        });
                      }}
                    >
                      {(editedOverride as any)[item.key] === false ? 'Disattivo' : 'Attivo'}
                    </Button>
                  </div>
                ))}
              </div>

              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Se un'opzione è "Attivo", significa che segue le impostazioni globali del sistema.
                  Puoi disattivarla esplicitamente per non sincronizzare quel tipo di dato.
                </AlertDescription>
              </Alert>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={loadUserOverride}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Preferenze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
