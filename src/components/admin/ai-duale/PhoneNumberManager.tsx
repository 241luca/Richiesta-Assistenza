import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, PhoneIcon, UserCheckIcon, UserXIcon, ShieldIcon } from 'lucide-react';

interface PhoneNumber {
  number: string;
  name?: string;
  addedAt: string;
}

interface NumbersConfig {
  professionalNumbers: string[];
  trustedNumbers: string[];
  blockedNumbers: string[];
}

function NumbersList({ 
  numbers, 
  type,
  onRemove 
}: { 
  numbers: string[];
  type: 'professional' | 'trusted' | 'blocked';
  onRemove: (number: string) => void;
}) {
  const getIcon = () => {
    switch(type) {
      case 'professional': return <UserCheckIcon className="w-4 h-4 text-blue-500" />;
      case 'trusted': return <ShieldIcon className="w-4 h-4 text-green-500" />;
      case 'blocked': return <UserXIcon className="w-4 h-4 text-red-500" />;
    }
  };

  const getEmptyMessage = () => {
    switch(type) {
      case 'professional': return 'Nessun numero professionale configurato';
      case 'trusted': return 'Nessun numero fidato configurato';
      case 'blocked': return 'Nessun numero bloccato';
    }
  };

  if (!numbers || numbers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {getEmptyMessage()}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {numbers.map((number) => (
        <div key={number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-mono">{number}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(number)}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function AddNumberForm({ 
  type,
  onAdd 
}: { 
  type: 'professional' | 'trusted' | 'blocked';
  onAdd: (number: string) => void;
}) {
  const [number, setNumber] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (number.trim()) {
      // Normalizza il numero (rimuove spazi e caratteri speciali)
      const normalized = number.replace(/[^\d+]/g, '');
      onAdd(normalized);
      setNumber('');
    }
  };

  const getPlaceholder = () => {
    switch(type) {
      case 'professional': return 'es. +393331234567 (collega)';
      case 'trusted': return 'es. +393331234567 (fidato)';
      case 'blocked': return 'es. +393331234567 (da bloccare)';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="tel"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder={getPlaceholder()}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button type="submit">
        <PlusIcon className="w-4 h-4 mr-1" />
        Aggiungi
      </Button>
    </form>
  );
}

export function PhoneNumberManager() {
  const [activeTab, setActiveTab] = useState('professional');
  const queryClient = useQueryClient();
  
  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['whatsapp-numbers'],
    queryFn: async () => {
      const response = await api.get('/professional/whatsapp/config');
      return response.data.data;
    }
  });
  
  // Add number mutation
  const addNumber = useMutation({
    mutationFn: async ({ number, type }: { number: string; type: string }) => {
      const response = await api.post('/professional/whatsapp/numbers/add', {
        phoneNumber: number,
        type: type
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Numero aggiunto con successo!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore aggiunta numero');
    }
  });

  // Remove number mutation
  const removeNumber = useMutation({
    mutationFn: async ({ number, type }: { number: string; type: string }) => {
      const response = await api.delete('/professional/whatsapp/numbers/remove', {
        data: {
          phoneNumber: number,
          type: type
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Numero rimosso con successo!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore rimozione numero');
    }
  });

  // Test detection
  const testDetection = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await api.post('/professional/whatsapp/test-detection', {
        phoneNumber
      });
      return response.data;
    },
    onSuccess: (data) => {
      const result = data.data;
      toast.success(
        `Detection: ${result.mode} (confidence: ${(result.confidence * 100).toFixed(0)}%)`,
        { duration: 5000 }
      );
    },
    onError: (error: any) => {
      toast.error('Errore test detection');
    }
  });

  const [testNumber, setTestNumber] = useState('');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PhoneIcon className="w-5 h-5" />
          📱 Gestione Numeri Telefono
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="professional">
              Professionali
            </TabsTrigger>
            <TabsTrigger value="trusted">
              Fidati
            </TabsTrigger>
            <TabsTrigger value="blocked">
              Bloccati
            </TabsTrigger>
            <TabsTrigger value="test">
              Test
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="professional" className="mt-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Numeri di colleghi professionisti. Riceveranno risposte tecniche complete.
              </p>
            </div>
            <AddNumberForm 
              type="professional"
              onAdd={(number) => addNumber.mutate({ number, type: 'professional' })}
            />
            <NumbersList
              numbers={config?.professionalNumbers || []}
              type="professional"
              onRemove={(number) => removeNumber.mutate({ number, type: 'professional' })}
            />
          </TabsContent>
          
          <TabsContent value="trusted" className="mt-4 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Numeri fidati (es. fornitori). Riceveranno risposte tecniche con confidence 90%.
              </p>
            </div>
            <AddNumberForm 
              type="trusted"
              onAdd={(number) => addNumber.mutate({ number, type: 'trusted' })}
            />
            <NumbersList
              numbers={config?.trustedNumbers || []}
              type="trusted"
              onRemove={(number) => removeNumber.mutate({ number, type: 'trusted' })}
            />
          </TabsContent>
          
          <TabsContent value="blocked" className="mt-4 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                Numeri bloccati. Non riceveranno risposte automatiche.
              </p>
            </div>
            <AddNumberForm 
              type="blocked"
              onAdd={(number) => addNumber.mutate({ number, type: 'blocked' })}
            />
            <NumbersList
              numbers={config?.blockedNumbers || []}
              type="blocked"
              onRemove={(number) => removeNumber.mutate({ number, type: 'blocked' })}
            />
          </TabsContent>
          
          <TabsContent value="test" className="mt-4 space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Testa la detection per un numero specifico.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="Inserisci numero da testare..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={() => testNumber && testDetection.mutate(testNumber)}
                disabled={!testNumber}
              >
                Test Detection
              </Button>
            </div>
            
            {testDetection.isSuccess && testDetection.data && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Risultato Detection:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Modalità:</strong> {testDetection.data.data.mode}</p>
                  <p><strong>Confidence:</strong> {(testDetection.data.data.confidence * 100).toFixed(0)}%</p>
                  <p><strong>Fattori:</strong></p>
                  <ul className="ml-4 list-disc">
                    {testDetection.data.data.factors?.map((factor: string, i: number) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
