import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  TagIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    imageUrl: '',
    videoUrl: ''
  });

  const queryClient = useQueryClient();

  // Query per gli articoli
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['kb-articles', searchQuery, selectedCategory],
    queryFn: () => api.get('/kb/articles', {
      params: {
        search: searchQuery,
        category: selectedCategory
      }
    })
  });

  // Query per le categorie
  const { data: categories } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: () => api.get('/kb/categories')
  });

  // Query per articoli popolari
  const { data: popularArticles } = useQuery({
    queryKey: ['kb-popular'],
    queryFn: () => api.get('/kb/popular')
  });

  // Mutation per creare articolo
  const createArticleMutation = useMutation({
    mutationFn: (data) => api.post('/kb/articles', data),
    onSuccess: () => {
      toast.success('Articolo creato con successo!');
      queryClient.invalidateQueries(['kb-articles']);
      setShowCreateForm(false);
      setArticleForm({
        title: '',
        content: '',
        category: '',
        tags: '',
        imageUrl: '',
        videoUrl: ''
      });
    },
    onError: (error) => {
      toast.error('Errore creazione articolo');
      console.error(error);
    }
  });

  // Mutation per feedback
  const feedbackMutation = useMutation({
    mutationFn: (data) => api.post('/kb/feedback', data),
    onSuccess: () => {
      toast.success('Grazie per il tuo feedback!');
      queryClient.invalidateQueries(['kb-articles']);
    },
    onError: (error) => {
      toast.error('Errore invio feedback');
      console.error(error);
    }
  });

  const handleCreateArticle = (e) => {
    e.preventDefault();
    const tags = articleForm.tags.split(',').map(t => t.trim()).filter(t => t);
    createArticleMutation.mutate({
      ...articleForm,
      tags,
      published: true
    });
  };

  const handleFeedback = (articleId, helpful) => {
    feedbackMutation.mutate({
      articleId,
      helpful
    });
  };

  const articles = articlesData?.articles || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuovo Articolo
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca articoli..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutte le categorie</option>
              {categories?.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Caricamento articoli...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nessun articolo trovato</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map(article => (
                  <div
                    key={article.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 mb-3">
                          {article.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            {article.views} visualizzazioni
                          </span>
                          <span className="flex items-center">
                            <HandThumbUpIcon className="h-4 w-4 mr-1" />
                            {article.helpful}
                          </span>
                          {article.category && (
                            <span className="flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {article.category}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-24 h-24 object-cover rounded-lg ml-4"
                        />
                      )}
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {article.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Articoli Popolari */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                Articoli Popolari
              </h3>
              <div className="space-y-3">
                {popularArticles?.slice(0, 5).map(article => (
                  <div
                    key={article.id}
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <p className="font-medium text-sm">{article.title}</p>
                    <p className="text-xs text-gray-500">
                      {article.views} visualizzazioni
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiche */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiche Knowledge Base
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Totale articoli</span>
                  <span className="font-semibold">{articlesData?.pagination?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categorie</span>
                  <span className="font-semibold">{categories?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dettaglio Articolo */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedArticle.title}
              </h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {selectedArticle.imageUrl && (
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-wrap">{selectedArticle.content}</p>
              </div>
              
              {selectedArticle.videoUrl && (
                <div className="mb-6">
                  <iframe
                    src={selectedArticle.videoUrl}
                    className="w-full h-96 rounded-lg"
                    allowFullScreen
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleFeedback(selectedArticle.id, true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    <HandThumbUpIcon className="h-5 w-5" />
                    Utile ({selectedArticle.helpful})
                  </button>
                  <button
                    onClick={() => handleFeedback(selectedArticle.id, false)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <HandThumbDownIcon className="h-5 w-5" />
                    Non utile ({selectedArticle.notHelpful})
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  {selectedArticle.authorUser && (
                    <span className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {selectedArticle.authorUser.fullName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crea Articolo */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Crea Nuovo Articolo
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateArticle} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titolo
                </label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenuto
                </label>
                <textarea
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({...articleForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (separati da virgola)
                  </label>
                  <input
                    type="text"
                    value={articleForm.tags}
                    onChange={(e) => setArticleForm({...articleForm, tags: e.target.value})}
                    placeholder="idraulica, perdite, tutorial"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Immagine (opzionale)
                </label>
                <input
                  type="url"
                  value={articleForm.imageUrl}
                  onChange={(e) => setArticleForm({...articleForm, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Video (opzionale)
                </label>
                <input
                  type="url"
                  value={articleForm.videoUrl}
                  onChange={(e) => setArticleForm({...articleForm, videoUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={createArticleMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createArticleMutation.isPending ? 'Creazione...' : 'Crea Articolo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
