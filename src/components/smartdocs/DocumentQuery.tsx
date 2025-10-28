import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, FileText, Sparkles, Code2, X } from 'lucide-react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface DocumentQueryProps {
  containerId: string;
  containerName: string;
}

interface QueryResult {
  answer: string;
  sources: Array<{
    document_id: string;
    title: string;
    content?: string;
    chunk_text?: string;
    similarity: number;
  }>;
  metadata?: {
    tokens_used?: number;
    model?: string;
  };
}

export const DocumentQuery: React.FC<DocumentQueryProps> = ({ 
  containerId, 
  containerName 
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error('Inserisci una domanda');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        question: question.trim(),
        container_id: containerId
      };

      const response = await api.post('/smartdocs/ask', requestData);

      const resultData = response.data.data;
      setResult(resultData);
      
      // Save debug data
      setDebugData({
        request: requestData,
        response: response.data,
        timestamp: new Date().toISOString(),
        sourcesCount: resultData.sources?.length || 0,
        uniqueDocuments: resultData.sources ? 
          [...new Set(resultData.sources.map((s: any) => s.document_id))].length : 0
      });
      
      toast.success('Risposta generata!');
    } catch (error: any) {
      console.error('Query error:', error);
      toast.error(error.response?.data?.error || 'Errore durante la query');
      setResult(null);
      setDebugData({
        request: { question: question.trim(), container_id: containerId },
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Interroga i Documenti - {containerName}
          </CardTitle>
          {debugData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="gap-2"
            >
              <Code2 className="w-4 h-4" />
              Debug
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Query */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Fai una domanda sui documenti caricati
          </label>
          <TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Es: Qual è il prezzo totale nel preventivo? Quali sono i termini di pagamento?"
            className="min-h-[100px]"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Premi Enter per inviare, Shift+Enter per andare a capo
            </span>
            <Button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Invia Domanda
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            {/* Answer */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-2">Risposta</h3>
                  <p className="text-gray-800 whitespace-pre-wrap">{result.answer}</p>
                  {result.metadata && (
                    <div className="flex gap-2 mt-3">
                      {result.metadata.model && (
                        <Badge variant="info" className="text-xs">
                          {result.metadata.model}
                        </Badge>
                      )}
                      {result.metadata.tokens_used && (
                        <Badge variant="info" className="text-xs">
                          {result.metadata.tokens_used} tokens
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sources - Grouped by Document */}
            {result.sources && result.sources.length > 0 && (() => {
              // Group sources by document
              const groupedSources = result.sources.reduce((acc, source) => {
                const docId = source.document_id;
                if (!acc[docId]) {
                  acc[docId] = {
                    title: source.title,
                    chunks: []
                  };
                }
                acc[docId].chunks.push(source);
                return acc;
              }, {} as Record<string, { title: string; chunks: typeof result.sources }>);

              const uniqueDocuments = Object.keys(groupedSources).length;

              return (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Fonti: {uniqueDocuments} {uniqueDocuments === 1 ? 'Documento' : 'Documenti'} ({result.sources.length} chunks)
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(groupedSources).map(([docId, doc], index) => (
                      <div
                        key={docId}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm text-gray-900">
                              {doc.title || `Documento ${index + 1}`}
                            </span>
                          </div>
                          <Badge variant="info" className="text-xs">
                            {doc.chunks.length} {doc.chunks.length === 1 ? 'chunk' : 'chunks'}
                          </Badge>
                        </div>
                        
                        {/* Chunks from this document */}
                        <div className="space-y-2">
                          {doc.chunks.map((chunk, chunkIndex) => (
                            <div
                              key={chunkIndex}
                              className="bg-white border border-gray-200 rounded p-3"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-medium text-gray-600">
                                  Chunk #{chunkIndex + 1}
                                </span>
                                <Badge variant="success" className="text-xs">
                                  {Math.round(chunk.similarity * 100)}% rilevante
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {chunk.content || chunk.chunk_text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">
              Fai una domanda per ottenere risposte basate sui documenti caricati
            </p>
          </div>
        )}

        {/* Debug Panel */}
        {showDebug && debugData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Debug Info - RAG Query</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Timestamp */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Timestamp</div>
                  <div className="text-sm text-gray-800 font-mono">
                    {new Date(debugData.timestamp).toLocaleString('it-IT')}
                  </div>
                </div>

                {/* Request */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-200 rounded text-xs">REQUEST</span>
                    Dati inviati all'AI
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-blue-700 font-medium">Question:</div>
                      <div className="text-sm text-blue-900 font-mono bg-white p-2 rounded mt-1">
                        {debugData.request.question}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-700 font-medium">Container ID:</div>
                      <div className="text-sm text-blue-900 font-mono bg-white p-2 rounded mt-1">
                        {debugData.request.container_id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {debugData.sourcesCount !== undefined && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-purple-900 mb-2">STATISTICS</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-purple-700">Documenti Unici</div>
                        <div className="text-lg font-bold text-purple-900">{debugData.uniqueDocuments}</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-purple-700">Chunks Totali</div>
                        <div className="text-lg font-bold text-purple-900">{debugData.sourcesCount}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Response */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-200 rounded text-xs">RESPONSE</span>
                    Risposta dall'AI
                  </div>
                  {debugData.response ? (
                    <pre className="text-xs text-green-900 font-mono bg-white p-3 rounded overflow-x-auto max-h-96">
                      {JSON.stringify(debugData.response, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-sm text-red-800 bg-red-50 p-2 rounded">
                      Error: {JSON.stringify(debugData.error, null, 2)}
                    </div>
                  )}
                </div>

                {/* Sources Detail */}
                {debugData.response?.data?.sources && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-orange-900 mb-2">SOURCES (Chunks inviati al prompt)</div>
                    <div className="space-y-2">
                      {debugData.response.data.sources.map((source: any, idx: number) => (
                        <div key={idx} className="bg-white border border-orange-200 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-orange-900">
                              Chunk #{idx + 1} - {source.title}
                            </span>
                            <Badge variant="info" className="text-xs">
                              {Math.round(source.similarity * 100)}%
                            </Badge>
                          </div>
                          <div className="text-xs text-orange-800 font-mono bg-orange-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                            {source.chunk_text || source.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {debugData.response?.data?.metadata && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-900 mb-2">METADATA</div>
                    <pre className="text-xs text-gray-800 font-mono bg-white p-3 rounded overflow-x-auto">
                      {JSON.stringify(debugData.response.data.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Container Settings */}
                {debugData.response?.data?.metadata?.containerSettings && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-indigo-900 mb-3">CONTAINER SETTINGS</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-indigo-700">Nome Container</div>
                        <div className="text-sm font-medium text-indigo-900">
                          {debugData.response.data.metadata.containerSettings.name}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-indigo-700">Modello AI</div>
                        <div className="text-sm font-medium text-indigo-900">
                          {debugData.response.data.metadata.containerSettings.model}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-indigo-700">Temperature</div>
                        <div className="text-sm font-medium text-indigo-900">
                          {debugData.response.data.metadata.containerSettings.temperature}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-indigo-700">Max Tokens</div>
                        <div className="text-sm font-medium text-indigo-900">
                          {debugData.response.data.metadata.containerSettings.max_tokens}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-indigo-700">Chunk Size</div>
                        <div className="text-sm font-medium text-indigo-900">
                          {debugData.response.data.metadata.containerSettings.chunk_size}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-xs text-indigo-700">Chunk Overlap</div>
                        <div className="text-sm font-medium text-indigo-900">
                          {debugData.response.data.metadata.containerSettings.chunk_overlap}
                        </div>
                      </div>
                    </div>
                    {debugData.response.data.metadata.containerSettings.custom_prompt && (
                      <div className="mt-2 bg-white p-2 rounded">
                        <div className="text-xs text-indigo-700 mb-1">Custom Prompt</div>
                        <div className="text-sm text-indigo-900 font-mono whitespace-pre-wrap">
                          {debugData.response.data.metadata.containerSettings.custom_prompt}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Prompt - IL PIÙ IMPORTANTE! */}
                {debugData.response?.data?.metadata?.aiPrompt && (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                    <div className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2">
                      <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded">PROMPT INVIATO ALL'AI</span>
                      Questo è il prompt ESATTO inviato a OpenAI GPT-4
                    </div>
                    <div className="bg-white border border-yellow-300 rounded p-3 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-yellow-900 font-mono whitespace-pre-wrap">
                        {debugData.response.data.metadata.aiPrompt}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <Button onClick={() => setShowDebug(false)}>
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
