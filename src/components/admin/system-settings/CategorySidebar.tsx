import React from 'react';

interface CategorySidebarProps {
  categories: {
    [key: string]: {
      icon: React.ElementType;
      color: string;
      description: string;
      count?: number;
    };
  };
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategorySidebar({
  categories,
  activeCategory,
  onCategoryChange
}: CategorySidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Categorie</h2>
      </div>
      
      <nav className="p-2">
        {Object.entries(categories).map(([category, config]) => {
          const Icon = config.icon;
          const isActive = activeCategory === category;
          const count = config.count || 0;
          
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`
                w-full flex items-center justify-between px-3 py-2 mb-1 rounded-lg text-sm transition-all duration-150
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center">
                <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{category}</span>
              </div>
              {count > 0 && (
                <span className={`
                  px-2 py-0.5 text-xs rounded-full
                  ${isActive 
                    ? 'bg-blue-200 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
