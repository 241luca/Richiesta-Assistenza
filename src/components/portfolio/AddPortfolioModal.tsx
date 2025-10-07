import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AddPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
}

export const AddPortfolioModal: React.FC<AddPortfolioModalProps> = ({
  isOpen,
  onClose,
  professionalId
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    beforeImage: '',
    afterImage: '',
    categoryId: '',
    technicalDetails: '',
    materialsUsed: '',
    duration: '',
    cost: '',
    location: '',
    tags: ''
  });

  // Carica le categorie disponibili
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    }
  });

  // Mutation per creare il portfolio
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/portfolio', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Portfolio aggiunto con successo!');
      queryClient.invalidateQueries({ queryKey: ['portfolio', professionalId] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel creare il portfolio');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      beforeImage: '',
      afterImage: '',
      categoryId: '',
      technicalDetails: '',
      materialsUsed: '',
      duration: '',
      cost: '',
      location: '',
      tags: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione base
    if (!formData.title || !formData.beforeImage || !formData.afterImage || !formData.categoryId) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    // Prepara i dati
    const dataToSend = {
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
    };

    createMutation.mutate(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Aggiungi Nuovo Portfolio
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Titolo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Titolo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Es. Ristrutturazione bagno moderno"
                  />
                </div>

                {/* Descrizione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrizione
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Descrivi brevemente il lavoro svolto..."
                  />
                </div>

                {/* Immagini */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Foto Prima *
                    </label>
                    <div className="mt-1">
                      <input
                        type="url"
                        required
                        value={formData.beforeImage}
                        onChange={(e) => setFormData({...formData, beforeImage: e.target.value})}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="URL immagine prima"
                      />
                      {formData.beforeImage && (
                        <img 
                          src={formData.beforeImage} 
                          alt="Prima" 
                          className="mt-2 h-32 w-full object-cover rounded"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Foto Dopo *
                    </label>
                    <div className="mt-1">
                      <input
                        type="url"
                        required
                        value={formData.afterImage}
                        onChange={(e) => setFormData({...formData, afterImage: e.target.value})}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="URL immagine dopo"
                      />
                      {formData.afterImage && (
                        <img 
                          src={formData.afterImage} 
                          alt="Dopo" 
                          className="mt-2 h-32 w-full object-cover rounded"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Seleziona categoria</option>
                    {categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dettagli tecnici */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dettagli Tecnici
                  </label>
                  <textarea
                    value={formData.technicalDetails}
                    onChange={(e) => setFormData({...formData, technicalDetails: e.target.value})}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Specifiche tecniche del lavoro..."
                  />
                </div>

                {/* Materiali utilizzati */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Materiali Utilizzati
                  </label>
                  <input
                    type="text"
                    value={formData.materialsUsed}
                    onChange={(e) => setFormData({...formData, materialsUsed: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Es. Piastrelle in gres, sanitari Ideal Standard..."
                  />
                </div>

                {/* Durata e Costo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Durata Lavoro
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Es. 5 giorni"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Costo Indicativo (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Es. 2500.00"
                    />
                  </div>
                </div>

                {/* Location e Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Località
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Es. Milano, Zona Brera"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tags (separati da virgola)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="moderno, bagno, ristrutturazione"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Salvataggio...' : 'Salva Portfolio'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPortfolioModal;
