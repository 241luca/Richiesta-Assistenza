import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import MyContainers from '../../components/smartdocs/MyContainers';

export default function MySmartDocsPage() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('[MySmartDocsPage] Component mounted');
    console.log('[MySmartDocsPage] User:', user);
  }, [user]);

  if (!user) {
    console.log('[MySmartDocsPage] User not loaded yet, showing loading...');
    return <div>Loading...</div>;
  }

  console.log('[MySmartDocsPage] Rendering MyContainers with userId:', user.id);

  return (
    <div className="container mx-auto p-6">
      <MyContainers userId={user.id} userType="PROFESSIONAL" />
    </div>
  );
}
