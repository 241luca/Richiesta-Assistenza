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

  // Fetch categories - Usa api.get invece di apiClient
  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      console.log('Fetching categories...');
      try {
        const response = await api.get('/categories');
        console.log('Categories response:', response);
        return response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },
  });

  // Fetch subcategories for selected category
  const { data: subcategoriesResponse, isLoading: subcategoriesLoading, error: subcategoriesError } = useQuery({
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

  // Estrai i dati dalle risposte
  const categories = categoriesResponse?.categories || categoriesResponse?.data || [];
  const subcategories = subcategoriesResponse?.subcategories || subcategoriesResponse?.data || [];

  // Debug log
  useEffect(() => {
    console.log('Categories:', categories);
    console.log('Categories Error:', categoriesError);
  }, [categories, categoriesError]);

  useEffect(() => {
    console.log('Subcategories:', subcategories);
    console.log('Subcategories Error:', subcategoriesError);
  }, [subcategories, subcategoriesError]);

  useEffect(() => {
    if (value?.category !== selectedCategory) {
      setSelectedCategory(value?.category || '');
    }
    if (value?.subcategory !== selectedSubcategory) {
      setSelectedSubcategory(value?.subcategory || '');
    }
  }, [value]);

  const handleCategoryChange = (categoryId: string) => {
    console.log('Category changed to:', categoryId);
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
    console.log('Subcategory changed to:', subcategoryId);
    setSelectedSubcategory(subcategoryId);
    onChange({ 
      category: selectedCategory,
      subcategory: subcategoryId 
    });
  };

  const selectedCategoryData = categories.find((c: Category) => c.id === selectedCategory);
  const selectedSubcategoryData = subcategories.find((s: Subcategory) => s.id === selectedSubcategory);

  // Mostra errori se presenti
  if (categoriesError) {
    return (
      <div className="text-red-600 p-2 border border-red-300 rounded">
        Errore nel caricamento delle categorie. Ricarica la pagina.
      </div>
    );
  }

  return (