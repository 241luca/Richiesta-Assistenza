import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentTextIcon,
  CheckBadgeIcon,
  CalendarIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  CodeBracketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface LegalDocumentEditorProps {
  initialContent?: string;
  onChange: (content: string, plainText: string) => void;
  mode?: 'create' | 'edit' | 'view';
  showPreview?: boolean;
}

/**
 * Editor professionale per documenti legali
 * Per ora usa un textarea avanzato, poi potremo integrare TinyMCE o Quill
 */
export default function LegalDocumentEditor({
  initialContent = '',
  onChange,
  mode = 'create',
  showPreview = true
}: LegalDocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Templates predefiniti
  const templates = {
    privacy: `<h1>Informativa sulla Privacy</h1>

<p>Ultimo aggiornamento: [DATA]</p>

<h2>1. Introduzione</h2>
<p>La presente Informativa sulla Privacy descrive come [NOME_AZIENDA] ("noi", "nostro" o "ci") raccoglie, utilizza e condivide le informazioni personali degli utenti.</p>

<h2>2. Informazioni che Raccogliamo</h2>
<p>Raccogliamo le seguenti categorie di informazioni personali:</p>
<ul>
  <li>Informazioni di contatto (nome, email, telefono)</li>
  <li>Informazioni di utilizzo del servizio</li>
  <li>Dati tecnici (IP, browser, dispositivo)</li>
</ul>

<h2>3. Come Utilizziamo le Informazioni</h2>
<p>Utilizziamo le informazioni raccolte per:</p>
<ul>
  <li>Fornire e migliorare i nostri servizi</li>
  <li>Comunicare con gli utenti</li>
  <li>Rispettare gli obblighi legali</li>
</ul>

<h2>4. Condivisione delle Informazioni</h2>
<p>Non vendiamo o affittiamo le informazioni personali a terzi.</p>

<h2>5. I Tuoi Diritti</h2>
<p>Hai il diritto di:</p>
<ul>
  <li>Accedere ai tuoi dati</li>
  <li>Correggere i dati inesatti</li>
  <li>Richiedere la cancellazione</li>
  <li>Opporti al trattamento</li>
</ul>

<h2>6. Contatti</h2>
<p>Per domande sulla privacy, contattaci a: privacy@[dominio].it</p>`,

    terms: `<h1>Termini di Servizio</h1>

<p>Ultimo aggiornamento: [DATA]</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando il nostro servizio, accetti di essere vincolato dai presenti Termini di Servizio.</p>

<h2>2. Descrizione del Servizio</h2>
<p>[NOME_SERVIZIO] è una piattaforma che connette clienti con professionisti per servizi di assistenza tecnica.</p>

<h2>3. Account Utente</h2>
<p>Sei responsabile della sicurezza del tuo account e di tutte le attività che avvengono sotto il tuo account.</p>

<h2>4. Uso Accettabile</h2>
<p>Ti impegni a utilizzare il servizio in modo legale e rispettoso.</p>

<h2>5. Proprietà Intellettuale</h2>
<p>Tutti i contenuti del servizio sono protetti da copyright e altri diritti di proprietà intellettuale.</p>

<h2>6. Limitazione di Responsabilità</h2>
<p>Il servizio è fornito "così com'è" senza garanzie di alcun tipo.</p>

<h2>7. Modifiche ai Termini</h2>
<p>Ci riserviamo il diritto di modificare questi termini in qualsiasi momento.</p>

<h2>8. Contatti</h2>
<p>Per domande sui termini, contattaci a: legal@[dominio].it</p>`,

    cookie: `<h1>Cookie Policy</h1>

<p>Ultimo aggiornamento: [DATA]</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti il nostro sito.</p>

<h2>2. Come Utilizziamo i Cookie</h2>
<p>Utilizziamo i cookie per:</p>
<ul>
  <li>Mantenere la sessione di login</li>
  <li>Ricordare le preferenze</li>
  <li>Analizzare il traffico del sito</li>
</ul>

<h2>3. Tipi di Cookie</h2>
<ul>
  <li><strong>Cookie Essenziali:</strong> Necessari per il funzionamento del sito</li>
  <li><strong>Cookie Funzionali:</strong> Migliorano l'esperienza utente</li>
  <li><strong>Cookie Analitici:</strong> Ci aiutano a capire come viene utilizzato il sito</li>
</ul>

<h2>4. Gestione dei Cookie</h2>
<p>Puoi gestire o disabilitare i cookie attraverso le impostazioni del tuo browser.</p>

<h2>5. Contatti</h2>
<p>Per domande sui cookie, contattaci a: privacy@[dominio].it</p>`
  };

  // Calcola conteggi
  useEffect(() => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    setWordCount(plainText.split(/\s+/).filter(word => word.length > 0).length);
    setCharCount(plainText.length);
  }, [content]);
  
  // Notifica il parent component solo quando il contenuto cambia
  useEffect(() => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    onChange(content, plainText);
  }, [content]); // Rimuovi onChange dalle dipendenze per evitare loop

  // Inserisci template
  const insertTemplate = (type: keyof typeof templates) => {
    const template = templates[type];
    setContent(template);
  };

  // Funzioni di formattazione base
  const insertTag = (tag: string, placeholder = '') => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      `<${tag}>${selectedText}</${tag}>` +
      content.substring(end);
    
    setContent(newContent);
    
    // Riposiziona il cursore
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + tag.length + 2 + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertList = (ordered = false) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const tag = ordered ? 'ol' : 'ul';
    const listTemplate = `<${tag}>
  <li>Elemento 1</li>
  <li>Elemento 2</li>
  <li>Elemento 3</li>
</${tag}>`;
    
    const newContent = 
      content.substring(0, start) + 
      listTemplate +
      content.substring(start);
    
    setContent(newContent);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Template buttons */}
            <div className="flex items-center space-x-1 pr-2 mr-2 border-r border-gray-300">
              <span className="text-sm text-gray-500">Template:</span>
              <button
                onClick={() => insertTemplate('privacy')}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="Inserisci template Privacy Policy"
              >
                Privacy
              </button>
              <button
                onClick={() => insertTemplate('terms')}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title="Inserisci template Termini di Servizio"
              >
                Termini
              </button>
              <button
                onClick={() => insertTemplate('cookie')}
                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                title="Inserisci template Cookie Policy"
              >
                Cookie
              </button>
            </div>

            {/* Formatting buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => insertTag('h1', 'Titolo')}
                className="px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded"
                title="Titolo H1"
              >
                H1
              </button>
              <button
                onClick={() => insertTag('h2', 'Sottotitolo')}
                className="px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded"
                title="Titolo H2"
              >
                H2
              </button>
              <button
                onClick={() => insertTag('p', 'Paragrafo')}
                className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                title="Paragrafo"
              >
                P
              </button>
              <button
                onClick={() => insertTag('strong', 'testo')}
                className="px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded"
                title="Grassetto"
              >
                B
              </button>
              <button
                onClick={() => insertTag('em', 'testo')}
                className="px-2 py-1 text-sm italic text-gray-700 hover:bg-gray-100 rounded"
                title="Corsivo"
              >
                I
              </button>
              <button
                onClick={() => insertList(false)}
                className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                title="Lista non ordinata"
              >
                UL
              </button>
              <button
                onClick={() => insertList(true)}
                className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                title="Lista ordinata"
              >
                OL
              </button>
            </div>
          </div>

          {/* Preview toggle */}
          {showPreview && (
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
                isPreview 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isPreview ? (
                <>
                  <CodeBracketIcon className="h-4 w-4" />
                  <span className="text-sm">Codice</span>
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  <span className="text-sm">Anteprima</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isPreview ? (
          <div 
            className="prose prose-sm max-w-none p-6"
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Nessun contenuto da visualizzare</p>' }}
          />
        ) : (
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm text-gray-800 resize-none focus:outline-none"
            placeholder="Inserisci il contenuto del documento legale in formato HTML..."
            disabled={mode === 'view'}
          />
        )}
      </div>

      {/* Footer con statistiche */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Parole: <strong>{wordCount}</strong></span>
          <span>Caratteri: <strong>{charCount}</strong></span>
        </div>
        {mode !== 'view' && (
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
            <span>Ricorda di sostituire i placeholder [DATA], [NOME_AZIENDA], etc.</span>
          </div>
        )}
      </div>
    </div>
  );
}
