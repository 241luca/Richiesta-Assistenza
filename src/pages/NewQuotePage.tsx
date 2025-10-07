import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function NewQuotePage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId?: string }>();
  const { user } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState<string>(requestId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0.22 }
  ]);
  
  // Stati per i costi di viaggio
  const [includeTravelCost, setIncludeTravelCost] = useState(false);
  const [travelCostAmount, setTravelCostAmount] = useState(0);
  const [travelDistance, setTravelDistance] = useState(0);
  const [loadingTravelCost, setLoadingTravelCost] = useState(false);

  // Se abbiamo un requestId nei params, impostalo
  useEffect(() => {
    if (requestId) {
      setSelectedRequestId(requestId);
    }
  }, [requestId]);

  // Helper per tradurre stato in italiano
  const getStatusLabel = (status: string): string => {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Da assegnare',
      'assigned': 'Assegnato',
      'in_progress': 'In corso',
      'completed': 'Completato',
      'cancelled': 'Annullato'
    };
    return statusLabels[status.toLowerCase()] || status;
  };

  // Helper per tradurre priorità in italiano
  const getPriorityLabel = (priority: string): string => {
    const priorityLabels: { [key: string]: string } = {
      'low': 'Bassa',
      'medium': 'Media',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return priorityLabels[priority.toLowerCase()] || priority;
  };

  // Helper per ottenere il colore dello stato
  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Helper per ottenere il colore della priorità
  const getPriorityColor = (priority: string): string => {
    const colors: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Fetch available requests - FIX: Rimossi filtri troppo restrittivi
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['available-requests', user?.id],
    queryFn: async () => {
      console.log('Fetching requests for user:', user);
      
      // Per i professionisti, mostriamo richieste assegnate a loro
      // Per admin, mostriamo tutte
      // NOTA: Rimuoviamo il filtro professionalId che potrebbe non funzionare
      
      const response = await api.get('/requests');
      console.log('Requests received:', response.data);
      
      // Estrai correttamente le richieste dalla risposta
      let requests = [];
      if (response.data?.data?.requests) {
        requests = response.data.data.requests;
      } else if (response.data?.requests) {
        requests = response.data.requests;
      } else if (Array.isArray(response.data)) {
        requests = response.data;
      }
      
      console.log('Extracted requests:', requests.length);
      
      // Se è un professionista, filtra lato client per mostrare solo le sue richieste
      if (user?.role === 'PROFESSIONAL') {
        // Filtra per richieste assegnate a questo professionista O non ancora assegnate
        requests = requests.filter((req: any) => 
          req.professionalId === user.id || 
          req.professionalId === String(user.id) ||
          !req.professionalId ||
          req.status === 'PENDING' || 
          req.status === 'pending'
        );
        console.log('Filtered requests for professional:', requests.length);
      }
      
      return requests;
    },
    enabled: !!user // Solo se l'utente è caricato
  });

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/quotes', data);
    },
    onSuccess: () => {
      toast.success('Preventivo creato con successo!');
      navigate('/quotes');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella creazione del preventivo');
    }
  });

  // Helper per formattare i numeri con 2 decimali
  const formatPrice = (value: number): string => {
    return value.toFixed(2);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0.22 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    // Gestisci i valori numerici per evitare NaN
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const numValue = parseFloat(value) || 0;
      // Arrotonda unitPrice a 2 decimali
      if (field === 'unitPrice') {
        newItems[index] = { ...newItems[index], [field]: Math.round(numValue * 100) / 100 };
      } else if (field === 'quantity') {
        // Arrotonda quantity a 2 decimali
        newItems[index] = { ...newItems[index], [field]: Math.round(numValue * 100) / 100 };
      } else {
        newItems[index] = { ...newItems[index], [field]: numValue };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    const total = items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * item.taxRate;
      return total + itemTotal + itemTax;
    }, 0);
    // Arrotonda a 2 decimali
    return Math.round(total * 100) / 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequestId) {
      toast.error('Seleziona una richiesta');
      return;
    }
    
    if (!title) {
      toast.error('Inserisci un titolo');
      return;
    }
    
    if (items.length === 0 || items.some(item => !item.description || item.unitPrice <= 0)) {
      toast.error('Aggiungi almeno una voce valida al preventivo');
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    createQuoteMutation.mutate({
      requestId: selectedRequestId,
      title,
      description,
      validUntil: validUntil.toISOString(),
      notes,
      termsConditions,
      items: items.map(item => ({
        ...item,
        unitPrice: item.unitPrice, // NON moltiplicare per 100
        totalPrice: item.quantity * item.unitPrice // NON moltiplicare per 100
      }))
    });
  };

  // Mostra loading mentre carica le richieste
  if (isLoadingRequests) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se non ci sono richieste disponibili, mostra un messaggio
  if (!requestsData || requestsData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/quotes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Torna ai preventivi
        </button>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessuna richiesta disponibile
          </h3>
          <p className="text-gray-500 mb-4">
            {user?.role === 'PROFESSIONAL' 
              ? 'Non hai richieste assegnate per cui creare preventivi.'
              : 'Non ci sono richieste disponibili per creare preventivi.'}
          </p>
          <button
            onClick={() => navigate('/requests')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Vai alle richieste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/quotes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Torna ai preventivi
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Nuovo Preventivo</h1>
        <p className="mt-2 text-gray-600">Crea un nuovo preventivo per una richiesta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selezione Richiesta */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni Preventivo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Richiesta *
              </label>
              <select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleziona una richiesta</option>
                {requestsData?.map((request: any) => (
                  <option key={request.id} value={request.id}>
                    {request.title} - {request.client?.fullName || 'N/A'} | Stato: {getStatusLabel(request.status)} | Priorità: {getPriorityLabel(request.priority)}
                  </option>
                ))}
              </select>
            </div>

            {/* Mostra dettagli richiesta selezionata */}
            {selectedRequestId && requestsData && (
              <div className="md:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const selectedRequest = requestsData.find((r: any) => r.id === selectedRequestId);
                  if (!selectedRequest) return null;
                  
                  return (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Dettagli Richiesta Selezionata</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Cliente:</span>
                          <p className="text-sm text-gray-900">{selectedRequest.client?.fullName || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Stato:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                            {getStatusLabel(selectedRequest.status)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Priorità:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                            {getPriorityLabel(selectedRequest.priority)}
                          </span>
                        </div>
                        <div className="md:col-span-3">
                          <span className="text-sm font-medium text-gray-500">Descrizione:</span>
                          <p className="text-sm text-gray-900 mt-1">{selectedRequest.description}</p>
                        </div>
                        <div className="md:col-span-3">
                          <span className="text-sm font-medium text-gray-500">Indirizzo:</span>
                          <p className="text-sm text-gray-900">{selectedRequest.address}, {selectedRequest.city} {selectedRequest.province} {selectedRequest.postalCode}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validità (giorni)
              </label>
              <input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value))}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titolo Preventivo *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="es. Preventivo riparazione impianto elettrico"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrizione dettagliata del lavoro da svolgere..."
              />
            </div>
          </div>
        </div>

        {/* Costi di Trasferimento - NUOVO */}
        {selectedRequestId && user?.role === 'PROFESSIONAL' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Costi di Trasferimento</h2>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="includeTravelCost"
                  checked={includeTravelCost}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setIncludeTravelCost(checked);
                    
                    if (checked && selectedRequestId) {
                      // Calcola i costi di viaggio
                      setLoadingTravelCost(true);
                      try {
                        const response = await api.get(`/travel/request/${selectedRequestId}/travel-info`);
                        if (response.data.success && response.data.data) {
                          const travelData = response.data.data;
                          // La distanza viene ritornata in metri dal backend, convertiamo in km
                          const distanceInKm = Math.round(travelData.distanceKm || (travelData.distance / 1000));
                          setTravelDistance(distanceInKm);
                          // Arrotonda il costo a 2 decimali
                          const travelCostInEuro = Math.round((travelData.cost / 100) * 100) / 100;
                          setTravelCostAmount(travelCostInEuro);
                          
                          // Aggiungi automaticamente come voce nel preventivo
                          const travelItem = {
                            description: `Costi di trasferimento (${distanceInKm} km)`,
                            quantity: 1,
                            unitPrice: travelCostInEuro, // Usa il costo arrotondato
                            taxRate: 0.22
                          };
                          
                          // Rimuovi eventuali voci di trasferimento esistenti
                          const filteredItems = items.filter(item => !item.description.includes('Costi di trasferimento'));
                          setItems([...filteredItems, travelItem]);
                          
                          toast.success('Costi di viaggio calcolati e aggiunti');
                        }
                      } catch (error) {
                        console.error('Error calculating travel cost:', error);
                        toast.error('Errore nel calcolo dei costi di viaggio');
                        setIncludeTravelCost(false);
                      } finally {
                        setLoadingTravelCost(false);
                      }
                    } else if (!checked) {
                      // Rimuovi la voce dei costi di viaggio
                      setItems(items.filter(item => !item.description.includes('Costi di trasferimento')));
                      setTravelCostAmount(0);
                      setTravelDistance(0);
                    }
                  }}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="includeTravelCost" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Includi costi di trasferimento nel preventivo
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Calcola automaticamente i costi basati sulla distanza dal cliente
                  </p>
                </div>
              </div>
              
              {loadingTravelCost && (
                <div className="mt-4 flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Calcolo costi in corso...
                </div>
              )}
              
              {includeTravelCost && !loadingTravelCost && travelCostAmount > 0 && (
                <div className="mt-4 bg-white rounded-lg p-3 border border-blue-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Distanza:</span>
                      <span className="ml-2 font-medium">{travelDistance} km</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Costo:</span>
                      <span className="ml-2 font-medium text-blue-600">€{travelCostAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Il costo è stato aggiunto automaticamente alle voci del preventivo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voci Preventivo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Voci Preventivo</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Aggiungi Voce
            </button>
          </div>

          <div className="space-y-4">
            {/* Header delle colonne */}
            <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 border-b">
              <div className="col-span-5">Descrizione</div>
              <div className="col-span-1">Qtà</div>
              <div className="col-span-2">Prezzo Unit.</div>
              <div className="col-span-2">IVA</div>
              <div className="col-span-1">Totale</div>
              <div className="col-span-1"></div>
            </div>
            
            {items.map((item, index) => {
              // Calcola il totale per ogni riga
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const itemTotalWithTax = itemTotal * (1 + (item.taxRate || 0));
              
              return (
              <div key={index} className="grid grid-cols-12 gap-3 items-start bg-gray-50 p-3 rounded-lg">
                <div className="col-span-5">
                  <textarea
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Descrizione dettagliata del lavoro/materiale"
                    rows={2}
                    required
                  />
                </div>
                
                <div className="col-span-1">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    placeholder="1"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">€</span>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <select
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>0%</option>
                    <option value={0.04}>4%</option>
                    <option value={0.10}>10%</option>
                    <option value={0.22}>22%</option>
                  </select>
                </div>
                
                <div className="col-span-1 flex items-center justify-end pt-2">
                  <span className="text-sm font-bold text-gray-900">
                    €{itemTotalWithTax.toFixed(2)}
                  </span>
                </div>
                
                <div className="col-span-1 flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    disabled={items.length === 1}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">
                Totale: €{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Note e Termini */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Note e Condizioni</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Note aggiuntive per il cliente..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Termini e Condizioni
              </label>
              <textarea
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Termini e condizioni del preventivo..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/quotes')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          
          <button
            type="submit"
            disabled={createQuoteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentTextIcon className="h-5 w-5" />
            {createQuoteMutation.isPending ? 'Creazione...' : 'Crea Preventivo'}
          </button>
        </div>
      </form>
    </div>
  );
}