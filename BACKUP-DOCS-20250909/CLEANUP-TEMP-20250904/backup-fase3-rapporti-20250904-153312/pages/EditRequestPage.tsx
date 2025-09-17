import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
// import AddressAutocomplete from '../components/address/AddressAutocomplete';
import AddressGeocoding from '../components/address/AddressGeocoding';

// Schema di validazione
const requestSchema = z.object({
  title: z.string().min(3, 'Il titolo deve essere lungo almeno 3 caratteri'),
  description: z.string().min(10, 'La descrizione deve essere lunga almeno 10 caratteri'),
  categoryId: z.string().min(1, 'Seleziona una categoria'),
  subcategoryId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  address: z.string().min(5, 'Inserisci un indirizzo valido'),
  city: z.string().min(2, 'Inserisci una città valida'),
  province: z.string().length(2, 'La provincia deve essere di 2 caratteri'),
  postalCode: z.string().regex(/^\d{5}$/, 'Il CAP deve essere di 5 cifre'),
  requestedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  // Campi aggiuntivi per admin/professional
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  professionalId: z.string().optional().nullable(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const statusOptions = [
  { value: 'PENDING', label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ASSIGNED', label: 'Assegnata', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_PROGRESS', label: 'In Corso', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'COMPLETED', label: 'Completata', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Annullata', color: 'bg-red-100 text-red-800' },
];

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [hasChangedStatus, setHasChangedStatus] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<string>('');
  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    province: '',
    postalCode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const watchedCategoryId = watch('categoryId');
  const watchedStatus = watch('status');

  // Check user role
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isProfessional = user?.role === 'PROFESSIONAL';
  const isClient = user?.role === 'CLIENT';

  // Fetch request details
  const { data: request, isLoading: isLoadingRequest, error } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const response = await api.get(`/requests/${id}`);
      return response.data.request || response.data.data || response.data;
    },
    enabled: !!id,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data?.categories || response.data.categories || [];
    },
  });

  // Fetch subcategories based on selected category
  const { data: subcategoriesData } = useQuery({
    queryKey: ['subcategories', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      
      // Validate that selectedCategoryId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(selectedCategoryId)) {
        console.warn('Invalid category ID format:', selectedCategoryId);
        return [];
      }
      
      try {
        const response = await api.get('/subcategories', {
          params: {
            categoryId: selectedCategoryId,
            isActive: 'true'
          }
        });
        return response.data.data?.subcategories || response.data.subcategories || [];
      } catch (error: any) {
        // Only log error if it's not a 404 (category not found is expected sometimes)
        if (error.response?.status !== 404) {
          console.error('Error fetching subcategories:', error);
        }
        return [];
      }
    },
    enabled: !!selectedCategoryId,
  });

  // Fetch professionals (for admin assignment)
  const { data: professionalsData } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      if (!isAdmin) return [];
      try {
        const response = await api.get('/users', {
          params: { role: 'PROFESSIONAL' }
        });
        return response.data.data?.users || response.data.users || [];
      } catch (error) {
        console.error('Error fetching professionals:', error);
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const payload: any = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        priority: data.priority,
        address: data.address,
        city: data.city,
        province: data.province.toUpperCase(),
        postalCode: data.postalCode,
      };

      // Add optional fields
      if (data.subcategoryId && data.subcategoryId !== '') {
        payload.subcategoryId = data.subcategoryId;
      }
      
      if (data.notes && data.notes !== '') {
        payload.notes = data.notes;
      }
      
      if (data.requestedDate && data.requestedDate !== '') {
        payload.requestedDate = new Date(data.requestedDate).toISOString();
      }
      
      // Add coordinates if available
      if (data.latitude && data.longitude) {
        payload.latitude = data.latitude;
        payload.longitude = data.longitude;
      }

      // Admin/Professional specific fields
      if (isAdmin || isProfessional) {
        if (data.status) {
          payload.status = data.status;
        }
        if (isAdmin && data.professionalId) {
          payload.professionalId = data.professionalId;
        }
      }

      console.log('Sending update payload:', payload);
      
      const response = await api.put(`/requests/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      // Notifica di successo con icona
      toast.success(
        <div className="flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span>Richiesta aggiornata con successo</span>
        </div>,
        { duration: 4000 }
      );

      // Se lo stato è cambiato, notifica speciale
      if (hasChangedStatus && watchedStatus !== originalStatus) {
        toast(
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-blue-500" />
            <span>Notifica inviata al cliente per il cambio di stato</span>
          </div>,
          { 
            duration: 5000,
            icon: '📧'
          }
        );
      }

      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      
      // Piccolo delay per permettere all'utente di vedere le notifiche
      setTimeout(() => {
        navigate(`/requests/${id}`);
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Update error:', error.response?.data);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Errore durante l\'aggiornamento';
      toast.error(errorMessage);
    },
  });

  // Track status changes
  useEffect(() => {
    if (watchedStatus && originalStatus && watchedStatus !== originalStatus) {
      setHasChangedStatus(true);
    } else {
      setHasChangedStatus(false);
    }
  }, [watchedStatus, originalStatus]);

  // Update selected category when form value changes
  useEffect(() => {
    if (watchedCategoryId) {
      setSelectedCategoryId(watchedCategoryId);
    }
  }, [watchedCategoryId]);

  // Populate form with existing data
  useEffect(() => {
    if (request && categoriesData) {
      let categoryId = '';
      
      // First priority: use categoryId if available
      if (request.categoryId) {
        // Verify the categoryId exists in our categories
        const categoryExists = categoriesData.find((cat: any) => cat.id === request.categoryId);
        if (categoryExists) {
          categoryId = request.categoryId;
        }
      } 
      // Second priority: check if category is an object with id
      else if (request.category && typeof request.category === 'object' && request.category.id) {
        const categoryExists = categoriesData.find((cat: any) => cat.id === request.category.id);
        if (categoryExists) {
          categoryId = request.category.id;
        }
      } 
      // Third priority: category is a string (slug or name)
      else if (request.category && typeof request.category === 'string') {
        // Try to match by slug first, then by name
        const category = categoriesData.find((cat: any) => 
          cat.slug === request.category || cat.name === request.category
        );
        if (category) {
          categoryId = category.id;
        }
      }
      
      // Only set categoryId if it's valid
      if (categoryId) {
        setSelectedCategoryId(categoryId);
      } else {
        console.warn('Could not find valid category for request:', {
          requestCategory: request.category,
          requestCategoryId: request.categoryId,
          availableCategories: categoriesData.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))
        });
      }
      
      setOriginalStatus(request.status || 'PENDING');
      
      let formattedDate = '';
      if (request.requestedDate) {
        try {
          formattedDate = format(new Date(request.requestedDate), "yyyy-MM-dd'T'HH:mm");
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      
      // Update address data state
      setAddressData({
        address: request.address || '',
        city: request.city || '',
        province: request.province || '',
        postalCode: request.postalCode || '',
        latitude: request.latitude || undefined,
        longitude: request.longitude || undefined,
      });
      
      reset({
        title: request.title || '',
        description: request.description || '',
        categoryId: categoryId,
        subcategoryId: request.subcategoryId || request.subcategory?.id || '',
        priority: request.priority || 'MEDIUM',
        address: request.address || '',
        city: request.city || '',
        province: request.province || '',
        postalCode: request.postalCode || '',
        requestedDate: formattedDate,
        notes: request.notes || '',
        status: request.status || 'PENDING',
        professionalId: request.professionalId || '',
        latitude: request.latitude || null,
        longitude: request.longitude || null,
      });
    }
  }, [request, categoriesData, reset]);

  // Check permissions
  const canEditBasicInfo = isAdmin || (isClient && request?.status === 'PENDING');
  const canEditStatus = isAdmin || (isProfessional && request?.professionalId === user?.id);
  const canAssignProfessional = isAdmin;

  if (isLoadingRequest) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900">Errore nel caricamento</h3>
          <p className="text-red-700 mt-2">Impossibile caricare i dettagli della richiesta</p>
          <button
            onClick={() => navigate('/requests')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Torna alle richieste
          </button>
        </div>
      </div>
    );
  }

  if (!canEditBasicInfo && !canEditStatus) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-900">Non autorizzato</h3>
          <p className="text-yellow-700 mt-2">Non hai i permessi per modificare questa richiesta</p>
          <button
            onClick={() => navigate(`/requests/${id}`)}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Torna ai dettagli
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = (data: RequestFormData) => {
    // Include updated address data with coordinates
    const updatedData = {
      ...data,
      address: addressData.address,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
      latitude: addressData.latitude || null,
      longitude: addressData.longitude || null,
    };
    updateMutation.mutate(updatedData);
  };
  
  // Handle address change from autocomplete
  const handleAddressChange = (newAddressData: typeof addressData) => {
    setAddressData(newAddressData);
    // Update form values
    setValue('address', newAddressData.address);
    setValue('city', newAddressData.city);
    setValue('province', newAddressData.province);
    setValue('postalCode', newAddressData.postalCode);
    if (newAddressData.latitude) setValue('latitude', newAddressData.latitude);
    if (newAddressData.longitude) setValue('longitude', newAddressData.longitude);
  };

  const categories = categoriesData || [];
  const subcategories = subcategoriesData || [];
  const professionals = professionalsData || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/requests/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Torna ai dettagli
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Modifica Richiesta</h1>
        <p className="text-gray-600 mt-2">
          {isAdmin ? 'Modifica tutti i dettagli della richiesta' : 
           isProfessional ? 'Aggiorna lo stato della richiesta' :
           'Aggiorna i dettagli della tua richiesta di assistenza'}
        </p>
      </div>

      {/* Status change notification */}
      {hasChangedStatus && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <BellIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Stai cambiando lo stato della richiesta
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Il cliente riceverà una notifica automatica del cambio di stato
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Admin/Professional Status Management */}
        {canEditStatus && (
          <div className="bg-white shadow-sm rounded-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gestione Stato e Assegnazione
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Stato Richiesta
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {watchedStatus !== originalStatus && (
                  <p className="mt-1 text-sm text-blue-600 flex items-center">
                    <BellIcon className="h-4 w-4 mr-1" />
                    Notifica verrà inviata
                  </p>
                )}
              </div>

              {/* Professional Assignment (Admin only) */}
              {canAssignProfessional && (
                <div>
                  <label htmlFor="professionalId" className="block text-sm font-medium text-gray-700">
                    Professionista Assegnato
                  </label>
                  <select
                    id="professionalId"
                    {...register('professionalId')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  >
                    <option value="">Nessuno (non assegnato)</option>
                    {professionals.map((prof: any) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.firstName} {prof.lastName} 
                        {prof.profession && ` - ${prof.profession}`}
                      </option>
                    ))}
                  </select>
                  {request?.professionalId !== watch('professionalId') && watch('professionalId') && (
                    <p className="mt-1 text-sm text-blue-600 flex items-center">
                      <BellIcon className="h-4 w-4 mr-1" />
                      Il professionista riceverà una notifica
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Informazioni Richiesta
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {/* Titolo */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Titolo *
              </label>
              <input
                type="text"
                id="title"
                {...register('title')}
                disabled={!canEditBasicInfo}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border disabled:bg-gray-100"
                placeholder="Es: Perdita rubinetto cucina"
              />
              <p className="mt-1 text-sm text-gray-500">
                Descrivi in poche parole il problema principale
              </p>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Descrizione */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrizione dettagliata *
              </label>
              <textarea
                id="description"
                {...register('description')}
                disabled={!canEditBasicInfo}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border disabled:bg-gray-100"
                placeholder="Es: Il rubinetto della cucina perde acqua dalla base quando aperto. Il problema è iniziato 3 giorni fa..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Includi: quando è iniziato il problema, frequenza, già tentate soluzioni
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Categoria e Sottocategoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                  Categoria *
                </label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  disabled={!canEditBasicInfo}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border disabled:bg-gray-100"
                >
                  <option value="">-- Seleziona tipo di servizio --</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Scegli il tipo di professionista di cui hai bisogno
                </p>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700">
                  Sottocategoria
                </label>
                <select
                  id="subcategoryId"
                  {...register('subcategoryId')}
                  disabled={!canEditBasicInfo || !selectedCategoryId || subcategories.length === 0}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border disabled:bg-gray-100"
                >
                  <option value="">-- Specifica il tipo di intervento (opzionale) --</option>
                  {subcategories.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Dettaglio specifico del servizio richiesto
                </p>
              </div>
            </div>

            {/* Priorità */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priorità *
              </label>
              <select
                id="priority"
                {...register('priority')}
                disabled={!canEditBasicInfo}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border disabled:bg-gray-100"
              >
                <option value="LOW">Bassa - Posso aspettare</option>
                <option value="MEDIUM">Media - Entro la settimana</option>
                <option value="HIGH">Alta - Entro 2-3 giorni</option>
                <option value="URGENT">Urgente - Entro 24 ore</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Indica quanto è urgente il tuo intervento
              </p>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            {/* Data richiesta */}
            <div>
              <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700">
                Data e ora preferita per l'intervento
              </label>
              <div className="mt-1 relative">
                <input
                  type="datetime-local"
                  id="requestedDate"
                  {...register('requestedDate')}
                  disabled={!canEditBasicInfo}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border disabled:bg-gray-100"
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Seleziona quando preferisci ricevere l'intervento (facoltativo)
              </p>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Note aggiuntive
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                disabled={!canEditBasicInfo}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border disabled:bg-gray-100"
                placeholder="Es: Il cane è in casa la mattina, citofono secondo piano, parcheggio disponibile nel cortile..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Aggiungi dettagli su: accesso all'abitazione, presenza animali, orari preferiti, parcheggio
              </p>
            </div>
          </div>
        </div>

        {/* Indirizzo */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2" />
            Luogo dell'intervento
          </h2>

          {canEditBasicInfo ? (
            <AddressGeocoding
              value={addressData}
              onChange={handleAddressChange}
              errors={errors}
            />
          ) : (
            // Read-only view when editing is disabled
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Indirizzo</label>
                <p className="mt-1 px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                  {addressData.address || 'Non specificato'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Città</label>
                  <p className="mt-1 px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                    {addressData.city || 'Non specificata'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provincia</label>
                  <p className="mt-1 px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                    {addressData.province || 'Non specificata'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CAP</label>
                  <p className="mt-1 px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                    {addressData.postalCode || 'Non specificato'}
                  </p>
                </div>
              </div>
              {addressData.latitude && addressData.longitude && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Indirizzo verificato con coordinate GPS
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(`/requests/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          
          <div className="flex items-center space-x-4">
            {isDirty && (
              <span className="text-sm text-gray-500 italic">
                Hai modifiche non salvate
              </span>
            )}
            <button
              type="submit"
              disabled={isSubmitting || (!canEditBasicInfo && !canEditStatus)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvataggio...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Salva modifiche
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
