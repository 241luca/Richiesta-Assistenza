import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { SaveIcon, BookOpenIcon, EyeIcon, RefreshCwIcon } from 'lucide-react';

interface KnowledgeBase {
  kbProfessional?: any;
  kbClient?: any;
  kbEmergency?: any;
}

export function KBEditor({ subcategoryId }: { subcategoryId?: string }) {
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryId || '');
  const [kbProfessional, setKbProfessional] = useState('');
  const [kbClient, setKbClient] = useState('');
  const [sanitizedPreview, setSanitizedPreview] = useState('');
  const queryClient = useQueryClient();

  // Fetch subcategories
  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      try {
        const response = await api.get('/subcategories');
        return response.data?.data || [];
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        return [];
      }
    }
  });

  // Fetch KB for selected subcategory
  const { data: kbData, isLoading: kbLoading } = useQuery({
    queryKey: ['kb', selectedSubcategory],
    queryFn: async () => {
      if (!selectedSubcategory) return null;
      const response = await api.get(`/professional/whatsapp/kb/${selectedSubcategory}`);
      return response.data.data;
    },
    enabled: !!selectedSubcategory
  });

  useEffect(() => {
    if (kbData) {
      setKbProfessional(JSON.stringify(kbData.kbProfessional || {}, null, 2));
      setKbClient(JSON.stringify(kbData.kbClient || {}, null, 2));
    }
  }, [kbData]);

  // Update KB Professional
  const updateKBProfessional = useMutation({
    mutationFn: async (data: string) => {
      const response = await api.put(
        `/professional/whatsapp/kb/${selectedSubcategory}/professional`,
        { kb: JSON.parse(data) }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('KB Professional aggiornata!');
      queryClient.invalidateQueries({ queryKey: ['kb', selectedSubcategory] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore aggiornamento KB');
    }
  });

  // Update KB Client
  const updateKBClient = useMutation({
    mutationFn: async (data: string) => {
      const response = await api.put(
        `/professional/whatsapp/kb/${selectedSubcategory}/client`,
        { kb: JSON.parse(data) }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('KB Client aggiornata!');
      queryClient.invalidateQueries({ queryKey: ['kb', selectedSubcategory] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore aggiornamento KB');
    }
  });

  // Test sanitization
  const testSanitization = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post('/professional/whatsapp/test-sanitization', {
        text,
        mode: 'CLIENT'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSanitizedPreview(data.data.sanitized);
      toast.success('Sanitizzazione completata!');
    },
    onError: () => {
      toast.error('Errore test sanitizzazione');
    }
  });

  const handleSaveProfessional = () => {
    try {
      JSON.parse(kbProfessional); // Valida JSON
      updateKBProfessional.mutate(kbProfessional);
    } catch (e) {
      toast.error('JSON non valido nella KB Professional');
    }
  };

  const handleSaveClient = () => {
    try {
      JSON.parse(kbClient); // Valida JSON
      updateKBClient.mutate(kbClient);
    } catch (e) {
      toast.error('JSON non valido nella KB Client');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5" />
          📚 Editor Knowledge Base
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Selector sottocategoria */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleziona Sottocategoria
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Seleziona --</option>
            {subcategories?.map((subcat: any) => (
              <option key={subcat.id} value={subcat.id}>
                {subcat.category.name} → {subcat.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSubcategory && (
          <Tabs defaultValue="professional">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="professional">KB Professional</TabsTrigger>
              <TabsTrigger value="client">KB Client</TabsTrigger>
              <TabsTrigger value="preview">Preview Sanitizzazione</TabsTrigger>
            </TabsList>
            
            <TabsContent value="professional" className="mt-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Knowledge Base per professionisti. Include dettagli tecnici, prezzi netti, codici prodotto.
                </p>
              </div>
              <textarea
                value={kbProfessional}
                onChange={(e) => setKbProfessional(e.target.value)}
                className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='{\n  "products": [],\n  "procedures": [],\n  "prices": [],\n  "suppliers": []\n}'
              />
              <Button onClick={handleSaveProfessional} className="w-full">
                <SaveIcon className="w-4 h-4 mr-2" />
                Salva KB Professional
              </Button>
            </TabsContent>
            
            <TabsContent value="client" className="mt-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Knowledge Base per clienti. Linguaggio semplice, prezzi pubblici (+35%), no dettagli sensibili.
                </p>
              </div>
              <textarea
                value={kbClient}
                onChange={(e) => setKbClient(e.target.value)}
                className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='{\n  "services": [],\n  "faq": [],\n  "pricing": [],\n  "support": []\n}'
              />
              <Button onClick={handleSaveClient} className="w-full">
                <SaveIcon className="w-4 h-4 mr-2" />
                Salva KB Client
              </Button>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Testa come viene sanitizzato un testo per i clienti (rimozione prezzi netti, margini, etc.)
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Testo originale (con info sensibili)
                </label>
                <textarea
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es: Il prodotto ABC costa €100 (netto), margine 35%, codice COD-INT-123..."
                  onChange={(e) => e.target.value && testSanitization.mutate(e.target.value)}
                />
              </div>
              
              {sanitizedPreview && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Testo sanitizzato (per clienti)
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{sanitizedPreview}</pre>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => testSanitization.mutate(kbProfessional)}
                className="w-full"
                variant="outline"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Test Sanitizzazione KB Professional
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
