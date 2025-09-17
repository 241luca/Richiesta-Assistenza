# 📋 FASE 5 - REPORT FORM IMPLEMENTATION

## OBIETTIVO
Implementare il form completo di compilazione rapporti con tutte le funzionalità avanzate.

## DURATA STIMATA: 32 ore

---

## 📁 STRUTTURA FILE DA CREARE

```
src/
├── pages/
│   └── professional/
│       └── reports/
│           ├── create.tsx                # Creazione nuovo rapporto
│           └── edit/[id].tsx            # Modifica rapporto esistente
│
└── components/
    └── reports/
        ├── form/
        │   ├── ReportForm.tsx           # Form principale
        │   ├── FormSections.tsx         # Sezioni del form
        │   ├── FormNavigation.tsx       # Navigazione sezioni
        │   └── FormValidation.tsx       # Validazione form
        ├── fields/
        │   ├── TextField.tsx            # Campo testo
        │   ├── TextAreaField.tsx        # Campo textarea
        │   ├── NumberField.tsx          # Campo numerico
        │   ├── DateField.tsx            # Campo data
        │   ├── TimeField.tsx            # Campo ora
        │   ├── SelectField.tsx          # Campo select
        │   ├── CheckboxField.tsx        # Campo checkbox
        │   ├── RadioField.tsx           # Campo radio
        │   ├── SignatureField.tsx       # Campo firma
        │   ├── PhotoField.tsx           # Campo foto
        │   ├── TimerField.tsx           # Campo timer
        │   ├── GpsField.tsx             # Campo GPS
        │   └── MaterialsField.tsx       # Campo materiali
        ├── widgets/
        │   ├── QuickPhrasesWidget.tsx   # Widget frasi rapide
        │   ├── MaterialsWidget.tsx      # Widget materiali
        │   ├── TimerWidget.tsx          # Widget timer
        │   ├── PhotoUploadWidget.tsx    # Widget upload foto
        │   └── SignatureWidget.tsx      # Widget firma
        └── preview/
            ├── ReportPreview.tsx        # Anteprima rapporto
            ├── PdfPreview.tsx           # Anteprima PDF
            └── PrintPreview.tsx         # Anteprima stampa
```

---

## STEP 5.1 - FORM PRINCIPALE RAPPORTO (8 ore)

### Creare `src/components/reports/form/ReportForm.tsx`:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Save, 
  Send, 
  Eye, 
  Clock, 
  MapPin,
  Camera,
  Package,
  FileSignature,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import FormSections from './FormSections';
import FormNavigation from './FormNavigation';
import QuickPhrasesWidget from '../widgets/QuickPhrasesWidget';
import MaterialsWidget from '../widgets/MaterialsWidget';
import TimerWidget from '../widgets/TimerWidget';
import { apiRequest } from '@/lib/api';

// Schema validazione Zod
const reportSchema = z.object({
  requestId: z.string(),
  typeId: z.string(),
  interventionDate: z.date(),
  startTime: z.string(),
  endTime: z.string().optional(),
  totalHours: z.number().optional(),
  formData: z.record(z.any()),
  materials: z.array(z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    total: z.number()
  })).optional(),
  photos: z.array(z.object({
    type: z.enum(['prima', 'durante', 'dopo']),
    url: z.string(),
    caption: z.string().optional()
  })).optional(),
  clientNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpNotes: z.string().optional()
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportFormProps {
  requestId?: string;
  reportId?: string;
  templateId?: string;
  onSuccess?: () => void;
}

