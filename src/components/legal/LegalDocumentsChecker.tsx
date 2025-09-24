import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import LegalAcceptanceModal from '@/components/legal/LegalAcceptanceModal';

/**
 * Hook che verifica se l'utente ha documenti legali da accettare
 * e mostra automaticamente il modal se necessario
 */
export function useLegalDocumentsCheck() {
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Fetch pending documents
  const { data: pendingDocuments, refetch } = useQuery({
    queryKey: ['pending-legal-documents-check'],
    queryFn: async () => {
      try {
        const response = await api.get('/legal/pending');
        return response.data?.data || [];
      } catch (error) {
        // Se l'utente non è autenticato o c'è un errore, return empty array
        return [];
      }
    },
    enabled: !hasChecked, // Solo se non abbiamo ancora controllato
    staleTime: 30 * 60 * 1000, // 30 minuti
  });

  useEffect(() => {
    // Se ci sono documenti pendenti e non abbiamo ancora mostrato il modal
    if (pendingDocuments && pendingDocuments.length > 0 && !hasChecked) {
      // Verifica se ci sono documenti obbligatori
      const hasRequired = pendingDocuments.some((doc: any) => doc.document.isRequired);
      
      if (hasRequired) {
        // Mostra il modal dopo un piccolo delay per non essere troppo invasivi
        setTimeout(() => {
          setShowModal(true);
        }, 2000);
      }
      
      setHasChecked(true);
    }
  }, [pendingDocuments, hasChecked]);

  const handleComplete = () => {
    setShowModal(false);
    refetch(); // Ricarica i documenti pendenti
  };

  const handleSkip = () => {
    setShowModal(false);
    // L'utente può skippare ma verrà richiesto alla prossima sessione
  };

  return {
    showModal,
    pendingDocuments: pendingDocuments || [],
    handleComplete,
    handleSkip
  };
}

/**
 * Componente da aggiungere nel Layout principale per controllare documenti pendenti
 */
export default function LegalDocumentsChecker() {
  const { showModal, handleComplete, handleSkip } = useLegalDocumentsCheck();

  return (
    <LegalAcceptanceModal
      isOpen={showModal}
      onComplete={handleComplete}
      onClose={handleSkip}
      canSkip={true} // Permettiamo di rimandare (per ora)
    />
  );
}
