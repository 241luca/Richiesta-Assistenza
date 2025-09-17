import React from 'react';
import { ChatBubbleLeftRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface ChatHeaderProps {
  title: string;
  status: string;
  participants: Array<{
    id: string;
    fullName: string;
    role: string;
    avatar?: string;
  }>;
  isActive: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, status, participants, isActive }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'PENDING':
        return 'In attesa';
      case 'ASSIGNED':
        return 'Assegnata';
      case 'IN_PROGRESS':
        return 'In corso';
      case 'COMPLETED':
        return 'Completata';
      case 'CANCELLED':
        return 'Cancellata';
      default:
        return status;
    }
  };

  return (
    <div className="px-4 py-3 bg-white border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </span>
              {!isActive && (
                <span className="text-xs text-red-600 font-medium">
                  Chat chiusa
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((participant) => (
              <div
                key={participant.id}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-gray-200"
                title={participant.fullName}
              >
                {participant.avatar ? (
                  <img
                    src={participant.avatar}
                    alt={participant.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm font-medium">
                    {participant.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {participants.length > 3 && (
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-600">+{participants.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
