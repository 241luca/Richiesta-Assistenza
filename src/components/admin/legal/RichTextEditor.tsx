import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  documentType?: 'PRIVACY_POLICY' | 'TERMS_SERVICE' | 'COOKIE_POLICY' | string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  height = 600,
  placeholder = 'Inizia a scrivere il contenuto del documento...',
  documentType
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tinymceApiKey, setTinymceApiKey] = useState<string | null>(null);

  // Carica la API key di TinyMCE dal database - NO HARDCODING
  const { data: apiKeyData, isLoading: keyLoading } = useQuery({
    queryKey: ['api-key-tinymce-rich-editor'],
    queryFn: async () => {
      try {
        // Prende la chiave dal database tramite API
        const response = await api.get('/admin/api-keys/TINYMCE/raw');
        console.log('RichTextEditor: Loading TinyMCE key from database...');
        if (response.data?.data?.key) {
          const key = response.data.data.key;
          console.log('RichTextEditor: TinyMCE key loaded successfully');
          return key;
        }
      } catch (error) {
        console.error('RichTextEditor: Error loading TinyMCE key:', error);
        // Fallback: prova lista chiavi
        try {
          const response = await api.get('/admin/api-keys');
          const keys = response.data?.data || [];
          const tinymceKey = keys.find((key: any) => 
            key.service === 'TINYMCE'
          );
          if (tinymceKey?.key) {
            console.log('RichTextEditor: TinyMCE key found in list');
            return tinymceKey.key;
          }
        } catch (err) {
          console.error('RichTextEditor: Failed to load TinyMCE key from any source:', err);
        }
      }
      return null;
    },
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    gcTime: 10 * 60 * 1000
  });

  useEffect(() => {
    if (apiKeyData) {
      setTinymceApiKey(apiKeyData);
    }
  }, [apiKeyData]);

  // Template predefiniti per diversi tipi di documenti
  const templates: Record<string, string> = {
    PRIVACY_POLICY: `
<h1>Informativa sulla Privacy</h1>
<p class="subtitle">Ai sensi del Regolamento UE 2016/679 (GDPR)</p>
<p class="last-update">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è <strong>[Nome Azienda]</strong>, con sede legale in [Indirizzo].</p>
<ul>
  <li>Email: privacy@[dominio].it</li>
  <li>PEC: [pec]@pec.[dominio].it</li>
  <li>Telefono: [numero]</li>
</ul>

<h2>2. Tipologie di Dati Raccolti</h2>
<p>Nell'ambito della nostra attività raccogliamo e trattiamo le seguenti categorie di dati personali:</p>
<ul>
  <li><strong>Dati anagrafici:</strong> nome, cognome, data di nascita, codice fiscale</li>
  <li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo</li>
  <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate</li>
</ul>

<h2>3. Finalità del Trattamento</h2>
<p>I suoi dati personali saranno trattati per le seguenti finalità:</p>
<ol>
  <li>Erogazione dei servizi richiesti</li>
  <li>Adempimenti contrattuali e precontrattuali</li>
  <li>Adempimenti di legge</li>
  <li>Marketing diretto (previo consenso)</li>
</ol>

<h2>4. Base Giuridica</h2>
<p>Il trattamento dei suoi dati si basa su:</p>
<table class="table">
  <thead>
    <tr>
      <th>Finalità</th>
      <th>Base Giuridica</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Erogazione servizi</td>
      <td>Esecuzione del contratto</td>
    </tr>
    <tr>
      <td>Marketing</td>
      <td>Consenso dell'interessato</td>
    </tr>
    <tr>
      <td>Adempimenti fiscali</td>
      <td>Obbligo di legge</td>
    </tr>
  </tbody>
</table>

<h2>5. Diritti dell'Interessato</h2>
<p>In qualità di interessato, lei ha diritto di:</p>
<ul>
  <li>Accedere ai suoi dati personali</li>
  <li>Rettificare dati inesatti</li>
  <li>Cancellare i dati (diritto all'oblio)</li>
  <li>Limitare il trattamento</li>
  <li>Portabilità dei dati</li>
  <li>Opporsi al trattamento</li>
</ul>

<h2>6. Contatti</h2>
<p>Per esercitare i suoi diritti o per qualsiasi domanda relativa al trattamento dei suoi dati personali, può contattarci:</p>
<div class="contact-box">
  <p><strong>Email:</strong> privacy@[dominio].it</p>
  <p><strong>PEC:</strong> privacy@pec.[dominio].it</p>
  <p><strong>Indirizzo:</strong> [Via/Piazza], [Città]</p>
</div>`,

    TERMS_SERVICE: `
<h1>Termini e Condizioni di Servizio</h1>
<p class="last-update">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando questo servizio, l'utente accetta di essere vincolato dai presenti Termini e Condizioni. Se non si accettano questi termini, si prega di non utilizzare il servizio.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Il nostro servizio consiste in:</p>
<ul>
  <li>Piattaforma di collegamento tra clienti e professionisti</li>
  <li>Gestione richieste di assistenza</li>
  <li>Sistema di preventivazione</li>
  <li>Comunicazione tra le parti</li>
</ul>

<h2>3. Obblighi dell'Utente</h2>
<p>L'utente si impegna a:</p>
<ol>
  <li>Fornire informazioni veritiere e accurate</li>
  <li>Mantenere riservate le credenziali di accesso</li>
  <li>Non utilizzare il servizio per scopi illegali</li>
  <li>Rispettare i diritti di proprietà intellettuale</li>
</ol>

<h2>4. Pagamenti e Tariffe</h2>
<table class="table">
  <thead>
    <tr>
      <th>Servizio</th>
      <th>Tariffa</th>
      <th>Modalità</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Registrazione</td>
      <td>Gratuita</td>
      <td>-</td>
    </tr>
    <tr>
      <td>Commissione servizio</td>
      <td>15%</td>
      <td>Sul valore del servizio</td>
    </tr>
  </tbody>
</table>

<h2>5. Limitazione di Responsabilità</h2>
<div class="warning-box">
  <p><strong>⚠️ Importante:</strong> La piattaforma agisce esclusivamente come intermediario tra clienti e professionisti. Non siamo responsabili per la qualità dei servizi erogati dai professionisti.</p>
</div>

<h2>6. Modifiche ai Termini</h2>
<p>Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche saranno comunicate con almeno 30 giorni di anticipo.</p>`,

    COOKIE_POLICY: `
<h1>Cookie Policy</h1>
<p class="last-update">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti un sito web. Servono a migliorare l'esperienza di navigazione e a fornire informazioni ai proprietari del sito.</p>

<h2>2. Tipologie di Cookie Utilizzati</h2>

<h3>2.1 Cookie Necessari</h3>
<p>Questi cookie sono essenziali per il funzionamento del sito:</p>
<table class="cookie-table">
  <thead>
    <tr>
      <th>Nome Cookie</th>
      <th>Scopo</th>
      <th>Durata</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>session_id</td>
      <td>Mantenere la sessione utente</td>
      <td>Sessione</td>
    </tr>
    <tr>
      <td>auth_token</td>
      <td>Autenticazione</td>
      <td>7 giorni</td>
    </tr>
    <tr>
      <td>csrf_token</td>
      <td>Sicurezza</td>
      <td>Sessione</td>
    </tr>
  </tbody>
</table>

<h3>2.2 Cookie Analitici</h3>
<p>Utilizziamo cookie analitici per comprendere come i visitatori interagiscono con il sito:</p>
<ul>
  <li><strong>Google Analytics (_ga, _gid):</strong> Per analisi del traffico e comportamento utenti</li>
  <li><strong>Hotjar (_hjid):</strong> Per mappe di calore e registrazioni sessioni</li>
</ul>

<h3>2.3 Cookie di Marketing</h3>
<p>Questi cookie sono utilizzati per mostrare pubblicità pertinenti:</p>
<ul>
  <li><strong>Facebook Pixel:</strong> Per remarketing su Facebook</li>
  <li><strong>Google Ads:</strong> Per pubblicità mirate</li>
</ul>

<h2>3. Gestione dei Cookie</h2>
<div class="info-box">
  <h4>Come disabilitare i cookie</h4>
  <p>Puoi gestire le preferenze sui cookie attraverso le impostazioni del tuo browser:</p>
  <ul>
    <li><a href="#">Chrome</a></li>
    <li><a href="#">Firefox</a></li>
    <li><a href="#">Safari</a></li>
    <li><a href="#">Edge</a></li>
  </ul>
</div>

<h2>4. Consenso</h2>
<p>Continuando a navigare su questo sito, accetti l'utilizzo dei cookie secondo quanto descritto in questa policy.</p>`
  };

  // Applica template
  const applyTemplate = () => {
    if (documentType && templates[documentType]) {
      onChange(templates[documentType]);
    }
  };

  // Copia contenuto
  const copyContent = () => {
    const content = editorRef.current?.getContent() || value;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Se sta caricando la key, mostra loading
  if (keyLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-3">Caricamento editor...</p>
        </div>
      </div>
    );
  }

  // Se non c'è la API key, mostra avviso
  if (!tinymceApiKey) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              API Key TinyMCE Non Configurata
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Per utilizzare l'editor avanzato, è necessario configurare la API key di TinyMCE.
            </p>
            <div className="mt-3">
              <a 
                href="/admin/api-keys" 
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Vai a Gestione API Keys →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar personalizzata */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
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

          {documentType && templates[documentType] && (
            <button
              type="button"
              onClick={applyTemplate}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-100 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              Usa Template
            </button>
          )}

          <button
            type="button"
            onClick={copyContent}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-100 transition-colors"
          >
            {copied ? <CheckIcon className="h-4 w-4 mr-1 text-green-600" /> : <ClipboardDocumentIcon className="h-4 w-4 mr-1" />}
            {copied ? 'Copiato!' : 'Copia HTML'}
          </button>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-100 transition-colors"
        >
          {isFullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Editor o Preview */}
      {isPreview ? (
        <div 
          className={`prose prose-lg max-w-none p-6 bg-white border border-gray-200 rounded-lg overflow-auto ${
            isFullscreen ? 'h-[calc(100vh-120px)]' : ''
          }`}
          style={{ minHeight: height }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <Editor
          ref={editorRef}
          apiKey={tinymceApiKey}
          value={value}
          init={{
            height: isFullscreen ? window.innerHeight - 120 : height,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
              'pagebreak', 'nonbreaking', 'visualchars', 'quickbars', 'codesample', 
              'directionality', 'save', 'autosave'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic underline strikethrough | forecolor backcolor | ' +
              'alignleft aligncenter alignright alignjustify | ' +
              'bullist numlist outdent indent | ' +
              'removeformat | table | link image media | ' +
              'code fullscreen preview | help',
            toolbar_mode: 'sliding',
            block_formats: 'Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3; Header 4=h4; Header 5=h5; Header 6=h6; Blockquote=blockquote; Preformatted=pre',
            content_style: `
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 16px;
                line-height: 1.6;
                color: #1a202c;
                max-width: 100%;
                padding: 1rem;
              }
              h1 { font-size: 2.5em; font-weight: 800; margin: 1em 0 0.5em; color: #1a202c; }
              h2 { font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; color: #2d3748; }
              h3 { font-size: 1.5em; font-weight: 600; margin: 1em 0 0.5em; color: #2d3748; }
              h4 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; color: #4a5568; }
              p { margin: 1em 0; }
              ul, ol { margin: 1em 0; padding-left: 2em; }
              li { margin: 0.5em 0; }
              blockquote { 
                border-left: 4px solid #3182ce; 
                padding-left: 1em; 
                margin: 1.5em 0; 
                font-style: italic;
                color: #4a5568;
              }
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 1.5em 0;
              }
              table th { 
                background: #f7fafc; 
                border: 1px solid #e2e8f0; 
                padding: 0.75em; 
                text-align: left;
                font-weight: 600;
              }
              table td { 
                border: 1px solid #e2e8f0; 
                padding: 0.75em; 
              }
              .subtitle { 
                font-size: 1.1em; 
                color: #718096; 
                margin-top: -0.5em;
                font-weight: 500;
              }
              .last-update { 
                color: #718096; 
                font-size: 0.9em;
                margin: 1em 0;
                font-style: italic;
              }
              .info-box, .warning-box, .contact-box {
                padding: 1.25em;
                margin: 1.5em 0;
                border-radius: 0.5em;
                border: 1px solid;
              }
              .info-box {
                background: #ebf8ff;
                border-color: #90cdf4;
              }
              .warning-box {
                background: #fffaf0;
                border-color: #feb2b2;
              }
              .contact-box {
                background: #f0fff4;
                border-color: #9ae6b4;
              }
              a { color: #3182ce; text-decoration: underline; }
              a:hover { color: #2c5282; }
              strong { font-weight: 600; color: #1a202c; }
              code { 
                background: #f7fafc; 
                padding: 0.2em 0.4em; 
                border-radius: 0.25em;
                font-size: 0.9em;
                font-family: 'Monaco', 'Courier New', monospace;
              }
              pre {
                background: #2d3748;
                color: #f7fafc;
                padding: 1em;
                border-radius: 0.5em;
                overflow-x: auto;
              }
            `,
            placeholder: placeholder,
            paste_as_text: false,
            paste_data_images: true,
            browser_spellcheck: true,
            contextmenu: 'link image table',
            templates: [
              {
                title: 'Sezione Standard',
                description: 'Una sezione con titolo e contenuto',
                content: '<h2>Titolo Sezione</h2><p>Contenuto della sezione...</p>'
              },
              {
                title: 'Lista Puntata',
                description: 'Lista con punti elenco',
                content: '<ul><li>Primo punto</li><li>Secondo punto</li><li>Terzo punto</li></ul>'
              },
              {
                title: 'Tabella 3x3',
                description: 'Tabella con intestazioni',
                content: '<table><thead><tr><th>Colonna 1</th><th>Colonna 2</th><th>Colonna 3</th></tr></thead><tbody><tr><td>Dato 1</td><td>Dato 2</td><td>Dato 3</td></tr></tbody></table>'
              }
            ],
            setup: function(editor: any) {
              editor.on('change', function() {
                onChange(editor.getContent());
              });
            }
          }}
        />
      )}

      {/* Help text */}
      {!isFullscreen && (
        <p className="mt-2 text-xs text-gray-500">
          Usa l'editor per formattare il testo. Puoi inserire titoli, liste, tabelle, link e immagini. 
          Clicca su "Anteprima" per vedere come apparirà il documento finale.
        </p>
      )}

      {/* Custom styles for editor */}
      <style jsx>{`
        .rich-text-editor :global(.tox-tinymce) {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        }
        .rich-text-editor :global(.tox .tox-toolbar__primary) {
          background: #f9fafb;
        }
        .rich-text-editor.fullscreen {
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
