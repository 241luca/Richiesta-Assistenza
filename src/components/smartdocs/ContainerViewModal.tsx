import React from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { X, Edit2 } from 'lucide-react';
import { Container } from '../../services/smartdocs.service';

interface ContainerViewModalProps {
  container: Container;
  categories: any[];
  onClose: () => void;
  onEdit: (container: Container) => void;
}

export default function ContainerViewModal({
  container,
  categories,
  onClose,
  onEdit
}: ContainerViewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dettagli Container</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Info Base */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Nome</Label>
              <p className="text-lg font-semibold mt-1">{container.name}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Categoria</Label>
              <div className="mt-1">
                <Badge variant="default">
                  {categories.find(c => c.code === container.type)?.name || container.type}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Descrizione</Label>
              <p className="text-base mt-1">{container.description || 'Nessuna descrizione'}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">ID Container</Label>
              <p className="text-sm font-mono mt-1 bg-gray-100 p-2 rounded">{container.id}</p>
            </div>
          </div>

          {/* AI Prompt */}
          {(container as any).ai_prompt && (
            <div className="border-t pt-4">
              <Label className="text-sm text-muted-foreground">AI Prompt Personalizzato</Label>
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{(container as any).ai_prompt}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          {container.metadata && Object.keys(container.metadata).length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm text-muted-foreground">Metadata</Label>
              <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(container.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Date */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Creato</Label>
              <p className="text-sm mt-1">
                {new Date(container.created_at).toLocaleString('it-IT')}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Aggiornato</Label>
              <p className="text-sm mt-1">
                {new Date(container.updated_at).toLocaleString('it-IT')}
              </p>
            </div>
          </div>

          {/* Azioni */}
          <div className="border-t pt-4 flex gap-3">
            <Button
              onClick={() => {
                onClose();
                onEdit(container);
              }}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Modifica
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
