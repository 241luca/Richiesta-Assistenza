import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StarRating } from './StarRating';
import { UserIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface ReviewListProps {
  professionalId: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  isVerified: boolean;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  request?: {
    id: string;
    category?: {
      name: string;
    };
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const ReviewList: React.FC<ReviewListProps> = ({ professionalId }) => {
  // Query per le recensioni
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', professionalId],
    queryFn: async () => {
      const response = await api.get(`/reviews/professional/${professionalId}`);
      return response.data.data;
    }
  });

  // Query per le statistiche
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['reviews-stats', professionalId],
    queryFn: async () => {
      const response = await api.get(`/reviews/professional/${professionalId}/stats`);
      return response.data.data as ReviewStats;
    }
  });

  if (isLoadingReviews || isLoadingStats) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Caricamento recensioni...</span>
      </div>
    );
  }

  const reviews = reviewsData?.reviews || [];

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Rating medio */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Valutazione Media
                </h3>
                <StarRating 
                  rating={stats.averageRating} 
                  readonly 
                  size="lg" 
                />
                <p className="text-sm text-gray-600 mt-1">
                  Basato su {stats.totalReviews} {stats.totalReviews === 1 ? 'recensione' : 'recensioni'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">su 5.0</p>
              </div>
            </div>

            {/* Distribuzione stelle */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Distribuzione valutazioni
              </h4>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.distribution[stars] || 0;
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-3">{stars}</span>
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lista recensioni */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recensioni dei clienti
        </h3>
        
        {reviews.length > 0 ? (
          reviews.map((review: Review) => (
            <div 
              key={review.id} 
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {review.client.avatar ? (
                      <img 
                        src={review.client.avatar} 
                        alt={review.client.firstName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info cliente */}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.client.firstName} {review.client.lastName.charAt(0)}.
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRating 
                        rating={review.rating} 
                        readonly 
                        size="sm" 
                        showNumber={false}
                      />
                      {review.isVerified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Verificato
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Data */}
                <p className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Categoria servizio */}
              {review.request?.category?.name && (
                <p className="text-sm text-gray-600 mb-2">
                  Servizio: <span className="font-medium">{review.request.category.name}</span>
                </p>
              )}

              {/* Commento */}
              {review.comment && (
                <p className="text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg font-medium">
              Nessuna recensione ancora
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Sii il primo a lasciare una recensione per questo professionista
            </p>
          </div>
        )}
      </div>

      {/* Paginazione se ci sono più recensioni */}
      {reviewsData?.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex gap-2">
            {/* Implementare paginazione se necessario */}
          </nav>
        </div>
      )}
    </div>
  );
};

// Icona stella per la distribuzione
function StarIcon({ className }: { className: string }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
