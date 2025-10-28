import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileText } from 'lucide-react';

interface QueryDebugPanelProps {
  debugData: any;
}

export default function QueryDebugPanel({ debugData }: QueryDebugPanelProps) {
  if (!debugData || !debugData.aiDebug) {
    return null;
  }

  const { aiDebug } = debugData;

  return (
    <Card className="border-2 border-purple-300 mb-6">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600" />
          🤖 Debug AI - Cosa mandiamo all'AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Info */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-600">Modello</p>
            <p className="text-sm font-mono bg-purple-50 p-2 rounded">
              {aiDebug.model}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600">Temperature</p>
            <p className="text-sm font-mono bg-purple-50 p-2 rounded">
              {aiDebug.temperature}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600">Max Tokens</p>
            <p className="text-sm font-mono bg-purple-50 p-2 rounded">
              {aiDebug.max_tokens}
            </p>
          </div>
        </div>

        {/* Messages sent to AI */}
        <div>
          <p className="text-xs font-semibold text-purple-600 mb-2">
            💬 MESSAGGI INVIATI ALL'AI ({aiDebug.messagesCount})
          </p>
          <div className="space-y-3">
            {aiDebug.messages.map((msg: any, idx: number) => (
              <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={msg.role === 'system' ? 'default' : 'info'}>
                    {msg.role === 'system' ? '🔧 SYSTEM' : '👤 USER'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {msg.content.length} caratteri
                  </span>
                </div>
                <pre className="text-xs font-mono bg-white p-3 rounded overflow-x-auto max-h-96 border whitespace-pre-wrap">
                  {msg.content}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Context Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-600">Fonti Utilizzate</p>
            <p className="text-2xl font-bold text-purple-600">
              {aiDebug.sourcesUsed}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600">Lunghezza Contesto</p>
            <p className="text-2xl font-bold text-purple-600">
              {aiDebug.contextLength.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Raw Context */}
        <details className="bg-gray-50 rounded p-3">
          <summary className="text-xs font-semibold text-gray-600 cursor-pointer">
            📄 Contesto Completo (Click per espandere)
          </summary>
          <pre className="text-xs font-mono mt-3 p-3 bg-white rounded border overflow-x-auto max-h-96 whitespace-pre-wrap">
            {aiDebug.context}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
