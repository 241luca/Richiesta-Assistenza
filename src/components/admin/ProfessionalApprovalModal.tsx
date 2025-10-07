import React, { useState } from 'react';
import { 
  XMarkIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BriefcaseIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Professional {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  fiscalCode?: string;
  businessName?: string;  // Ragione sociale
  vatNumber?: string;
  professionId?: string;
  profession?: {
    name: string;
  };
  registeredAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents?: any[];
  notes?: string;
}

interface ApprovalModalProps {
  professional: Professional;
  isOpen: boolean;
  onClose: () => void;
}

// Lista documenti richiesti configurabile
const REQUIRED_DOCUMENTS = [
  { id: 'identity', label: 'Documento di identità', required: true },
  { id: 'fiscal_code', label: 'Codice Fiscale', required: true },
  { id: 'vat_certificate', label: 'Certificato Partita IVA', required: true },
  { id: 'professional_insurance', label: 'Assicurazione RC Professionale', required: false },
  { id: 'chamber_commerce', label: 'Visura Camerale', required: false },
  { id: 'professional_license', label: 'Iscrizione Albo/Licenza', required: false },
  { id: 'certifications', label: 'Certificazioni professionali', required: false },
  { id: 'portfolio', label: 'Portfolio lavori precedenti', required: false },
  { id: 'criminal_record', label: 'Casellario Giudiziale', required: false },
  { id: 'references', label: 'Referenze clienti', required: false }
];

export default function ProfessionalApprovalModal({ professional, isOpen, onClose }: ApprovalModalProps) {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'details' | 'documents' | 'request'>('details');
  const [missingDocuments, setMissingDocuments] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Mutation per approvare
  const approveMutation = useMutation({
    mutationFn: async () => {
      return await api.put(`/professionals/${professional.id}/approve`, {
        notes: approvalNotes
      });
    },
    onSuccess: () => {
      toast.success('Professionista approvato con successo!');
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'approvazione');
    }
  });

  // Mutation per rifiutare
  const rejectMutation = useMutation({
    mutationFn: async () => {
      return await api.put(`/professionals/${professional.id}/reject`, {
        reason: approvalNotes
      });
    },
    onSuccess: () => {
      toast.success('Professionista rifiutato');
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante il rifiuto');
    }
  });

  // Mutation per richiedere documenti
  const requestDocumentsMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/professionals/${professional.id}/request-documents`, {
        missingDocuments: missingDocuments.map(id => {
          const doc = REQUIRED_DOCUMENTS.find(d => d.id === id);
          return { id, label: doc?.label };
        }),
        customMessage
      });
    },
    onSuccess: () => {
      toast.success('Email di richiesta documenti inviata!');
      setMissingDocuments([]);
      setCustomMessage('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore invio email');
    }
  });

  const handleDocumentToggle = (docId: string) => {
    setMissingDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleApprove = () => {
    if (confirm('Sei sicuro di voler approvare questo professionista?')) {
      approveMutation.mutate();
    }
  };

  const handleReject = () => {
    if (!approvalNotes.trim()) {
      toast.error('Inserisci una motivazione per il rifiuto');
      return;
    }
    if (confirm('Sei sicuro di voler rifiutare questo professionista?')) {
      rejectMutation.mutate();
    }
  };

  const handleRequestDocuments = () => {
    if (missingDocuments.length === 0) {
      toast.error('Seleziona almeno un documento da richiedere');
      return;
    }
    requestDocumentsMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Verifica Professionista - {professional.firstName} {professional.lastName}
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setSelectedTab('details')}
                className={`px-6 py-3 font-medium ${
                  selectedTab === 'details'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <UserIcon className="h-5 w-5 inline mr-2" />
                Dettagli Professionista
              </button>
              <button
                onClick={() => setSelectedTab('documents')}
                className={`px-6 py-3 font-medium ${
                  selectedTab === 'documents'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <DocumentIcon className="h-5 w-5 inline mr-2" />
                Documenti
              </button>
              <button
                onClick={() => setSelectedTab('request')}
                className={`px-6 py-3 font-medium ${
                  selectedTab === 'request'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <EnvelopeIcon className="h-5 w-5 inline mr-2" />
                Richiedi Documenti
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {selectedTab === 'details' && (
              <div className="space-y-6">
                {/* Informazioni Personali */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informazioni Personali</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Nome Completo</label>
                      <p className="font-medium">{professional.firstName} {professional.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="font-medium">{professional.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Telefono</label>
                      <p className="font-medium">{professional.phone || 'Non fornito'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Codice Fiscale</label>
                      <p className="font-medium">{professional.fiscalCode || 'Non fornito'}</p>
                    </div>
                  </div>
                </div>

                {/* Informazioni Professionali */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informazioni Professionali</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Professione</label>
                      <p className="font-medium">{professional.profession?.name || 'Non specificata'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Ragione Sociale</label>
                      <p className="font-medium">{professional.businessName || 'Non specificata'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Partita IVA</label>
                      <p className="font-medium">{professional.vatNumber || 'Non fornita'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Data Registrazione</label>
                      <p className="font-medium">
                        {new Date(professional.registeredAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Città</label>
                      <p className="font-medium">
                        {professional.city ? `${professional.city} (${professional.province})` : 'Non fornita'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Note di Approvazione */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Note Interne</h3>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Aggiungi note per l'approvazione o motivazione per il rifiuto..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {selectedTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">Documenti Caricati</h3>
                
                {professional.documents && professional.documents.length > 0 ? (
                  <div className="space-y-2">
                    {professional.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span>{doc.name}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          Visualizza
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DocumentIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nessun documento caricato</p>
                  </div>
                )}

                {/* Checklist Documenti */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Checklist Documenti Richiesti</h4>
                  <div className="space-y-2">
                    {REQUIRED_DOCUMENTS.map(doc => (
                      <div key={doc.id} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-3"
                          disabled
                        />
                        <span className={doc.required ? 'font-medium' : ''}>
                          {doc.label}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'request' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Seleziona Documenti Mancanti</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Seleziona i documenti da richiedere al professionista. 
                    Verrà inviata un'email con la lista dei documenti necessari.
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    {REQUIRED_DOCUMENTS.map(doc => (
                      <label key={doc.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={missingDocuments.includes(doc.id)}
                          onChange={() => handleDocumentToggle(doc.id)}
                          className="mr-3"
                        />
                        <span className={doc.required ? 'font-medium' : ''}>
                          {doc.label}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Messaggio Personalizzato */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Messaggio Aggiuntivo (opzionale)
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Aggiungi un messaggio personalizzato per il professionista..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  </div>

                  {/* Preview Email */}
                  {missingDocuments.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Anteprima Email:</h4>
                      <div className="text-sm text-gray-700">
                        <p className="mb-2">Gentile {professional.firstName} {professional.lastName},</p>
                        <p className="mb-2">
                          Per completare la sua registrazione come professionista, 
                          la preghiamo di fornire i seguenti documenti:
                        </p>
                        <ul className="list-disc list-inside mb-2">
                          {missingDocuments.map(id => {
                            const doc = REQUIRED_DOCUMENTS.find(d => d.id === id);
                            return <li key={id}>{doc?.label}</li>;
                          })}
                        </ul>
                        {customMessage && (
                          <p className="mb-2 italic">{customMessage}</p>
                        )}
                        <p>Cordiali saluti,<br />Il Team di Richiesta Assistenza</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRequestDocuments}
                    disabled={missingDocuments.length === 0 || requestDocumentsMutation.isPending}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requestDocumentsMutation.isPending ? 'Invio in corso...' : 'Invia Richiesta Documenti'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Chiudi
              </button>
              
              <div className="space-x-3">
                {professional.status === 'PENDING' && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircleIcon className="h-5 w-5 inline mr-1" />
                      Rifiuta
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5 inline mr-1" />
                      Approva
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
