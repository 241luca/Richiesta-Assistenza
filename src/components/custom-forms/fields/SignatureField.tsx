/**
 * Signature Field Component
 * Campo firma digitale con canvas per la raccolta di firme
 * 
 * @module components/custom-forms/fields/SignatureField
 * @version 1.0.0
 */

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PenIcon, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SignatureFieldProps {
  label: string;
  value?: string; // Base64 string della firma
  onChange: (signature: string | null) => void;
  isRequired?: boolean;
  isReadonly?: boolean;
  config?: {
    penColor?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    backgroundColor?: string;
  };
  error?: string;
  className?: string;
}

export const SignatureField: React.FC<SignatureFieldProps> = ({
  label,
  value,
  onChange,
  isRequired = false,
  isReadonly = false,
  config = {},
  error,
  className
}) => {
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const {
    penColor = '#000000',
    canvasWidth = 500,
    canvasHeight = 200,
    backgroundColor = '#ffffff'
  } = config;

  // Gestisce l'inizio del disegno
  const handleBegin = () => {
    setHasDrawn(true);
  };

  // Gestisce la fine del disegno
  const handleEnd = () => {
    if (signaturePadRef.current && !isReadonly) {
      const dataUrl = signaturePadRef.current.toDataURL();
      onChange(dataUrl);
    }
  };

  // Pulisce la firma
  const handleClear = () => {
    if (signaturePadRef.current && !isReadonly) {
      signaturePadRef.current.clear();
      setHasDrawn(false);
      onChange(null);
    }
  };

  // Annulla l'ultima azione (non disponibile in react-signature-canvas base)
  // Per implementare undo reale, serve salvare stati intermedi
  const handleUndo = () => {
    handleClear(); // Per ora equivale a clear
  };

  // Rendering in modalità preview (readonly)
  if (isReadonly && value) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label>
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Card className="p-4">
          <img 
            src={value} 
            alt="Firma digitale"
            className="max-w-full h-auto border border-gray-200 rounded"
            style={{ maxHeight: canvasHeight }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={`signature-${label}`}>
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Card className={cn(
        'p-4',
        error && 'border-red-500'
      )}>
        <div className="space-y-3">
          {/* Canvas area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white"
            style={{ width: '100%', maxWidth: canvasWidth }}
          >
            <SignatureCanvas
              ref={signaturePadRef}
              canvasProps={{
                width: canvasWidth,
                height: canvasHeight,
                className: 'signature-canvas cursor-crosshair',
                style: { width: '100%', height: `${canvasHeight}px` }
              }}
              penColor={penColor}
              backgroundColor={backgroundColor}
              onBegin={handleBegin}
              onEnd={handleEnd}
            />
          </div>

          {/* Status indicator */}
          {hasDrawn && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Firma acquisita</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClear}
              disabled={!hasDrawn || isReadonly}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Cancella
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUndo}
              disabled={!hasDrawn || isReadonly}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Annulla
            </Button>

            <div className="text-xs text-gray-500 ml-auto flex items-center gap-1">
              <PenIcon className="h-3 w-3" />
              Firma nell'area sopra
            </div>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500">
            Usa il mouse o il touch screen per firmare nell'area tratteggiata
          </p>
        </div>
      </Card>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default SignatureField;
