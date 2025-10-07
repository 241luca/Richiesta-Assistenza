import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  XMarkIcon,
  PencilIcon,
  StarIcon,
  TagIcon,
  CalendarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  whatsappId?: string;
  name?: string;
  pushname?: string;
  shortName?: string;
  businessName?: string;
  isMyContact: boolean;
  isUser: boolean;
  isBusiness: boolean;
  isEnterprise: boolean;
  isGroup: boolean;
  isBlocked: boolean;
  profilePicUrl?: string;
  statusMessage?: string;
  about?: string;
  businessCategory?: string;
  firstMessageAt?: Date;
  lastMessageAt?: Date;
  totalMessages: number;
  userId?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  professionalId?: string;
  professional?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
}

export default function WhatsAppContacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'linked' | 'unlinked' | 'business' | 'favorite'>('all');
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<WhatsAppContact | null>(null);
  const queryClient = useQueryClient();

  // Query contatti
  const { data: contacts = [], isLoading, refetch } = useQuery<WhatsAppContact[]>({
    queryKey: ['whatsapp', 'contacts'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/contacts');
      return response.data.data || [];
    }
  });

  // Query utenti per il collegamento
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.data || [];
    },
    enabled: linkModalOpen
  });

  // Mutation per collegare contatto a utente
  const linkContactMutation = useMutation({
    mutationFn: async (data: { contactId: string; userId?: string; professionalId?: string }) => {
      const response = await api.put(`/whatsapp/contacts/${data.contactId}/link`, {
        userId: data.userId,
        professionalId: data.professionalId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Contatto collegato con successo!');
      refetch();
      setLinkModalOpen(false);
      setSelectedContact(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore collegamento contatto');
    }
  });

  // Mutation per aggiornare contatto
  const updateContactMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<WhatsAppContact> }) => {
      const response = await api.put(`/whatsapp/contacts/${data.id}`, data.updates);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Contatto aggiornato!');
      refetch();
      setEditModalOpen(false);
      setEditingContact(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore aggiornamento contatto');
    }
  });

  // Mutation per toggle preferito
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const contact = contacts.find(c => c.id === contactId);
      const response = await api.put(`/whatsapp/contacts/${contactId}`, {
        isFavorite: !contact?.isFavorite
      });
      return response.data;
    },
    onSuccess: () => {
      refetch();
      toast.success('Preferito aggiornato!');
    }
  });

  // Filtra contatti
  const filteredContacts = contacts.filter(contact => {
    // Filtro per tipo
    if (filterType === 'linked' && !contact.userId && !contact.professionalId) return false;
    if (filterType === 'unlinked' && (contact.userId || contact.professionalId)) return false;
    if (filterType === 'business' && !contact.isBusiness) return false;
    if (filterType === 'favorite' && !contact.isFavorite) return false;

    // Filtro per ricerca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        contact.name?.toLowerCase().includes(search) ||
        contact.phoneNumber.includes(search) ||
        contact.pushname?.toLowerCase().includes(search) ||
        contact.businessName?.toLowerCase().includes(search) ||
        contact.user?.fullName.toLowerCase().includes(search) ||
        contact.professional?.fullName.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Statistiche
  const stats = {
    total: contacts.length,
    linked: contacts.filter(c => c.userId || c.professionalId).length,
    unlinked: contacts.filter(c => !c.userId && !c.professionalId).length,
    business: contacts.filter(c => c.isBusiness).length,
    favorites: contacts.filter(c => c.isFavorite).length
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('39')) {
      const number = phone.substring(2);
      return `+39 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Caricamento contatti...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Contatti WhatsApp</h2>
        
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Totali</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600">Collegati</div>
            <div className="text-2xl font-bold text-green-900">{stats.linked}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-600">Non collegati</div>
            <div className="text-2xl font-bold text-orange-900">{stats.unlinked}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600">Business</div>
            <div className="text-2xl font-bold text-blue-900">{stats.business}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-600">Preferiti</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.favorites}</div>
          </div>
        </div>

        {/* Filtri */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per nome, numero, azienda..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setFilterType('linked')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'linked'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Collegati
            </button>
            <button
              onClick={() => setFilterType('unlinked')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'unlinked'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Non collegati
            </button>
            <button
              onClick={() => setFilterType('business')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'business'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Business
            </button>
            <button
              onClick={() => setFilterType('favorite')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'favorite'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Preferiti
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Lista contatti */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numero
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collegamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messaggi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ultimo contatto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {contact.profilePicUrl ? (
                        <img
                          src={contact.profilePicUrl}
                          alt=""
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-gray-400" />
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {contact.name || contact.pushname || 'Sconosciuto'}
                          {contact.isFavorite && (
                            <StarIconSolid className="h-4 w-4 text-yellow-500 ml-1" />
                          )}
                        </div>
                        {contact.statusMessage && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {contact.statusMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {formatPhone(contact.phoneNumber)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.user || contact.professional ? (
                      <div className="flex items-center">
                        <CheckBadgeIcon className="h-5 w-5 text-green-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contact.user?.fullName || contact.professional?.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contact.user ? 'Cliente' : 'Professionista'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setLinkModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Collega
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.totalMessages}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contact.lastMessageAt
                        ? format(new Date(contact.lastMessageAt), 'dd/MM HH:mm', { locale: it })
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {contact.isBusiness && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Business
                        </span>
                      )}
                      {contact.isEnterprise && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          Enterprise
                        </span>
                      )}
                      {contact.isGroup && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Gruppo
                        </span>
                      )}
                      {contact.isBlocked && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Bloccato
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleFavoriteMutation.mutate(contact.id)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        {contact.isFavorite ? (
                          <StarIconSolid className="h-5 w-5" />
                        ) : (
                          <StarIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingContact(contact);
                          setEditModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <a
                        href={`/admin/whatsapp/messages?phone=${contact.phoneNumber}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nessun contatto trovato
            </div>
          )}
        </div>
      </div>

      {/* Modal collegamento */}
      {linkModalOpen && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Collega contatto a utente
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Contatto: <strong>{selectedContact.name || selectedContact.phoneNumber}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Numero: <strong>{formatPhone(selectedContact.phoneNumber)}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleziona utente da collegare:
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value);
                  if (user) {
                    const data = user.role === 'PROFESSIONAL' 
                      ? { contactId: selectedContact.id, professionalId: user.id }
                      : { contactId: selectedContact.id, userId: user.id };
                    linkContactMutation.mutate(data);
                  }
                }}
              >
                <option value="">Seleziona...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} - {user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setLinkModalOpen(false);
                  setSelectedContact(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal modifica */}
      {editModalOpen && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Modifica contatto
            </h3>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateContactMutation.mutate({
                  id: editingContact.id,
                  updates: {
                    name: formData.get('name') as string,
                    notes: formData.get('notes') as string,
                    tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean)
                  }
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingContact.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (separati da virgola)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingContact.tags.join(', ')}
                    placeholder="cliente vip, fornitore, urgente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingContact.notes}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
