import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { RequestCustomForms } from '@/components/custom-forms/RequestCustomForms';

export default function RequestForms() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Query per caricare i dettagli della richiesta
  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const response = await api.get(`/requests/${id}`);
      console.log('Raw API response:', response.data);
      
      // I dati sono in response.data.data.request per via del ResponseFormatter
      const requestData = response.data?.data?.request || response.data?.request || response.data;
      
      console.log('Extracted request data:', requestData);
      return requestData;
    }
  });

  // Determina i ruoli
  const isProfessional = user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isClient = user?.role === 'CLIENT';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Richiesta non trovata</p>
        <button
          onClick={() => navigate('/requests')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Torna alle richieste
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold">
                  Moduli Richiesta #{id?.slice(0, 8)}
                </h2>
                {request && (
                  <div className="space-y-1 mt-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Richiesta:</span> {request.title || request.description || 'Senza titolo'}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Cliente:</span> {
                          request.client 
                            ? `${request.client.firstName || ''} ${request.client.lastName || ''}`.trim() || request.client.email
                            : 'Non specificato'
                        }
                        {request.client?.phone && ` - Tel: ${request.client.phone}`}
                      </p>
                      {request.professional ? (
                        <p>
                          <span className="font-medium">Professionista:</span> {
                            `${request.professional.firstName || ''} ${request.professional.lastName || ''}`.trim() || request.professional.email
                          }
                          {request.professional.phone && ` - Tel: ${request.professional.phone}`}
                        </p>
                      ) : (
                        <p className="text-orange-600">
                          <span className="font-medium">Professionista:</span> Non ancora assegnato
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RequestCustomForms
          requestId={id!}
          subcategoryId={request.subcategoryId}
          isProfessional={isProfessional}
          isClient={isClient}
          requestInfo={{
            requestNumber: request.requestNumber,
            category: request.category?.name,
            subcategory: request.subcategory?.name
          }}
        />
      </div>
    </div>
  );
}
