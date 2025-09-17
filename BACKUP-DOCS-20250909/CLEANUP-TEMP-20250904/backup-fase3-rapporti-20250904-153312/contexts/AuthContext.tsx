// File temporaneo di compatibilità
// QUESTO FILE È DEPRECATO - usare ../hooks/useAuth invece

// Re-export del nuovo hook per compatibilità
export { useAuth } from '../hooks/useAuth';

// Provider fittizio che non fa nulla (non dovrebbe essere usato)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.warn('⚠️ AuthProvider è deprecato. Rimuovere dal codice e usare solo useAuth hook.');
  return <>{children}</>;
}
