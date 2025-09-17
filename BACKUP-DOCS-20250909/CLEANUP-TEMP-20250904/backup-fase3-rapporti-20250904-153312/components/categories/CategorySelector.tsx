import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color: string;
  isActive: boolean;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  textColor?: string;
  categoryId: string;
  isActive: boolean;
  requirements?: string;
  displayOrder: number;
  _count?: {
    ProfessionalUserSubcategory: number;
    AssistanceRequest?: number;
  };
}

interface CategorySelectorProps {
  value?: {
    category?: string;
    subcategory?: string;
  };
  onChange: (selection: { category?: string; subcategory?: string }) => void;
  required?: boolean;
  disabled?: boolean;
  onlyWithProfessionals?: boolean;
}

export default function CategorySelector({
  value,
  onChange,
  required = false,
  disabled = false,
  onlyWithProfessionals = true
}: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(value?.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(value?.subcategory || '');

  // Fetch categories with professionals filter
  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories', 'active', onlyWithProfessionals],
    queryFn: async () => {
      console.log('Fetching categories with professionals filter:', onlyWithProfessionals);
      try {
        const response = await api.get('/categories', {
          params: onlyWithProfessionals ? { withProfessionals: 'true' } : {}
        });
        console.log('Categories response:', response);
        return response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },
  });

  // Fetch subcategories for selected category
  const { data: subcategoriesResponse, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return { subcategories: [] };
      console.log('Fetching subcategories for category:', selectedCategory);
      try {
        const response = await api.get('/subcategories', {
          params: { 
            categoryId: selectedCategory,
            isActive: true 
          }
        });
        console.log('Subcategories response:', response);
        return response.data;
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        throw error;
      }
    },
    enabled: !!selectedCategory,
  });

  // Extract data from responses
  const categories = categoriesResponse?.categories || categoriesResponse?.data || [];
  const allSubcategories = subcategoriesResponse?.subcategories || subcategoriesResponse?.data || [];
  
  // Filter subcategories to show only those with professionals
  const subcategories = allSubcategories.filter((sub: Subcategory) => {
    if (!onlyWithProfessionals) {
      return sub.isActive;
    }
    
    // Only show subcategories with at least 1 professional
    if (sub._count && sub._count.ProfessionalUserSubcategory !== undefined) {
      return sub._count.ProfessionalUserSubcategory > 0;
    }
    return true; // fallback if count not available
  });

  useEffect(() => {
    if (value?.category !== selectedCategory) {
      setSelectedCategory(value?.category || '');
    }
    if (value?.subcategory !== selectedSubcategory) {
      setSelectedSubcategory(value?.subcategory || '');
    }
  }, [value]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    console.log('Category changed to:', categoryId);
    setSelectedCategory(categoryId);
    setSelectedSubcategory(''); // Reset subcategory
    onChange({ 
      category: categoryId,
      subcategory: undefined 
    });
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategoryId = e.target.value;
    console.log('Subcategory changed to:', subcategoryId);
    setSelectedSubcategory(subcategoryId);
    onChange({ 
      category: selectedCategory,
      subcategory: subcategoryId 
    });
  };

  return (
    <div className="space-y-4">
      {/* Category Dropdown */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Categoria {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={disabled || categoriesLoading}
          className={cn(
            "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md",
            disabled && "bg-gray-100 cursor-not-allowed",
            categoriesError && "border-red-300"
          )}
        >
          <option value="">Seleziona una categoria...</option>
          {categoriesLoading ? (
            <option disabled>Caricamento...</option>
          ) : categories.length === 0 ? (
            <option disabled>
              {onlyWithProfessionals 
                ? 'Nessuna categoria con professionisti disponibili'
                : 'Nessuna categoria disponibile'
              }
            </option>
          ) : (
            categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.icon && `${category.icon} `}{category.name}
              </option>
            ))
          )}
        </select>
        {categoriesError && (
          <p className="mt-1 text-sm text-red-600">
            Errore nel caricamento delle categorie
          </p>
        )}
      </div>

      {/* Subcategory Dropdown - Only show if category is selected */}
      {selectedCategory && (
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
            Sottocategoria {required && <span className="text-red-500">*</span>}
          </label>
          <select
            id="subcategory"
            value={selectedSubcategory}
            onChange={handleSubcategoryChange}
            disabled={disabled || subcategoriesLoading || subcategories.length === 0}
            className={cn(
              "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md",
              disabled && "bg-gray-100 cursor-not-allowed",
              subcategories.length === 0 && "bg-yellow-50 border-yellow-300"
            )}
          >
            <option value="">Seleziona una sottocategoria...</option>
            {subcategoriesLoading ? (
              <option disabled>Caricamento...</option>
            ) : subcategories.length === 0 ? (
              <option disabled>
                {onlyWithProfessionals 
                  ? 'Nessun professionista disponibile per questa categoria'
                  : 'Nessuna sottocategoria disponibile'
                }
              </option>
            ) : (
              subcategories.map((subcategory: Subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                  {subcategory._count?.ProfessionalUserSubcategory !== undefined && 
                    ` (${subcategory._count.ProfessionalUserSubcategory} prof.)`
                  }
                </option>
              ))
            )}
          </select>
          
          {/* Warning message if no subcategories available */}
          {!subcategoriesLoading && subcategories.length === 0 && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                {onlyWithProfessionals 
                  ? 'Nessun professionista disponibile per questa categoria. Prova a selezionare una categoria diversa.'
                  : 'Nessuna sottocategoria disponibile per questa categoria.'
                }
              </p>
            </div>
          )}
          
          {/* Show subcategory details if selected */}
          {selectedSubcategory && subcategories.length > 0 && (
            <div className="mt-2">
              {(() => {
                const selected = subcategories.find((s: Subcategory) => s.id === selectedSubcategory);
                if (selected) {
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      {selected.description && (
                        <p className="text-sm text-gray-700">{selected.description}</p>
                      )}
                      {selected.requirements && (
                        <p className="text-xs text-gray-600 mt-1">
                          <strong>Requisiti:</strong> {selected.requirements}
                        </p>
                      )}
                      {selected._count?.ProfessionalUserSubcategory !== undefined && (
                        <p className="text-xs text-blue-600 mt-1">
                          <strong>{selected._count.ProfessionalUserSubcategory}</strong> professionisti disponibili
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
