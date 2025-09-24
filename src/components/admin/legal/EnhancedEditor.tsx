import React, { useState, useRef } from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

interface EnhancedEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  documentType?: 'PRIVACY_POLICY' | 'TERMS_SERVICE' | 'COOKIE_POLICY' | string;
}

export default function EnhancedEditor({ 
  value, 
  onChange, 
  height = 500,
  placeholder = 'Inizia a scrivere il contenuto del documento...',
  documentType
}: EnhancedEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Template predefiniti migliorati
  const templates: Record<string, string> = {
    PRIVACY_POLICY: `<div class="legal-document">
<h1 style="color: #1a202c; font-size: 2.5em; margin-bottom: 0.5em;">Informativa sulla Privacy</h1>
<p style="color: #718096; font-style: italic;">Ai sensi del Regolamento UE 2016/679 (GDPR)</p>
<p style="color: #718096; font-size: 0.9em;">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è <strong>[Nome Azienda]</strong>, con sede legale in [Indirizzo].</p>
<ul style="margin: 1em 0; padding-left: 2em;">
  <li>Email: privacy@[dominio].it</li>
  <li>PEC: [pec]@pec.[dominio].it</li>
  <li>Telefono: [numero]</li>
</ul>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">2. Tipologie di Dati Raccolti</h2>
<p>Nell'ambito della nostra attività raccogliamo e trattiamo le seguenti categorie di dati personali:</p>
<ul style="margin: 1em 0; padding-left: 2em;">
  <li><strong>Dati anagrafici:</strong> nome, cognome, data di nascita, codice fiscale</li>
  <li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo</li>
  <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate</li>
  <li><strong>Dati di pagamento:</strong> coordinate bancarie (gestite tramite provider sicuri)</li>
</ul>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">3. Finalità del Trattamento</h2>
<p>I suoi dati personali saranno trattati per le seguenti finalità:</p>
<ol style="margin: 1em 0; padding-left: 2em;">
  <li>Erogazione dei servizi richiesti</li>
  <li>Adempimenti contrattuali e precontrattuali</li>
  <li>Adempimenti di obblighi di legge</li>
  <li>Marketing diretto (solo previo consenso esplicito)</li>
  <li>Analisi statistiche in forma aggregata</li>
</ol>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">4. Base Giuridica del Trattamento</h2>
<p>Il trattamento dei suoi dati si basa su:</p>
<table style="width: 100%; border-collapse: collapse; margin: 1.5em 0;">
  <thead>
    <tr style="background: #f7fafc;">
      <th style="border: 1px solid #e2e8f0; padding: 0.75em; text-align: left;">Finalità</th>
      <th style="border: 1px solid #e2e8f0; padding: 0.75em; text-align: left;">Base Giuridica</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Erogazione servizi</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Esecuzione del contratto</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Marketing</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Consenso dell'interessato</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Adempimenti fiscali</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Obbligo di legge</td>
    </tr>
  </tbody>
</table>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">5. Diritti dell'Interessato</h2>
<p>In qualità di interessato, lei ha diritto di:</p>
<ul style="margin: 1em 0; padding-left: 2em;">
  <li>Accedere ai suoi dati personali</li>
  <li>Rettificare dati inesatti o incompleti</li>
  <li>Cancellare i dati (diritto all'oblio)</li>
  <li>Limitare il trattamento</li>
  <li>Portabilità dei dati</li>
  <li>Opporsi al trattamento</li>
  <li>Revocare il consenso in qualsiasi momento</li>
</ul>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">6. Contatti</h2>
<div style="background: #f0fff4; border: 1px solid #9ae6b4; padding: 1.25em; border-radius: 0.5em; margin: 1.5em 0;">
  <p><strong>Email:</strong> privacy@[dominio].it</p>
  <p><strong>PEC:</strong> privacy@pec.[dominio].it</p>
  <p><strong>Indirizzo:</strong> [Via/Piazza], [CAP] [Città]</p>
</div>
</div>`,

    TERMS_SERVICE: `<div class="legal-document">
<h1 style="color: #1a202c; font-size: 2.5em; margin-bottom: 0.5em;">Termini e Condizioni di Servizio</h1>
<p style="color: #718096; font-size: 0.9em;">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">1. Accettazione dei Termini</h2>
<p>Utilizzando questo servizio ("Richiesta Assistenza"), l'utente accetta di essere vincolato dai presenti Termini e Condizioni. Se non si accettano questi termini, si prega di non utilizzare il servizio.</p>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">2. Descrizione del Servizio</h2>
<p>Richiesta Assistenza è una piattaforma digitale che:</p>
<ul style="margin: 1em 0; padding-left: 2em;">
  <li>Collega clienti con professionisti qualificati</li>
  <li>Gestisce richieste di assistenza tecnica</li>
  <li>Facilita la preventivazione e i pagamenti</li>
  <li>Fornisce strumenti di comunicazione tra le parti</li>
</ul>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">3. Pagamenti e Commissioni</h2>
<table style="width: 100%; border-collapse: collapse; margin: 1.5em 0;">
  <thead>
    <tr style="background: #f7fafc;">
      <th style="border: 1px solid #e2e8f0; padding: 0.75em;">Servizio</th>
      <th style="border: 1px solid #e2e8f0; padding: 0.75em;">Tariffa</th>
      <th style="border: 1px solid #e2e8f0; padding: 0.75em;">Modalità</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Registrazione</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Gratuita</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">-</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Commissione servizio</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">15%</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Sul totale</td>
    </tr>
  </tbody>
</table>

<div style="background: #fffaf0; border: 1px solid #feb2b2; padding: 1.25em; border-radius: 0.5em; margin: 1.5em 0;">
  <p><strong>⚠️ Importante:</strong> La piattaforma agisce esclusivamente come intermediario. Non siamo responsabili per la qualità dei servizi erogati dai professionisti.</p>
</div>
</div>`,

    COOKIE_POLICY: `<div class="legal-document">
<h1 style="color: #1a202c; font-size: 2.5em; margin-bottom: 0.5em;">Cookie Policy</h1>
<p style="color: #718096; font-size: 0.9em;">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente quando visita un sito web.</p>

<h2 style="color: #2d3748; font-size: 1.8em; margin-top: 1.5em;">2. Tipologie di Cookie Utilizzati</h2>
<table style="width: 100%; border-collapse: collapse; margin: 1.5em 0;">
  <thead>
    <tr style="background: #f7fafc;">
      <th style="border: 1px solid #e2e8f0; padding: 0.75em;">Nome Cookie</th>
      <th style="border: 1px solid #e2e8f0; padding: 0.75em;">Scopo</th>
      <th style="border: 1px solid #e2e8f0; padding: 0.75em;">Durata</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">session_id</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Sessione utente</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Sessione</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">auth_token</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">Autenticazione</td>
      <td style="border: 1px solid #e2e8f0; padding: 0.75em;">7 giorni</td>
    </tr>
  </tbody>
</table>
</div>`
  };

  // Funzioni di formattazione
  const insertHTML = (tagOpen: string, tagClose: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + tagOpen + selectedText + tagClose + value.substring(end);
    
    onChange(newText);
    
    // Ripristina la selezione
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, end + tagOpen.length);
    }, 0);
  };

  const formatBold = () => insertHTML('<strong>', '</strong>');
  const formatItalic = () => insertHTML('<em>', '</em>');
  const formatH1 = () => insertHTML('<h1>', '</h1>');
  const formatH2 = () => insertHTML('<h2>', '</h2>');
  const formatParagraph = () => insertHTML('<p>', '</p>');
  const formatUL = () => insertHTML('<ul>\n  <li>', '</li>\n</ul>');
  const formatOL = () => insertHTML('<ol>\n  <li>', '</li>\n</ol>');
  
  // Applica template
  const applyTemplate = () => {
    if (documentType && templates[documentType]) {
      onChange(templates[documentType]);
    }
  };

  // Copia contenuto
  const copyContent = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`enhanced-editor ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      {/* Toolbar migliorata */}
      <div className="bg-gray-50 rounded-t-lg border border-b-0 border-gray-200 p-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            {/* Template buttons */}
            {documentType && templates[documentType] && (
              <button
                type="button"
                onClick={applyTemplate}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Usa Template {documentType.replace('_', ' ')}
              </button>
            )}
            
            <div className="h-6 w-px bg-gray-300 mx-2" />
            
            {/* Formatting buttons */}
            <button
              type="button"
              onClick={formatH1}
              className="px-2 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200 rounded"
              title="Titolo 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={formatH2}
              className="px-2 py-1 text-base font-bold text-gray-700 hover:bg-gray-200 rounded"
              title="Titolo 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={formatParagraph}
              className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
              title="Paragrafo"
            >
              P
            </button>
            
            <div className="h-6 w-px bg-gray-300 mx-1" />
            
            <button
              type="button"
              onClick={formatBold}
              className="px-2 py-1 font-bold text-gray-700 hover:bg-gray-200 rounded"
              title="Grassetto"
            >
              B
            </button>
            <button
              type="button"
              onClick={formatItalic}
              className="px-2 py-1 italic text-gray-700 hover:bg-gray-200 rounded"
              title="Corsivo"
            >
              I
            </button>
            
            <div className="h-6 w-px bg-gray-300 mx-1" />
            
            <button
              type="button"
              onClick={formatUL}
              className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded"
              title="Lista puntata"
            >
              UL
            </button>
            <button
              type="button"
              onClick={formatOL}
              className="px-2 py-1 text-gray-700 hover:bg-gray-200 rounded"
              title="Lista numerata"
            >
              OL
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isPreview 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isPreview ? <CodeBracketIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              {isPreview ? 'Editor' : 'Anteprima'}
            </button>

            <button
              type="button"
              onClick={copyContent}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-100"
            >
              {copied ? <CheckIcon className="h-4 w-4 mr-1 text-green-600" /> : <ClipboardDocumentIcon className="h-4 w-4 mr-1" />}
              {copied ? 'Copiato!' : 'Copia'}
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-100"
            >
              {isFullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Editor o Preview */}
      {isPreview ? (
        <div 
          className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6 overflow-auto"
          style={{ 
            minHeight: isFullscreen ? 'calc(100vh - 200px)' : height,
            maxHeight: isFullscreen ? 'calc(100vh - 200px)' : height 
          }}
        >
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 border border-t-0 border-gray-200 rounded-b-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ 
            minHeight: isFullscreen ? 'calc(100vh - 200px)' : height,
            maxHeight: isFullscreen ? 'calc(100vh - 200px)' : height 
          }}
        />
      )}

      {/* Help text */}
      {!isFullscreen && (
        <p className="mt-2 text-xs text-gray-500">
          Usa i pulsanti per formattare il testo o applica un template predefinito. 
          Puoi scrivere HTML direttamente o usare l'anteprima per vedere il risultato.
        </p>
      )}
    </div>
  );
}
