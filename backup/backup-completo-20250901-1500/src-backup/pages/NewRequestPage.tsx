import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
// CORRETTO: Usa l'API service strutturato e il nuovo hook useAuth
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import CategorySelector from '../components/categories/CategorySelector';
// import AddressAutocomplete from '../components/address/AddressAutocomplete';
import AddressGeocoding from '../components/address/AddressGeocoding'; // Nuovo componente che usa Geocoding API

// Form validation schema
const requestSchema = z.object({
  title: z.string().min(5, 'Il titolo deve essere almeno 5 caratteri').max(255),
  description: z.string().min(20, 'La descrizione deve essere almeno 20 caratteri').max(5000),
  categoryId: z.string().min(1, 'Seleziona una categoria'),
  subcategoryId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  address: z.string().min(5, 'Inserisci un indirizzo valido').max(500),
  city: z.string().min(2, 'Inserisci una città valida').max(100),
  province: z.string().length(2, 'La provincia deve essere di 2 caratteri'),
  postalCode: z.string().regex(/^\d{5}$/, 'Il CAP deve essere di 5 cifre'),
  requestedDate: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const priorityOptions = [
  { value: 'LOW', label: 'Bassa', color: 'bg-gray-100 text-gray-800', description: 'Non urgente' },
  { value: 'MEDIUM', label: 'Media', color: 'bg-blue-100 text-blue-800', description: 'Entro qualche giorno' },
  { value: 'HIGH', label: 'Alta', color: 'bg-orange-100 text-orange-800', description: 'Entro 24-48 ore' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800', description: 'Immediato' },
];

export default function NewRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [addressData, setAddressData] = useState({
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    postalCode: user?.postalCode || '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      priority: 'MEDIUM',
      address: addressData.address,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
    },
  });

  const watchPriority = watch('priority');

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

  // CORRETTO: Upload attachments con API service
  const uploadAttachments = async (requestId: string, files: File[]) => {
    if (files.length === 0) return;

    // Usa il metodo uploadAttachment dell'API service per ogni file
    const uploadPromises = files.map(async (file, index) => {
      try {
        const response = await api.requests.uploadAttachment(requestId, file);
        // CORRETTO: Gestisce ResponseFormatter
        return response.data?.data || response.data;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      toast.success(`${files.length} file caricati con successo`);
      return results;
    } catch (error: any) {
      console.error('Error uploading attachments:', error);
      toast.error('Errore durante il caricamento dei file');
      throw error;
    }
  };

  // CORRETTO: Create request mutation con ResponseFormatter
  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      // Step 1: Crea la richiesta
      const response = await api.requests.create(data);
      // CORRETTO: Gestisce ResponseFormatter
      const requestData = response.data?.data || response.data;
      const requestId = requestData?.id || requestData?.request?.id;

      if (!requestId) {
        throw new Error('Request ID not received from server');
      }

      // Step 2: Carica allegati se presenti
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        try {
          await uploadAttachments(requestId, selectedFiles);
        } catch (uploadError) {
          // Log error but don't fail the entire request
          console.error('Error uploading files:', uploadError);
          toast.error('La richiesta è stata creata ma alcuni file non sono stati caricati');
        } finally {
          setIsUploading(false);
        }
      }

      return { id: requestId, ...requestData };
    },
    onSuccess: async (data, variables, context) => {
      // CORRETTO: Non usiamo responseData perché non è disponibile con l'API service
      toast.success('Richiesta creata con successo!', {
        duration: 5000,
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      });
      
      // Invalidate multiple queries to ensure data is fresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['requests'] }),
        queryClient.invalidateQueries({ queryKey: ['request', data.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-requests'] }),
      ]);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        navigate(`/requests/${data.id}`);
      }, 100);
    },
    onError: (error: any) => {
      // CORRETTO: Gestisce errori ResponseFormatter
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          error.message || 
                          'Errore durante la creazione della richiesta';
      toast.error(errorMessage);
      console.error('Request creation error:', error);
    },
  });

  const onSubmit = (data: RequestFormData) => {
    // Debug: log what we're sending
    console.log('Form data before processing:', data);
    console.log('Selected category:', selectedCategory);
    console.log('Selected subcategory:', selectedSubcategory);
    
    // Validate category selection
    if (!selectedCategory) {
      toast.error('Seleziona una categoria');
      return;
    }

    // Set category and subcategory from the selector
    data.categoryId = selectedCategory;
    data.subcategoryId = selectedSubcategory || undefined;
    
    // Debug: log final data
    console.log('Final data being sent:', data);
    
    // Add address data with coordinates
    data.address = addressData.address;
    data.city = addressData.city;
    data.province = addressData.province;
    data.postalCode = addressData.postalCode;
    data.latitude = addressData.latitude;
    data.longitude = addressData.longitude;
    
    // Transform requestedDate to ISO format if present
    if (data.requestedDate) {
      data.requestedDate = new Date(data.requestedDate).toISOString();
    }
    
    createRequestMutation.mutate(data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} è troppo grande (max 10MB)`);
        return false;
      }
      // Check file type
      const validTypes = [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} non è un tipo di file supportato`);
        return false;
      }
      return true;
    });

    // Check total files limit
    if (selectedFiles.length + validFiles.length > 5) {
      toast.error('Massimo 5 file per richiesta');
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Clear the input to allow re-selecting the same file
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/requests')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Torna alle richieste
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nuova Richiesta di Assistenza</h1>
          <p className="mt-2 text-gray-600">
            Compila il modulo per richiedere assistenza da un professionista qualificato
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            {/* Title and Description */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titolo della richiesta *
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Es: Riparazione perdita rubinetto cucina"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Inserisci un titolo breve e descrittivo (minimo 5 caratteri)
                </p>
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrizione dettagliata *
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Descrivi il problema in dettaglio: quando è iniziato, cosa hai già provato, quali sono i sintomi..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Fornisci tutti i dettagli utili al professionista (minimo 20 caratteri). Più informazioni dai, migliore sarà il preventivo.
                </p>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Category and Priority */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categoria e Priorità</h3>
            
            <div className="space-y-6">
              {/* Category Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria del servizio *
                </label>
                <CategorySelector
                  value={{ category: selectedCategory, subcategory: selectedSubcategory }}
                  onChange={({ category, subcategory }) => {
                    setSelectedCategory(category || '');
                    setSelectedSubcategory(subcategory || '');
                    setValue('categoryId', category || '');
                    setValue('subcategoryId', subcategory || '');
                  }}
                />
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorità *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {priorityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        relative flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all
                        ${watchPriority === option.value 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        {...register('priority')}
                        value={option.value}
                        className="sr-only"
                      />
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${option.color}`}>
                        {option.label}
                      </span>
                      <span className="mt-1 text-xs text-gray-500 text-center">
                        {option.description}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location with Address Autocomplete */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <MapPinIcon className="h-5 w-5 inline mr-2" />
              Indirizzo dell'intervento
            </h3>
            
            <AddressGeocoding 
              value={addressData}
              onChange={handleAddressChange}
              errors={errors}
            />
            
            <div className="mt-4">
              <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700">
                Data preferita
                <span className="text-xs text-gray-500 ml-1">(opzionale)</span>
              </label>
              <input
                type="datetime-local"
                id="requestedDate"
                {...register('requestedDate')}
                min={new Date().toISOString().slice(0, 16)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Seleziona quando preferiresti ricevere l'intervento. Il professionista confermerà la disponibilità.
              </p>
              {errors.requestedDate && (
                <p className="mt-1 text-sm text-red-600">{errors.requestedDate.message}</p>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informazioni Aggiuntive</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Note aggiuntive
                  <span className="text-xs text-gray-500 ml-1">(opzionale)</span>
                </label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Informazioni aggiuntive utili per il professionista (es: orari preferiti, istruzioni accesso, codice cancello, piano, animali domestici...)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Aggiungi dettagli che potrebbero aiutare il professionista: accesso all'abitazione, presenza di animali, orari preferiti, parcheggio disponibile, ecc.
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CloudArrowUpIcon className="h-5 w-5 inline mr-1" />
                  Allegati 
                  <span className="text-xs text-gray-500 ml-1">(max 5 file, 10MB ciascuno)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Carica foto del problema, preventivi precedenti, schemi tecnici o qualsiasi documento utile. Formati accettati: JPG, PNG, PDF, DOC.
                </p>
                
                {selectedFiles.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center flex-1">
                          {file.type.startsWith('image/') ? (
                            <PhotoIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                          ) : (
                            <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFiles.length < 5 && (
                  <label className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <span className="relative font-medium text-blue-600 hover:text-blue-500">
                          Carica file
                        </span>
                        <p className="pl-1">o trascina qui</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, PDF, DOC fino a 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress.total && (
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="flex items-center">
                <CloudArrowUpIcon className="h-5 w-5 text-blue-500 mr-2 animate-pulse" />
                <span className="text-sm text-gray-600">Caricamento file in corso...</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.total}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/requests')}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createRequestMutation.isPending || isUploading}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || createRequestMutation.isPending || isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isUploading ? 'Caricamento file...' : 'Creazione in corso...'}
                </span>
              ) : (
                'Crea Richiesta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}