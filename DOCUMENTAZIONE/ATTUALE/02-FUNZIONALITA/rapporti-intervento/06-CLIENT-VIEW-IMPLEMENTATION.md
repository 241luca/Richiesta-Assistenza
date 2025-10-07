Circle, 
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface SignatureProcessProps {
  report: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SignatureProcess({ 
  report, 
  onClose, 
  onSuccess 
}: SignatureProcessProps) {
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const signaturePadRef = useRef<SignaturePad>(null);

  // Mutation firma
  const signMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(`/api/intervention-reports/${report.id}/sign`, {
        method: 'POST',
        data
      }),
    onSuccess: () => {
      onSuccess();
    },
    onError: () => {
      toast.error('Errore durante la firma');
    }
  });

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSaveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL();
      setSignature(dataUrl);
      setStep(3);
    } else {
      toast.error('Inserisci la firma');
    }
  };

  const handleConfirmSignature = () => {
    if (!signature) return;

    signMutation.mutate({
      signature,
      acceptedTerms: accepted,
      signedAt: new Date().toISOString(),
      ipAddress: window.location.hostname,
      userAgent: navigator.userAgent
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Firma Digitale Rapporto
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className={`flex-1 h-2 ${
                i === 1 ? '' : 'ml-2'
              } ${
                i <= step ? 'bg-blue-600' : 'bg-gray-200'
              } rounded`}
            />
          ))}
        </div>

        {/* Step 1: Review */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Prima di firmare, verifica attentamente il contenuto del rapporto.
                La firma digitale ha valore legale e conferma l'accettazione dell'intervento.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">Riepilogo Rapporto</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Numero:</span>
                  <span className="ml-2 font-medium">{report.reportNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Data:</span>
                  <span className="ml-2 font-medium">
                    {new Date(report.interventionDate).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Professionista:</span>
                  <span className="ml-2 font-medium">{report.professional.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ore lavorate:</span>
                  <span className="ml-2 font-medium">{report.totalHours}h</span>
                </div>
              </div>

              {report.materials?.length > 0 && (
                <div>
                  <span className="text-gray-500">Materiali utilizzati:</span>
                  <span className="ml-2 font-medium">{report.materials.length} articoli</span>
                </div>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="accept"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="accept" className="text-sm font-medium">
                  Confermo di aver verificato il contenuto del rapporto
                </Label>
                <p className="text-xs text-gray-500">
                  Accetto che l'intervento è stato eseguito come descritto e che i materiali
                  elencati sono stati effettivamente utilizzati.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Annulla
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!accepted}
              >
                Procedi
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Signature */}
        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <Edit3 className="h-4 w-4" />
              <AlertDescription>
                Disegna la tua firma nel riquadro sottostante utilizzando il mouse o il touch.
              </AlertDescription>
            </Alert>

            <div className="border-2 border-gray-300 rounded-lg p-2">
              <SignaturePad
                ref={signaturePadRef}
                canvasProps={{
                  className: 'signature-canvas',
                  width: 550,
                  height: 200,
                  style: { 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    background: 'white'
                  }
                }}
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleClearSignature}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Cancella
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Indietro
                </Button>
                <Button onClick={handleSaveSignature}>
                  Salva Firma
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && signature && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Firma acquisita correttamente. Conferma per completare il processo.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">La tua firma:</h3>
              <div className="bg-white p-4 rounded border">
                <img 
                  src={signature} 
                  alt="La tua firma" 
                  className="max-h-24 mx-auto"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Informazioni legali:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• La firma digitale ha valore legale equivalente alla firma autografa</li>
                <li>• Data e ora della firma verranno registrate nel sistema</li>
                <li>• Il rapporto firmato verrà archiviato e reso disponibile in formato PDF</li>
                <li>• Riceverai una copia via email per i tuoi archivi</li>
              </ul>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSignature(null);
                  setStep(2);
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Modifica Firma
              </Button>
              <Button
                onClick={handleConfirmSignature}
                disabled={signMutation.isLoading}
              >
                {signMutation.isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Firma in corso...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Conferma e Firma
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Creare `src/components/client/reports/FeedbackForm.tsx`:

```tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface FeedbackFormProps {
  reportId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FeedbackForm({ 
  reportId, 
  onClose, 
  onSuccess 
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [satisfaction, setSatisfaction] = useState('');
  const [comments, setComments] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(`/api/intervention-reports/${reportId}/feedback`, {
        method: 'POST',
        data
      }),
    onSuccess: () => {
      toast.success('Grazie per il tuo feedback!');
      onSuccess();
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Seleziona una valutazione');
      return;
    }

    mutation.mutate({
      rating,
      satisfaction,
      comments,
      wouldRecommend
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lascia un Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <Label>Valutazione complessiva</Label>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-500">
                {rating === 5 && 'Eccellente!'}
                {rating === 4 && 'Molto buono'}
                {rating === 3 && 'Buono'}
                {rating === 2 && 'Sufficiente'}
                {rating === 1 && 'Da migliorare'}
              </p>
            )}
          </div>

          {/* Satisfaction Level */}
          <div className="space-y-2">
            <Label>Quanto sei soddisfatto del servizio?</Label>
            <RadioGroup value={satisfaction} onValueChange={setSatisfaction}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="molto_soddisfatto" id="molto_soddisfatto" />
                <Label htmlFor="molto_soddisfatto">Molto soddisfatto</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="soddisfatto" id="soddisfatto" />
                <Label htmlFor="soddisfatto">Soddisfatto</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutrale" id="neutrale" />
                <Label htmlFor="neutrale">Neutrale</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="insoddisfatto" id="insoddisfatto" />
                <Label htmlFor="insoddisfatto">Insoddisfatto</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Would Recommend */}
          <div className="space-y-2">
            <Label>Consiglieresti il nostro servizio?</Label>
            <div className="flex gap-4 justify-center">
              <Button
                type="button"
                variant={wouldRecommend === true ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Sì
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                No
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label>Commenti aggiuntivi (opzionale)</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Condividi la tua esperienza..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={rating === 0 || mutation.isLoading}
          >
            Invia Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Creare `src/components/client/reports/DisputeForm.tsx`:

```tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface DisputeFormProps {
  report: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DisputeForm({ 
  report, 
  onClose, 
  onSuccess 
}: DisputeFormProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [contactPreference, setContactPreference] = useState('email');
  const [urgency, setUrgency] = useState('normal');
  const [acknowledged, setAcknowledged] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'attachments') {
          formData.append(key, data[key]);
        }
      });
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      return apiRequest(`/api/intervention-reports/${report.id}/dispute`, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    onSuccess: () => {
      toast.success('Contestazione inviata. Ti contatteremo presto.');
      onSuccess();
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!reason || !description) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    if (!acknowledged) {
      toast.error('Devi confermare di aver letto le informazioni');
      return;
    }

    mutation.mutate({
      reason,
      description,
      urgency,
      contactPreference,
      reportNumber: report.reportNumber,
      reportId: report.id
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Contestazione Rapporto
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            La contestazione del rapporto avvierà una procedura di verifica.
            Un nostro responsabile ti contatterà entro 24-48 ore per discutere la situazione.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {/* Motivo contestazione */}
          <div className="space-y-2">
            <Label>Motivo della contestazione *</Label>
            <select
              className="w-full p-2 border rounded"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Seleziona un motivo</option>
              <option value="lavoro_incompleto">Lavoro incompleto</option>
              <option value="lavoro_non_conforme">Lavoro non conforme</option>
              <option value="materiali_non_utilizzati">Materiali fatturati ma non utilizzati</option>
              <option value="ore_eccessive">Ore di lavoro eccessive</option>
              <option value="danni_causati">Danni causati durante l'intervento</option>
              <option value="comportamento_inappropriato">Comportamento inappropriato</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          {/* Descrizione dettagliata */}
          <div className="space-y-2">
            <Label>Descrizione dettagliata *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi in dettaglio il problema riscontrato..."
              rows={6}
              required
            />
            <p className="text-xs text-gray-500">
              Fornisci quanti più dettagli possibili per aiutarci a comprendere la situazione
            </p>
          </div>

          {/* Urgenza */}
          <div className="space-y-2">
            <Label>Livello di urgenza</Label>
            <RadioGroup value={urgency} onValueChange={setUrgency}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bassa" id="bassa" />
                <Label htmlFor="bassa">Bassa - Può attendere</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normale" id="normale" />
                <Label htmlFor="normale">Normale - Da risolvere entro una settimana</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alta" id="alta" />
                <Label htmlFor="alta">Alta - Richiede attenzione immediata</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Allegati */}
          <div className="space-y-2">
            <Label>Allegati (foto, documenti)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                id="dispute-files"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="dispute-files"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600 mt-2">
                  Clicca per caricare file
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Max 10MB per file
                </span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preferenza contatto */}
          <div className="space-y-2">
            <Label>Come preferisci essere contattato?</Label>
            <RadioGroup value={contactPreference} onValueChange={setContactPreference}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="telefono" id="telefono" />
                <Label htmlFor="telefono">Telefono</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entrambi" id="entrambi" />
                <Label htmlFor="entrambi">Email e Telefono</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Acknowledgment */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="acknowledge" className="text-sm">
                Confermo di aver letto e compreso la procedura di contestazione
              </Label>
              <p className="text-xs text-gray-500">
                La contestazione verrà valutata dal nostro team. Potrebbe essere richiesta
                una verifica in loco o documentazione aggiuntiva.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason || !description || !acknowledged || mutation.isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Invia Contestazione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ CHECKLIST COMPLETAMENTO FASE 6

### Visualizzazione Rapporto
- [ ] Vista dettagliata rapporto
- [ ] Tabs per sezioni
- [ ] Visualizzazione materiali
- [ ] Galleria foto
- [ ] Download PDF

### Processo Firma
- [ ] Wizard multi-step
- [ ] Acquisizione firma digitale
- [ ] Accettazione termini
- [ ] Conferma e validazione
- [ ] Notifica completamento

### Feedback System
- [ ] Form valutazione stelle
- [ ] Domande soddisfazione
- [ ] Commenti testuali
- [ ] Salvataggio feedback

### Sistema Contestazioni
- [ ] Form contestazione
- [ ] Upload documenti
- [ ] Livelli urgenza
- [ ] Tracking stato

### Testing
- [ ] Test visualizzazione
- [ ] Test processo firma
- [ ] Test feedback
- [ ] Test contestazioni

---

## 📝 NOTE PER FASE SUCCESSIVA

La Fase 7 (PDF Generation) potrà iniziare con:
- Vista cliente completa
- Sistema firma funzionante
- Feedback implementato
- Contestazioni gestite

Passare a: `07-PDF-GENERATION.md`