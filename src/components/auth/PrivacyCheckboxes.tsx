import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface PrivacyCheckboxesProps {
  privacyAccepted: boolean;
  termsAccepted: boolean;
  marketingAccepted: boolean;
  onPrivacyChange: (value: boolean) => void;
  onTermsChange: (value: boolean) => void;
  onMarketingChange: (value: boolean) => void;
  errors?: {
    privacy?: string;
    terms?: string;
  };
}

export function PrivacyCheckboxes({
  privacyAccepted,
  termsAccepted,
  marketingAccepted,
  onPrivacyChange,
  onTermsChange,
  onMarketingChange,
  errors
}: PrivacyCheckboxesProps) {
  return (
    <div className="space-y-3">
      {/* Privacy Policy - Obbligatorio */}
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id="privacy"
            name="privacy"
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => onPrivacyChange(e.target.checked)}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="privacy" className="font-medium text-gray-700">
            Privacy Policy <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500">
            Accetto l'
            <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500">
              informativa sulla privacy
            </a>
            {' '}e il trattamento dei miei dati personali
          </p>
          {errors?.privacy && (
            <p className="text-sm text-red-600 mt-1">{errors.privacy}</p>
          )}
        </div>
      </div>

      {/* Termini e Condizioni - Obbligatorio */}
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms" className="font-medium text-gray-700">
            Termini e Condizioni <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500">
            Accetto i{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500">
              termini e condizioni
            </a>
            {' '}del servizio
          </p>
          {errors?.terms && (
            <p className="text-sm text-red-600 mt-1">{errors.terms}</p>
          )}
        </div>
      </div>

      {/* Marketing - Opzionale */}
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id="marketing"
            name="marketing"
            type="checkbox"
            checked={marketingAccepted}
            onChange={(e) => onMarketingChange(e.target.checked)}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="marketing" className="font-medium text-gray-700">
            Comunicazioni Marketing
          </label>
          <p className="text-gray-500">
            Desidero ricevere comunicazioni promozionali, offerte e novità sul servizio
          </p>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
        <div className="flex">
          <CheckCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              I campi contrassegnati con <span className="text-red-500">*</span> sono obbligatori per procedere con la registrazione.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
