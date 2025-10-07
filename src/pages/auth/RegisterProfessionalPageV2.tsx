import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  UserIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  HomeIcon,
  BriefcaseIcon,
  IdentificationIcon,
  PhoneIcon,
  EnvelopeIcon,
  KeyIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { AddressAutocomplete, useGoogleMapsLoader } from '../../components/AddressAutocomplete';

// Step components
const steps = [
  { id: 1, name: 'Tipo Attività', icon: BriefcaseIcon },
  { id: 2, name: 'Dati Personali', icon: UserIcon },
  { id: 3, name: 'Dati Fiscali', icon: BuildingOfficeIcon }, // Per ditta/azienda
  { id: 4, name: 'Documenti', icon: DocumentIcon },
];

export default function RegisterProfessionalPageV2() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { isLoaded: googleMapsLoaded } = useGoogleMapsLoader();
  
  // Tipo di registrazione e attività
  const [registrationType, setRegistrationType] = useState<'occasional' | 'individual' | 'company' | null>(null);
  const [activityType, setActivityType] = useState<'OCCASIONAL' | 'INDIVIDUAL' | 'COMPANY' | null>(null);
  
  const [formData, setFormData] = useState({
    // Step 2 - Dati Personali
    firstName: '',
    lastName: '',
    personalFiscalCode: '', // Codice fiscale personale
    email: '',
    personalPhone: '',
    password: '',
    confirmPassword: '',
    
    // Indirizzi personali
    personalAddress: '',
    personalCity: '',
    personalProvince: '',
    personalPostalCode: '',
    
    // Professione
    professionId: '',
    yearsExperience: '',
    
    // Step 3 - Dati Aziendali (per ditta individuale E società)
    businessName: '', // Denominazione/Ragione sociale per ENTRAMBI
    vatNumber: '',
    companyFiscalCode: '', // CF azienda se diverso da P.IVA
    companyPhone: '',
    companyEmail: '',
    pec: '',
    sdiCode: '',
    
    // Sede legale
    legalAddress: '',
    legalCity: '',
    legalProvince: '',
    legalPostalCode: '',
    
    // Sede operativa
    hasOperativeAddress: false,
    operativeAddress: '',
    operativeCity: '',
    operativeProvince: '',
    operativePostalCode: '',
    
    // Ruolo in azienda
    companyRole: 'OWNER' as 'OWNER' | 'EMPLOYEE' | 'COLLABORATOR',
    
    // Step 4 - Documenti
    identityDocument: null as File | null,
    vatCertificate: null as File | null, // Certificato P.IVA
    chamberOfCommerce: null as File | null, // Visura camerale
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lista professioni
  const professions = [
    { id: 'idraulico', name: '🔧 Idraulico' },
    { id: 'elettricista', name: '⚡ Elettricista' },
    { id: 'muratore', name: '🧱 Muratore' },
    { id: 'imbianchino', name: '🎨 Imbianchino' },
    { id: 'falegname', name: '🪵 Falegname' },
    { id: 'fabbro', name: '🔨 Fabbro' },
    { id: 'giardiniere', name: '🌿 Giardiniere' },
    { id: 'tecnico-condizionatori', name: '❄️ Tecnico' },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch(step) {
      case 1:
        if (!registrationType) newErrors.registrationType = 'Seleziona il tipo di registrazione';
        break;
        
      case 2: // Dati personali
        if (!formData.firstName.trim()) newErrors.firstName = 'Nome richiesto';
        if (!formData.lastName.trim()) newErrors.lastName = 'Cognome richiesto';
        if (!formData.personalFiscalCode.trim()) newErrors.personalFiscalCode = 'Codice fiscale richiesto';
        else if (formData.personalFiscalCode.length !== 16) {
          newErrors.personalFiscalCode = 'Codice fiscale deve essere di 16 caratteri';
        }
        if (!formData.email.trim()) newErrors.email = 'Email richiesta';
        if (!formData.personalPhone.trim()) newErrors.personalPhone = 'Telefono richiesto';
        if (!formData.password) newErrors.password = 'Password richiesta';
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Le password non coincidono';
        }
        if (!formData.personalCity.trim()) newErrors.personalCity = 'Città richiesta';
        if (!formData.personalProvince.trim()) newErrors.personalProvince = 'Provincia richiesta';
        if (!formData.professionId) newErrors.professionId = 'Seleziona una professione';
        break;
        
      case 3: // Dati fiscali (per ditta individuale e società)
        if (registrationType === 'individual') {
          // Ditta individuale: richiede P.IVA, PEC, etc.
          if (!formData.vatNumber.trim()) newErrors.vatNumber = 'Partita IVA richiesta';
          else if (formData.vatNumber.length !== 11) {
            newErrors.vatNumber = 'Partita IVA deve essere di 11 cifre';
          }
          if (!formData.companyPhone.trim()) newErrors.companyPhone = 'Telefono professionale richiesto';
          if (!formData.companyEmail.trim()) newErrors.companyEmail = 'Email professionale richiesta';
          if (!formData.legalCity.trim()) newErrors.legalCity = 'Città sede richiesta';
          if (!formData.legalProvince.trim()) newErrors.legalProvince = 'Provincia richiesta';
        } else if (registrationType === 'company') {
          // Società: richiede anche ragione sociale
          if (!formData.businessName.trim()) newErrors.businessName = 'Ragione sociale richiesta';
          if (!formData.vatNumber.trim()) newErrors.vatNumber = 'Partita IVA richiesta';
          else if (formData.vatNumber.length !== 11) {
            newErrors.vatNumber = 'Partita IVA deve essere di 11 cifre';
          }
          if (!formData.companyPhone.trim()) newErrors.companyPhone = 'Telefono aziendale richiesto';
          if (!formData.companyEmail.trim()) newErrors.companyEmail = 'Email aziendale richiesta';
          if (!formData.legalAddress.trim()) newErrors.legalAddress = 'Indirizzo sede legale richiesto';
          if (!formData.legalCity.trim()) newErrors.legalCity = 'Città sede legale richiesta';
          if (!formData.legalProvince.trim()) newErrors.legalProvince = 'Provincia richiesta';
          if (!formData.legalPostalCode.trim()) newErrors.legalPostalCode = 'CAP richiesto';
        }
        break;
        
      case 4: // Documenti
        if (!formData.identityDocument) newErrors.identityDocument = 'Documento identità richiesto';
        if (registrationType === 'company' && !formData.vatCertificate) {
          newErrors.vatCertificate = 'Certificato P.IVA richiesto per aziende';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Se step 2 e lavoratore occasionale, salta step 3 (dati fiscali)
      if (currentStep === 2 && registrationType === 'occasional') {
        setCurrentStep(4);
      } else if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        // Submit
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === 4 && registrationType === 'occasional') {
      setCurrentStep(2);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const dataToSend = new FormData();
    
    // Aggiungi tipo registrazione e attività
    dataToSend.append('registrationType', registrationType || '');
    dataToSend.append('activityType', activityType || '');
    
    // Aggiungi dati personali (per tutti)
    dataToSend.append('firstName', formData.firstName);
    dataToSend.append('lastName', formData.lastName);
    dataToSend.append('personalFiscalCode', formData.personalFiscalCode);
    dataToSend.append('email', formData.email);
    dataToSend.append('personalPhone', formData.personalPhone);
    dataToSend.append('password', formData.password);
    dataToSend.append('personalAddress', formData.personalAddress);
    dataToSend.append('personalCity', formData.personalCity);
    dataToSend.append('personalProvince', formData.personalProvince);
    dataToSend.append('personalPostalCode', formData.personalPostalCode);
    dataToSend.append('professionId', formData.professionId);
    dataToSend.append('yearsExperience', formData.yearsExperience);
    
    // Aggiungi dati fiscali (NON per lavoratore occasionale)
    if (registrationType !== 'occasional') {
      dataToSend.append('vatNumber', formData.vatNumber);
      dataToSend.append('companyPhone', formData.companyPhone);
      dataToSend.append('companyEmail', formData.companyEmail);
      dataToSend.append('pec', formData.pec || '');
      dataToSend.append('sdiCode', formData.sdiCode || '');
      
      // Dati sede
      if (registrationType === 'individual' && !formData.hasOperativeAddress) {
        // Usa residenza come sede
        dataToSend.append('legalAddress', formData.personalAddress);
        dataToSend.append('legalCity', formData.personalCity);
        dataToSend.append('legalProvince', formData.personalProvince);
        dataToSend.append('legalPostalCode', formData.personalPostalCode);
      } else {
        dataToSend.append('legalAddress', formData.legalAddress);
        dataToSend.append('legalCity', formData.legalCity);
        dataToSend.append('legalProvince', formData.legalProvince);
        dataToSend.append('legalPostalCode', formData.legalPostalCode);
      }
    }
    
    // Aggiungi dati azienda (solo per company)
    if (registrationType === 'company') {
      dataToSend.append('businessName', formData.businessName);
      dataToSend.append('companyFiscalCode', formData.companyFiscalCode || '');
      dataToSend.append('companyRole', formData.companyRole);
      
      if (formData.hasOperativeAddress) {
        dataToSend.append('hasOperativeAddress', 'true');
        dataToSend.append('operativeAddress', formData.operativeAddress);
        dataToSend.append('operativeCity', formData.operativeCity);
        dataToSend.append('operativeProvince', formData.operativeProvince);
        dataToSend.append('operativePostalCode', formData.operativePostalCode);
      }
    }
    
    // Aggiungi documenti
    if (formData.identityDocument) {
      dataToSend.append('identityDocument', formData.identityDocument);
    }
    if (formData.vatCertificate) {
      dataToSend.append('vatCertificate', formData.vatCertificate);
    }
    if (formData.chamberOfCommerce) {
      dataToSend.append('chamberOfCommerce', formData.chamberOfCommerce);
    }
    
    try {
      // Chiama API di registrazione
      const response = await api.post('/auth/register-professional', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Registrazione completata! Un amministratore verificherà la tua richiesta.');
      navigate('/pending-approval');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore durante la registrazione');
    }
  };

  // Determina quali step mostrare
  const activeSteps = registrationType === 'individual' 
    ? steps.filter(s => s.id !== 3)
    : steps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Registrazione Professionista
          </h1>
          <p className="mt-2 text-gray-600">
            Unisciti alla nostra rete di professionisti qualificati
          </p>
        </div>

        {/* Progress */}
        {registrationType && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {activeSteps.map((step, index) => {
                const Icon = step.icon;
                const stepNumber = step.id === 4 && registrationType === 'individual' ? 3 : step.id;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2
                      ${isCompleted ? 'bg-green-600 border-green-600 text-white' 
                        : isActive ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'}
                    `}>
                      {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    {index < activeSteps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          {/* Step 1: Tipo Registrazione */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">
                Che tipo di attività svolgi?
              </h2>
              
              <div className="space-y-4">
                {/* Lavoratore Occasionale */}
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('occasional');
                    setActivityType('OCCASIONAL');
                  }}
                  className={`
                    w-full p-6 rounded-lg border-2 text-left transition-all
                    ${registrationType === 'occasional'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="flex items-start">
                    <UserIcon className="h-8 w-8 text-green-600 mr-4 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">🙋 Lavoratore Occasionale</h3>
                      <p className="text-gray-600 mt-1">
                        Lavoro saltuariamente, <strong>senza Partita IVA</strong>
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-gray-500">
                        <li>✓ Massimo €5.000/anno per committente</li>
                        <li>✓ Solo codice fiscale personale</li>
                        <li>✓ Ritenuta d'acconto del 20%</li>
                        <li>✓ Max 30 giorni/anno stesso committente</li>
                      </ul>
                      <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                        ⚠️ Ideale per piccoli lavori sporadici
                      </div>
                    </div>
                  </div>
                </button>

                {/* Ditta Individuale */}
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('individual');
                    setActivityType('INDIVIDUAL');
                  }}
                  className={`
                    w-full p-6 rounded-lg border-2 text-left transition-all
                    ${registrationType === 'individual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="flex items-start">
                    <BriefcaseIcon className="h-8 w-8 text-blue-600 mr-4 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">👷 Ditta Individuale / Libero Professionista</h3>
                      <p className="text-gray-600 mt-1">
                        Partita IVA individuale, lavoro in proprio
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-gray-500">
                        <li>✓ Partita IVA personale</li>
                        <li>✓ Fatturazione elettronica</li>
                        <li>✓ PEC e codice SDI</li>
                        <li>✓ Sede = residenza o altro indirizzo</li>
                      </ul>
                    </div>
                  </div>
                </button>

                {/* Società */}
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('company');
                    setActivityType('COMPANY');
                  }}
                  className={`
                    w-full p-6 rounded-lg border-2 text-left transition-all
                    ${registrationType === 'company'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="flex items-start">
                    <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mr-4 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">🏢 Società (S.r.l., S.n.c., S.a.s., etc.)</h3>
                      <p className="text-gray-600 mt-1">
                        Lavoro per una società o ne sono titolare
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-gray-500">
                        <li>✓ Ragione sociale</li>
                        <li>✓ Partita IVA aziendale</li>
                        <li>✓ Sede legale e operativa</li>
                        <li>✓ Possibilità di aggiungere dipendenti</li>
                      </ul>
                    </div>
                  </div>
                </button>
              </div>

              {errors.registrationType && (
                <p className="text-red-500 text-sm mt-2">{errors.registrationType}</p>
              )}
            </div>
          )}

          {/* Step 2: Dati Personali */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">
                I tuoi dati personali
              </h2>

              {/* Nome e Cognome */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cognome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Codice Fiscale Personale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale Personale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personalFiscalCode}
                  onChange={(e) => setFormData({...formData, personalFiscalCode: e.target.value.toUpperCase()})}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.personalFiscalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="RSSMRA85M01H501Z"
                  maxLength={16}
                />
                {errors.personalFiscalCode && <p className="text-red-500 text-xs mt-1">{errors.personalFiscalCode}</p>}
              </div>

              {/* Contatti */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.personalPhone}
                    onChange={(e) => setFormData({...formData, personalPhone: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.personalPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.personalPhone && <p className="text-red-500 text-xs mt-1">{errors.personalPhone}</p>}
                </div>
              </div>

              {/* Indirizzo Personale */}
              <div>
                <h3 className="font-medium mb-3">📍 Indirizzo di Residenza</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.personalAddress}
                    onChange={(e) => setFormData({...formData, personalAddress: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Via/Piazza e numero civico"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={formData.personalCity}
                      onChange={(e) => setFormData({...formData, personalCity: e.target.value})}
                      className={`px-4 py-2 border rounded-lg ${
                        errors.personalCity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Città *"
                    />
                    <input
                      type="text"
                      value={formData.personalProvince}
                      onChange={(e) => setFormData({...formData, personalProvince: e.target.value.toUpperCase()})}
                      className={`px-4 py-2 border rounded-lg ${
                        errors.personalProvince ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Prov *"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={formData.personalPostalCode}
                      onChange={(e) => setFormData({...formData, personalPostalCode: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="CAP"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Professione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professione <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {professions.map(prof => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => setFormData({...formData, professionId: prof.id})}
                      className={`p-3 rounded-lg border-2 ${
                        formData.professionId === prof.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {prof.name}
                    </button>
                  ))}
                </div>
                {errors.professionId && <p className="text-red-500 text-xs mt-1">{errors.professionId}</p>}
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conferma Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Dati Fiscali (per ditta individuale e società) */}
          {currentStep === 3 && (registrationType === 'individual' || registrationType === 'company') && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">
                {registrationType === 'individual' ? 'Dati Fiscali e Professionali' : 'Dati Aziendali'}
              </h2>

              {/* Ragione Sociale (solo per società) */}
              {registrationType === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ragione Sociale <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mario Rossi S.r.l."
                  />
                  {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                </div>
              )}

              {/* Partita IVA (per tutti) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partita IVA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.vatNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345678901"
                    maxLength={11}
                  />
                  {errors.vatNumber && <p className="text-red-500 text-xs mt-1">{errors.vatNumber}</p>}
                </div>
                
                {/* Codice Fiscale aziendale (solo per società) */}
                {registrationType === 'company' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Codice Fiscale Aziendale
                      <span className="text-gray-400 text-xs ml-1">(se diverso da P.IVA)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyFiscalCode}
                      onChange={(e) => setFormData({...formData, companyFiscalCode: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      maxLength={16}
                    />
                  </div>
                )}
              </div>

              {/* Contatti Professionali/Aziendali */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  📞 Contatti Professionali
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (obbligatori per ricevere richieste)
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono {registrationType === 'individual' ? 'Professionale' : 'Aziendale'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.companyPhone}
                      onChange={(e) => setFormData({...formData, companyPhone: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.companyPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="333 1234567"
                    />
                    {errors.companyPhone && <p className="text-red-500 text-xs mt-1">{errors.companyPhone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email {registrationType === 'individual' ? 'Professionale' : 'Aziendale'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({...formData, companyEmail: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.companyEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={registrationType === 'individual' ? 'info@mariorossi.it' : 'info@azienda.it'}
                    />
                    {errors.companyEmail && <p className="text-red-500 text-xs mt-1">{errors.companyEmail}</p>}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Potrai scegliere quali contatti mostrare ai clienti dal tuo profilo dopo l'approvazione
                </p>
              </div>

              {/* PEC e SDI (per tutti) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PEC <span className="text-gray-400">(consigliata)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.pec}
                    onChange={(e) => setFormData({...formData, pec: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="mario.rossi@pec.it"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice SDI <span className="text-gray-400">(per fatturazione)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sdiCode}
                    onChange={(e) => setFormData({...formData, sdiCode: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="XXXXXXX o 0000000"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Sede Attività */}
              <div>
                <h3 className="font-medium mb-3">
                  🏢 {registrationType === 'individual' ? 'Sede Attività' : 'Sede Legale'}
                </h3>
                
                {registrationType === 'individual' && (
                  <div className="mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!formData.hasOperativeAddress}
                        onChange={(e) => setFormData({...formData, hasOperativeAddress: !e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Uso la mia residenza come sede attività</span>
                    </label>
                  </div>
                )}
                
                {(registrationType === 'company' || formData.hasOperativeAddress) && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.legalAddress}
                      onChange={(e) => setFormData({...formData, legalAddress: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.legalAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Via/Piazza e numero civico"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={formData.legalCity}
                        onChange={(e) => setFormData({...formData, legalCity: e.target.value})}
                        className={`px-4 py-2 border rounded-lg ${
                          errors.legalCity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Città *"
                      />
                      <input
                        type="text"
                        value={formData.legalProvince}
                        onChange={(e) => setFormData({...formData, legalProvince: e.target.value.toUpperCase()})}
                        className={`px-4 py-2 border rounded-lg ${
                          errors.legalProvince ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Prov *"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={formData.legalPostalCode}
                        onChange={(e) => setFormData({...formData, legalPostalCode: e.target.value})}
                        className={`px-4 py-2 border rounded-lg ${
                          errors.legalPostalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="CAP"
                        maxLength={5}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sede Operativa (solo per società) */}
              {registrationType === 'company' && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasOperativeAddress}
                      onChange={(e) => setFormData({...formData, hasOperativeAddress: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="font-medium">La sede operativa è diversa dalla sede legale</span>
                  </label>
                  
                  {formData.hasOperativeAddress && (
                    <div className="mt-3 space-y-3">
                      <input
                        type="text"
                        value={formData.operativeAddress}
                        onChange={(e) => setFormData({...formData, operativeAddress: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Via/Piazza e numero civico"
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={formData.operativeCity}
                          onChange={(e) => setFormData({...formData, operativeCity: e.target.value})}
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Città"
                        />
                        <input
                          type="text"
                          value={formData.operativeProvince}
                          onChange={(e) => setFormData({...formData, operativeProvince: e.target.value.toUpperCase()})}
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Prov"
                          maxLength={2}
                        />
                        <input
                          type="text"
                          value={formData.operativePostalCode}
                          onChange={(e) => setFormData({...formData, operativePostalCode: e.target.value})}
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="CAP"
                          maxLength={5}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ruolo (solo per società) */}
              {registrationType === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Il tuo ruolo nell'azienda
                  </label>
                  <select
                    value={formData.companyRole}
                    onChange={(e) => setFormData({...formData, companyRole: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="OWNER">Titolare/Amministratore</option>
                    <option value="EMPLOYEE">Dipendente</option>
                    <option value="COLLABORATOR">Collaboratore/Freelance</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Documenti */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">
                Documenti Necessari
              </h2>

              <div className="space-y-4">
                {/* Documento Identità */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento d'Identità <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({...formData, identityDocument: e.target.files?.[0] || null})}
                    className="w-full"
                    accept="image/*,.pdf"
                  />
                  {errors.identityDocument && <p className="text-red-500 text-xs mt-1">{errors.identityDocument}</p>}
                </div>

                {/* Documenti Azienda (solo se company) */}
                {registrationType === 'company' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificato Partita IVA <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFormData({...formData, vatCertificate: e.target.files?.[0] || null})}
                        className="w-full"
                        accept="image/*,.pdf"
                      />
                      {errors.vatCertificate && <p className="text-red-500 text-xs mt-1">{errors.vatCertificate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visura Camerale <span className="text-gray-400">(opzionale)</span>
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFormData({...formData, chamberOfCommerce: e.target.files?.[0] || null})}
                        className="w-full"
                        accept="image/*,.pdf"
                      />
                    </div>
                  </>
                )}

                <div className="p-4 bg-blue-50 rounded-lg">
                  <ExclamationCircleIcon className="h-5 w-5 text-blue-600 inline mr-2" />
                  <span className="text-sm text-blue-800">
                    Altri documenti (certificazioni, assicurazione, etc.) potrai aggiungerli dopo l'approvazione
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Indietro
              </button>
            )}
            
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
            >
              {currentStep === 4 ? 'Invia Registrazione' : 'Continua'}
              <ArrowRightIcon className="h-4 w-4 inline ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
