import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useSystemSettingsMap } from '@/hooks/useSystemSettings';

export default function ContactPage() {
  const navigate = useNavigate();
  const { settings, isLoading } = useSystemSettingsMap();

  // Recupera le impostazioni dal sistema
  const siteName = settings.site_name || 'Richiesta Assistenza';
  const siteLogo = settings.site_logo_url || '/logo.svg';
  const siteClaim = settings.site_claim || 'Il tuo problema, la nostra soluzione!';
  const companyName = settings.company_name || 'LM Tecnologie';
  const companyDescription = settings.company_description || 
    'Siamo specializzati nella gestione professionale delle richieste di assistenza tecnica, mettendo in contatto clienti e professionisti qualificati per risolvere ogni tipo di problema.';
  
  const contactPhone = settings.contact_phone || settings.company_phone || '+39 06 123456';
  const contactEmail = settings.contact_email || settings.company_email || 'info@lmtecnologie.it';
  const contactAddress = settings.contact_address || settings.company_address || 'Via Roma 123';
  const contactCity = settings.contact_city || 'Roma';
  const contactCap = settings.contact_cap || '00100';
  const contactCountry = settings.contact_country || 'Italia';
  const contactHours = settings.contact_hours || 'Lun-Ven: 9:00-18:00, Sab: 9:00-13:00';

  const whatsappNumber = settings.whatsapp_number || '+39 366 1234567';
  const supportEmail = settings.support_email || 'supporto@lmtecnologie.it';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bottone Torna Indietro */}
          <div className="pt-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Torna indietro"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Torna indietro
            </button>
          </div>
          
          <div className="py-16 text-center">
            {siteLogo && (
              <img 
                src={siteLogo} 
                alt={siteName} 
                className="h-20 w-auto mx-auto mb-6 filter brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <h1 className="text-4xl font-bold mb-4">Contattaci</h1>
            <p className="text-xl opacity-90">{siteClaim}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Company Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{companyName}</h2>
              <p className="text-gray-600 mb-6">{companyDescription}</p>
              
              <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <PhoneIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Telefono</p>
                    <a href={`tel:${contactPhone}`} className="text-blue-600 hover:text-blue-700 transition-colors">
                      {contactPhone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <a href={`mailto:${contactEmail}`} className="text-purple-600 hover:text-purple-700 transition-colors">
                      {contactEmail}
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPinIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Indirizzo</p>
                    <p className="text-gray-600">
                      {contactAddress}<br />
                      {contactCap} {contactCity}<br />
                      {contactCountry}
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Orari</p>
                    <p className="text-gray-600">{contactHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Support Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-green-600" />
                Supporto Rapido
              </h3>
              <div className="space-y-3">
                <a 
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  WhatsApp
                </a>
                <a 
                  href={`mailto:${supportEmail}`}
                  className="flex items-center justify-center w-full bg-white text-green-600 border-2 border-green-600 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  Email Supporto
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Inviaci un messaggio</h2>
              <p className="text-gray-600 mb-6">
                Compila il modulo sottostante e ti risponderemo il prima possibile.
              </p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Il tuo nome"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Il tuo cognome"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="tua@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Oggetto *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Come possiamo aiutarti?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Messaggio *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Scrivi qui il tuo messaggio..."
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    required
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">
                    Accetto la <Link to="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> e 
                    i <Link to="/legal/terms" className="text-blue-600 hover:underline"> Termini di Servizio</Link> *
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    Invia Messaggio
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perché Scegliere {siteName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Professionalità</h3>
              <p className="text-gray-600">
                Professionisti qualificati e verificati pronti a risolvere ogni tua esigenza.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rapidità</h3>
              <p className="text-gray-600">
                Risposte veloci e interventi tempestivi per minimizzare i tuoi disagi.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Supporto</h3>
              <p className="text-gray-600">
                Assistenza dedicata disponibile per guidarti in ogni fase del processo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}