import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export function RegisterEmployeePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [currentStep, setCurrentStep] = useState<'search' | 'verify' | 'register'>('search');
  
  const [formData, setFormData] = useState({
    // Dati personali
    firstName: '',
    lastName: '',
    personalFiscalCode: '',
    email: '',
    personalPhone: '',
    password: '',
    confirmPassword: '',
    
    // Indirizzo personale
    personalAddress: '',
    personalCity: '',
    personalProvince: '',
    personalPostalCode: '',
    
    // Ruolo in azienda
    companyRole: 'EMPLOYEE' as 'EMPLOYEE' | 'COLLABORATOR',
    professionId: '',
    
    // Documento
    identityDocument: null as File | null,
  });

  // Cerca azienda per P.IVA o Ragione Sociale
  const searchMutation = useMutation({
    mutationFn: (query: string) => 
      api.get(`/companies/search?q=${encodeURIComponent(query)}`),
    onSuccess: (data) => {
      if (data.length === 0) {
        toast.error('Nessuna azienda trovata');
      } else if (data.length === 1) {
        setSelectedCompany(data[0]);
        setCurrentStep('verify');
      }
    }
  });

  // Verifica codice azienda
  const verifyCodeMutation = useMutation({
    mutationFn: (data: { companyId: string; code: string }) =>
      api.post('/companies/verify-employee-code', data),
    onSuccess: () => {
      toast.success('Codice verificato! Puoi procedere con la registrazione');
      setCurrentStep('register');
    },
    onError: () => {
      toast.error('Codice non valido');
    }
  });

  // Registrazione dipendente
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();
      
      // Aggiungi tutti i campi
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (data[key] instanceof File) {
            formDataToSend.append(key, data[key]);
          } else {
            formDataToSend.append(key, String(data[key]));
          }
        }
      });
      
      // Aggiungi info azienda
      formDataToSend.append('companyId', selectedCompany.id);
      formDataToSend.append('activityType', 'COMPANY');
      formDataToSend.append('role', 'PROFESSIONAL');
      
      return api.post('/auth/register-employee', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      toast.success('Registrazione completata! Un amministratore verificherà la tua richiesta.');
      navigate('/pending-approval');
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCompany && verificationCode) {
      verifyCodeMutation.mutate({
        companyId: selectedCompany.id,
        code: verificationCode
      });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazioni base
    if (formData.password !== formData.confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }
    
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <BuildingOfficeIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">
            Registrazione Dipendente/Collaboratore
          </h1>
          <p className="mt-2 text-gray-600">
            Lavori per un'azienda già registrata? Unisciti al team!
          </p>
        </div>

        {/* Step 1: Cerca Azienda */}
        {currentStep === 'search' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6">
              🔍 Cerca la tua azienda
            </h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inserisci la Partita IVA o la Ragione Sociale dell'azienda
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Es: 12345678901 o Mario Rossi S.r.l."
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={searchMutation.isPending}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {searchMutation.isPending ? 'Ricerca...' : 'Cerca Azienda'}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 inline mr-2" />
              <span className="text-sm text-amber-800">
                <strong>Non trovi l'azienda?</strong> Chiedi al titolare di registrarla prima, 
                oppure di fornirti il codice dipendente.
              </span>
            </div>

            {/* Alternativa */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sei un libero professionista o hai una tua azienda?
              </p>
              <a 
                href="/register-professional"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Registrati come professionista autonomo →
              </a>
            </div>
          </div>
        )}

        {/* Step 2: Verifica Codice */}
        {currentStep === 'verify' && selectedCompany && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6">
              🔐 Verifica appartenenza all'azienda
            </h2>

            {/* Azienda Trovata */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
              <CheckCircleIcon className="h-5 w-5 text-green-600 inline mr-2" />
              <span className="font-medium">Azienda trovata:</span>
              <div className="mt-2">
                <p className="font-semibold">{selectedCompany.businessName}</p>
                <p className="text-sm text-gray-600">P.IVA: {selectedCompany.vatNumber}</p>
                <p className="text-sm text-gray-600">
                  {selectedCompany.legalCity} ({selectedCompany.legalProvince})
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice di Verifica Dipendente
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Inserisci il codice fornito dal titolare"
                  maxLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Il codice ti deve essere fornito dal titolare o dall'amministratore dell'azienda
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('search');
                    setSelectedCompany(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cambia Azienda
                </button>
                <button
                  type="submit"
                  disabled={verifyCodeMutation.isPending}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {verifyCodeMutation.isPending ? 'Verifica...' : 'Verifica Codice'}
                </button>
              </div>
            </form>

            {/* Come ottenere il codice */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-sm mb-2">📋 Come ottenere il codice?</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Il titolare accede alla sua area riservata</li>
                <li>2. Va in "Gestione Team" → "Aggiungi Dipendente"</li>
                <li>3. Genera un codice temporaneo</li>
                <li>4. Te lo comunica (valido per 24 ore)</li>
              </ol>
            </div>
          </div>
        )}

        {/* Step 3: Completa Registrazione */}
        {currentStep === 'register' && selectedCompany && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6">
              ✍️ Completa la registrazione
            </h2>

            {/* Azienda Verificata */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium">
                  Registrazione per: {selectedCompany.businessName}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Dati Personali */}
              <div>
                <h3 className="font-medium mb-3">Dati Personali</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cognome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice Fiscale <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.personalFiscalCode}
                    onChange={(e) => setFormData({...formData, personalFiscalCode: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="RSSMRA85M01H501Z"
                    maxLength={16}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.personalPhone}
                      onChange={(e) => setFormData({...formData, personalPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Ruolo in Azienda */}
              <div>
                <h3 className="font-medium mb-3">Ruolo nell'Azienda</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo di Rapporto <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.companyRole}
                      onChange={(e) => setFormData({...formData, companyRole: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="EMPLOYEE">Dipendente</option>
                      <option value="COLLABORATOR">Collaboratore/Consulente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Professione <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.professionId}
                      onChange={(e) => setFormData({...formData, professionId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Seleziona...</option>
                      <option value="idraulico">Idraulico</option>
                      <option value="elettricista">Elettricista</option>
                      <option value="muratore">Muratore</option>
                      <option value="imbianchino">Imbianchino</option>
                      <option value="falegname">Falegname</option>
                      <option value="fabbro">Fabbro</option>
                      <option value="tecnico">Tecnico</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <h3 className="font-medium mb-3">Credenziali di Accesso</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conferma Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento d'Identità <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setFormData({...formData, identityDocument: e.target.files?.[0] || null})}
                  className="w-full"
                  accept="image/*,.pdf"
                  required
                />
              </div>

              {/* Note */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> La tua registrazione dovrà essere approvata sia 
                  dall'amministratore del sistema che dal titolare dell'azienda.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {registerMutation.isPending ? (
                  'Registrazione in corso...'
                ) : (
                  <>
                    Completa Registrazione
                    <ArrowRightIcon className="h-4 w-4 inline ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
