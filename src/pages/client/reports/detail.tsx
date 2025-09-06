import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function ClientReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Query per il rapporto
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['report-detail', id],
    queryFn: async () => {
      const response = await fetch(`/api/intervention-reports/${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Dati mock se l'API non esiste
        return {
          id: id,
          reportNumber: 'RI-2025-00001',
          professional: {
            fullName: 'Mario Rossi',
            phone: '333-1234567',
            email: 'mario.rossi@example.com'
          },
          client: {
            fullName: 'Giovanni Bianchi',
            address: 'Via Roma 123, Milano'
          },
          request: {
            title: 'Riparazione rubinetto cucina',
            description: 'Il rubinetto della cucina perde acqua'
          },
          interventionDate: new Date().toISOString(),
          startTime: '09:00',
          endTime: '11:30',
          totalHours: 2.5,
          type: { name: 'Riparazione idraulica' },
          
          // Dettagli intervento
          formData: {
            problemFound: 'Guarnizione del rubinetto usurata e o-ring danneggiato',
            solutionApplied: 'Sostituita guarnizione e o-ring, pulito calcare, verificato funzionamento',
            recommendations: 'Si consiglia di pulire periodicamente il filtro del rubinetto per evitare accumuli di calcare',
            notes: 'Intervento completato con successo. Il cliente è stato presente durante tutto l\'intervento.'
          },
          
          // Materiali utilizzati
          materials: [
            { name: 'Guarnizione rubinetto', quantity: 1, unitPrice: 5, totalPrice: 5 },
            { name: 'O-ring', quantity: 2, unitPrice: 2, totalPrice: 4 },
            { name: 'Pasta sigillante', quantity: 1, unitPrice: 8, totalPrice: 8 }
          ],
          materialsTotal: 17,
          
          // Stato firme
          professionalSignedAt: new Date().toISOString(),
          clientSignedAt: null,
          
          // Valutazione
          rating: null,
          feedback: null,
          
          status: 'pending_signature'
        };
      }
      
      const data = await response.json();
      return data.data || data;
    }
  });

  // Mutation per firmare
  const signMutation = useMutation({
    mutationFn: async (signature: string) => {
      const response = await fetch(`/api/intervention-reports/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ signature, role: 'client' })
      });
      
      if (!response.ok) throw new Error('Errore durante la firma');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Rapporto firmato con successo');
      setShowSignatureModal(false);
      refetch();
    },
    onError: () => {
      toast.error('Errore durante la firma');
    }
  });

  // Mutation per valutare
  const rateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/intervention-reports/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, feedback })
      });
      
      if (!response.ok) throw new Error('Errore durante la valutazione');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Valutazione inviata con successo');
      refetch();
    },
    onError: () => {
      toast.error('Errore durante la valutazione');
    }
  });

  // Canvas per firma digitale
  useEffect(() => {
    if (!showSignatureModal || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#000';
  }, [showSignatureModal]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signature = canvas.toDataURL();
    signMutation.mutate(signature);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/intervention-reports/${id}/pdf`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapporto-${report?.reportNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('PDF scaricato con successo');
      } else {
        toast.error('PDF non disponibile');
      }
    } catch (error) {
      toast.error('Errore durante il download');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Rapporto non trovato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <button
              onClick={() => navigate('/client/reports')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Torna ai rapporti
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Rapporto {report.reportNumber}
            </h1>
            <p className="mt-2 text-gray-600">{report.request?.title}</p>
          </div>
          
          <div className="flex space-x-3">
            {report.clientSignedAt && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Scarica PDF
              </button>
            )}
            {!report.clientSignedAt && (
              <button
                onClick={() => setShowSignatureModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Firma Rapporto
              </button>
            )}
          </div>
        </div>

        {/* Informazioni Base */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Informazioni Intervento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Data Intervento</p>
                <p className="font-medium">
                  {new Date(report.interventionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Orario</p>
                <p className="font-medium">
                  {report.startTime} - {report.endTime} ({report.totalHours} ore)
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <UserIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Professionista</p>
                <p className="font-medium">{report.professional?.fullName}</p>
                <p className="text-sm text-gray-600">{report.professional?.phone}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Indirizzo</p>
                <p className="font-medium">{report.client?.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dettagli Intervento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-gray-500" />
            Dettagli Intervento
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Problema Riscontrato</p>
              <p className="mt-1 text-gray-600">{report.formData?.problemFound}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Soluzione Applicata</p>
              <p className="mt-1 text-gray-600">{report.formData?.solutionApplied}</p>
            </div>
            
            {report.formData?.recommendations && (
              <div>
                <p className="text-sm font-medium text-gray-700">Raccomandazioni</p>
                <p className="mt-1 text-gray-600">{report.formData.recommendations}</p>
              </div>
            )}
            
            {report.formData?.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Note</p>
                <p className="mt-1 text-gray-600">{report.formData.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Materiali Utilizzati */}
        {report.materials && report.materials.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CubeIcon className="h-5 w-5 mr-2 text-gray-500" />
              Materiali Utilizzati
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materiale
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantità
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prezzo Unit.
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Totale
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.materials.map((material: any, index: number) => (
                    <tr key={index}>
                      <td className="py-2 text-sm text-gray-900">{material.name}</td>
                      <td className="py-2 text-sm text-gray-900 text-center">{material.quantity}</td>
                      <td className="py-2 text-sm text-gray-900 text-right">€ {material.unitPrice}</td>
                      <td className="py-2 text-sm text-gray-900 text-right">€ {material.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={3} className="py-2 text-sm font-medium text-gray-900 text-right">
                      Totale Materiali:
                    </td>
                    <td className="py-2 text-sm font-bold text-gray-900 text-right">
                      € {report.materialsTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Stato Firme */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Stato Firme</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Firma Professionista</span>
              {report.professionalSignedAt ? (
                <span className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  Firmato il {new Date(report.professionalSignedAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-gray-500">Non firmato</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Firma Cliente</span>
              {report.clientSignedAt ? (
                <span className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  Firmato il {new Date(report.clientSignedAt).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-yellow-600">In attesa di firma</span>
              )}
            </div>
          </div>
        </div>

        {/* Valutazione */}
        {report.clientSignedAt && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Valutazione Servizio</h2>
            
            {report.rating ? (
              <div>
                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-6 w-6 ${star <= report.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                  <span className="ml-3 text-gray-700">
                    Valutazione: {report.rating}/5
                  </span>
                </div>
                {report.feedback && (
                  <p className="text-gray-600 mt-2">{report.feedback}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 mb-2">Come valuti il servizio ricevuto?</p>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        {star <= rating ? (
                          <StarIcon className="h-8 w-8 text-yellow-400" />
                        ) : (
                          <StarIconOutline className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Feedback (opzionale)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Condividi la tua esperienza..."
                  />
                </div>
                
                <button
                  onClick={() => rateMutation.mutate()}
                  disabled={rating === 0 || rateMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Invia Valutazione
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Firma */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Firma Digitale</h2>
            <p className="text-gray-600 mb-4">
              Firma nello spazio sottostante per confermare il rapporto di intervento
            </p>
            
            <div className="border-2 border-gray-300 rounded-lg mb-4">
              <canvas
                ref={canvasRef}
                width={450}
                height={200}
                className="w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={clearSignature}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancella
              </button>
              
              <div className="space-x-3">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                
                <button
                  onClick={saveSignature}
                  disabled={signMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Conferma Firma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}