import React from 'react';
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CustomFormViewerProps {
  form: {
    name: string;
    description?: string;
    Fields?: Array<{
      id: string;
      fieldName?: string;
      label?: string;
      visibleOnlyToProfessional?: boolean;
    }>;
  };
  responses: Array<{
    fieldId?: string;
    fieldName: string;
    fieldType: string;
    value: string | null;
    valueJson: any;
  }>;
  requestInfo?: {
    requestNumber?: number;
    category?: string;
    subcategory?: string;
  };
  sentBy?: {
    firstName: string;
    lastName: string;
    sentAt: string;
  };
  completedBy?: {
    firstName: string;
    lastName: string;
    completedAt: string;
  };
  userRole?: string; // Ruolo dell'utente che visualizza (PROFESSIONAL o CLIENT)
  onClose: () => void;
}

export const CustomFormViewer: React.FC<CustomFormViewerProps> = ({
  form,
  responses,
  requestInfo,
  sentBy,
  completedBy,
  userRole,
  onClose
}) => {
  // Filtra le risposte in base al ruolo dell'utente
  const visibleResponses = responses.filter(response => {
    // Se l'utente è un professional, mostra tutto
    if (userRole === 'PROFESSIONAL' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return true;
    }
    
    // Se l'utente è un cliente, nascondi i campi visibili solo al professional
    const field = form.Fields?.find(f => 
      f.id === response.fieldId || 
      f.fieldName === response.fieldName || 
      f.label === response.fieldName
    );
    
    return !field?.visibleOnlyToProfessional;
  });
  const renderValue = (response: any) => {
    // Se è un campo multiplo (checkbox, multiselect, tags), usa valueJson
    if (['CHECKBOX', 'MULTISELECT', 'TAGS'].includes(response.fieldType) && response.valueJson) {
      const values = Array.isArray(response.valueJson) ? response.valueJson : [];
      return values.join(', ');
    }

    // Altrimenti usa value
    return response.value || '-';
  };

  const handlePrint = () => {
    // Crea HTML ottimizzato per la stampa
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${form.name}</title>
          <style>
            @page { 
              margin: 2cm;
              size: A4;
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              margin: 0;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: start; 
              margin-bottom: 20px; 
            }
            h1 { 
              color: #1f2937; 
              margin: 0; 
              flex: 1;
              font-size: 24px;
            }
            .request-info { 
              text-align: right; 
              color: #6b7280; 
              font-size: 14px; 
            }
            .divider { 
              border-bottom: 2px solid #3b82f6; 
              margin: 20px 0; 
            }
            .description { 
              color: #6b7280; 
              margin-bottom: 30px; 
            }
            .field { 
              margin-bottom: 25px; 
              page-break-inside: avoid; 
            }
            .field-label { 
              font-weight: bold; 
              color: #374151; 
              margin-bottom: 8px; 
            }
            .field-value { 
              color: #1f2937; 
              padding: 10px; 
              background: #f9fafb; 
              border-left: 3px solid #3b82f6;
              word-wrap: break-word;
            }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
              font-size: 12px; 
              color: #6b7280; 
            }
            .footer-row { 
              margin-bottom: 8px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${form.name}</h1>
            ${requestInfo ? `
              <div class="request-info">
                <div><strong>Richiesta N.</strong> ${requestInfo.requestNumber !== undefined && requestInfo.requestNumber !== null ? requestInfo.requestNumber : 'N/A'}</div>
                <div>${requestInfo.category || 'N/A'}${requestInfo.subcategory ? ' → ' + requestInfo.subcategory : ''}</div>
              </div>
            ` : ''}
          </div>
          <div class="divider"></div>
          ${form.description ? `<p class="description">${form.description}</p>` : ''}
          ${visibleResponses.map(r => `
            <div class="field">
              <div class="field-label">${r.fieldName}</div>
              <div class="field-value">${renderValue(r)}</div>
            </div>
          `).join('')}
          <div class="footer">
            ${sentBy ? `
              <div class="footer-row">
                <strong>📤 Inviato da:</strong> ${sentBy.firstName} ${sentBy.lastName} il ${new Date(sentBy.sentAt).toLocaleDateString('it-IT')} alle ${new Date(sentBy.sentAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ` : ''}
            ${completedBy ? `
              <div class="footer-row">
                <strong>✅ Completato da:</strong> ${completedBy.firstName} ${completedBy.lastName} il ${new Date(completedBy.completedAt).toLocaleDateString('it-IT')} alle ${new Date(completedBy.completedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ` : ''}
            <div class="footer-row" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
            </div>
          </div>
        </body>
      </html>
    `;

    // Apri in nuova finestra e stampa
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Attendi il caricamento e stampa
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } else {
      toast.error('Impossibile aprire la finestra di stampa. Verifica le impostazioni del browser.');
    }
  };

  const handleDownloadPDF = () => {
    // Genera HTML del form per il PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${form.name}</title>
          <style>
            @media print {
              @page { margin: 2cm; }
            }
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; }
            h1 { color: #1f2937; margin: 0; flex: 1; }
            .request-info { text-align: right; color: #6b7280; font-size: 14px; }
            .divider { border-bottom: 2px solid #3b82f6; margin: 20px 0; }
            .description { color: #6b7280; margin-bottom: 30px; }
            .field { margin-bottom: 25px; page-break-inside: avoid; }
            .field-label { font-weight: bold; color: #374151; margin-bottom: 8px; }
            .field-value { color: #1f2937; padding: 10px; background: #f9fafb; border-left: 3px solid #3b82f6; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            .footer-row { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${form.name}</h1>
            ${requestInfo ? `
              <div class="request-info">
                <div><strong>Richiesta N.</strong> ${requestInfo.requestNumber !== undefined && requestInfo.requestNumber !== null ? requestInfo.requestNumber : 'N/A'}</div>
                <div>${requestInfo.category || 'N/A'}${requestInfo.subcategory ? ' → ' + requestInfo.subcategory : ''}</div>
              </div>
            ` : ''}
          </div>
          <div class="divider"></div>
          ${form.description ? `<p class="description">${form.description}</p>` : ''}
          ${visibleResponses.map(r => `
            <div class="field">
              <div class="field-label">${r.fieldName}</div>
              <div class="field-value">${renderValue(r)}</div>
            </div>
          `).join('')}
          <div class="footer">
            ${sentBy ? `
              <div class="footer-row">
                <strong>📤 Inviato da:</strong> ${sentBy.firstName} ${sentBy.lastName} il ${new Date(sentBy.sentAt).toLocaleDateString('it-IT')} alle ${new Date(sentBy.sentAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ` : ''}
            ${completedBy ? `
              <div class="footer-row">
                <strong>✅ Completato da:</strong> ${completedBy.firstName} ${completedBy.lastName} il ${new Date(completedBy.completedAt).toLocaleDateString('it-IT')} alle ${new Date(completedBy.completedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ` : ''}
            <div class="footer-row" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
            </div>
          </div>
        </body>
      </html>
    `;

    // Crea un Blob e scarica
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Form scaricato! Puoi aprirlo e salvarlo come PDF');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{form.name}</h2>
                {requestInfo && (
                  <div className="ml-4 text-right text-sm text-gray-600">
                    <div><strong>Richiesta N.</strong> {requestInfo.requestNumber !== undefined && requestInfo.requestNumber !== null ? requestInfo.requestNumber : 'N/A'}</div>
                    <div className="text-xs">
                      {requestInfo.category}{requestInfo.subcategory && ` → ${requestInfo.subcategory}`}
                    </div>
                  </div>
                )}
              </div>
              {form.description && (
                <p className="text-sm text-gray-600 mt-1">{form.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Risposte */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {visibleResponses.length > 0 ? (
              visibleResponses.map((response, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {response.fieldName}
                  </label>
                  <div className="text-gray-900">
                    {renderValue(response)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nessuna risposta disponibile
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Stampa
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Scarica PDF
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
