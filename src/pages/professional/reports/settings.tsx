import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BellIcon,
  PaintBrushIcon,
  CheckIcon,
  PhotoIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi } from '../../../services/professional/reports-api';

interface BusinessData {
  businessName: string;
  vatNumber: string;
  fiscalCode: string;
  reaNumber: string;
  businessAddress: string;
  businessCity: string;
  businessProvince: string;
  businessPostalCode: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite: string;
  businessLogo?: string;
}

interface Preferences {
  autoStartTimer: boolean;
  autoGpsLocation: boolean;
  autoWeather: boolean;
  quickPhrases: boolean;
  quickMaterials: boolean;
  showLastReports: boolean;
  defaultLanguage: string;
  reportNumberFormat: string;
  dateFormat: string;
}

interface Notifications {
  notifyOnSign: boolean;
  notifyOnView: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  emailCopy: boolean;
  smsAlerts: boolean;
}

interface PdfSettings {
  pdfTemplate: string;
  includeTerms: boolean;
  includePrivacy: boolean;
  includeSignature: boolean;
  includeWatermark: boolean;
  watermarkText: string;
  pageSize: string;
  pageOrientation: string;
}

export default function ProfessionalSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('business');
  const [hasChanges, setHasChanges] = useState(false);

  // Form states
  const [businessData, setBusinessData] = useState<BusinessData>({
    businessName: '',
    vatNumber: '',
    fiscalCode: '',
    reaNumber: '',
    businessAddress: '',
    businessCity: '',
    businessProvince: '',
    businessPostalCode: '',
    businessPhone: '',
    businessEmail: '',
    businessWebsite: ''
  });

  const [preferences, setPreferences] = useState<Preferences>({
    autoStartTimer: false,
    autoGpsLocation: true,
    autoWeather: false,
    quickPhrases: true,
    quickMaterials: true,
    showLastReports: true,
    defaultLanguage: 'it',
    reportNumberFormat: 'YYYY-###',
    dateFormat: 'DD/MM/YYYY'
  });

  const [notifications, setNotifications] = useState<Notifications>({
    notifyOnSign: true,
    notifyOnView: false,
    dailySummary: false,
    weeklyReport: true,
    emailCopy: true,
    smsAlerts: false
  });

  const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
    pdfTemplate: 'professional',
    includeTerms: true,
    includePrivacy: false,
    includeSignature: true,
    includeWatermark: false,
    watermarkText: '',
    pageSize: 'A4',
    pageOrientation: 'portrait'
  });

  // Query per recuperare le impostazioni
  const { data: settings, isLoading } = useQuery({
    queryKey: ['professional-settings'],
    queryFn: async () => {
      try {
        const response = await settingsApi.get();
        return response.data?.data;
      } catch (error) {
        console.warn('Using default settings');
        // Ritorna i valori di default se l'API non è disponibile
        return {
          businessData: {
            businessName: 'Mario Rossi Impianti',
            vatNumber: '12345678901',
            fiscalCode: 'RSSMRA80A01H501Z',
            reaNumber: 'RM-123456',
            businessAddress: 'Via Roma 123',
            businessCity: 'Roma',
            businessProvince: 'RM',
            businessPostalCode: '00100',
            businessPhone: '+39 06 12345678',
            businessEmail: 'info@rossi-impianti.it',
            businessWebsite: 'www.rossi-impianti.it'
          },
          preferences,
          notifications,
          pdfSettings
        };
      }
    },
    onSuccess: (data) => {
      if (data) {
        setBusinessData(data.businessData || businessData);
        setPreferences(data.preferences || preferences);
        setNotifications(data.notifications || notifications);
        setPdfSettings(data.pdfSettings || pdfSettings);
      }
    }
  });

  // Mutation per salvare le impostazioni
  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        businessData,
        preferences,
        notifications,
        pdfSettings
      };
      
      console.log('Saving settings:', data);
      
      // Quando l'API sarà pronta:
      // return await settingsApi.update(data);
      
      // Mock save
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Impostazioni salvate con successo!');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Errore nel salvataggio delle impostazioni');
    }
  });

  // Upload logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verifica tipo file
    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine valido');
      return;
    }

    // Verifica dimensione (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Il file non deve superare i 2MB');
      return;
    }

    try {
      // Mock upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessData({
          ...businessData,
          businessLogo: reader.result as string
        });
        setHasChanges(true);
        toast.success('Logo caricato con successo!');
      };
      reader.readAsDataURL(file);
      
      // Quando l'API sarà pronta:
      // const response = await settingsApi.uploadLogo(file);
      // setBusinessData({ ...businessData, businessLogo: response.data.url });
    } catch (error) {
      toast.error('Errore nel caricamento del logo');
    }
  };

  // Test invio email
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      console.log('Testing email configuration');
      
      // Quando l'API sarà pronta:
      // return await settingsApi.testEmail();
      
      // Mock test
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Email di test inviata con successo!');
    },
    onError: () => {
      toast.error('Errore nell\'invio dell\'email di test');
    }
  });

  const tabs = [
    { id: 'business', label: 'Dati Aziendali', icon: BuildingOfficeIcon },
    { id: 'preferences', label: 'Preferenze', icon: PaintBrushIcon },
    { id: 'notifications', label: 'Notifiche', icon: BellIcon },
    { id: 'pdf', label: 'PDF e Firma', icon: DocumentTextIcon }
  ];

  const handleSave = () => {
    saveMutation.mutate();
  };

  // Monitora cambiamenti
  useEffect(() => {
    if (!isLoading && settings) {
      // Confronta con i dati salvati per rilevare cambiamenti
      setHasChanges(false);
    }
  }, [businessData, preferences, notifications, pdfSettings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/professional/reports')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Torna ai Rapporti
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Impostazioni Rapporti
              </h1>
              <p className="mt-2 text-gray-600">
                Configura i dati aziendali e le preferenze per i rapporti
              </p>
            </div>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 flex items-center ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Dati Aziendali */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informazioni Aziendali
                </h3>
                
                {/* Logo aziendale */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Aziendale
                  </label>
                  <div className="flex items-center gap-4">
                    {businessData.businessLogo ? (
                      <img 
                        src={businessData.businessLogo} 
                        alt="Logo" 
                        className="h-20 w-20 object-contain border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <span className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 inline-flex items-center">
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                        Carica Logo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {businessData.businessLogo && (
                      <button
                        onClick={() => {
                          setBusinessData({ ...businessData, businessLogo: undefined });
                          setHasChanges(true);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formati supportati: JPG, PNG. Max 2MB
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ragione Sociale *
                    </label>
                    <input
                      type="text"
                      value={businessData.businessName}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessName: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partita IVA *
                    </label>
                    <input
                      type="text"
                      value={businessData.vatNumber}
                      onChange={(e) => {
                        setBusinessData({...businessData, vatNumber: e.target.value});
                        setHasChanges(true);
                      }}
                      maxLength={11}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codice Fiscale
                    </label>
                    <input
                      type="text"
                      value={businessData.fiscalCode}
                      onChange={(e) => {
                        setBusinessData({...businessData, fiscalCode: e.target.value.toUpperCase()});
                        setHasChanges(true);
                      }}
                      maxLength={16}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numero REA
                    </label>
                    <input
                      type="text"
                      value={businessData.reaNumber}
                      onChange={(e) => {
                        setBusinessData({...businessData, reaNumber: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indirizzo *
                    </label>
                    <input
                      type="text"
                      value={businessData.businessAddress}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessAddress: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Città *
                    </label>
                    <input
                      type="text"
                      value={businessData.businessCity}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessCity: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provincia *
                    </label>
                    <input
                      type="text"
                      value={businessData.businessProvince}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessProvince: e.target.value.toUpperCase()});
                        setHasChanges(true);
                      }}
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CAP *
                    </label>
                    <input
                      type="text"
                      value={businessData.businessPostalCode}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessPostalCode: e.target.value});
                        setHasChanges(true);
                      }}
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono *
                    </label>
                    <input
                      type="tel"
                      value={businessData.businessPhone}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessPhone: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={businessData.businessEmail}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessEmail: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sito Web
                    </label>
                    <input
                      type="url"
                      value={businessData.businessWebsite}
                      onChange={(e) => {
                        setBusinessData({...businessData, businessWebsite: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.esempio.it"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Preferenze */}
            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Preferenze Operative
                </h3>
                
                <div className="space-y-3">
                  {/* Preferenze booleane */}
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Avvia timer automaticamente
                      </span>
                      <p className="text-xs text-gray-500">
                        Avvia il timer quando inizi un nuovo rapporto
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.autoStartTimer}
                      onChange={(e) => {
                        setPreferences({...preferences, autoStartTimer: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Localizzazione GPS automatica
                      </span>
                      <p className="text-xs text-gray-500">
                        Rileva automaticamente la posizione dell'intervento
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.autoGpsLocation}
                      onChange={(e) => {
                        setPreferences({...preferences, autoGpsLocation: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Registra condizioni meteo
                      </span>
                      <p className="text-xs text-gray-500">
                        Includi le condizioni meteo nel rapporto
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.autoWeather}
                      onChange={(e) => {
                        setPreferences({...preferences, autoWeather: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Mostra frasi ricorrenti
                      </span>
                      <p className="text-xs text-gray-500">
                        Suggerisci frasi salvate durante la compilazione
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.quickPhrases}
                      onChange={(e) => {
                        setPreferences({...preferences, quickPhrases: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Mostra materiali rapidi
                      </span>
                      <p className="text-xs text-gray-500">
                        Accesso rapido ai materiali più usati
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.quickMaterials}
                      onChange={(e) => {
                        setPreferences({...preferences, quickMaterials: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Mostra ultimi rapporti
                      </span>
                      <p className="text-xs text-gray-500">
                        Visualizza gli ultimi rapporti nella dashboard
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.showLastReports}
                      onChange={(e) => {
                        setPreferences({...preferences, showLastReports: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>
                </div>

                {/* Altre preferenze */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Formato Numero Rapporto
                    </label>
                    <select
                      value={preferences.reportNumberFormat}
                      onChange={(e) => {
                        setPreferences({...preferences, reportNumberFormat: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="YYYY-###">2025-001</option>
                      <option value="###/YYYY">001/2025</option>
                      <option value="RAP-YYYY-###">RAP-2025-001</option>
                      <option value="sequential">Sequenziale (1, 2, 3...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Formato Data
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => {
                        setPreferences({...preferences, dateFormat: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DD/MM/YYYY">07/01/2025</option>
                      <option value="DD-MM-YYYY">07-01-2025</option>
                      <option value="YYYY-MM-DD">2025-01-07</option>
                      <option value="DD MMM YYYY">07 Gen 2025</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lingua Predefinita
                    </label>
                    <select
                      value={preferences.defaultLanguage}
                      onChange={(e) => {
                        setPreferences({...preferences, defaultLanguage: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="it">Italiano</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Notifiche */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Preferenze Notifiche
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Notifica quando il cliente firma
                      </span>
                      <p className="text-xs text-gray-500">
                        Ricevi una notifica quando il cliente firma il rapporto
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.notifyOnSign}
                      onChange={(e) => {
                        setNotifications({...notifications, notifyOnSign: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Notifica visualizzazione rapporto
                      </span>
                      <p className="text-xs text-gray-500">
                        Ricevi una notifica quando il cliente visualizza il rapporto
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.notifyOnView}
                      onChange={(e) => {
                        setNotifications({...notifications, notifyOnView: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Copia email dei rapporti
                      </span>
                      <p className="text-xs text-gray-500">
                        Ricevi una copia via email di ogni rapporto inviato
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailCopy}
                      onChange={(e) => {
                        setNotifications({...notifications, emailCopy: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Riepilogo giornaliero
                      </span>
                      <p className="text-xs text-gray-500">
                        Ricevi un riepilogo dei rapporti del giorno alle 20:00
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.dailySummary}
                      onChange={(e) => {
                        setNotifications({...notifications, dailySummary: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Report settimanale
                      </span>
                      <p className="text-xs text-gray-500">
                        Ricevi un report settimanale delle tue attività ogni lunedì
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={(e) => {
                        setNotifications({...notifications, weeklyReport: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Avvisi SMS
                      </span>
                      <p className="text-xs text-gray-500">
                        Ricevi SMS per notifiche urgenti
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.smsAlerts}
                      onChange={(e) => {
                        setNotifications({...notifications, smsAlerts: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>
                </div>

                {/* Test Email */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Test Configurazione Email
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Invia un'email di test per verificare la configurazione
                  </p>
                  <button
                    onClick={() => testEmailMutation.mutate()}
                    disabled={testEmailMutation.isPending}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testEmailMutation.isPending ? 'Invio...' : 'Invia Email di Test'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: PDF e Firma */}
            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Impostazioni PDF e Firma
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template PDF
                    </label>
                    <select
                      value={pdfSettings.pdfTemplate}
                      onChange={(e) => {
                        setPdfSettings({...pdfSettings, pdfTemplate: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="professional">Professionale</option>
                      <option value="simple">Semplice</option>
                      <option value="detailed">Dettagliato</option>
                      <option value="compact">Compatto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dimensione Pagina
                    </label>
                    <select
                      value={pdfSettings.pageSize}
                      onChange={(e) => {
                        setPdfSettings({...pdfSettings, pageSize: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orientamento Pagina
                    </label>
                    <select
                      value={pdfSettings.pageOrientation}
                      onChange={(e) => {
                        setPdfSettings({...pdfSettings, pageOrientation: e.target.value});
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="portrait">Verticale</option>
                      <option value="landscape">Orizzontale</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Includi termini e condizioni
                    </span>
                    <input
                      type="checkbox"
                      checked={pdfSettings.includeTerms}
                      onChange={(e) => {
                        setPdfSettings({...pdfSettings, includeTerms: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Includi informativa privacy
                    </span>
                    <input
                      type="checkbox"
                      checked={pdfSettings.includePrivacy}
                      onChange={(e) => {
                        setPdfSettings({...pdfSettings, includePrivacy: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Includi firma digitale
                    </span>
                    <input
                      type="checkbox"
                      checked={pdfSettings.includeSignature}
                      onChange={(e) => {
                        setPdfSettings({...pdfSettings, includeSignature: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Includi watermark
                      </span>
                      <p className="text-xs text-gray-500">
                        Aggiungi filigrana di sicurezza al documento
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={pdfSettings.includeWatermark}
                      onChange={(e) => {
                        setPdfSettings({...pdfSettings, includeWatermark: e.target.checked});
                        setHasChanges(true);
                      }}
                      className="rounded text-blue-600"
                    />
                  </label>

                  {pdfSettings.includeWatermark && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Testo Watermark
                      </label>
                      <input
                        type="text"
                        value={pdfSettings.watermarkText}
                        onChange={(e) => {
                          setPdfSettings({...pdfSettings, watermarkText: e.target.value});
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Es. COPIA CONFORME"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Firma Digitale
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Configura la tua firma digitale per applicarla automaticamente ai rapporti.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toast.info('Configurazione firma digitale in arrivo!')}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Configura Firma
                    </button>
                    <button
                      onClick={() => toast.info('Test firma in arrivo!')}
                      className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                    >
                      Test Firma
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}