import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChartIcon, TrendingUpIcon, ActivityIcon, PieChartIcon } from 'lucide-react';

interface AccuracyData {
  totalDetections: number;
  correctDetections: number;
  overrides: number;
  accuracy: number;
  modeDistribution: {
    PROFESSIONAL: number;
    CLIENT: number;
    BLOCKED: number;
  };
  confidenceAverage: number;
}

export function AnalyticsDashboard() {
  // Fetch accuracy data
  const { data: accuracy, isLoading } = useQuery({
    queryKey: ['ai-accuracy'],
    queryFn: async () => {
      const response = await api.get('/professional/whatsapp/accuracy');
      return response.data.data as AccuracyData;
    }
  });

  // Fetch recent messages
  const { data: recentMessages } = useQuery({
    queryKey: ['recent-ai-messages'],
    queryFn: async () => {
      const response = await api.get('/professional/whatsapp/messages/recent');
      return response.data.data;
    }
  });

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChartIcon className="w-5 h-5" />
          📊 Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Detections */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ActivityIcon className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-blue-600">Totale</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {accuracy?.totalDetections || 0}
            </div>
            <p className="text-xs text-blue-700 mt-1">Detection totali</p>
          </div>
          
          {/* Accuracy */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUpIcon className="w-5 h-5 text-green-600" />
              <span className="text-xs text-green-600">Accuratezza</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatPercentage(accuracy?.accuracy || 0)}
            </div>
            <p className="text-xs text-green-700 mt-1">Detection corrette</p>
          </div>
          
          {/* Overrides */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <PieChartIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-xs text-yellow-600">Override</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {accuracy?.overrides || 0}
            </div>
            <p className="text-xs text-yellow-700 mt-1">Correzioni manuali</p>
          </div>
          
          {/* Confidence Average */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChartIcon className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-purple-600">Confidence</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatPercentage(accuracy?.confidenceAverage || 0)}
            </div>
            <p className="text-xs text-purple-700 mt-1">Media confidence</p>
          </div>
        </div>
        
        {/* Mode Distribution */}
        {accuracy?.modeDistribution && (
          <div>
            <h3 className="font-medium mb-3">Distribuzione Modalità</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Professional</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(accuracy.modeDistribution.PROFESSIONAL / accuracy.totalDetections) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {accuracy.modeDistribution.PROFESSIONAL}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Client</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${(accuracy.modeDistribution.CLIENT / accuracy.totalDetections) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {accuracy.modeDistribution.CLIENT}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Blocked</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ 
                        width: `${(accuracy.modeDistribution.BLOCKED / accuracy.totalDetections) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {accuracy.modeDistribution.BLOCKED}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent Messages */}
        {recentMessages && recentMessages.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Messaggi Recenti</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentMessages.map((msg: any) => (
                <div key={msg.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs">{msg.phoneNumber}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      msg.detectedMode === 'PROFESSIONAL' 
                        ? 'bg-blue-100 text-blue-800'
                        : msg.detectedMode === 'CLIENT'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {msg.detectedMode}
                    </span>
                  </div>
                  <p className="text-gray-600 truncate">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confidence: {formatPercentage(msg.confidence)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {(!accuracy || accuracy.totalDetections === 0) && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <BarChartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nessun dato disponibile</p>
            <p className="text-sm mt-1">I dati appariranno dopo le prime detection</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
