import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { PlayIcon, RefreshCwIcon, UserIcon, BotIcon } from 'lucide-react';

interface TestResult {
  detection: {
    mode: string;
    confidence: number;
    factors: string[];
  };
  sanitized?: string;
  original?: string;
}

export function TestPlayground() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  // Test detection
  const testDetection = useMutation({
    mutationFn: async () => {
      const response = await api.post('/professional/whatsapp/test-detection', {
        phoneNumber,
        message
      });
      return response.data;
    },
    onSuccess: (data) => {
      setTestResult(data.data);
      toast.success('Test completato!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore test');
    }
  });

  // Test sanitization
  const testSanitization = useMutation({
    mutationFn: async () => {
      const response = await api.post('/professional/whatsapp/test-sanitization', {
        text: message,
        mode: 'CLIENT'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setTestResult(prev => ({
        ...prev!,
        original: message,
        sanitized: data.data.sanitized
      }));
      toast.success('Sanitizzazione testata!');
    },
    onError: () => {
      toast.error('Errore test sanitizzazione');
    }
  });

  // Override detection
  const overrideDetection = useMutation({
    mutationFn: async (newMode: string) => {
      const response = await api.post('/professional/whatsapp/override-detection', {
        phoneNumber,
        mode: newMode,
        reason: 'Manual override from test playground'
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Override salvato! Riprova il test.');
      setTestResult(null);
    },
    onError: () => {
      toast.error('Errore override');
    }
  });

  const handleTest = () => {
    if (!phoneNumber || !message) {
      toast.error('Inserisci numero e messaggio');
      return;
    }
    testDetection.mutate();
  };

  const handleReset = () => {
    setPhoneNumber('');
    setMessage('');
    setTestResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayIcon className="w-5 h-5" />
          🎮 Test Playground
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-sm text-purple-800">
            Simula messaggi da diversi numeri per testare detection e sanitizzazione.
          </p>
        </div>
        
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero Telefono
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+393331234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Messaggio
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi un messaggio di test..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleTest} className="flex-1">
              <PlayIcon className="w-4 h-4 mr-2" />
              Test Detection
            </Button>
            <Button 
              onClick={() => testSanitization.mutate()} 
              variant="outline"
              disabled={!message}
            >
              Test Sanitizzazione
            </Button>
            <Button onClick={handleReset} variant="ghost">
              <RefreshCwIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Test Results */}
        {testResult && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium flex items-center gap-2">
              <BotIcon className="w-4 h-4" />
              Risultati Test
            </h3>
            
            {/* Detection Result */}
            {testResult.detection && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Detection Result</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    testResult.detection.mode === 'PROFESSIONAL' 
                      ? 'bg-blue-100 text-blue-800'
                      : testResult.detection.mode === 'CLIENT'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {testResult.detection.mode}
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Confidence:</strong> {(testResult.detection.confidence * 100).toFixed(0)}%
                  </p>
                  <p><strong>Fattori:</strong></p>
                  <ul className="ml-4 list-disc text-gray-600">
                    {testResult.detection.factors?.map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Override Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => overrideDetection.mutate('PROFESSIONAL')}
                    disabled={testResult.detection.mode === 'PROFESSIONAL'}
                  >
                    Override → Professional
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => overrideDetection.mutate('CLIENT')}
                    disabled={testResult.detection.mode === 'CLIENT'}
                  >
                    Override → Client
                  </Button>
                </div>
              </div>
            )}
            
            {/* Sanitization Result */}
            {testResult.sanitized && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <h4 className="font-medium">Sanitizzazione</h4>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Originale:</p>
                    <div className="p-2 bg-white rounded border">
                      {testResult.original}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 mb-1">Sanitizzato (per clienti):</p>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      {testResult.sanitized}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
