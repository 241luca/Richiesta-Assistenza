import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  tooltipText?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  size = 'md',
  showText = false,
  className = '',
  tooltipText = 'Profilo Verificato'
}) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div 
      className={`inline-flex items-center gap-1 ${className}`} 
      title={tooltipText}
    >
      <CheckBadgeIcon 
        className={`${sizeClasses[size]} text-blue-600 drop-shadow-sm`} 
      />
      {showText && (
        <span className={`${textSizeClasses[size]} font-semibold text-blue-600`}>
          Verificato
        </span>
      )}
    </div>
  );
};

/**
 * Variante del badge con stili diversi
 */
export const VerifiedBadgeGreen: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  size = 'md',
  showText = false,
  className = '',
  tooltipText = 'Profilo Verificato'
}) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div 
      className={`inline-flex items-center gap-1 ${className}`} 
      title={tooltipText}
    >
      <CheckBadgeIcon 
        className={`${sizeClasses[size]} text-emerald-600 drop-shadow-sm`} 
      />
      {showText && (
        <span className={`${textSizeClasses[size]} font-semibold text-emerald-600`}>
          Verificato
        </span>
      )}
    </div>
  );
};

/**
 * Badge con informazioni dettagliate sulla verifica
 */
interface DetailedVerifiedBadgeProps {
  isVerified: boolean;
  verificationDetails?: {
    documentsVerified?: boolean;
    backgroundCheck?: boolean;
    certificatesVerified?: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const DetailedVerifiedBadge: React.FC<DetailedVerifiedBadgeProps> = ({
  isVerified,
  verificationDetails,
  size = 'md',
  showDetails = false
}) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const getVerificationLevel = () => {
    if (!verificationDetails) return 'base';
    
    const { documentsVerified, backgroundCheck, certificatesVerified } = verificationDetails;
    const verifiedCount = [documentsVerified, backgroundCheck, certificatesVerified].filter(Boolean).length;
    
    if (verifiedCount === 3) return 'premium';
    if (verifiedCount >= 2) return 'advanced';
    return 'base';
  };

  const level = getVerificationLevel();
  const colorClasses = {
    base: 'text-blue-600',
    advanced: 'text-purple-600',
    premium: 'text-yellow-600'
  };

  const levelText = {
    base: 'Verificato',
    advanced: 'Verificato Pro',
    premium: 'Verificato Premium'
  };

  const getTooltipText = () => {
    if (!verificationDetails || !showDetails) return 'Profilo Verificato';
    
    const details = [];
    if (verificationDetails.documentsVerified) details.push('Documenti ✓');
    if (verificationDetails.backgroundCheck) details.push('Background Check ✓');
    if (verificationDetails.certificatesVerified) details.push('Certificazioni ✓');
    
    return `Verificato: ${details.join(', ')}`;
  };

  return (
    <div 
      className="inline-flex items-center gap-1" 
      title={getTooltipText()}
    >
      <CheckBadgeIcon 
        className={`${sizeClasses[size]} ${colorClasses[level]} drop-shadow-sm`} 
      />
      {showDetails && (
        <span className={`text-sm font-semibold ${colorClasses[level]}`}>
          {levelText[level]}
        </span>
      )}
    </div>
  );
};

export default VerifiedBadge;