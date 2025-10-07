import { AiChatComplete } from "@/components/ai/AiChatComplete";
import ScheduleIntervention from '../components/professional/ScheduleIntervention';
import ProposeInterventions from '../components/professional/ProposeInterventions';
import ScheduledInterventions from '../components/interventions/ScheduledInterventions';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  TagIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { RequestMap } from '../components/maps/RequestMap';
import { AutoTravelInfo } from '../components/travel/AutoTravelInfo'; // Componente professionale con calcolo distanze e costi
import RequestChat from '../components/chat/RequestChat';

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  category: string | {
    id: string;
    name: string;
    color: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
  status: string;
  priority: string;
  clientId: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    province?: string;
  };
  professionalId?: string;
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profession?: string;
    professionData?: {
      id: string;
      name: string;
    };
  };
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  requestedDate?: string;
  assignedDate?: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  quotes?: any[];
  attachments?: any[];
}

const statusConfig = {
  PENDING: {
    label: 'In Attesa',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: ClockIcon,
  },
  pending: {
    label: 'In Attesa',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: ClockIcon,
  },
  ASSIGNED: {
    label: 'Assegnata',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: UserIcon,
  },
  assigned: {
    label: 'Assegnata',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: UserIcon,
  },
  IN_PROGRESS: {
    label: 'In Corso',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: ClockIcon,
  },
  in_progress: {
    label: 'In Corso',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: ClockIcon,
  },
  COMPLETED: {
    label: 'Completata',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircleIcon,
  },
  completed: {
    label: 'Completata',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircleIcon,
  },
  CANCELLED: {
    label: 'Annullata',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircleIcon,
  },
  cancelled: {
    label: 'Annullata',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircleIcon,
  },
};

