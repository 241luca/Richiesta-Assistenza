import React, { useState } from 'react';
import CategoriesPage from './CategoriesPage';
import SubcategoriesPage from './SubcategoriesPage';
import ProfessionCategoriesPage from './ProfessionCategoriesPage';
import { ProfessionsTab } from '../../components/admin/ProfessionsTab';
import { BuildingOfficeIcon, TagIcon, BriefcaseIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

type TabType = 'professions' | 'profession-categories' | 'categories' | 'subcategories';

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('professions');

  const tabs = [
    {
      id: 'professions' as TabType,
      label: 'Professioni',
      icon: BriefcaseIcon,
      component: ProfessionsTab
    },
    {
      id: 'profession-categories' as TabType,
      label: 'Categorie Professioni',
      icon: Squares2X2Icon,
      component: ProfessionCategoriesPage
    },
    {
      id: 'categories' as TabType,
      label: 'Categorie',
      icon: BuildingOfficeIcon,
      component: CategoriesPage
    },
    {
      id: 'subcategories' as TabType,
      label: 'Sottocategorie',
      icon: TagIcon,
      component: SubcategoriesPage
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tassonomia Servizi</h1>
        <p className="text-gray-600 mt-2">Gestisci professioni, categorie e sottocategorie</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}