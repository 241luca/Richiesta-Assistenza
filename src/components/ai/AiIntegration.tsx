import React from 'react';
import { AiChatComplete } from './AiChatComplete';

interface AiIntegrationProps {
  requestId: string;
  subcategoryId?: string;
  userRole: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
}

export function AiIntegration({ requestId, subcategoryId, userRole }: AiIntegrationProps) {
  const getConversationType = () => {
    switch (userRole) {
      case 'PROFESSIONAL':
        return 'professional_help';
      case 'CLIENT':
        return 'client_help';
      default:
        return 'system_help';
    }
  };

  return (
    <AiChatComplete
      requestId={requestId}
      subcategoryId={subcategoryId}
      conversationType={getConversationType()}
      className="z-50"
    />
  );
}
