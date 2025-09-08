import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PhotoIcon, DocumentIcon } from '@heroicons/react/24/solid';

interface MessageItemProps {
  message: {
    id: string;
    message: string;
    messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'SYSTEM';
    attachments?: any[];
    isEdited: boolean;
    editedAt?: string;
    isDeleted: boolean;
    createdAt: string;
    User: {
      id: string;
      fullName: string;
      avatar?: string;
      role: string;
    };
  };
  isOwn: boolean;
  onEdit: (newMessage: string) => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  onEdit,
  onDelete,
  canEdit,
  canDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.message);

  const handleSaveEdit = () => {
    if (editedText.trim() !== message.message) {
      onEdit(editedText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(message.message);
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN':
        return 'text-purple-600';
      case 'ADMIN':
        return 'text-red-600';
      case 'PROFESSIONAL':
        return 'text-blue-600';
      case 'CLIENT':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700 border border-purple-300';
      case 'ADMIN':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'PROFESSIONAL':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'CLIENT':
        return 'bg-green-100 text-green-700 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin/Staff';
      case 'PROFESSIONAL':
        return 'Professionista';
      case 'CLIENT':
        return 'Cliente';
      default:
        return '';
    }
  };

  // Messaggio di sistema
  if (message.messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-full text-sm">
          {message.message}
        </div>
      </div>
    );
  }

  // Messaggio eliminato
  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="max-w-xs lg:max-w-md">
          <div className="px-4 py-2 bg-gray-200 text-gray-500 italic rounded-lg">
            Messaggio eliminato
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Nome utente e ruolo - mostra sempre, anche per i propri messaggi */}
        <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-sm font-semibold text-gray-700">
            {message.User.fullName || 'Utente'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeStyle(message.User.role)}`}>
            {getRoleBadge(message.User.role)}
          </span>
        </div>

        <div className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          {!isOwn && (
            <div className="flex-shrink-0">
              {message.User.avatar ? (
                <img
                  src={message.User.avatar}
                  alt={message.User.fullName}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm text-gray-600">
                    {message.User.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Contenuto messaggio */}
          <div className={`flex-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 text-green-600 hover:text-green-800"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.message}</p>
                  
                  {/* Allegati */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {(message.attachments as any[]).map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded ${
                            isOwn ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {attachment.fileType?.startsWith('image/') ? (
                            <PhotoIcon className="h-4 w-4" />
                          ) : (
                            <DocumentIcon className="h-4 w-4" />
                          )}
                          <span className="text-sm truncate">{attachment.fileName}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Azioni messaggio */}
                {(canEdit || canDelete) && (
                  <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Modifica"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={onDelete}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Elimina"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Timestamp e stato modifica */}
            <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span>
                {format(new Date(message.createdAt), 'HH:mm', { locale: it })}
              </span>
              {message.isEdited && (
                <span className="italic">modificato</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
