import { Link } from 'react-router-dom';
import { UserIcon, BriefcaseIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export function RegisterChoicePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Scegli il tipo di account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Seleziona il tipo di registrazione più adatto alle tue esigenze
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="space-y-4">
          
          {/* Card Cliente */}
          <Link
            to="/register/client"
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-500"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  Sono un Cliente
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Registrati per richiedere assistenza e servizi professionali
                </p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Richiedi preventivi gratuiti
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Confronta professionisti qualificati
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Gestisci le tue richieste online
                  </li>
                </ul>
              </div>
            </div>
          </Link>

          {/* Card Professionista */}
          <Link
            to="/register/professional"
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-500"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BriefcaseIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  Sono un Professionista
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Registrati per offrire i tuoi servizi e trovare nuovi clienti
                </p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Ricevi richieste nella tua zona
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Gestisci preventivi e interventi
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Espandi la tua attività
                  </li>
                </ul>
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  <strong>Nota:</strong> La registrazione richiede dati aziendali e sarà soggetta ad approvazione
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Link per tornare al login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Torna al login
          </Link>
        </div>
        
        {/* Testo informativo */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            <strong>Hai già un account?</strong>{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Accedi qui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
