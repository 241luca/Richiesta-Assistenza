import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import MyContainers from '../../components/smartdocs/MyContainers';

export default function MySmartDocsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <MyContainers userId={user.id} userType="CLIENT" />
    </div>
  );
}
