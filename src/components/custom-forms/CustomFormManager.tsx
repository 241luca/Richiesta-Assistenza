import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { customFormsAPI, CustomForm, CustomFormFilters } from '../../services/customForms.api';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface CustomFormManagerProps {
  subcategoryId?: string;
  onSelectForm?: (form: CustomForm) => void;
  showCreateButton?: boolean;
  showActions?: boolean;
}

export const CustomFormManager: React.FC<CustomFormManagerProps> = ({
  subcategoryId,
  onSelectForm,
  showCreateButton = true,
  showActions = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Check if user is professional (not admin)
  const isProfessional = user?.role === 'PROFESSIONAL';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  // IMPORTANTE: Nel DB CustomForm, professionalId è l'ID UTENTE del professionista, NON il professionId!
  // Quindi se l'utente è professional, usiamo il suo user.id come filtro
  const currentProfessionalId = isProfessional ? user?.id : undefined;
  
  console.log('🔍 User info (DETAILED):', {
    userId: user?.id,
    role: user?.role,
    isProfessional,
    isAdmin,
    professionId: (user as any)?.professionId,
    'FILTRO professionalId': currentProfessionalId,
    'SPIEGAZIONE': 'CustomForm.professionalId = User.id (non User.professionId!)'
  });
  
  const [filters, setFilters] = useState<CustomFormFilters>({
    subcategoryId,
    // Se è professional, filtra automaticamente per il suo USER ID (non professionId!)
    ...(isProfessional && currentProfessionalId ? { professionalId: currentProfessionalId } : {})
  });
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [showTemplates, setShowTemplates] = useState(true); // Checkbox per mostrare i template

  // Query per ottenere i professionisti (per il filtro) - SOLO PER ADMIN
  const { data: professionalsResponse } = useQuery({
    queryKey: ['professionals-list'],
    queryFn: async () => {
      const response = await api.get('/users/professionals');
      return response.data.data;
    },
    enabled: isAdmin, // Solo per admin
    staleTime: 30 * 60 * 1000,
  });

  // Query per ottenere categorie e sottocategorie
  const { data: categoriesResponse, isLoading: loadingCategories, error: errorCategories } = useQuery({
    queryKey: ['categories', isProfessional, user?.id],
    queryFn: async () => {
      console.log('📚 Fetching categories...', { isProfessional, userId: user?.id });
      
      if (isProfessional && user?.id) {
        // Per professional: carica solo le sue sottocategorie abilitate
        console.log('📚 Fetching professional subcategories for:', user.id);
        const response = await api.get(`/user/subcategories/${user.id}`);
        console.log('📚 Professional subcategories response:', response.data);
        
        // Trasforma in formato categorie con sottocategorie
        const subcategories = response.data.data || response.data || [];
        
        // Raggruppa per categoria
        const categoriesMap = new Map();
        subcategories.forEach((sub: any) => {
          const category = sub.Subcategory?.Category || sub.Category;
          const subcategory = sub.Subcategory || sub;
          
          if (category && subcategory) {
            if (!categoriesMap.has(category.id)) {
              categoriesMap.set(category.id, {
                ...category,
                Subcategory: []
              });
            }
            categoriesMap.get(category.id).Subcategory.push(subcategory);
          }
        });
        
        const categoriesArray = Array.from(categoriesMap.values());
        console.log('📚 Processed professional categories:', categoriesArray);
        
        return { data: categoriesArray };
      } else {
        // Per admin: tutte le categorie con sottocategorie
        const response = await api.get('/categories');
        console.log('📚 Admin categories response:', response.data);
        return response.data;
      }
    },
    staleTime: 30 * 60 * 1000,
  });

  const categories = categoriesResponse?.data || [];
  
  // Estrai gli ID delle sottocategorie abilitate per il professional
  const professionalSubcategoryIds = React.useMemo(() => {
    if (!isProfessional || !categories || categories.length === 0) return [];
    
    const ids: string[] = [];
    categories.forEach((category: any) => {
      const subs = category.Subcategory || category.Subcategories || [];
      subs.forEach((sub: any) => {
        if (sub.id) ids.push(sub.id);
      });
    });
    
    console.log('🔑 Professional subcategory IDs:', ids);
    return ids;
  }, [isProfessional, categories]);
  
  console.log('📚 Categories processed:', {
    loadingCategories,
    errorCategories,
    rawResponse: categoriesResponse,
    categoriesArray: categories,
    count: categories.length,
    firstCategory: categories[0]
  });

  // Query per ottenere i custom forms
  const { 
    data: customFormsResponse, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['custom-forms', filters, isProfessional, currentProfessionalId, showTemplates, professionalSubcategoryIds],
    queryFn: () => {
      // Se è professional, forza il filtro sul suo USER ID + flag isProfessionalView
      // MA SOLO SE ha un ID valido!
      // Se showTemplates è true, isProfessionalView farà l'OR query (suoi form + template)
      // Se showTemplates è false, NON mette isProfessionalView (solo suoi form)
      const finalFilters = isProfessional && currentProfessionalId
        ? { 
            ...filters, 
            professionalId: currentProfessionalId, 
            isProfessionalView: showTemplates, // Solo se checkbox attivo
            professionalSubcategoryIds: showTemplates ? professionalSubcategoryIds : undefined // Filtra template solo per sue sottocategorie
          }
        : filters;
      
      console.log('🔍 CustomFormManager - Filters (DETAILED):', {
        isProfessional,
        userId: user?.id,
        currentProfessionalId,
        showTemplates,
        professionalSubcategoryIds,
        professionalSubcategoryIdsLength: professionalSubcategoryIds?.length || 0,
        'HAS userId?': currentProfessionalId !== undefined,
        'WILL SHOW TEMPLATES?': showTemplates,
        originalFilters: filters,
        finalFilters
      });
      
      return customFormsAPI.getAllCustomForms(finalFilters);
    },
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  const customForms = customFormsResponse?.data?.data || customFormsResponse?.data || [];

  // Mutation per pubblicare un form
  const publishMutation = useMutation({
    mutationFn: (formId: string) => customFormsAPI.publishCustomForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      toast.success('Modulo pubblicato con successo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante la pubblicazione');
    }
  });

  // Mutation per eliminare un form
  const deleteMutation = useMutation({
    mutationFn: (formId: string) => customFormsAPI.deleteCustomForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      toast.success('Modulo eliminato con successo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'eliminazione');
    }
  });

  // Mutation per clonare un template
  const cloneMutation = useMutation({
    mutationFn: ({ formId, newName }: { formId: string; newName?: string }) => 
      customFormsAPI.cloneForm(formId, newName),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      const clonedForm = response.data?.data || response.data;
      toast.success(`Template clonato come "${clonedForm.name}"`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante la clonazione del template');
    }
  });

  const handlePublish = (form: CustomForm) => {
    if (window.confirm(`Sei sicuro di voler pubblicare il form "${form.name}"?`)) {
      publishMutation.mutate(form.id);
    }
  };

  const handleDelete = (form: CustomForm) => {
    if (window.confirm(`Sei sicuro di voler eliminare il form "${form.name}"? Questa azione non può essere annullata.`)) {
      deleteMutation.mutate(form.id);
    }
  };

  const handleCloneTemplate = (form: CustomForm) => {
    const newName = window.prompt(
      `Vuoi dare un nome personalizzato al tuo form?`,
      `${form.name} (Mio)`
    );
    
    // Se l'utente annulla, non fare nulla
    if (newName === null) return;
    
    // Se il nome è vuoto, usa il default
    const finalName = newName.trim() || undefined;
    
    cloneMutation.mutate({ formId: form.id, newName: finalName });
  };

  const handleSelectForm = (form: CustomForm) => {
    setSelectedForm(form);
    onSelectForm?.(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Caricamento custom forms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Errore nel caricamento
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Non è stato possibile caricare i custom forms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Moduli
          </h2>
          <p className="text-sm text-gray-600">
            Gestisci i moduli personalizzati per le richieste
          </p>
        </div>
        
        {showCreateButton && (
          <button
            type="button"
            onClick={() => {
              // Determina il percorso base in base alla location attuale
              const basePath = location.pathname.startsWith('/admin') 
                ? '/admin/custom-forms/new' 
                : '/professional/custom-forms/new';
              navigate(basePath);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuovo Form
          </button>
        )}
      </div>

      {/* Filtri */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        {/* Riga 1: Stato Pubblicazione (Checkbox) + Template (per Professional) */}
        <div className="flex items-start justify-between">
          {/* Stato Pubblicazione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato Pubblicazione
            </label>
            <div className="flex items-center space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isPublished === true}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({ ...filters, isPublished: true });
                    } else {
                      const { isPublished, ...rest } = filters;
                      setFilters(rest);
                    }
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  ✅ Pubblicati
                </span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isPublished === false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({ ...filters, isPublished: false });
                    } else {
                      const { isPublished, ...rest } = filters;
                      setFilters(rest);
                    }
                  }}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  📝 Bozze
                </span>
              </label>
            </div>
          </div>

          {/* Mostra Template - SOLO PER PROFESSIONAL */}
          {isProfessional && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visualizzazione
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showTemplates}
                  onChange={(e) => setShowTemplates(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  📚 Mostra Template Repository
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Riga 2: Altri filtri */}
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          {/* Filtro Proprietario - SOLO PER ADMIN */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proprietario
              </label>
              <select
                value={filters.professionalId === undefined ? '' : (filters.professionalId || 'template')}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({
                    ...filters,
                    professionalId: value === '' ? undefined : (value === 'template' ? null : value)
                  });
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Tutti</option>
                <option value="template">📚 Template Repository</option>
                {professionalsResponse?.map((prof: any) => (
                  <option key={prof.id} value={prof.id}>
                    👤 {prof.firstName} {prof.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Sottocategoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sottocategoria
            </label>
            <select
              value={filters.subcategoryId || ''}
              onChange={(e) => setFilters({
                ...filters,
                subcategoryId: e.target.value || undefined
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tutte le sottocategorie</option>
              {categories.flatMap((category: any) => {
                // Supporta sia 'Subcategory' che 'Subcategories' (Prisma singolare vs plurale)
                const subs = category.Subcategory || category.Subcategories || [];
                return subs.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {category.name} → {sub.name}
                  </option>
                ));
              })}
            </select>
          </div>

          {/* Campo Ricerca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cerca
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({
                ...filters,
                search: e.target.value || undefined
              })}
              placeholder="Nome del form..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Lista Moduli */}
      {customForms.length === 0 ? (
        <div className="text-center py-12">
          <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nessun custom form trovato
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {subcategoryId 
              ? 'Non ci sono custom forms per questa sottocategoria.'
              : 'Inizia creando il tuo primo custom form.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customForms.map((form: CustomForm) => (
            <div
              key={form.id}
              className={`bg-white rounded-lg border-2 p-6 hover:shadow-md transition-shadow cursor-pointer ${
                selectedForm?.id === form.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectForm(form)}
            >
              {/* Header del form */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {form.name}
                  </h3>
                  {form.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                </div>
                
                {/* Status badge */}
                <div className="ml-4">
                  {form.isPublished ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Pubblicato
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Bozza
                    </span>
                  )}
                </div>
              </div>

              {/* Informazioni del form */}
              <div className="space-y-2 mb-4">
                {/* Proprietario (Nuovo!) */}
                <div className="flex items-center text-sm">
                  {form.professionalId ? (
                    <>
                      <UserIcon className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-700">Professional:</span>
                      <span className="ml-1 text-gray-600">
                        {form.Professional?.firstName} {form.Professional?.lastName}
                      </span>
                    </>
                  ) : (
                    <>
                      <BookOpenIcon className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="font-medium text-purple-700">Template Repository</span>
                    </>
                  )}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Campi:</span>
                  <span className="ml-1">{(form.Fields || form.fields || []).length}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Tipo:</span>
                  <span className="ml-1">{form.displayType}</span>
                </div>

                {/* Categoria → Sottocategoria */}
                {(form.Subcategory || form.subcategory) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Categoria:</span>
                    <span className="ml-1">
                      {((form.Subcategory as any)?.Category?.name || (form.subcategory as any)?.Category?.name || 'N/A')} → {(form.Subcategory?.name || form.subcategory?.name)}
                    </span>
                  </div>
                )}
              </div>

              {/* Azioni */}
              {showActions && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const basePath = location.pathname.startsWith('/admin') 
                          ? `/admin/custom-forms/${form.id}` 
                          : `/professional/custom-forms/${form.id}`;
                        navigate(basePath);
                      }}
                      className="inline-flex items-center p-1.5 border border-transparent rounded text-gray-400 hover:text-gray-600"
                      title="Visualizza"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {/* Mostra Modifica solo per i form di proprietà (non per i template se sei professional) */}
                    {(!form.professionalId && isProfessional) ? null : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const basePath = location.pathname.startsWith('/admin') 
                            ? `/admin/custom-forms/${form.id}` 
                            : `/professional/custom-forms/${form.id}`;
                          navigate(basePath);
                        }}
                        className="inline-flex items-center p-1.5 border border-transparent rounded text-gray-400 hover:text-gray-600"
                        title="Modifica"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {/* Bottone Clona Template - solo per professional che vedono template */}
                    {isProfessional && !form.professionalId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneTemplate(form);
                        }}
                        disabled={cloneMutation.isPending}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50"
                        title="Clona questo template come tuo"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                        Clona
                      </button>
                    )}
                    
                    {!form.isPublished && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublish(form);
                        }}
                        disabled={publishMutation.isPending}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                      >
                        Pubblica
                      </button>
                    )}
                    
                    {/* Elimina solo per i form di proprietà (non per i template se sei professional) */}
                    {(!form.professionalId && isProfessional) ? null : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(form);
                        }}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center p-1.5 border border-transparent rounded text-red-400 hover:text-red-600 disabled:opacity-50"
                        title="Elimina"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};