export default function ReportForm({ 
  requestId, 
  reportId, 
  templateId,
  onSuccess 
}: ReportFormProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [isDraft, setIsDraft] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [weather, setWeather] = useState<any>(null);
  
  const autoSaveRef = useRef<NodeJS.Timeout>();

  // Query request data
  const { data: request } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => apiRequest(`/api/requests/${requestId}`),
    enabled: !!requestId
  });

  // Query existing report
  const { data: existingReport } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => apiRequest(`/api/intervention-reports/${reportId}`),
    enabled: !!reportId
  });

  // Query template
  const { data: template } = useQuery({
    queryKey: ['template', templateId || existingReport?.templateId],
    queryFn: () => apiRequest(`/api/intervention-reports/templates/${templateId || existingReport?.templateId}`),
    enabled: !!(templateId || existingReport?.templateId)
  });

  // Form setup
  const methods = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: existingReport || {
      requestId: requestId || '',
      interventionDate: new Date(),
      startTime: new Date().toTimeString().slice(0, 5),
      formData: {},
      materials: [],
      photos: [],
      followUpRequired: false
    }
  });

  const { handleSubmit, watch, setValue, formState: { errors } } = methods;

  // Watch form changes for auto-save
  const formData = watch();
  
  useEffect(() => {
    if (reportId && isDraft) {
      // Auto-save ogni 30 secondi
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      
      autoSaveRef.current = setTimeout(() => {
        saveDraft(formData);
      }, 30000);
    }
    
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [formData, reportId, isDraft]);

  // Mutation salvataggio
  const saveMutation = useMutation({
    mutationFn: (data: { report: ReportFormData, status: string }) => {
      if (reportId) {
        return apiRequest(`/api/intervention-reports/${reportId}`, {
          method: 'PUT',
          data: { ...data.report, status: data.status }
        });
      }
      return apiRequest('/api/intervention-reports', {
        method: 'POST',
        data: { ...data.report, status: data.status }
      });
    },
    onSuccess: (response) => {
      toast.success(isDraft ? 'Bozza salvata' : 'Rapporto salvato');
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error('Errore nel salvataggio');
    }
  });

  // Auto-save draft
  const saveDraft = async (data: ReportFormData) => {
    try {
      await saveMutation.mutateAsync({ 
        report: data, 
        status: 'draft' 
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Submit form
  const onSubmit = async (data: ReportFormData) => {
    try {
      // Calcola ore totali se timer attivo
      if (isTimerRunning) {
        data.totalHours = elapsedTime / 3600;
      }

      // Aggiungi GPS e meteo
      if (gpsLocation) {
        data.formData.gpsLocation = gpsLocation;
      }
      if (weather) {
        data.formData.weather = weather;
      }

      await saveMutation.mutateAsync({ 
        report: data, 
        status: isDraft ? 'draft' : 'completed' 
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  // Timer management
  const startTimer = () => {
    setIsTimerRunning(true);
    setValue('startTime', new Date().toTimeString().slice(0, 5));
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setValue('endTime', new Date().toTimeString().slice(0, 5));
    setValue('totalHours', elapsedTime / 3600);
  };

  // GPS location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('Posizione GPS acquisita');
        },
        (error) => {
          toast.error('Impossibile ottenere la posizione');
        }
      );
    }
  };

  // Weather data
  const getWeatherData = async () => {
    if (!gpsLocation) {
      toast.error('Prima acquisisci la posizione GPS');
      return;
    }

    try {
      const weather = await apiRequest('/api/weather', {
        params: { lat: gpsLocation.lat, lng: gpsLocation.lng }
      });
      setWeather(weather);
      toast.success('Dati meteo acquisiti');
    } catch (error) {
      toast.error('Impossibile ottenere i dati meteo');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="h-full">
        <div className="flex h-full">
          {/* Sidebar sinistra - Navigazione */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <FormNavigation
              sections={template?.sections || []}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              errors={errors}
            />
          </div>

          {/* Area principale - Form */}
          <div className="flex-1 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {reportId ? 'Modifica Rapporto' : 'Nuovo Rapporto'}
                  </h2>
                  {request && (
                    <p className="text-gray-600">
                      {request.title} - {request.client.fullName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    {isDraft ? (
                      <>
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <span className="text-orange-600">Bozza</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-600">Completato</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Anteprima
                    </Button>
                    
                    <Button
                      type="submit"
                      variant={isDraft ? "outline" : "default"}
                      onClick={() => setIsDraft(true)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salva Bozza
                    </Button>
                    
                    <Button
                      type="submit"
                      onClick={() => setIsDraft(false)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Completa
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form content */}
            <div className="p-6">
              <FormSections
                template={template}
                activeSection={activeSection}
              />
            </div>
          </div>

          {/* Sidebar destra - Widget */}
          <div className="w-80 border-l bg-gray-50 p-4 space-y-4">
            {/* Timer Widget */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timer Intervento
              </h3>
              <TimerWidget
                isRunning={isTimerRunning}
                elapsedTime={elapsedTime}
                onStart={startTimer}
                onStop={stopTimer}
                onTimeUpdate={setElapsedTime}
              />
            </Card>

            {/* GPS Widget */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Posizione GPS
              </h3>
              <div className="space-y-2">
                {gpsLocation ? (
                  <div className="text-sm">
                    <p>Lat: {gpsLocation.lat.toFixed(6)}</p>
                    <p>Lng: {gpsLocation.lng.toFixed(6)}</p>
                    {weather && (
                      <p className="mt-2">
                        Meteo: {weather.description} - {weather.temp}°C
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Non acquisita</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={getCurrentLocation}
                  >
                    Acquisisci
                  </Button>
                  {gpsLocation && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={getWeatherData}
                    >
                      Meteo
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Phrases Widget */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Frasi Rapide</h3>
              <QuickPhrasesWidget
                onSelect={(phrase) => {
                  // Inserisci frase nel campo attivo
                  const activeField = document.activeElement as HTMLTextAreaElement;
                  if (activeField && activeField.tagName === 'TEXTAREA') {
                    const start = activeField.selectionStart;
                    const end = activeField.selectionEnd;
                    const text = activeField.value;
                    activeField.value = text.substring(0, start) + phrase + text.substring(end);
                  }
                }}
              />
            </Card>

            {/* Materials Widget */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materiali Rapidi
              </h3>
              <MaterialsWidget
                onAdd={(material) => {
                  const currentMaterials = methods.getValues('materials') || [];
                  methods.setValue('materials', [...currentMaterials, material]);
                }}
              />
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <ReportPreviewModal
            report={formData}
            template={template}
            onClose={() => setShowPreview(false)}
          />
        )}
      </form>
    </FormProvider>
  );
}
```

---

## STEP 5.2 - CAMPI PERSONALIZZATI (12 ore)

### Creare `src/components/reports/fields/SignatureField.tsx`:

```tsx
import React, { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SignaturePad from 'react-signature-canvas';
import { Edit, Trash, Check } from 'lucide-react';

interface SignatureFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readonly?: boolean;
}

export default function SignatureField({ 
  name, 
  label, 
  required, 
  readonly 
}: SignatureFieldProps) {
  const { setValue, watch } = useFormContext();
  const [isDrawing, setIsDrawing] = useState(false);
  const signaturePadRef = useRef<SignaturePad>(null);
  
  const value = watch(name);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setValue(name, null);
    }
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL();
      setValue(name, {
        data: dataUrl,
        timestamp: new Date().toISOString()
      });
      setIsDrawing(false);
    }
  };

  if (readonly && value) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Card className="p-4">
          <img src={value.data} alt="Firma" className="max-h-32" />
          <p className="text-xs text-gray-500 mt-2">
            Firmato il {new Date(value.timestamp).toLocaleString('it-IT')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {!isDrawing && !value ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDrawing(true)}
          disabled={readonly}
        >
          <Edit className="h-4 w-4 mr-2" />
          Aggiungi Firma
        </Button>
      ) : isDrawing ? (
        <Card className="p-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
            <SignaturePad
              ref={signaturePadRef}
              canvasProps={{
                className: 'signature-canvas',
                width: 500,
                height: 200,
                style: { border: '1px solid #e5e7eb' }
              }}
            />
          </div>
          <div className="flex justify-between mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              size="sm"
            >
              <Trash className="h-4 w-4 mr-2" />
              Cancella
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDrawing(false)}
                size="sm"
              >
                Annulla
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Salva Firma
              </Button>
            </div>
          </div>
        </Card>
      ) : value ? (
        <Card className="p-4">
          <img src={value.data} alt="Firma" className="max-h-32" />
          <p className="text-xs text-gray-500 mt-2">
            Firmato il {new Date(value.timestamp).toLocaleString('it-IT')}
          </p>
          {!readonly && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValue(name, null);
                setIsDrawing(true);
              }}
              size="sm"
              className="mt-2"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica Firma
            </Button>
          )}
        </Card>
      ) : null}
    </div>
  );
}
```

### Creare `src/components/reports/fields/PhotoField.tsx`:

```tsx
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoFieldProps {
  name: string;
  label: string;
  maxPhotos?: number;
  photoTypes?: string[];
  required?: boolean;
  readonly?: boolean;
}

interface Photo {
  id: string;
  type: string;
  url: string;
  file?: File;
  caption?: string;
  timestamp: string;
}

export default function PhotoField({ 
  name, 
  label, 
  maxPhotos = 5,
  photoTypes = ['prima', 'durante', 'dopo'],
  required, 
  readonly 
}: PhotoFieldProps) {
  const { setValue, watch } = useFormContext();
  const [selectedType, setSelectedType] = useState(photoTypes[0]);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const photos: Photo[] = watch(name) || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = maxPhotos - photos.filter(p => p.type === selectedType).length;
    
    if (files.length > remainingSlots) {
      toast.error(`Puoi aggiungere solo ${remainingSlots} foto per "${selectedType}"`);
      return;
    }

    const newPhotos: Photo[] = [];
    
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} non è un'immagine valida`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} è troppo grande (max 10MB)`);
        continue;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      
      newPhotos.push({
        id: `photo-${Date.now()}-${i}`,
        type: selectedType,
        url: url,
        file: file,
        caption: caption,
        timestamp: new Date().toISOString()
      });
    }

    setValue(name, [...photos, ...newPhotos]);
    setCaption('');
    toast.success(`${newPhotos.length} foto aggiunte`);
  };

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Implementare capture da camera
      // Per ora usa file upload
      
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast.error('Camera non disponibile, usa upload file');
    }
  };

  const removePhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo?.url.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url);
    }
    setValue(name, photos.filter(p => p.id !== photoId));
  };

  const getPhotosByType = (type: string) => photos.filter(p => p.type === type);

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {!readonly && (
        <div className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {photoTypes.map(type => (
              <Button
                key={type}
                type="button"
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                <span className="ml-2 text-xs">
                  ({getPhotosByType(type).length}/{maxPhotos})
                </span>
              </Button>
            ))}
          </div>

          {/* Upload controls */}
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Didascalia (opzionale)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="flex-1"
            />
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(`${name}-upload`)?.click()}
                disabled={getPhotosByType(selectedType).length >= maxPhotos}
              >
                <Upload className="h-4 w-4 mr-2" />
                Carica
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleTakePhoto}
                disabled={getPhotosByType(selectedType).length >= maxPhotos}
              >
                <Camera className="h-4 w-4 mr-2" />
                Scatta
              </Button>
            </div>
            
            <input
              id={`${name}-upload`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      )}

      {/* Photo grid by type */}
      {photoTypes.map(type => {
        const typePhotos = getPhotosByType(type);
        if (typePhotos.length === 0 && readonly) return null;
        
        return (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Foto {type.charAt(0).toUpperCase() + type.slice(1)}
            </h4>
            
            {typePhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {typePhotos.map(photo => (
                  <Card key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption || `Foto ${photo.type}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs">
                        {photo.caption}
                      </div>
                    )}
                    
                    {!readonly && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(photo.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setPreviewUrl(photo.url)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nessuna foto</p>
            )}
          </div>
        );
      })}

      {/* Preview modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full"
          />
        </div>
      )}
    </div>
  );
}
```

---

## STEP 5.3 - GESTIONE MATERIALI NEL FORM (8 ore)

### Creare `src/components/reports/fields/MaterialsField.tsx`:

```tsx
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash, Search, Euro, Package } from 'lucide-react';
import { toast } from 'sonner';
import MaterialSearchDialog from './MaterialSearchDialog';

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
  totalPrice: number;
  totalWithVat: number;
}

interface MaterialsFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readonly?: boolean;
  showVat?: boolean;
  showDiscount?: boolean;
}

export default function MaterialsField({ 
  name, 
  label,
  required,
  readonly,
  showVat = true,
  showDiscount = true
}: MaterialsFieldProps) {
  const { setValue, watch } = useFormContext();
  const [showSearch, setShowSearch] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const materials: Material[] = watch(name) || [];

  const calculateTotal = (material: Partial<Material>): Material => {
    const quantity = material.quantity || 0;
    const unitPrice = material.unitPrice || 0;
    const vatRate = material.vatRate || 22;
    const discount = material.discount || 0;
    
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const totalPrice = subtotal - discountAmount;
    const vatAmount = totalPrice * (vatRate / 100);
    const totalWithVat = totalPrice + vatAmount;

    return {
      ...material,
      totalPrice,
      totalWithVat
    } as Material;
  };

  const addMaterial = (material: any) => {
    const newMaterial = calculateTotal({
      id: `material-${Date.now()}`,
      code: material.code,
      name: material.name,
      unit: material.unit || 'pz',
      quantity: 1,
      unitPrice: material.defaultPrice || 0,
      vatRate: material.vatRate || 22,
      discount: 0
    });

    setValue(name, [...materials, newMaterial]);
    toast.success('Materiale aggiunto');
  };

  const updateMaterial = (index: number, updates: Partial<Material>) => {
    const newMaterials = [...materials];
    newMaterials[index] = calculateTotal({
      ...newMaterials[index],
      ...updates
    });
    setValue(name, newMaterials);
  };

  const removeMaterial = (index: number) => {
    setValue(name, materials.filter((_, i) => i !== index));
    toast.success('Materiale rimosso');
  };

  const getTotals = () => {
    return materials.reduce((acc, mat) => ({
      totalPrice: acc.totalPrice + mat.totalPrice,
      totalWithVat: acc.totalWithVat + mat.totalWithVat
    }), { totalPrice: 0, totalWithVat: 0 });
  };

  const totals = getTotals();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {!readonly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Materiale
          </Button>
        )}
      </div>

      {materials.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Codice</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead className="w-20">Q.tà</TableHead>
                <TableHead className="w-16">UM</TableHead>
                <TableHead className="w-24">Prezzo</TableHead>
                {showDiscount && <TableHead className="w-20">Sconto %</TableHead>}
                {showVat && <TableHead className="w-20">IVA %</TableHead>}
                <TableHead className="w-28">Totale</TableHead>
                {!readonly && <TableHead className="w-16"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material, index) => (
                <TableRow key={material.id}>
                  <TableCell className="font-mono text-sm">
                    {material.code}
                  </TableCell>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>
                    {readonly || editingIndex !== index ? (
                      material.quantity
                    ) : (
                      <Input
                        type="number"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, {
                          quantity: parseFloat(e.target.value) || 0
                        })}
                        className="w-16"
                        step="0.01"
                      />
                    )}
                  </TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>
                    {readonly || editingIndex !== index ? (
                      `€ ${material.unitPrice.toFixed(2)}`
                    ) : (
                      <Input
                        type="number"
                        value={material.unitPrice}
                        onChange={(e) => updateMaterial(index, {
                          unitPrice: parseFloat(e.target.value) || 0
                        })}
                        className="w-20"
                        step="0.01"
                      />
                    )}
                  </TableCell>
                  {showDiscount && (
                    <TableCell>
                      {readonly || editingIndex !== index ? (
                        `${material.discount}%`
                      ) : (
                        <Input
                          type="number"
                          value={material.discount}
                          onChange={(e) => updateMaterial(index, {
                            discount: parseFloat(e.target.value) || 0
                          })}
                          className="w-16"
                          step="1"
                          max="100"
                        />
                      )}
                    </TableCell>
                  )}
                  {showVat && (
                    <TableCell>{material.vatRate}%</TableCell>
                  )}
                  <TableCell className="font-semibold">
                    € {material.totalPrice.toFixed(2)}
                  </TableCell>
                  {!readonly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totali */}
          <div className="bg-gray-50 p-4 border-t">
            <div className="flex justify-end space-y-1">
              <div className="text-right">
                <div className="flex justify-between gap-8">
                  <span>Totale Imponibile:</span>
                  <span className="font-semibold">€ {totals.totalPrice.toFixed(2)}</span>
                </div>
                {showVat && (
                  <div className="flex justify-between gap-8">
                    <span>Totale con IVA:</span>
                    <span className="font-bold text-lg">€ {totals.totalWithVat.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nessun materiale aggiunto</p>
            {!readonly && (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setShowSearch(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi il primo materiale
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Search dialog */}
      {showSearch && (
        <MaterialSearchDialog
          open={showSearch}
          onClose={() => setShowSearch(false)}
          onSelect={addMaterial}
        />
      )}
    </div>
  );
}
```

---

## ✅ CHECKLIST COMPLETAMENTO FASE 5

### Form Principale
- [ ] Form multi-sezione implementato
- [ ] Navigazione sezioni funzionante
- [ ] Validazione con Zod
- [ ] Auto-save bozze
- [ ] Gestione stati (bozza/completato)

### Campi Personalizzati
- [ ] TextField e TextArea
- [ ] Number e Date fields
- [ ] Select e MultiSelect
- [ ] Checkbox e Radio
- [ ] SignatureField completo
- [ ] PhotoField con camera
- [ ] TimerField funzionante
- [ ] GpsField con meteo
- [ ] MaterialsField avanzato

### Widget
- [ ] QuickPhrases widget
- [ ] Materials widget
- [ ] Timer widget
- [ ] Photo upload widget
- [ ] Signature widget

### Funzionalità
- [ ] Upload foto multiplo
- [ ] Firma digitale
- [ ] Calcolo automatico totali
- [ ] GPS e meteo
- [ ] Timer start/stop
- [ ] Frasi rapide

### Testing
- [ ] Test validazione form
- [ ] Test auto-save
- [ ] Test upload foto
- [ ] Test firma digitale

---

## 📝 NOTE PER FASE SUCCESSIVA

La Fase 6 (Client View & Firma) potrà iniziare con:
- Form compilazione completo
- Tutti i campi personalizzati funzionanti
- Sistema di widget operativo

Passare a: `06-CLIENT-VIEW-IMPLEMENTATION.md`