const priorityConfig = {
  LOW: {
    label: 'Bassa',
    color: 'bg-gray-100 text-gray-800',
  },
  low: {
    label: 'Bassa',
    color: 'bg-gray-100 text-gray-800',
  },
  MEDIUM: {
    label: 'Media',
    color: 'bg-blue-100 text-blue-800',
  },
  medium: {
    label: 'Media',
    color: 'bg-blue-100 text-blue-800',
  },
  HIGH: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800',
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800',
  },
  URGENT: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-800',
  },
  urgent: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-800',
  },
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingAttempted, setGeocodingAttempted] = useState(false);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [showProposeInterventions, setShowProposeInterventions] = useState(false);
  const [suggestedMessage, setSuggestedMessage] = useState<string>('');

  // Effetto per aprire automaticamente la chat se c'è il parametro openChat nell'URL
  useEffect(() => {
    const openChat = searchParams.get('openChat');
    const reason = searchParams.get('reason');
    
    if (openChat === 'true') {
      // Prepara un messaggio suggerito basato sul motivo
      if (reason === 'intervention') {
        setSuggestedMessage('Buongiorno, ho visto la data proposta per l\'intervento. Vorrei proporre una data alternativa perché...');
      } else if (reason === 'quote') {
        setSuggestedMessage('Buongiorno, ho ricevuto il preventivo. Vorrei chiarire alcuni punti prima di accettarlo...');
      }
      
      setShowChat(true);
      
      // Rimuovi i parametri dall'URL dopo aver aperto la chat
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('openChat');
      newSearchParams.delete('reason');
      const newSearch = newSearchParams.toString();
      navigate(`/requests/${id}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }
  }, [searchParams, id, navigate]);

  // Fetch request details
  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const response = await api.get(`/requests/${id}`);
      console.log('Raw API response:', response.data);
      return response.data;
    },
    enabled: !!id,
  });

  // Extract request from response data - CORRETTA LOGICA
  let request = null;
  
  console.log("Debug - responseData structure:", responseData ? Object.keys(responseData) : "no responseData");
  
  if (responseData?.data?.request) {
    // Case: {data: {request: {actual_data}}} - QUESTA È LA STRUTTURA CORRETTA!
    request = responseData.data.request;
    console.log("Extracted from: responseData.data.request");
  } else if (responseData?.request?.request) {
    // Case: {request: {request: {actual_data}}}
    request = responseData.request.request;
    console.log("Extracted from: responseData.request.request");
  } else if (responseData?.request) {
    // Case: {request: {actual_data}}
    request = responseData.request;
    console.log("Extracted from: responseData.request");
  } else if (responseData?.data) {
    // Case: {data: {actual_data}}
    request = responseData.data;
    console.log("Extracted from: responseData.data");
  } else if (responseData && !responseData.success && !responseData.message) {
    // Case: direct object without wrapper
    request = responseData;
    console.log("Extracted from: responseData directly");
  }

  console.log("RequestDetailPage - Raw request data:", request);
  console.log("RequestDetailPage - Request status:", request?.status);
  console.log("RequestDetailPage - Request keys:", request ? Object.keys(request) : "no request");
  if (request) {
    console.log("RequestDetailPage - Full request object:", JSON.stringify(request, null, 2));
  }

  // Fetch professionals for subcategory
  const { data: professionalsData } = useQuery({
    queryKey: ['subcategory-professionals', request?.subcategory?.id],
    queryFn: async () => {
      if (!request?.subcategory?.id) return [];
      console.log('🔍 Fetching professionals for subcategory:', request.subcategory.id);
      const response = await api.get(`/subcategories/${request.subcategory.id}/professionals`);
      console.log('👥 Professionals response:', response.data);
      return response.data?.data?.professionals || response.data?.professionals || [];
    },
    enabled: !!request?.subcategory?.id && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && !request?.professionalId
  });

  // Assign professional mutation
  const assignProfessionalMutation = useMutation({
    mutationFn: async (data: { professionalId: string; notes?: string }) => {
      await api.post(`/requests/${id}/assign`, data);
    },
    onSuccess: () => {
      toast.success('Richiesta assegnata con successo!');
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      setSelectedProfessional('');
      setAssignmentNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'assegnazione');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      // Se stiamo assegnando e c'è un professionista selezionato, usa l'endpoint di assegnazione
      if (newStatus === 'ASSIGNED' && selectedProfessional && !request?.professionalId) {
        await assignProfessionalMutation.mutateAsync({
          professionalId: selectedProfessional,
          notes: assignmentNotes
        });
      } else {
        // Altrimenti usa l'endpoint di aggiornamento stato (che non esiste ancora, quindi dobbiamo crearlo)
        await api.patch(`/requests/${id}`, { status: newStatus });
      }
    },
    onSuccess: () => {
      toast.success('Stato aggiornato con successo');
      queryClient.invalidateQueries({ queryKey: ['request', id] });
    },
    onError: () => {
      toast.error('Errore durante l\'aggiornamento dello stato');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/requests/${id}`);
    },
    onSuccess: () => {
      toast.success('Richiesta eliminata con successo');
      navigate('/requests');
    },
    onError: () => {
      toast.error('Errore durante l\'eliminazione');
    },
  });

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/requests/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `richiesta-${id ? id.slice(0, 8) : 'unknown'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF scaricato con successo');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Errore durante il download del PDF');
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('File scaricato con successo');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Errore durante il download del file');
    }
  };

  // Geocode the address when map opens if coordinates are not available
  useEffect(() => {
    // Se la mappa è aperta e abbiamo la richiesta ma non le coordinate
    if (showMapModal && request && !request.latitude && !request.longitude && !isGeocoding) {
      console.log('🗺️ Starting geocoding for:', request.address, request.city);
      setIsGeocoding(true);
      
      const fullAddress = `${request.address}, ${request.city}, ${request.province} ${request.postalCode}, Italia`;
      console.log('📍 Full address for geocoding:', fullAddress);
      
      // Call the geocoding API
      api.get(`/maps/geocode`, {
        params: { address: fullAddress }
      })
        .then(response => {
          console.log('✅ Geocoding response:', response.data);
          if (response.data && response.data.latitude && response.data.longitude) {
            const newCoords = {
              lat: response.data.latitude,
              lng: response.data.longitude
            };
            setCoordinates(newCoords);
            console.log('📌 Coordinates set:', newCoords);
            
            // Save coordinates to database
            return api.patch(`/requests/${id}/coordinates`, {
              latitude: response.data.latitude,
              longitude: response.data.longitude
            });
          } else {
            console.error('❌ Geocoding failed: No coordinates in response');
            toast.error('Impossibile trovare le coordinate per questo indirizzo');
            return Promise.reject('No coordinates');
          }
        })
        .then((saveResponse) => {
          if (saveResponse) {
            console.log('💾 Coordinates saved to database');
            // Refresh request data
            queryClient.invalidateQueries({ queryKey: ['request', id] });
          }
        })
        .catch(err => {
          console.error('❌ Geocoding/Save error:', err);
          if (err.response?.data?.error) {
            toast.error(`Errore: ${err.response.data.error}`);
          } else if (err !== 'No coordinates' && (!err.response?.status || err.response.status !== 429)) {
            toast.error('Impossibile ottenere le coordinate dell\'indirizzo');
          }
        })
        .finally(() => {
          setIsGeocoding(false);
          console.log('🏁 Geocoding process completed');
        });
    }
  }, [showMapModal, request?.address]); // Dependencies semplificate

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  // Get status and priority config with fallback
  const statusData = statusConfig[request.status] || statusConfig[request.status?.toLowerCase()] || statusConfig['pending'];
  const priorityData = priorityConfig[request.priority] || priorityConfig[request.priority?.toLowerCase()] || priorityConfig['medium'];
  const StatusIcon = statusData.icon;
  
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT' && request.clientId === user?.id;
  const isProfessional = user?.role === 'PROFESSIONAL' && request.professionalId === user?.id;
  const canEdit = isAdmin || (isClient && (request.status === 'PENDING' || request.status === 'pending'));
  const canDelete = isAdmin || (isClient && request.status !== 'IN_PROGRESS' && request.status !== 'in_progress' && request.status !== 'COMPLETED' && request.status !== 'completed');

  const handleDelete = () => {
    if (window.confirm(`Sei sicuro di voler eliminare la richiesta "${request.title}"?`)) {
      deleteMutation.mutate();
    }
  };

  // Get category name - handle both string and object format
  const categoryName = typeof request.category === 'string' ? request.category : request.category?.name;

  // RIMOSSO IL WRAPPER GoogleMapsProvider - ora è globale in App.tsx
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/requests')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Torna alle richieste
        </button>
        
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-4">
            <h1 className="text-2xl font-bold text-gray-900 truncate" title={request.title}>
              {request.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusData.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusData.label}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${priorityData.color}`}>
                {priorityData.label}
              </span>
              {/* Categoria e Sottocategoria */}
              {(categoryName || request.subcategory) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                  <TagIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-[150px]" title={categoryName}>
                    {categoryName || 'Non categorizzato'}
                  </span>
                  {request.subcategory && (
                    <>
                      <span className="text-purple-600">/</span>
                      <span className="truncate max-w-[150px]" title={request.subcategory.name}>
                        {request.subcategory.name}
                      </span>
                    </>
                  )}
                </span>
              )}
              <span className="text-gray-500 text-xs whitespace-nowrap">
                #{request.id ? request.id.slice(0, 8) : 'N/A'}
              </span>
            </div>
          </div>
          
          {(canEdit || isAdmin || isProfessional || isClient) && (
            <div className="flex space-x-2">
              
              {/* NUOVO: Pulsante Crea Rapporto Intervento - Solo per professionista assegnato */}
              {isProfessional && request.professionalId === user?.id && (
                <button
                  onClick={() => navigate(`/professional/reports/new?requestId=${request.id}`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                  Rapporto
                </button>
              )}
              
              {/* Pulsante Chat - sempre visibile per tutti gli utenti autorizzati */}
              <button
                onClick={() => setShowChat(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Chat
              </button>
              
              {/* Pulsante AI Assistant */}
              <button
                onClick={() => setShowAiChat(!showAiChat)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                AI
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                PDF
              </button>
              
              {canEdit && (
                <>
                  <button
                    onClick={() => navigate(`/requests/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Modifica
                  </button>
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                    >
                      <TrashIcon className="h-5 w-5 mr-2" />
                      Elimina
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrizione</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            
            {request.notes && (
              <>
                <h3 className="text-md font-semibold text-gray-900 mt-6 mb-2">Note</h3>
                <p className="text-gray-600">{request.notes}</p>
              </>
            )}
            
            {/* Note Pubbliche del Professionista - NUOVO! */}
            {request.publicNotes && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-md font-semibold text-blue-900 mb-2">
                  📝 Comunicazioni del Professionista
                </h3>
                <p className="text-blue-800 whitespace-pre-wrap">{request.publicNotes}</p>
              </div>
            )}
            
            {/* Data Intervento Programmato - NUOVO! */}
            {request.scheduledDate && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-md font-semibold text-green-900 mb-2">
                  📅 Intervento Programmato
                </h3>
                <p className="text-green-800">
                  {format(new Date(request.scheduledDate), 'EEEE d MMMM yyyy', { locale: it })}
                </p>
                <p className="text-green-700 text-lg font-medium">
                  Ore: {format(new Date(request.scheduledDate), 'HH:mm', { locale: it })}
                </p>
              </div>
            )}
          </div>

          {/* NUOVO: Sistema Interventi Multipli Programmati */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📅 Interventi Programmati
              </h2>
              {isProfessional && (
                <button
                  onClick={() => setShowProposeInterventions(true)}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Proponi Date
                </button>
              )}
            </div>
            
            <ScheduledInterventions
              requestId={request.id}
              userRole={user?.role as 'CLIENT' | 'PROFESSIONAL' | 'ADMIN'}
              userId={user?.id || ''}
            />
          </div>

          {/* Location - RISOLTO: Rimosso pulsante duplicato e integrato AutoTravelInfo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubicazione</h2>
            
            {/* Indirizzo */}
            <div className="flex items-start mb-4">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-gray-900">{request.address}</p>
                <p className="text-gray-600">
                  {request.city}, {request.province} {request.postalCode}
                </p>
              </div>
            </div>
            
            {/* AutoTravelInfo - Sistema professionale con calcolo distanze e costi */}
            {isProfessional && (
              <div className="mt-4 pt-4 border-t">
                <AutoTravelInfo
                  requestId={id || ''}
                  requestAddress={`${request.address}, ${request.city}, ${request.province} ${request.postalCode}`}
                  onOpenMap={() => setShowMapModal(true)}
                  onOpenItinerary={async () => {
                    try {
                      // Recupera l'indirizzo di lavoro del professionista
                      const response = await api.get('/travel/work-address');
                      const workAddress = response.data.data;
                      
                      const destination = `${request.address}, ${request.city}, ${request.province} ${request.postalCode}`;
                      let mapsUrl = '';
                      
                      if (workAddress && (workAddress.workAddress || workAddress.address)) {
                        // Se abbiamo l'indirizzo di lavoro, usalo come origine
                        const origin = workAddress.workAddress 
                          ? `${workAddress.workAddress}, ${workAddress.workCity}, ${workAddress.workProvince} ${workAddress.workPostalCode}`
                          : `${workAddress.address}, ${workAddress.city}, ${workAddress.province} ${workAddress.postalCode}`;
                        
                        mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}/data=!4m2!4m1!3e0`;
                      } else {
                        // Altrimenti usa solo la destinazione (Google userà la posizione attuale)
                        mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                      }
                      
                      window.open(mapsUrl, '_blank');
                    } catch (error) {
                      console.error('Error getting work address:', error);
                      // Fallback: apri solo con la destinazione
                      const destination = `${request.address}, ${request.city}, ${request.province} ${request.postalCode}`;
                      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                      window.open(mapsUrl, '_blank');
                    }
                  }}
                />
              </div>
            )}
            
            {/* Pulsante Mostra Mappa solo per clienti e admin */}
            {!isProfessional && (
              <div className="mt-4">
                <button
                  onClick={() => setShowMapModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Mostra Mappa
                </button>
              </div>
            )}
          </div>

          {/* Quotes Section - SEMPRE VISIBILE */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Preventivi {request.quotes && request.quotes.length > 0 ? `(${request.quotes.length})` : '(0)'}
              </h2>
              {isProfessional && (
                <button
                  onClick={() => navigate(`/quotes/new/${request.id}`)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nuovo Preventivo
                </button>
              )}
            </div>
            
            {request.quotes && request.quotes.length > 0 ? (
              <div className="space-y-3">
                {request.quotes.map((quote: any) => (
                  <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                       onClick={() => navigate(`/quotes/${quote.id}`)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{quote.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{quote.description}</p>
                        {quote.professional && (
                          <p className="text-sm text-gray-500 mt-2">
                            Da: {quote.professional.firstName} {quote.professional.lastName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          €{(quote.amount / 100).toFixed(2)}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                          quote.status === 'accepted' || quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          quote.status === 'rejected' || quote.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {quote.status === 'accepted' || quote.status === 'ACCEPTED' ? 'Accettato' :
                           quote.status === 'rejected' || quote.status === 'REJECTED' ? 'Rifiutato' :
                           'In Attesa'}
                        </span>
                      </div>
                    </div>
                    {(isClient || isAdmin) && quote.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success('Funzione in sviluppo');
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                          Accetta
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.error('Funzione in sviluppo');
                          }}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Nessun preventivo presente</p>
                {isProfessional && (
                  <p className="mt-1 text-xs text-gray-500">
                    Clicca su "Nuovo Preventivo" per crearne uno
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Allegati {request.attachments && request.attachments.length > 0 && `(${request.attachments.length})`}
              </h2>
              {(canEdit || isClient) && (
                <div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      
                      try {
                        const formData = new FormData();
                        files.forEach((file) => {
                          formData.append('files', file);
                        });
                        files.forEach((file, index) => {
                          formData.append('descriptions', `${file.name}`);
                        });
                        
                        await api.post(`/requests/${id}/attachments`, formData, {
                          headers: {
                            'Content-Type': 'multipart/form-data'
                          }
                        });
                        
                        toast.success('File caricati con successo');
                        queryClient.invalidateQueries({ queryKey: ['request', id] });
                      } catch (error) {
                        console.error('Error uploading files:', error);
                        toast.error('Errore nel caricamento dei file');
                      }
                      
                      // Reset input
                      e.target.value = '';
                    }}
                    ref={attachmentInputRef}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Attachment button clicked');
                      console.log('attachmentInputRef.current:', attachmentInputRef.current);
                      if (attachmentInputRef.current) {
                        attachmentInputRef.current.click();
                      } else {
                        console.error('attachmentInputRef.current is null');
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Aggiungi File
                  </button>
                </div>
              )}
            </div>
            
            {request.attachments && request.attachments.length > 0 ? (
              <div className="space-y-2">
                {request.attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <PaperClipIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-gray-900">{attachment.originalName || attachment.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {attachment.description || 'Nessuna descrizione'} • 
                        {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Dimensione sconosciuta'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName || attachment.fileName)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                      Scarica
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nessun allegato presente</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-gray-900">
                    {request.client.firstName} {request.client.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                <a href={`mailto:${request.client.email}`} className="text-blue-600 hover:underline">
                  {request.client.email}
                </a>
              </div>
              {request.client.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <a href={`tel:${request.client.phone}`} className="text-blue-600 hover:underline">
                    {request.client.phone}
                  </a>
                </div>
              )}
            </div>

          </div>

          {/* Chat Section - Always visible for admin/staff when no professional assigned */}
          {!request.professional && isAdmin && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comunicazioni</h2>
              <p className="text-gray-600 text-sm mb-4">
                Nessun professionista assegnato. Puoi comunicare direttamente con il cliente tramite la chat.
              </p>
              <button
                onClick={() => setShowChat(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Apri Chat con Cliente
              </button>
            </div>
          )}

          {/* Professional Info */}
          {request.professional && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Professionista</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-gray-900">
                      {request.professional.firstName} {request.professional.lastName}
                    </p>
                    {(request.professional.professionData?.name || request.professional.profession) && (
                      <p className="text-sm text-gray-600">{request.professional.professionData?.name || request.professional.profession}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <a href={`mailto:${request.professional.email}`} className="text-blue-600 hover:underline">
                    {request.professional.email}
                  </a>
                </div>
                {request.professional.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <a href={`tel:${request.professional.phone}`} className="text-blue-600 hover:underline">
                      {request.professional.phone}
                    </a>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dettagli</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Categoria</dt>
                <dd className="mt-1 text-sm text-gray-900">{categoryName || 'Non categorizzato'}</dd>
              </div>
              {request.subcategory && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sottocategoria</dt>
                  <dd className="mt-1 text-sm text-gray-900">{request.subcategory.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Creata il</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(request.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}
                </dd>
              </div>
              {request.requestedDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data Richiesta Cliente</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">
                    {format(new Date(request.requestedDate), 'dd MMM yyyy', { locale: it })}
                  </dd>
                </div>
              )}
              {request.scheduledDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data Intervento Programmato</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">
                    {format(new Date(request.scheduledDate), 'dd MMM yyyy HH:mm', { locale: it })}
                  </dd>
                </div>
              )}
              {request.assignedDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data Assegnazione</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(request.assignedDate), 'dd MMM yyyy', { locale: it })}
                  </dd>
                </div>
              )}
              {request.completionDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data Completamento</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(request.completionDate), 'dd MMM yyyy', { locale: it })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Schedule Intervention for Professional - NUOVO! */}
          {isProfessional && request.professionalId === user?.id && (
            <div className="bg-white rounded-lg shadow p-6">
              <ScheduleIntervention 
                request={request}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['request', id] });
                  toast.success('Data intervento impostata!');
                }}
              />
            </div>
          )}

          {/* Assignment Section for Admin - Solo se non c'è già un professionista */}
          {isAdmin && !request.professionalId && request.subcategory && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assegna Professionista</h2>
              
              {/* Professional Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleziona Professionista
                </label>
                <select
                  value={selectedProfessional}
                  onChange={(e) => setSelectedProfessional(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={assignProfessionalMutation.isPending}
                >
                  <option value="">-- Seleziona --</option>
                  {console.log('🔍 Professionals in dropdown:', professionalsData)}
                  {professionalsData && professionalsData.length > 0 ? (
                    professionalsData.map((prof: any) => {
                      console.log('👤 Professional:', prof);
                      const user = prof.user || prof.User;
                      if (!user) {
                        console.warn('⚠️ Professional without user:', prof);
                        return null;
                      }
                      return (
                        <option key={user.id} value={user.id}>
                          {user.fullName} - {user.city}, {user.province}
                          {prof.experienceYears && ` (${prof.experienceYears} anni exp.)`}
                        </option>
                      );
                    })
                  ) : (
                    <option disabled>Nessun professionista disponibile</option>
                  )}
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (opzionale)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note per il professionista..."
                />
              </div>

              {/* Assign Button */}
              <button
                onClick={() => {
                  if (!selectedProfessional) {
                    toast.error('Seleziona un professionista');
                    return;
                  }
                  assignProfessionalMutation.mutate({
                    professionalId: selectedProfessional,
                    notes: assignmentNotes
                  });
                }}
                disabled={!selectedProfessional || assignProfessionalMutation.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignProfessionalMutation.isPending ? 'Assegnazione...' : 'Assegna Richiesta'}
              </button>
            </div>
          )}

          {/* Status Update - Solo se c'è già un professionista o per altri cambi stato */}
          {(isAdmin || isProfessional) && request.professionalId && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Aggiorna Stato</h2>
              <select
                value={request.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={updateStatusMutation.isPending}
              >
                <option value="PENDING">In Attesa</option>
                <option value="ASSIGNED">Assegnata</option>
                <option value="IN_PROGRESS">In Corso</option>
                <option value="COMPLETED">Completata</option>
                <option value="CANCELLED">Annullata</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Modal Proponi Interventi */}
      {showProposeInterventions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Proponi Interventi Programmati</h3>
            </div>
            <div className="p-4">
              <ProposeInterventions
                requestId={request.id}
                requestTitle={request.title}
                clientName={`${request.client.firstName} ${request.client.lastName}`}
                onClose={() => setShowProposeInterventions(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ubicazione Intervento</h3>
              <button
                onClick={() => {
                  setShowMapModal(false);
                  setGeocodingAttempted(false); // Reset per permettere nuovo tentativo
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="h-[500px]">
              {isGeocoding ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="ml-3 text-gray-600">Localizzazione indirizzo in corso...</p>
                </div>
              ) : (
                <RequestMap
                  requests={[
                    {
                      ...request,
                      latitude: request.latitude || coordinates?.lat,
                      longitude: request.longitude || coordinates?.lng
                    }
                  ]}
                  center={{
                    lat: request.latitude || coordinates?.lat || 45.0703,
                    lng: request.longitude || coordinates?.lng || 7.6869
                  }}
                  zoom={15}
                  height="500px"
                  showFilters={false}
                  singleRequestMode={true}
                  showControls={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Chat Richiesta</h3>
              <button
                onClick={() => {
                  setShowChat(false);
                  setSuggestedMessage(''); // Reset del messaggio suggerito
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <RequestChat
                requestId={request.id}
                requestTitle={request.title}
                requestStatus={request.status}
                suggestedMessage={suggestedMessage}
                participants={[
                  {
                    id: request.client.id,
                    fullName: `${request.client.firstName} ${request.client.lastName}`,
                    role: 'CLIENT',
                    avatar: undefined
                  },
                  ...(request.professional ? [{
                    id: request.professional.id,
                    fullName: `${request.professional.firstName} ${request.professional.lastName}`,
                    role: 'PROFESSIONAL',
                    avatar: undefined
                  }] : []),
                  ...(isAdmin ? [{
                    id: user?.id || '',
                    fullName: user?.fullName || 'Admin',
                    role: user?.role || 'ADMIN',
                    avatar: undefined
                  }] : [])
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Assistant - Controllato dal pulsante */}
      {showAiChat && request && (
        <AiChatComplete
          requestId={request.id}
          subcategoryId={request.subcategory?.id}
          conversationType={user?.role === 'PROFESSIONAL' ? 'professional_help' : 'client_help'}
          forceOpen={true}
        />
      )}
    </div>
  );
}
