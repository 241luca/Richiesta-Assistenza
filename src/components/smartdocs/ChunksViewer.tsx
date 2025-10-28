import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { FileText, Hash, TrendingUp, Link as LinkIcon } from 'lucide-react';

interface Chunk {
  id: string;
  index: number;
  content: string;
  title?: string;
  contextualMetadata: {
    topicKeywords: string[];
    documentType: string;
    importanceScore: number;
    isSectionHeader: boolean;
    sentenceCount: number;
    readabilityScore: number;
  };
  tokens: number;
  characterCount: number;
  previousChunkPreview?: string;
  nextChunkPreview?: string;
  relatedChunkIds?: string[];
}

interface ChunksViewerProps {
  chunks: Chunk[];
  documentTitle?: string;
}

export default function ChunksViewer({ chunks, documentTitle }: ChunksViewerProps) {
  if (chunks.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nessun chunk disponibile. Esegui prima un sync test.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          📄 {chunks.length} Chunk Semantici {documentTitle && `- ${documentTitle}`}
        </h3>
        <div className="flex gap-2">
          <Badge variant="info">
            {chunks.reduce((sum, c) => sum + c.tokens, 0)} token totali
          </Badge>
          <Badge variant="default">
            {Math.round(chunks.reduce((sum, c) => sum + c.characterCount, 0) / chunks.length)} caratteri medi
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {chunks.map((chunk, idx) => (
          <Card key={chunk.id || idx} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs">
                      Chunk #{chunk.index + 1}
                    </Badge>
                    {chunk.contextualMetadata.isSectionHeader && (
                      <Badge variant="warning" className="text-xs">
                        📌 Section Header
                      </Badge>
                    )}
                    <Badge 
                      variant={chunk.contextualMetadata.importanceScore > 0.7 ? 'success' : 'info'}
                      className="text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Importanza: {(chunk.contextualMetadata.importanceScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  {chunk.title && (
                    <CardTitle className="text-sm font-semibold text-gray-700 mb-1">
                      {chunk.title}
                    </CardTitle>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Hash className="w-3 h-3" />
                    {chunk.tokens} token
                  </div>
                  <div className="text-xs text-gray-600">
                    {chunk.characterCount} char
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Content */}
              <div className="bg-gray-50 p-3 rounded border text-sm">
                <pre className="whitespace-pre-wrap font-sans">
                  {chunk.content}
                </pre>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="font-semibold text-blue-700">Tipo</p>
                  <p className="text-gray-700">{chunk.contextualMetadata.documentType}</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="font-semibold text-green-700">Frasi</p>
                  <p className="text-gray-700">{chunk.contextualMetadata.sentenceCount}</p>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <p className="font-semibold text-purple-700">Leggibilità</p>
                  <p className="text-gray-700">{(chunk.contextualMetadata.readabilityScore * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Keywords */}
              {chunk.contextualMetadata.topicKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">🔑 Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {chunk.contextualMetadata.topicKeywords.map((keyword, i) => (
                      <Badge key={i} variant="default" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Previews */}
              {(chunk.previousChunkPreview || chunk.nextChunkPreview) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {chunk.previousChunkPreview && (
                    <div className="bg-gray-100 p-2 rounded border-l-2 border-gray-400">
                      <p className="font-semibold text-gray-600 mb-1">⬅️ Precedente:</p>
                      <p className="text-gray-600 italic">
                        ...{chunk.previousChunkPreview}
                      </p>
                    </div>
                  )}
                  {chunk.nextChunkPreview && (
                    <div className="bg-gray-100 p-2 rounded border-r-2 border-gray-400">
                      <p className="font-semibold text-gray-600 mb-1">➡️ Successivo:</p>
                      <p className="text-gray-600 italic">
                        {chunk.nextChunkPreview}...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Related Chunks */}
              {chunk.relatedChunkIds && chunk.relatedChunkIds.length > 0 && (
                <div className="bg-indigo-50 p-2 rounded">
                  <p className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Chunk Correlati: {chunk.relatedChunkIds.length}
                  </p>
                  <p className="text-xs text-gray-600">
                    {chunk.relatedChunkIds.map(id => `#${id.split('-')[1]}`).join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
