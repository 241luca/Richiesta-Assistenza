import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyEuroIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useSystemSettingsMap } from '@/hooks/useSystemSettings';

export default function GuaranteesPage() {
  const navigate = useNavigate();
  const { settings, isLoading } = useSystemSettingsMap();

  const siteName = settings.site_name || 'Richiesta Assistenza';
  const siteLogo = settings.site_logo_url || '/logo.svg';
  const companyName = settings.company_name || 'LM Tecnologie';
  const contactPhone = settings.contact_phone || '+39 06 123456';
  const supportEmail = settings.support_email || 'supporto@lmtecnologie.it';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
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
            <h1 className="text-4xl font-bold mb-4">🛡️ Le Nostre Garanzie</h1>
            <p className="text-xl opacity-90">La tua tranquillità è la nostra priorità</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Garanzie Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Garanzia Soddisfatti o Rimborsati */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              100% Garantito
            </h3>
            <p className="text-center text-gray-600 font-medium mb-2">
              Soddisfatti o Rimborsati
            </p>
            <p className="text-sm text-gray-500 text-center">
              Se non sei soddisfatto, rimborso totale entro 14 giorni
            </p>
          </div>

          {/* Garanzia Lavoro */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Garanzia 24 mesi
            </h3>
            <p className="text-center text-gray-600 font-medium mb-2">
              Su tutti i lavori
            </p>
            <p className="text-sm text-gray-500 text-center">
              Copertura completa per 24 mesi dalla data di completamento
            </p>
          </div>

          {/* Assicurazione */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
              <CurrencyEuroIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Assicurato €100.000
            </h3>
            <p className="text-center text-gray-600 font-medium mb-2">
              Copertura danni
            </p>
            <p className="text-sm text-gray-500 text-center">
              Assicurazione RC professionale per eventuali danni
            </p>
          </div>

          {/* Professionisti Verificati */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
              <CheckBadgeIcon className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Professionisti Verificati
            </h3>
            <p className="text-center text-gray-600 font-medium mb-2">
              Solo esperti certificati
            </p>
            <p className="text-sm text-gray-500 text-center">
              Tutti i professionisti sono verificati e certificati
            </p>
          </div>
        </div>

        {/* Dettagli Garanzie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Soddisfatti o Rimborsati - Dettagli */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                💯 Soddisfatti o Rimborsati
              </h2>
            </div>
            
            <p className="text-gray-700 mb-6">
              Se non sei completamente soddisfatto del lavoro svolto, hai <strong>14 giorni</strong> 
              dalla data di completamento per richiedere il rimborso totale. Nessuna domanda, 
              nessuna complicazione.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Valido su tutti i servizi senza eccezioni</span>
              </div>
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">14 giorni di tempo dalla fine del lavoro</span>
              </div>
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Rimborso entro 5 giorni lavorativi</span>
              </div>
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Nessuna penale o costo aggiuntivo</span>
              </div>
            </div>
          </div>

          {/* Garanzia Lavoro - Dettagli */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                ⏰ Garanzia Lavoro 24 Mesi
              </h2>
            </div>
            
            <p className="text-gray-700 mb-6">
              Tutti i lavori eseguiti dai nostri professionisti sono garantiti per 
              <strong> 24 mesi</strong> dalla data di completamento. Se qualcosa non va 
              come dovrebbe, interveniamo gratuitamente.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Copertura completa per 24 mesi</span>
              </div>
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Intervento gratuito in caso di problemi</span>
              </div>
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Include materiali e manodopera</span>
              </div>
              <div className="flex items-start">
                <CheckBadgeIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Assistenza telefonica dedicata</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assicurazione e Sicurezza */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Assicurazione RC */}
            <div>
              <div className="flex items-center mb-4">
                <CurrencyEuroIcon className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  🛡️ Assicurazione €100.000
                </h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                Ogni professionista del nostro network è coperto da assicurazione 
                di responsabilità civile fino a <strong>€100.000</strong> per eventuali 
                danni durante il lavoro.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  <span className="text-gray-600">Copertura danni materiali</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  <span className="text-gray-600">Responsabilità civile professionale</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  <span className="text-gray-600">Certificato assicurativo su richiesta</span>
                </div>
              </div>
            </div>

            {/* Professionisti Verificati */}
            <div>
              <div className="flex items-center mb-4">
                <CheckBadgeIcon className="h-8 w-8 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  ✅ Professionisti Verificati
                </h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                Tutti i professionisti del nostro network sono accuratamente selezionati 
                e verificati prima di essere ammessi alla piattaforma.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                  <span className="text-gray-600">Verifica identità e documenti</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                  <span className="text-gray-600">Controllo certificazioni professionali</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                  <span className="text-gray-600">Sistema di rating e recensioni</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Come Richiedere Garanzia */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📋 Come Richiedere la Garanzia
            </h2>
            <p className="text-gray-600">
              Processo semplice e veloce per attivare le tue garanzie
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contattaci</h3>
              <p className="text-sm text-gray-600">
                Chiama il nostro numero verde o invia una email di supporto
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verifica</h3>
              <p className="text-sm text-gray-600">
                Verificheremo i dettagli del lavoro e della garanzia richiesta
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Risoluzione</h3>
              <p className="text-sm text-gray-600">
                Interveniamo rapidamente per risolvere il problema o rimborsarti
              </p>
            </div>
          </div>
        </div>

        {/* Condizioni e Note */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Condizioni e Limitazioni
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">
                  • Le garanzie sono valide solo per lavori regolarmente fatturati attraverso la piattaforma
                </p>
                <p className="mb-2">
                  • La garanzia non copre danni causati da uso improprio o eventi esterni
                </p>
                <p className="mb-2">
                  • Per attivare la garanzia è necessario conservare la documentazione del lavoro
                </p>
                <p>
                  • I termini completi sono disponibili nei nostri Termini di Servizio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            💬 Hai bisogno di aiuto con una garanzia?
          </h2>
          <p className="text-blue-100 mb-6">
            Il nostro team di supporto è sempre disponibile per assisterti
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`tel:${contactPhone}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <PhoneIcon className="h-5 w-5 mr-2" />
              Chiama ora
            </a>
            
            <a 
              href={`mailto:${supportEmail}?subject=Richiesta%20Garanzia`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white/20 text-white border-2 border-white rounded-lg hover:bg-white/30 transition-colors font-medium"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Invia Email
            </a>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-blue-900 font-medium mb-2">
                💡 Garanzie sempre attive
              </h4>
              <p className="text-blue-800 text-sm">
                Tutte le garanzie si attivano automaticamente al completamento del lavoro. 
                Non devi fare nulla di speciale - sei già protetto! Conserva solo la ricevuta 
                del lavoro che ti verrà inviata via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}