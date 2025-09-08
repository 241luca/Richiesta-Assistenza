import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';
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
    professionals: number;
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
}

export default function CategorySelector({
  value,
  onChange,
  required = false,
  disabled = false
}: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(value?.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(value?.subcategory || '');
  const [showSubcategories, setShowSubcategories] = useState(false);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/categories', {
        params: { isActive: true }
      });
      return response.data.categories;
    },
  });

  // Fetch subcategories for selected category
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const response = await apiClient.get('/subcategories', {
        params: { 
          categoryId: selectedCategory,
          isActive: true 
        }
      });
      return response.data.subcategories;
    },
    enabled: !!selectedCategory,
  });

  const categories = categoriesData || [];
  const subcategories = subcategoriesData || [];

  useEffect(() => {
    if (value?.category !== selectedCategory) {
      setSelectedCategory(value?.category || '');
    }
    if (value?.subcategory !== selectedSubcategory) {
      setSelectedSubcategory(value?.subcategory || '');
    }
  }, [value]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setShowSubcategories(true);
    
    const category = categories.find((c: Category) => c.id === categoryId);
    onChange({ 
      category: categoryId,
      subcategory: undefined 
    });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    onChange({ 
      category: selectedCategory,
      subcategory: subcategoryId 
    });
  };

  const selectedCategoryData = categories.find((c: Category) => c.id === selectedCategory);
  const selectedSubcategoryData = subcategories.find((s: Subcategory) => s.id === selectedSubcategory);

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categoria {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={disabled || categoriesLoading}
            className={cn(
              "w-full px-3 py-2 border border-gray-300 rounded-lg",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              selectedCategoryData && "pl-4"
            )}
            style={{
              borderLeftColor: selectedCategoryData?.color,
              borderLeftWidth: selectedCategoryData ? '4px' : undefined
            }}
          >
            <option value="">Seleziona una categoria...</option>
            {categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categoriesLoading && (
            <div className="absolute right-2 top-2">
              <div className="animate-spin h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        {selectedCategoryData?.description && (
          <p className="mt-1 text-sm text-gray-500">{selectedCategoryData.description}</p>
        )}
      </div>

      {/* Subcategory Selection */}
      {selectedCategory && showSubcategories && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sottocategoria
          </label>
          {subcategoriesLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : subcategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subcategories.map((subcategory: Subcategory) => (
                <button
                  key={subcategory.id}
                  type="button"
                  onClick={() => handleSubcategoryChange(subcategory.id)}
                  disabled={disabled}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-all",
                    "hover:border-blue-500 hover:shadow-md",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedSubcategory === subcategory.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  )}
                  style={{
                    borderLeftColor: subcategory.color || selectedCategoryData?.color,
                    borderLeftWidth: '3px'
                  }}
                >
                  <div className="font-medium text-gray-900">
                    {subcategory.name}
                  </div>
                  {subcategory.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {subcategory.description}
                    </div>
                  )}
                  {subcategory._count?.professionals !== undefined && (
                    <div className="text-xs text-gray-400 mt-2">
                      {subcategory._count.professionals} professionisti disponibili
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Nessuna sottocategoria disponibile per questa categoria
            </div>
          )}
        </div>
      )}
    </div>
  );
}
