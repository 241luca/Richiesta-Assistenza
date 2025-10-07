import React from 'react';

interface UserAvatarProps {
  imageUrl?: string | null;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  imageUrl,
  firstName,
  lastName,
  fullName,
  size = 'md',
  className = ''
}) => {
  // Dimensioni per ogni size
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-xl'
  };

  // Genera le iniziali
  const getInitials = (): string => {
    if (fullName) {
      const names = fullName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    
    if (lastName) {
      return lastName.substring(0, 2).toUpperCase();
    }
    
    return '??';
  };

  // Genera un colore consistente basato sul nome
  const getColorFromName = (): string => {
    const name = fullName || `${firstName} ${lastName}` || 'Unknown';
    let hash = 0;
    
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Array di colori gradiente predefiniti
    const colors = [
      'from-blue-500 to-blue-700',
      'from-green-500 to-green-700',
      'from-purple-500 to-purple-700',
      'from-pink-500 to-pink-700',
      'from-indigo-500 to-indigo-700',
      'from-yellow-500 to-yellow-700',
      'from-red-500 to-red-700',
      'from-teal-500 to-teal-700',
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials();
  const gradientColor = getColorFromName();

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={fullName || `${firstName} ${lastName}` || 'Utente'}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Se l'immagine non si carica, mostra le iniziali
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="h-full w-full bg-gradient-to-br ${gradientColor} flex items-center justify-center">
                  <span class="text-white font-semibold">${initials}</span>
                </div>
              `;
            }
          }}
        />
      ) : (
        <div className={`h-full w-full bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
          <span className="text-white font-semibold">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

// Componente per mostrare avatar con nome
interface UserAvatarWithNameProps extends UserAvatarProps {
  showName?: boolean;
  subtitle?: string;
  layout?: 'horizontal' | 'vertical';
}

export const UserAvatarWithName: React.FC<UserAvatarWithNameProps> = ({
  showName = true,
  subtitle,
  layout = 'horizontal',
  ...avatarProps
}) => {
  const name = avatarProps.fullName || 
    `${avatarProps.firstName || ''} ${avatarProps.lastName || ''}`.trim() || 
    'Utente';

  if (layout === 'vertical') {
    return (
      <div className="flex flex-col items-center space-y-2">
        <UserAvatar {...avatarProps} />
        {showName && (
          <div className="text-center">
            <p className="font-medium text-gray-900">{name}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <UserAvatar {...avatarProps} />
      {showName && (
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
