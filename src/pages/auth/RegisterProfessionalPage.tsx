import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  BriefcaseIcon,
  IdentificationIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// Step components per un wizard semplice
const steps = [
  { id: 1, name: 'Informazioni Base', icon: UserIcon },
  { id: 2, name: 'La tua Professione', icon: BriefcaseIcon },
  { id: 3, name: 'Documenti', icon: DocumentIcon },
];

export function RegisterProfessionalPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Info Base
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Step 2 - Professione e Dati Aziendali
    professionId: '',
    yearsExperience: '',
    businessName: '',  // Ragione sociale
    fiscalCode: '',    // Codice fiscale
    city: '',
    province: '',
    
    // Step 3 - Documenti (solo i fondamentali)
    identityDocument: null as File | null,
    vatNumber: '',
    hasVat: 'no' as 'yes' | 'no' | 'pending',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lista professioni semplificata
  const professions = [
    { id: 'idraulico', name: '🔧 Idraulico', description: 'Impianti idraulici e riparazioni' },
    { id: 'elettricista', name: '⚡ Elettricista', description: 'Impianti elettrici e riparazioni' },
    { id: 'muratore', name: '🧱 Muratore', description: 'Opere murarie e ristrutturazioni' },
    { id: 'imbianchino', name: '🎨 Imbianchino', description: 'Tinteggiature e decorazioni' },
    { id: 'falegname', name: '🪵 Falegname', description: 'Lavori in legno e serramenti' },
    { id: 'fabbro', name: '🔨 Fabbro', description: 'Lavori in metallo e serrature' },
    { id: 'giardiniere', name: '🌿 Giardiniere', description: 'Manutenzione giardini' },
    { id: 'tecnico-condizionatori', name: '❄️ Tecnico Condizionatori', description: 'Climatizzazione' },
    { id: 'altro', name: '📋 Altro', description: 'Altra professione' }
  ];

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();
      
      // Aggiungi tutti i campi al FormData
      Object.keys(data).forEach(key => {
        if (key === 'identityDocument' && data[key]) {
          formDataToSend.append('identityDocument', data[key]);
        } else if (data[key] !== null && data[key] !== undefined) {
          formDataToSend.append(key, data[key]);
        }
      });
      
      // Aggiungi role
      formDataToSend.append('role', 'PROFESSIONAL');
      formDataToSend.append('approvalStatus', 'PENDING');
      
      return await api.post('/auth/register-professional', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Registrazione completata! Un amministratore verificherà la tua richiesta.');
      navigate('/pending-approval');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante la registrazione');
    }
  });

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch(step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'Nome richiesto';
        if (!formData.lastName.trim()) newErrors.lastName = 'Cognome richiesto';
        if (!formData.email.trim()) newErrors.email = 'Email richiesta';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email non valida';
        if (!formData.phone.trim()) newErrors.phone = 'Telefono richiesto';
        if (!formData.password) newErrors.password = 'Password richiesta';
        else if (formData.password.length < 8) newErrors.password = 'Minimo 8 caratteri';
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Le password non coincidono';
        }
        break;
        
      case 2:
        if (!formData.professionId) newErrors.professionId = 'Seleziona la tua professione';
        if (!formData.fiscalCode.trim()) newErrors.fiscalCode = 'Codice fiscale richiesto';
        else if (formData.fiscalCode.length !== 16) newErrors.fiscalCode = 'Codice fiscale deve essere di 16 caratteri';
        if (!formData.city.trim()) newErrors.city = 'Città richiesta';
        if (!formData.province.trim()) newErrors.province = 'Provincia richiesta';
        break;
        
      case 3:
        if (!formData.identityDocument) newErrors.identityDocument = 'Documento richiesto';
        if (formData.hasVat === 'yes' && !formData.vatNumber.trim()) {
          newErrors.vatNumber = 'Inserisci la Partita IVA';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // Submit
        registerMutation.mutate(formData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifica dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Il file è troppo grande. Massimo 5MB.');
        return;
      }
      setFormData({ ...formData, identityDocument: file });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Diventa un Professionista 🛠️
          </h1>
          <p className="mt-2 text-gray-600">
            Unisciti alla nostra rete di professionisti qualificati
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2
                    ${currentStep > step.id 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : currentStep === step.id 
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}>
                    {currentStep > step.id ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-full h-1 mx-2
                      ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map(step => (
              <span 
                key={step.id}
                className={`text-xs ${
                  currentStep >= step.id ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {step.name}
              </span>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Informazioni Base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-6">
                  👋 Ciao! Iniziamo con le informazioni base
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Il tuo nome
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Mario"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Il tuo cognome
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Rossi"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (la useremo per contattarti)
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="mario.rossi@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero di telefono
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="333 1234567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Minimo 8 caratteri"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conferma Password
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ripeti la password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professione */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-6">
                  💼 Qual è la tua professione?
                </h2>
                
                <div className="grid grid-cols-2 gap-3">
                  {professions.map(profession => (
                    <button
                      key={profession.id}
                      type="button"
                      onClick={() => setFormData({...formData, professionId: profession.id})}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${formData.professionId === profession.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="font-medium text-lg">{profession.name}</div>
                      <div className="text-sm text-gray-500">{profession.description}</div>
                    </button>
                  ))}
                </div>
                {errors.professionId && (
                  <p className="text-red-500 text-xs mt-2">{errors.professionId}</p>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Da quanti anni fai questo lavoro?
                  </label>
                  <select
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleziona...</option>
                    <option value="0-1">Meno di 1 anno</option>
                    <option value="1-3">1-3 anni</option>
                    <option value="3-5">3-5 anni</option>
                    <option value="5-10">5-10 anni</option>
                    <option value="10+">Più di 10 anni</option>
                  </select>
                </div>

                {/* Dati Aziendali */}
                <div className="mt-6">
                  <h3 className="font-medium mb-3">🏢 Dati Aziendali</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ragione Sociale / Ditta Individuale
                        <span className="text-gray-400 font-normal ml-1">(opzionale)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Mario Rossi S.r.l. o Mario Rossi (ditta individuale)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lascia vuoto se lavori come privato/occasionale
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Codice Fiscale
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fiscalCode}
                        onChange={(e) => setFormData({...formData, fiscalCode: e.target.value.toUpperCase()})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.fiscalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="RSSMRA85M01H501Z"
                        maxLength={16}
                      />
                      {errors.fiscalCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.fiscalCode}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">📍 Dove lavori principalmente?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Città
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Milano"
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Provincia
                      </label>
                      <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => setFormData({...formData, province: e.target.value.toUpperCase()})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.province ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="MI"
                        maxLength={2}
                      />
                      {errors.province && (
                        <p className="text-red-500 text-xs mt-1">{errors.province}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documenti */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-6">
                  📄 Quasi finito! Ci servono solo un paio di documenti
                </h2>
                <p className="text-gray-600 mb-6">
                  Non preoccuparti, potrai aggiungere altri documenti più tardi dal tuo profilo.
                </p>

                {/* Upload Documento */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento d'identità (fronte o fronte-retro)
                  </label>
                  <div className={`
                    border-2 border-dashed rounded-lg p-6 text-center
                    ${errors.identityDocument ? 'border-red-500' : 'border-gray-300'}
                  `}>
                    {formData.identityDocument ? (
                      <div className="flex items-center justify-center">
                        <DocumentIcon className="h-8 w-8 text-green-600 mr-2" />
                        <span className="text-green-600 font-medium">
                          {formData.identityDocument.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, identityDocument: null})}
                          className="ml-4 text-red-500 hover:text-red-700"
                        >
                          Rimuovi
                        </button>
                      </div>
                    ) : (
                      <>
                        <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Clicca per caricare
                          </span>
                          <span className="text-gray-500"> o trascina il file qui</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">
                          JPG, PNG o PDF - Max 5MB
                        </p>
                      </>
                    )}
                  </div>
                  {errors.identityDocument && (
                    <p className="text-red-500 text-xs mt-1">{errors.identityDocument}</p>
                  )}
                </div>

                {/* Partita IVA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Hai la Partita IVA?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="hasVat"
                        value="yes"
                        checked={formData.hasVat === 'yes'}
                        onChange={(e) => setFormData({...formData, hasVat: 'yes'})}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">✅ Sì, ce l'ho</span>
                        <p className="text-sm text-gray-500">Inserirò il numero ora</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="hasVat"
                        value="pending"
                        checked={formData.hasVat === 'pending'}
                        onChange={(e) => setFormData({...formData, hasVat: 'pending', vatNumber: ''})}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">⏳ La sto aprendo</span>
                        <p className="text-sm text-gray-500">La aggiungerò appena pronta</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="hasVat"
                        value="no"
                        checked={formData.hasVat === 'no'}
                        onChange={(e) => setFormData({...formData, hasVat: 'no', vatNumber: ''})}
                        className="mr-3"
                      />
                      <div>
                        <span className="font-medium">❌ No, non ce l'ho</span>
                        <p className="text-sm text-gray-500">Lavoro occasionalmente</p>
                      </div>
                    </label>
                  </div>

                  {formData.hasVat === 'yes' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numero Partita IVA
                      </label>
                      <input
                        type="text"
                        value={formData.vatNumber}
                        onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.vatNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="IT12345678901"
                      />
                      {errors.vatNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.vatNumber}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <ExclamationCircleIcon className="h-5 w-5 text-blue-600 inline mr-2" />
                  <span className="text-sm text-blue-800">
                    <strong>Nota:</strong> Dopo l'approvazione potrai aggiungere certificazioni, 
                    portfolio lavori e altri documenti dal tuo profilo.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Indietro
              </button>
            )}
            
            <button
              type="button"
              onClick={handleNext}
              disabled={registerMutation.isPending}
              className={`
                px-6 py-2 rounded-lg text-white font-medium ml-auto
                ${registerMutation.isPending 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              {registerMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Invio in corso...
                </>
              ) : currentStep < steps.length ? (
                <>
                  Continua
                  <ArrowRightIcon className="h-4 w-4 inline ml-2" />
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                  Completa Registrazione
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Hai già un account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Accedi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
