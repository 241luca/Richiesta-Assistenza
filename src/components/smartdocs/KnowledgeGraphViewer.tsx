import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Network, Tag, Link as LinkIcon, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Entity {
  id: string;
  name: string;
  type: string;
  importance: number;
  frequency: number;
  context?: string;
  aliases?: string[];
}

interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: string;
  confidence: number;
  context?: string;
}

interface KnowledgeGraphViewerProps {
  entities: Entity[];
  relationships: Relationship[];
  documentTitle?: string;
}

export default function KnowledgeGraphViewer({ 
  entities, 
  relationships, 
  documentTitle 
}: KnowledgeGraphViewerProps) {
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [minImportance, setMinImportance] = useState<number>(0);

  if (entities.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nessuna entità estratta. Esegui prima un sync test.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter entities
  const filteredEntities = entities.filter(e => {
    const typeMatch = selectedEntityType === 'all' || e.type === selectedEntityType;
    const importanceMatch = e.importance >= minImportance;
    return typeMatch && importanceMatch;
  });

  // Get unique types
  const entityTypes = Array.from(new Set(entities.map(e => e.type)));

  // Helper to find entity name by ID
  const getEntityName = (id: string) => {
    const entity = entities.find(e => e.id === id);
    return entity?.name || id;
  };

  // Get relationships for filtered entities
  const filteredRelationships = relationships.filter(r => {
    const sourceInFiltered = filteredEntities.some(e => e.id === r.source_entity_id);
    const targetInFiltered = filteredEntities.some(e => e.id === r.target_entity_id);
    return sourceInFiltered && targetInFiltered;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-600" />
            Knowledge Graph {documentTitle && `- ${documentTitle}`}
          </h3>
          <div className="flex gap-2">
            <Badge variant="info">{entities.length} Entità</Badge>
            <Badge variant="success">{relationships.length} Relazioni</Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Tipo Entità
            </label>
            <select
              className="w-full p-2 border rounded text-sm"
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
            >
              <option value="all">Tutti ({entities.length})</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>
                  {type} ({entities.filter(e => e.type === type).length})
                </option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Importanza Minima: {(minImportance * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={minImportance}
              onChange={(e) => setMinImportance(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Entities Grid */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <Tag className="w-4 h-4" />
          Entità ({filteredEntities.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEntities
            .sort((a, b) => b.importance - a.importance)
            .map((entity) => (
              <Card key={entity.id} className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-semibold">
                        {entity.name}
                      </CardTitle>
                      <Badge variant="info" className="text-xs mt-1">
                        {entity.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={entity.importance > 0.7 ? 'success' : 'default'}
                        className="text-xs"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {(entity.importance * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">Frequenza:</span> {entity.frequency}
                  </div>
                  
                  {entity.context && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <p className="text-gray-600 italic line-clamp-2">
                        "{entity.context}"
                      </p>
                    </div>
                  )}

                  {entity.aliases && entity.aliases.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Alias:</p>
                      <div className="flex flex-wrap gap-1">
                        {entity.aliases.map((alias, i) => (
                          <Badge key={i} variant="default" className="text-xs">
                            {alias}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Relationships */}
      {filteredRelationships.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <LinkIcon className="w-4 h-4" />
            Relazioni ({filteredRelationships.length})
          </h4>
          <div className="space-y-2">
            {filteredRelationships
              .sort((a, b) => b.confidence - a.confidence)
              .map((rel, idx) => (
                <Card key={rel.id || idx} className="border-l-4 border-l-green-500">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-2 text-sm">
                        <Badge variant="info" className="text-xs">
                          {getEntityName(rel.source_entity_id)}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge variant="default" className="text-xs bg-green-600">
                          {rel.type}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge variant="info" className="text-xs">
                          {getEntityName(rel.target_entity_id)}
                        </Badge>
                      </div>
                      <Badge 
                        variant={rel.confidence > 0.7 ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {(rel.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    {rel.context && (
                      <div className="mt-2 bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600 italic">
                          "{rel.context}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
