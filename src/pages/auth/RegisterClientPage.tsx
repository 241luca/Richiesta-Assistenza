import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AddressAutocomplete } from '../../components/auth/AddressAutocompleteEnhanced';
import { PrivacyCheckboxes } from '../../components/auth/PrivacyCheckboxes';
import toast from 'react-hot-toast';

// Schema di validazione per Cliente
const clientRegisterSchema = z.object({
  // Dati personali
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  phone: z.string().min(10, 'Numero di telefono non valido'),
  dateOfBirth: z.string().optional(),
  codiceFiscale: z.string().length(16, 'Codice fiscale deve essere di 16 caratteri').optional().or(z.literal('')),
  
  // Indirizzo
  address: z.string().min(5, 'Indirizzo richiesto'),
  city: z.string().min(2, 'Città richiesta'),
  province: z.string().length(2, 'Provincia deve essere di 2 caratteri'),
  postalCode: z.string().regex(/^\d{5}$/, 'CAP deve essere di 5 cifre'),
  
  // Privacy
  privacyAccepted: z.boolean().refine(val => val === true, 'Devi accettare la privacy policy'),
  termsAccepted: z.boolean().refine(val => val === true, 'Devi accettare i termini e condizioni'),
  marketingAccepted: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type ClientRegisterFormData = z.infer<typeof clientRegisterSchema>;

export function RegisterClientPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressData, setAddressData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger
  } = useForm<ClientRegisterFormData>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: {
      privacyAccepted: false,
      termsAccepted: false,
      marketingAccepted: false,
    },
  });

  // Osserva i valori dei checkbox
  const watchPrivacy = watch('privacyAccepted', false);
  const watchTerms = watch('termsAccepted', false);

  const handleAddressSelect = (address: any) => {
    // Salva immediatamente i valori nel form
    setValue('address', address.street, { shouldValidate: true });
    setValue('city', address.city, { shouldValidate: true });
    setValue('province', address.province, { shouldValidate: true });
    setValue('postalCode', address.postalCode, { shouldValidate: true });
    setAddressData(address);
    
    // Trigger per mantenere i valori
    trigger(['address', 'city', 'province', 'postalCode']);
  };

  const onSubmit = async (data: ClientRegisterFormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepara i dati per il backend
      const registrationData = {
        ...data,
        role: 'CLIENT',
        username: data.email.split('@')[0] + Math.random().toString(36).substring(7),
        fullName: `${data.firstName} ${data.lastName}`,
        latitude: addressData?.latitude,
        longitude: addressData?.longitude,
        privacyAcceptedAt: data.privacyAccepted ? new Date().toISOString() : null,
        termsAcceptedAt: data.termsAccepted ? new Date().toISOString() : null,
        marketingAcceptedAt: data.marketingAccepted ? new Date().toISOString() : null,
      };

      // Rimuovi confirmPassword prima di inviare
      delete (registrationData as any).confirmPassword;

      const result = await registerUser(registrationData);
      
      if (result.success) {
        toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.');
        navigate('/login');
      } else {
        // Gestione errori specifici
        const errorMessage = result.error || 'Errore durante la registrazione';
        
        // Personalizza messaggi per errori comuni
        if (errorMessage.includes('EMAIL_ALREADY_EXISTS') || errorMessage.includes('email')) {
          toast.error('Questa email è già registrata. Prova ad accedere o usa un\'altra email.');
        } else if (errorMessage.includes('CF_ALREADY_EXISTS')) {
          toast.error('Questo codice fiscale è già registrato nel sistema.');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Errore registrazione:', error);
      
      // Gestione errori dal server
      const errorResponse = error.response?.data;
      let errorMessage = 'Errore durante la registrazione';
      
      if (errorResponse) {
        // Log per debug
        console.log('Error response:', errorResponse);
        
        // Estrai il messaggio di errore
        errorMessage = errorResponse.message || errorResponse.error || errorMessage;
        
        // Se ci sono errori di validazione specifici
        if (errorResponse.data && Array.isArray(errorResponse.data)) {
          const validationErrors = errorResponse.data.map((err: any) => 
            `${err.path?.join('.')}: ${err.message}`
          ).join(', ');
          errorMessage = `Errori di validazione: ${validationErrors}`;
        }
      }
      
      // Mostra messaggi specifici
      if (errorMessage.includes('email')) {
        toast.error('Questa email è già registrata. Prova ad accedere o usa un\'altra email.');
      } else if (errorMessage.includes('codice fiscale')) {
        toast.error('Questo codice fiscale è già registrato nel sistema.');
      } else if (errorMessage.includes('validation')) {
        toast.error('Controlla che tutti i campi siano compilati correttamente.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'phone'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['password', 'confirmPassword'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/register" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Torna alla scelta profilo
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Registrazione Cliente
          </h2>
          <p className="mt-2 text-gray-600">
            Crea il tuo account per richiedere assistenza
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-24 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-24 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <div className={`w-24 h-1 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                4
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600 px-8">
            <span>Dati personali</span>
            <span>Sicurezza</span>
            <span>Indirizzo</span>
            <span>Privacy</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Dati Personali */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Personali</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('firstName')}
                        type="text"
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Mario"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Cognome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cognome *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('lastName')}
                        type="text"
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Rossi"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="mario.rossi@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Telefono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono *
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('phone')}
                      type="tel"
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+39 333 1234567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data di nascita */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data di nascita
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('dateOfBirth')}
                        type="date"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Codice Fiscale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Codice Fiscale
                    </label>
                    <div className="relative">
                      <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('codiceFiscale')}
                        type="text"
                        maxLength={16}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase ${
                          errors.codiceFiscale ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="RSSMRA80A01H501T"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    {errors.codiceFiscale && (
                      <p className="mt-1 text-sm text-red-600">{errors.codiceFiscale.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continua →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Password */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sicurezza Account</h3>
                
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full pr-10 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Minimo 8 caratteri"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Conferma Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conferma Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full pr-10 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ripeti la password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Suggerimenti password */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Requisiti password:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Almeno 8 caratteri
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Combina lettere maiuscole e minuscole
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Includi numeri e caratteri speciali
                    </li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Indietro
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continua →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Indirizzo */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo di Residenza</h3>
                
                {/* Indirizzo con Autocompletamento */}
                <AddressAutocomplete
                  onAddressSelect={handleAddressSelect}
                  label="Indirizzo completo *"
                  placeholder="Inizia a digitare il tuo indirizzo..."
                  required
                  error={errors.address?.message}
                  defaultValue={watch('address')} // Mantiene il valore
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Città */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Città *
                    </label>
                    <input
                      type="text"
                      value={watch('city') || ''} // Valore controllato con fallback
                      onChange={(e) => setValue('city', e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Roma"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>

                  {/* Provincia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia *
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={watch('province') || ''} // Valore controllato con fallback
                      onChange={(e) => setValue('province', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase ${
                        errors.province ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="RM"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.province && (
                      <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
                    )}
                  </div>
                </div>

                {/* CAP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAP *
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={watch('postalCode') || ''} // Valore controllato con fallback
                    onChange={(e) => setValue('postalCode', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.postalCode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="00100"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Indietro
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continua →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Privacy */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy e Consensi</h3>
                
                <PrivacyCheckboxes
                  privacyAccepted={watchPrivacy}
                  termsAccepted={watchTerms}
                  marketingAccepted={watch('marketingAccepted', false)}
                  onPrivacyChange={(value) => setValue('privacyAccepted', value)}
                  onTermsChange={(value) => setValue('termsAccepted', value)}
                  onMarketingChange={(value) => setValue('marketingAccepted', value)}
                  errors={{
                    privacy: errors.privacyAccepted?.message,
                    terms: errors.termsAccepted?.message
                  }}
                />

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Indietro
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !watchPrivacy || !watchTerms}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Registrazione...' : 'Completa Registrazione'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Link Login */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Hai già un account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
