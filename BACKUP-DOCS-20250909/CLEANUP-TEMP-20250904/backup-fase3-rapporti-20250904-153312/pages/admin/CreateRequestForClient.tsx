import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  DocumentTextIcon,
  MapPinIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { apiClient as api } from '@/services/api';
import CategorySelector from '@/components/categories/CategorySelector';
import AddressAutocomplete from '@/components/address/AddressAutocomplete';

// Schema di validazione
const requestSchema = z.object({
  // Cliente
  clientId: z.string().optional(),
  createNewClient: z.boolean(),
  newClientEmail: z.string().email('Email non valida').optional(),
  newClientFirstName: z.string().min(2, 'Nome troppo corto').optional(),
  newClientLastName: z.string().min(2, 'Cognome troppo corto').optional(),
  newClientPhone: z.string().optional(),
  newClientCodiceFiscale: z.string().optional(),
  
  // Richiesta
  title: z.string().min(5, 'Il titolo deve essere almeno 5 caratteri').max(255),
  description: z.string().min(20, 'La descrizione deve essere almeno 20 caratteri').max(5000),
  categoryId: z.string().min(1, 'Seleziona una categoria'),
  subcategoryId: z.string().min(1, 'Seleziona una sottocategoria'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  
  // Indirizzo
  address: z.string().min(5, 'Inserisci un indirizzo valido').max(500),
  city: z.string().min(2, 'Inserisci una città valida').max(100),
  province: z.string().length(2, 'La provincia deve essere di 2 caratteri'),
  postalCode: z.string().regex(/^\d{5}$/, 'Il CAP deve essere di 5 cifre'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Opzionali
  requestedDate: z.string().optional(),
  notes: z.string().optional(),
  professionalId: z.string().optional(),
  assignmentNotes: z.string().optional(),
}).refine((data) => {
  if (data.createNewClient) {
    return data.newClientEmail && data.newClientFirstName && data.newClientLastName;
  }
  return data.clientId;
}, {
  message: "Seleziona un cliente esistente o compila i dati del nuovo cliente",
  path: ["clientId"]
});

type RequestFormData = z.infer<typeof requestSchema>;

const priorityOptions = [
  { value: 'LOW', label: 'Bassa', color: 'bg-gray-100 text-gray-800', description: 'Non urgente' },
  { value: 'MEDIUM', label: 'Media', color: 'bg-blue-100 text-blue-800', description: 'Entro qualche giorno' },
  { value: 'HIGH', label: 'Alta', color: 'bg-orange-100 text-orange-800', description: 'Entro 24-48 ore' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800', description: 'Immediato' },
];

export default function CreateRequestForClient() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [createNewClient, setCreateNewClient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [assignToProfessional, setAssignToProfessional] = useState(false);
  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    province: '',
    postalCode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      priority: 'MEDIUM',
      createNewClient: false,
    },
  });

  const watchPriority = watch('priority');

  // Query per professionisti (solo quelli abilitati alla sottocategoria)
  const { data: professionalsResponse } = useQuery({
    queryKey: ['professionals', selectedSubcategory],
    queryFn: async () => {
      if (!selectedSubcategory) return [];
      const response = await api.get(`/professionals?subcategoryId=${selectedSubcategory}`);
      return response.data?.data || response.data || [];
    },
    enabled: !!selectedSubcategory && assignToProfessional
  });

  const professionals = Array.isArray(professionalsResponse) ? professionalsResponse : [];

  // Mutation per creare la richiesta
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/requests/for-client', data);
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      toast.success(
        data.newClientCreated 
          ? "Nuovo cliente creato e richiesta assegnata con successo!" 
          : "Richiesta creata con successo per il cliente!"
      );
      navigate('/requests');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Errore nella creazione della richiesta"
      );
    }
  });

  const handleSearchClient = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast.error('Inserisci almeno 2 caratteri per la ricerca');
      return;
    }

    try {
      console.log('Searching for:', searchQuery);
      
      // Chiamata diretta con axios per debug
      const response = await api.get('/users/search', {
        params: {
          query: searchQuery,
          role: 'CLIENT'
        }
      });
      
      console.log('Search response:', response);
      
      // Estrai i dati dalla risposta
      const data = response.data?.data;
      const message = response.data?.message;
      
      console.log('Extracted data:', data);
      console.log('Message:', message);
      
      // Gestisci i diversi tipi di risposta
      if (data === null || data === undefined) {
        toast.error(message || 'Nessun cliente trovato');
        setSelectedClient(null);
        setSearchResults([]);
        return;
      }
      
      // Se è un array di risultati
      if (Array.isArray(data)) {
        if (data.length === 0) {
          toast.error(message || 'Nessun cliente trovato');
          setSelectedClient(null);
          setSearchResults([]);
        } else if (data.length === 1) {
          // Un solo risultato, selezionalo automaticamente
          const client = data[0];
          selectClient(client);
          toast.success(`Cliente trovato: ${client.fullName || client.email}`);
        } else {
          // Più risultati, mostra la lista
          setSearchResults(data);
          toast.success(`Trovati ${data.length} clienti`);
        }
      } 
      // Se è un singolo oggetto
      else if (data && typeof data === 'object' && data.id) {
        selectClient(data);
        toast.success(`Cliente trovato: ${data.fullName || data.email}`);
      } 
      // Caso non previsto
      else {
        console.error('Unexpected data format:', data);
        toast.error('Formato dati non previsto');
      }
      
    } catch (error: any) {
      console.error('Search error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 403) {
        toast.error('Non hai i permessi per effettuare questa ricerca');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Errore durante la ricerca');
      }
      
      setSelectedClient(null);
      setSearchResults([]);
    }
  };

  const selectClient = (client: any) => {
    console.log('Selecting client:', client);
    setSelectedClient(client);
    setSearchResults([]);
    setValue('clientId', client.id);
    clearErrors('clientId');
    
    // Pre-compila l'indirizzo se il cliente ce l'ha
    if (client.address) {
      setAddressData({
        address: client.address || '',
        city: client.city || '',
        province: client.province || '',
        postalCode: client.postalCode || '',
        latitude: undefined,
        longitude: undefined,
      });
      setValue('address', client.address || '');
      setValue('city', client.city || '');
      setValue('province', client.province || '');
      setValue('postalCode', client.postalCode || '');
    }
  };

  const handleAddressChange = (data: any) => {
    setAddressData(data);
    setValue('address', data.address);
    setValue('city', data.city);
    setValue('province', data.province);
    setValue('postalCode', data.postalCode);
    if (data.latitude) setValue('latitude', data.latitude);
    if (data.longitude) setValue('longitude', data.longitude);
  };

  const handleCategoryChange = (selection: { category?: string; subcategory?: string }) => {
    setSelectedCategory(selection.category || '');
    setSelectedSubcategory(selection.subcategory || '');
    setValue('categoryId', selection.category || '');
    setValue('subcategoryId', selection.subcategory || '');
  };

  const onSubmit = (data: RequestFormData) => {
    const payload: any = {
      // Dati richiesta
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      priority: data.priority,
      address: data.address,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      requestedDate: data.requestedDate || null,
      notes: data.notes || null
    };

    // Cliente esistente o nuovo
    if (createNewClient) {
      payload.newClient = {
        email: data.newClientEmail,
        firstName: data.newClientFirstName,
        lastName: data.newClientLastName,
        phone: data.newClientPhone,
        codiceFiscale: data.newClientCodiceFiscale,
      };
    } else if (selectedClient) {
      payload.clientId = selectedClient.id;
    }

    // Assegnazione opzionale
    if (assignToProfessional && data.professionalId) {
      payload.professionalId = data.professionalId;
      payload.assignmentNotes = data.assignmentNotes || null;
    }

    console.log('Submitting payload:', payload);
    createRequestMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Torna alla dashboard
          </button>
          
          <div className="flex items-center">
            <PhoneIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Centralino - Crea Richiesta per Cliente
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Inserisci una richiesta di assistenza per conto di un cliente
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sezione 1: Selezione Cliente */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                1. Seleziona o Crea Cliente
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Ricerca cliente esistente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cerca cliente esistente (email, nome, cognome o telefono)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchClient();
                        }
                      }}
                      disabled={createNewClient}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="es: mario.rossi@email.com, Rossi, 3331234567"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchClient}
                    disabled={!searchQuery || createNewClient}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cerca
                  </button>
                </div>
              </div>

              {/* Lista risultati multipli */}
              {searchResults.length > 0 && (
                <div className="rounded-md bg-blue-50 p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Seleziona un cliente dalla lista:
                  </h3>
                  <div className="space-y-2">
                    {searchResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium">{client.fullName}</div>
                        <div className="text-sm text-gray-600">
                          {client.email} {client.phone && `• ${client.phone}`}
                        </div>
                        {client.address && (
                          <div className="text-xs text-gray-500 mt-1">
                            {client.address}, {client.city} ({client.province})
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cliente trovato */}
              {selectedClient && !createNewClient && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-green-800">
                        Cliente selezionato
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p><strong>{selectedClient.fullName}</strong></p>
                        <p className="flex items-center mt-1">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {selectedClient.email}
                        </p>
                        {selectedClient.phone && (
                          <p className="flex items-center mt-1">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {selectedClient.phone}
                          </p>
                        )}
                        {selectedClient.address && (
                          <p className="flex items-center mt-1">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {selectedClient.address}, {selectedClient.city} ({selectedClient.province})
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null);
                        setValue('clientId', '');
                        setSearchQuery('');
                      }}
                      className="ml-3 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Divider con opzione nuovo cliente */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">oppure</span>
                </div>
              </div>

              {/* Checkbox nuovo cliente */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createNew"
                  checked={createNewClient}
                  onChange={(e) => {
                    setCreateNewClient(e.target.checked);
                    setValue('createNewClient', e.target.checked);
                    if (e.target.checked) {
                      setSelectedClient(null);
                      setValue('clientId', '');
                      setSearchQuery('');
                      setSearchResults([]);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="createNew" className="ml-2 block text-sm text-gray-900 font-medium">
                  <span className="flex items-center">
                    <UserPlusIcon className="h-4 w-4 mr-1" />
                    Crea nuovo cliente
                  </span>
                </label>
              </div>

              {/* Form nuovo cliente */}
              {createNewClient && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        Nome *
                      </label>
                      <input
                        type="text"
                        {...register('newClientFirstName')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {errors.newClientFirstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.newClientFirstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Cognome *
                      </label>
                      <input
                        type="text"
                        {...register('newClientLastName')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {errors.newClientLastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.newClientLastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('newClientEmail')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {errors.newClientEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.newClientEmail.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Telefono
                      </label>
                      <input
                        type="tel"
                        {...register('newClientPhone')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="codiceFiscale" className="block text-sm font-medium text-gray-700">
                        Codice Fiscale
                      </label>
                      <input
                        type="text"
                        {...register('newClientCodiceFiscale')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sezione 2: Dettagli Richiesta (RIORDINATO) */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                2. Dettagli Richiesta
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* PRIMA: Categoria e Sottocategoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria e Sottocategoria *
                </label>
                <CategorySelector
                  value={{ 
                    category: selectedCategory, 
                    subcategory: selectedSubcategory 
                  }}
                  onChange={handleCategoryChange}
                  required
                  onlyWithProfessionals={true} // Mostra solo categorie con professionisti
                />
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
                {errors.subcategoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.subcategoryId.message}</p>
                )}
              </div>

              {/* DOPO: Titolo */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titolo *
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Es: Riparazione impianto elettrico"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Descrizione */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrizione del problema *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Descrivi dettagliatamente il problema o il servizio richiesto..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Priorità */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorità
                </label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {priorityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                        ${watchPriority === option.value 
                          ? 'border-blue-500 ring-2 ring-blue-500' 
                          : 'border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        {...register('priority')}
                        value={option.value}
                        className="sr-only"
                      />
                      <div className="flex flex-1">
                        <div className="flex flex-col">
                          <span className={`block text-sm font-medium ${option.color} px-2 py-1 rounded`}>
                            {option.label}
                          </span>
                          <span className="mt-1 flex items-center text-xs text-gray-500">
                            {option.description}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data richiesta */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700">
                    Data richiesta intervento
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="datetime-local"
                      {...register('requestedDate')}
                      className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <CalendarIcon className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Note aggiuntive
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Informazioni aggiuntive o richieste speciali..."
                />
              </div>
            </div>
          </div>

          {/* Sezione 3: Indirizzo Intervento */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                3. Indirizzo Intervento
              </h2>
            </div>
            
            <div className="p-6">
              <AddressAutocomplete
                value={addressData}
                onChange={handleAddressChange}
                errors={errors}
              />
            </div>
          </div>

          {/* Sezione 4: Assegnazione Professionista (Opzionale) */}
          {selectedSubcategory && (
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  4. Assegnazione Professionista (Opzionale)
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="assignNow"
                    checked={assignToProfessional}
                    onChange={(e) => setAssignToProfessional(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="assignNow" className="ml-2 block text-sm text-gray-900">
                    Assegna subito a un professionista
                  </label>
                </div>

                {assignToProfessional && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <label htmlFor="professionalId" className="block text-sm font-medium text-gray-700">
                        Seleziona professionista
                      </label>
                      <select
                        {...register('professionalId')}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Seleziona...</option>
                        {professionals.map((prof: any) => (
                          <option key={prof.id} value={prof.id}>
                            {prof.fullName} {prof.profession && `- ${prof.profession}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="assignmentNotes" className="block text-sm font-medium text-gray-700">
                        Note per il professionista
                      </label>
                      <textarea
                        {...register('assignmentNotes')}
                        rows={2}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Note specifiche per il professionista..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pulsanti azione */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createRequestMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || createRequestMutation.isPending ? 'Creazione in corso...' : 'Crea Richiesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
