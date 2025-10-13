import React, { useState } from 'react';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';
import { 
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  CameraIcon,
  StarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// NUOVA FUNZIONALITÀ: Import componente indirizzo lavoro per professionisti
import { WorkAddressSettings } from '../components/travel/WorkAddressSettings';
// AGGIUNTO: Import autocompletamento per profilo generale
import { PlaceAutocomplete } from '../components/address/PlaceAutocomplete';
// NUOVO: Import componenti Portfolio
import { PortfolioGallery, AddPortfolioModal } from '../components/portfolio';

export function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  // Helper per estrarre città, provincia, CAP e coordinate dai dettagli di Google Places
  const parseAddressDetails = (details: any) => {
    try {
      const comps: any[] = details?.address_components || [];
      const findType = (t: string) => comps.find((c) => c.types?.includes(t));
      const city =
        findType('locality')?.long_name ||
        findType('administrative_area_level_3')?.long_name ||
        findType('sublocality')?.long_name ||
        '';
      const province =
        findType('administrative_area_level_2')?.short_name ||
        findType('administrative_area_level_1')?.short_name ||
        '';
      const postalCode = findType('postal_code')?.long_name || '';
      const latitude = details?.geometry?.location?.lat?.();
      const longitude = details?.geometry?.location?.lng?.();
      return { city, province, postalCode, latitude, longitude };
    } catch (e) {
      return { city: '', province: '', postalCode: '', latitude: undefined, longitude: undefined };
    }
  };
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    postalCode: user?.postalCode || '',
    codiceFiscale: user?.codiceFiscale || '',
    partitaIva: user?.partitaIva || '',
    ragioneSociale: user?.ragioneSociale || '',
    pec: user?.pec || '',
    sdi: user?.sdi || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementare aggiornamento profilo
    toast.success('Profilo aggiornato con successo!');
    setIsEditing(false);
  };

  const handleEditPortfolio = (portfolio: any) => {
    // TODO: Implementare modifica portfolio
  toast('Funzionalità modifica portfolio in arrivo!');
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    // TODO: Implementare eliminazione portfolio
    toast.success('Portfolio eliminato con successo!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Il Mio Profilo</h1>
        <p className="mt-2 text-gray-600">
          Gestisci le tue informazioni personali e professionali
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-20 w-20 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                  <CameraIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-blue-100">{user?.role}</p>
              <p className="text-blue-100">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Informazioni Personali
            </h3>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Modifica
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Salva
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserCircleIcon className="inline h-5 w-5 mr-1" />
                Nome
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserCircleIcon className="inline h-5 w-5 mr-1" />
                Cognome
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <EnvelopeIcon className="inline h-5 w-5 mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="inline h-5 w-5 mr-1" />
                Telefono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Address Information con autocompletamento Google Places */}
            <div className="md:col-span-2">
              <h4 className="text-md font-semibold text-gray-900 mb-4 mt-4">
                <MapPinIcon className="inline h-5 w-5 mr-1" />
                Indirizzo di Residenza
              </h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>Autocompletamento Google:</strong> Digita l'indirizzo e seleziona dai suggerimenti per garantire la massima precisione.
                  </div>
                </div>
              </div>
              
                {isEditing ? (
                <PlaceAutocomplete
                  value={formData.address}
                  onChange={(value, details) => {
                    const parsed = parseAddressDetails(details);
                    setFormData({
                      ...formData,
                      address: value,
                      city: parsed.city || formData.city,
                      province: parsed.province || formData.province,
                      postalCode: parsed.postalCode || formData.postalCode,
                    });
                    console.log('🏠 Indirizzo residenza selezionato:', { value, ...parsed });
                  }}
                  label="Indirizzo completo"
                />
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-sm font-medium text-gray-700">Indirizzo completo:</div>
                    <div className="text-gray-900">
                      {formData.address && formData.city ? 
                        `${formData.address}, ${formData.postalCode} ${formData.city} (${formData.province})` :
                        'Nessun indirizzo configurato'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Fiscal Information */}
            {(user?.role === 'PROFESSIONAL' || user?.role === 'CLIENT') && (
              <>
                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 mt-4">
                    <IdentificationIcon className="inline h-5 w-5 mr-1" />
                    Dati Fiscali
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    name="codiceFiscale"
                    value={formData.codiceFiscale}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    maxLength={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    name="partitaIva"
                    value={formData.partitaIva}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    maxLength={11}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BuildingOfficeIcon className="inline h-5 w-5 mr-1" />
                    Ragione Sociale
                  </label>
                  <input
                    type="text"
                    name="ragioneSociale"
                    value={formData.ragioneSociale}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PEC
                  </label>
                  <input
                    type="email"
                    name="pec"
                    value={formData.pec}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice SDI
                  </label>
                  <input
                    type="text"
                    name="sdi"
                    value={formData.sdi}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    maxLength={7}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow-md rounded-lg mt-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sicurezza Account
        </h3>
        <div className="space-y-4">
          <button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Cambia Password
          </button>
          <button className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ml-0 md:ml-2">
            Abilita Autenticazione a Due Fattori
          </button>
        </div>
      </div>

      {/* NUOVA FUNZIONALITÀ: Competenze e Indirizzo Lavoro - Solo per professionisti */}
      {user?.role === 'PROFESSIONAL' && (
        <>
          {/* Link a Competenze e Tariffe */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <StarIcon className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-blue-900">Gestisci Competenze e Tariffe</h4>
                  <p className="text-sm text-blue-700">Configura le tue specializzazioni, aree di servizio e tariffe di trasferimento</p>
                </div>
              </div>
              <a 
                href="/professional/skills" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Vai alle Competenze →
              </a>
            </div>
          </div>

          {/* ===== NUOVO: SEZIONE PORTFOLIO LAVORI ===== */}
          <div className="bg-white shadow-md rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <PhotoIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Portfolio Lavori
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Mostra i tuoi lavori con foto Prima e Dopo per attirare nuovi clienti
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPortfolio(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Aggiungi Lavoro
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {user?.id && (
                <PortfolioGallery 
                  professionalId={user.id}
                  editable={true}
                  onEdit={handleEditPortfolio}
                  onDelete={handleDeletePortfolio}
                />
              )}
            </div>
          </div>

          {/* Modal per aggiungere portfolio */}
          {user?.id && (
            <AddPortfolioModal
              isOpen={showAddPortfolio}
              onClose={() => setShowAddPortfolio(false)}
              professionalId={user.id}
            />
          )}
          {/* ===== FINE SEZIONE PORTFOLIO ===== */}

          {/* Sezione Indirizzo di Lavoro - IMPORTANTE per calcolo distanze */}
          <div className="bg-white shadow-md rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPinIcon className="h-6 w-6 mr-2 text-blue-600" />
                Indirizzo di Lavoro
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Configura il tuo indirizzo di partenza per il calcolo automatico delle distanze e dei percorsi verso i clienti
              </p>
            </div>
            
            <div className="p-6">
              <WorkAddressSettings onSave={() => toast.success('Indirizzo di lavoro aggiornato!')} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}