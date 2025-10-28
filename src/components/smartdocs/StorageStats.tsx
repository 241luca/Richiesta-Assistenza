import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, Zap, HardDrive } from 'lucide-react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface StorageStatsProps {
  containerId: string;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ containerId }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [containerId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/smartdocs/storage/${containerId}`);
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load storage stats:', error);
      toast.error('Errore caricamento statistiche');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Caricamento statistiche...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT').format(num);
  };

  const calculatePercentage = (part: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  const autoSyncPercent = calculatePercentage(
    stats.auto_sync.total_chunks,
    stats.total.total_chunks
  );

  const manualPercent = calculatePercentage(
    stats.manual.total_chunks,
    stats.total.total_chunks
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Storage SmartDocs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Stats */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Utilizzo Totale</span>
            <Badge variant="info">
              {formatNumber(stats.total.total_chunks)} chunks
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
              style={{ width: '100%' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span>{formatNumber(stats.total.total_tokens)} tokens</span>
            <span>{formatBytes(stats.total.storage_size_bytes)}</span>
          </div>
        </div>

        {/* Auto-Sync Stats */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">
              AUTO-SYNC (da Richiesta Assistenza)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${autoSyncPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xs text-green-700 mb-1">Documenti</div>
              <div className="text-lg font-bold text-green-900">
                {stats.auto_sync.total_documents}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xs text-green-700 mb-1">Chunks</div>
              <div className="text-lg font-bold text-green-900">
                {formatNumber(stats.auto_sync.total_chunks)}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xs text-green-700 mb-1">Tokens</div>
              <div className="text-lg font-bold text-green-900">
                {formatNumber(stats.auto_sync.total_tokens)}
              </div>
            </div>
          </div>

          {/* Breakdown by entity type */}
          {stats.auto_sync.breakdown && Object.keys(stats.auto_sync.breakdown).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 mb-2">Dettaglio per tipo:</div>
              {Object.entries(stats.auto_sync.breakdown).map(([type, data]: [string, any]) => (
                <div key={type} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-gray-500" />
                    <span className="font-medium text-gray-700 capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>{data.documents} doc</span>
                    <span>{formatNumber(data.chunks)} chunks</span>
                    <span>{formatNumber(data.tokens)} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Upload Stats */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">
              MANUALI (caricati dall'utente)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all"
              style={{ width: `${manualPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-700 mb-1">PDF</div>
              <div className="text-lg font-bold text-blue-900">
                {stats.manual.total_documents}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-700 mb-1">Chunks</div>
              <div className="text-lg font-bold text-blue-900">
                {formatNumber(stats.manual.total_chunks)}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-700 mb-1">Tokens</div>
              <div className="text-lg font-bold text-blue-900">
                {formatNumber(stats.manual.total_tokens)}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="border-t pt-4 bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-yellow-700 mb-1">Costo Stimato Mensile</div>
              <div className="text-sm text-yellow-600">
                Basato su ~10 query/giorno
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              €{((stats.total.total_tokens / 1000000) * 2.5).toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
