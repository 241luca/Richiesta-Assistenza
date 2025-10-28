import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { Container } from '../../services/smartdocs.service';

interface ContainerListProps {
  containers: Container[];
  categories: any[];
  searchTerm: string;
  filterCategory: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onView: (container: Container) => void;
  onEdit: (container: Container) => void;
  onDelete: (id: string, name: string) => void;
}

export default function ContainerList({
  containers,
  categories,
  searchTerm,
  filterCategory,
  loading,
  onSearchChange,
  onFilterChange,
  onView,
  onEdit,
  onDelete
}: ContainerListProps) {
  // Filtra containers
  const filteredContainers = containers.filter(container => {
    // Filtro ricerca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchName = container.name.toLowerCase().includes(search);
      const matchDesc = container.description?.toLowerCase().includes(search);
      if (!matchName && !matchDesc) return false;
    }
    
    // Filtro categoria
    if (filterCategory !== 'all' && container.type !== filterCategory) {
      return false;
    }
    
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Containers Esistenti</CardTitle>
        <CardDescription>
          {filteredContainers.length} container{filteredContainers.length !== 1 ? 's' : ''} trovati
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtri */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-container">Ricerca</Label>
              <Input
                id="search-container"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cerca per nome o descrizione..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-category">Filtra per Categoria</Label>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tutte le categorie</option>
                {categories.filter(c => c.is_active).map((cat) => (
                  <option key={cat.id} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista containers */}
        <div className="space-y-3">
          {filteredContainers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nessun container trovato</p>
            </div>
          ) : (
            filteredContainers.map((container) => (
              <div key={container.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{container.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {container.description || 'Nessuna descrizione'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="default">
                        {categories.find(c => c.code === container.type)?.name || container.type}
                      </Badge>
                      <Badge variant="info">
                        ID: {container.id.substring(0, 8)}...
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(container)}
                      disabled={loading}
                      title="Visualizza dettagli"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizza
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(container)}
                      disabled={loading}
                      title="Modifica container"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Edit2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(container.id, container.name)}
                      disabled={loading}
                      title="Elimina container"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
