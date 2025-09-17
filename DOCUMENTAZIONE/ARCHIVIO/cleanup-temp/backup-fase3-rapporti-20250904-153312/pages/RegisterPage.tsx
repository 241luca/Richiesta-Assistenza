import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  phone: z.string().min(10, 'Numero di telefono non valido'),
  role: z.enum(['CLIENT', 'PROFESSIONAL']),
  address: z.string().min(5, 'Indirizzo richiesto'),
  city: z.string().min(2, 'Città richiesta'),
  province: z.string().length(2, 'Provincia deve essere di 2 caratteri'),
  postalCode: z.string().regex(/^\d{5}$/, 'CAP deve essere di 5 cifre'),
  codiceFiscale: z.string().length(16, 'Codice fiscale deve essere di 16 caratteri').optional(),
  partitaIva: z.string().length(11, 'Partita IVA deve essere di 11 cifre').optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Devi accettare i termini e condizioni'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CLIENT',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, acceptTerms, ...registerData } = data;
      await registerUser(registerData);
      
      // Successo - il context gestisce il redirect automatico
      toast.success('Registrazione completata con successo!');
      
      // Redirect basato sul ruolo dopo un breve delay
      setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (currentUser.role === 'PROFESSIONAL') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // AGGIORNATO: Gestisce meglio gli errori del ResponseFormatter
      let errorMessage = 'Errore durante la registrazione';
      
      if (error.message?.includes('already exists')) {
        errorMessage = 'Esiste già un account con questa email';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Registrati</h2>
        <p className="mt-2 text-sm text-gray-600">
          Hai già un account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Accedi
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo di account
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative">
              <input
                {...register('role')}
                type="radio"
                value="CLIENT"
                className="sr-only peer"
              />
              <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50">
                <p className="font-medium">Cliente</p>
                <p className="text-sm text-gray-500">Richiedi assistenza</p>
              </div>
            </label>
            <label className="relative">
              <input
                {...register('role')}
                type="radio"
                value="PROFESSIONAL"
                className="sr-only peer"
              />
              <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50">
                <p className="font-medium">Professionista</p>
                <p className="text-sm text-gray-500">Offri servizi</p>
              </div>
            </label>
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              {...register('firstName')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cognome</label>
            <input
              {...register('lastName')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('email')}
            type="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Telefono</label>
          <input
            {...register('phone')}
            type="tel"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Conferma Password</label>
            <div className="mt-1 relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Indirizzo</label>
          <input
            {...register('address')}
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Città</label>
            <input
              {...register('city')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Provincia</label>
            <input
              {...register('province')}
              type="text"
              maxLength={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.province && (
              <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CAP</label>
            <input
              {...register('postalCode')}
              type="text"
              maxLength={5}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
            )}
          </div>
        </div>

        {/* Fiscal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Codice Fiscale (opzionale)
            </label>
            <input
              {...register('codiceFiscale')}
              type="text"
              maxLength={16}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.codiceFiscale && (
              <p className="mt-1 text-sm text-red-600">{errors.codiceFiscale.message}</p>
            )}
          </div>

          {selectedRole === 'PROFESSIONAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Partita IVA (opzionale)
              </label>
              <input
                {...register('partitaIva')}
                type="text"
                maxLength={11}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.partitaIva && (
                <p className="mt-1 text-sm text-red-600">{errors.partitaIva.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <input
            {...register('acceptTerms')}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Accetto i{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              termini e condizioni
            </Link>{' '}
            e la{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              privacy policy
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
