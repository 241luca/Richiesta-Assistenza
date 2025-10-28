import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FormRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  isReadonly?: boolean;
  isRequired?: boolean;
}

/**
 * Editor di testo rich per campi custom form
 * Versione semplificata di RichTextEditor.tsx per uso nei form
 */
export const FormRichTextEditor: React.FC<FormRichTextEditorProps> = ({ 
  value, 
  onChange, 
  height = 300,
  placeholder = 'Inserisci il testo...',
  isReadonly = false,
  isRequired = false
}) => {
  const editorRef = useRef<any>(null);
  const [tinymceApiKey, setTinymceApiKey] = useState<string | null>(null);

  // Carica la API key di TinyMCE dal database
  const { data: apiKeyData, isLoading: keyLoading } = useQuery({
    queryKey: ['api-key-tinymce-form-editor'],
    queryFn: async () => {
      try {
        // Prende la chiave dal database tramite API
        const response = await api.get('/admin/api-keys/TINYMCE/raw');
        if (response.data?.data?.key) {
          return response.data.data.key;
        }
      } catch (error) {
        // Fallback: prova lista chiavi
        try {
          const response = await api.get('/admin/api-keys');
          const keys = response.data?.data || [];
          const tinymceKey = keys.find((key: any) => 
            key.service === 'TINYMCE'
          );
          if (tinymceKey?.key) {
            return tinymceKey.key;
          }
        } catch (err) {
          console.error('FormRichTextEditor: Failed to load TinyMCE key:', err);
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

  // Se sta caricando la key, mostra loading
  if (keyLoading) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-gray-600 mt-2">Caricamento editor...</p>
        </div>
      </div>
    );
  }

  // Se non c'è la API key, mostra campo textarea di fallback
  if (!tinymceApiKey) {
    return (
      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="w-full rounded-md border-2 border-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white min-h-[200px]"
          placeholder={placeholder}
          readOnly={isReadonly}
          required={isRequired}
        />
        <div className="mt-2 flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Editor avanzato non disponibile. Configurare TinyMCE API key in Gestione API Keys.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-rich-text-editor">
      <Editor
        ref={editorRef}
        apiKey={tinymceApiKey}
        value={value}
        disabled={isReadonly}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'lists', 'link', 'charmap',
            'searchreplace', 'code',
            'insertdatetime', 'table', 'wordcount',
            'emoticons', 'quickbars'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic underline strikethrough | forecolor backcolor | ' +
            'alignleft aligncenter alignright | ' +
            'bullist numlist | ' +
            'link emoticons | ' +
            'removeformat code',
          toolbar_mode: 'sliding',
          block_formats: 'Paragrafo=p; Titolo 1=h1; Titolo 2=h2; Titolo 3=h3; Citazione=blockquote',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #1a202c;
              padding: 0.75rem;
            }
            h1 { font-size: 1.8em; font-weight: 700; margin: 0.8em 0 0.4em; }
            h2 { font-size: 1.5em; font-weight: 600; margin: 0.8em 0 0.4em; }
            h3 { font-size: 1.2em; font-weight: 600; margin: 0.8em 0 0.4em; }
            p { margin: 0.5em 0; }
            ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
            li { margin: 0.25em 0; }
            blockquote { 
              border-left: 3px solid #3182ce; 
              padding-left: 1em; 
              margin: 1em 0; 
              font-style: italic;
              color: #4a5568;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 1em 0;
            }
            table th { 
              background: #f7fafc; 
              border: 1px solid #e2e8f0; 
              padding: 0.5em; 
              text-align: left;
              font-weight: 600;
            }
            table td { 
              border: 1px solid #e2e8f0; 
              padding: 0.5em; 
            }
            a { color: #3182ce; text-decoration: underline; }
            strong { font-weight: 600; }
          `,
          placeholder: placeholder,
          paste_as_text: false,
          browser_spellcheck: true,
          contextmenu: 'link table',
          quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
          quickbars_insert_toolbar: false,
          setup: function(editor: any) {
            editor.on('change keyup', function() {
              onChange(editor.getContent());
            });
            
            // Se è readonly, disabilita editing
            if (isReadonly) {
              editor.mode.set('readonly');
            }
          }
        }}
      />
      
      {/* Custom styles applied via className */}
    </div>
  );
};
