import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  TruckIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount?: number;
  notes?: string;
}

export default function EditQuotePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [updateReason, setUpdateReason] = useState('');
  const [showRevisions, setShowRevisions] = useState(false);

  // Fetch quote data
  const { data: quoteData, isLoading: isLoadingQuote } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const response = await api.get(`/quotes/${id}`);
      const data = response.data?.data || response.data;
      return data;
    },
    enabled: !!id
  });

  // Fetch quote revisions
  const { data: revisionsData } = useQuery({
    queryKey: ['quote-revisions', id],
    queryFn: async () => {
      const response = await api.get(`/quotes/${id}/revisions`);
      const data = response.data?.data || response.data;
      return data;
    },
    enabled: !!id && showRevisions
  });

  // Populate form when quote data is loaded
  useEffect(() => {
    if (quoteData) {
      setTitle(quoteData.title || '');
      setDescription(quoteData.description || '');
      
      // Format date for input
      if (quoteData.validUntil) {
        const date = new Date(quoteData.validUntil);
        const formattedDate = date.toISOString().split('T')[0];
        setValidUntil(formattedDate);
      }
      
      setNotes(quoteData.notes || '');
      setTermsConditions(quoteData.terms || quoteData.termsConditions || '');
      
      // Map items correctly - convert from cents to euros
      const mappedItems = (quoteData.items || quoteData.QuoteItem || []).map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice / 100, // Convert from cents to euros
        taxRate: Number(item.taxRate || 0.22),
        discount: item.discount ? item.discount / 100 : 0,
        notes: item.notes || ''
      }));
      
      setItems(mappedItems.length > 0 ? mappedItems : [
        { description: '', quantity: 1, unitPrice: 0, taxRate: 0.22 }
      ]);
    }
  }, [quoteData]);

  // Update quote mutation
  const updateQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.put(`/quotes/${id}`, data);
    },
    onSuccess: () => {
      toast.success('Preventivo aggiornato con successo!');
      navigate('/quotes');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento del preventivo');
    }
  });

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0.22 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate' || field === 'discount') {
      const numValue = parseFloat(value) || 0;
      newItems[index] = { ...newItems[index], [field]: numValue };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    const total = items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemSubtotal = itemTotal - itemDiscount;
      const itemTax = itemSubtotal * item.taxRate;
      return total + itemSubtotal + itemTax;
    }, 0);
    return Math.round(total * 100) / 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error('Inserisci un titolo');
      return;
    }
    
    if (items.length === 0 || items.some(item => !item.description || item.unitPrice <= 0)) {
      toast.error('Aggiungi almeno una voce valida al preventivo');
      return;
    }

    const updateData = {
      title,
      description,
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      notes,
      termsConditions,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice, // Già in euro
        taxRate: item.taxRate,
        discount: item.discount || 0,
        notes: item.notes
      })),
      updateReason: updateReason || 'Aggiornamento preventivo'
    };

    updateQuoteMutation.mutate(updateData);
  };

  if (isLoadingQuote) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preventivo non trovato</h3>
          <button
            onClick={() => navigate('/quotes')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna ai preventivi
          </button>
        </div>
      </div>
    );
  }

  // Verifica autorizzazioni
  if (user?.role === 'PROFESSIONAL' && quoteData.professionalId !== user.id) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-red-900">Non autorizzato</h3>
          <p className="mt-2 text-red-700">Non sei autorizzato a modificare questo preventivo.</p>
          <button
            onClick={() => navigate('/quotes')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Torna ai preventivi
          </button>
        </div>
      </div>
    );
  }

  // Verifica stato modificabile
  if (quoteData.status !== 'DRAFT' && quoteData.status !== 'PENDING') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-900">Preventivo non modificabile</h3>
          <p className="mt-2 text-yellow-700">
            Questo preventivo ha stato "{quoteData.status}" e non può essere modificato.
          </p>
          <button
            onClick={() => navigate('/quotes')}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Torna ai preventivi
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
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifica Preventivo</h1>
            <p className="mt-2 text-gray-600">
              Versione {quoteData.version} - {quoteData.request?.title || 'N/A'}
            </p>
          </div>
          
          <button
            onClick={() => setShowRevisions(!showRevisions)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ClockIcon className="h-4 w-4" />
            Cronologia ({quoteData.version} revisioni)
          </button>
        </div>
      </div>

      {/* Mostra cronologia revisioni se richiesto */}
      {showRevisions && revisionsData && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Cronologia Revisioni</h3>
          <div className="space-y-2">
            {revisionsData.map((revision: any) => (
              <div key={revision.id} className="bg-white p-3 rounded border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">Versione {revision.version}</span>
                    <p className="text-sm text-gray-600 mt-1">{revision.reason}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(revision.createdAt).toLocaleDateString('it-IT')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informazioni Preventivo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni Preventivo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titolo Preventivo *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valido fino a
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              />
            </div>
          </div>
        </div>

        {/* Voci Preventivo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Voci Preventivo</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Aggiungi Voce
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start bg-gray-50 p-3 rounded-lg">
                <div className="col-span-5">
                  <textarea
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrizione"
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
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                    placeholder="Qtà"
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
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <select
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>0%</option>
                    <option value={0.04}>4%</option>
                    <option value={0.10}>10%</option>
                    <option value={0.22}>22%</option>
                  </select>
                </div>
                
                <div className="col-span-1 flex items-center justify-end pt-2">
                  <span className="text-sm font-bold text-gray-900">
                    €{((item.quantity * item.unitPrice) * (1 + item.taxRate)).toFixed(2)}
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
            ))}
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

        {/* Motivo della modifica */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Motivo della Modifica</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrivi brevemente il motivo della modifica (opzionale)
            </label>
            <input
              type="text"
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es. Aggiornamento prezzi, modifica quantità, correzione errori..."
            />
            <p className="mt-2 text-sm text-gray-600">
              Questo aiuterà a tenere traccia delle modifiche nella cronologia del preventivo.
            </p>
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
            disabled={updateQuoteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="h-5 w-5" />
            {updateQuoteMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </form>
    </div>
  );
}
