import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StarRating } from './StarRating';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
  requestId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  requestId, 
  onSuccess,
  onCancel 
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (data: { requestId: string; rating: number; comment?: string }) => {
      const response = await api.post('/reviews', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] });
      toast.success('Recensione inviata con successo! Grazie per il tuo feedback.');
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'invio della recensione';
      toast.error(message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione
    if (rating < 1 || rating > 5) {
      toast.error('Seleziona una valutazione da 1 a 5 stelle');
      return;
    }

    if (comment && comment.trim().length < 10) {
      toast.error('Il commento deve essere di almeno 10 caratteri');
      return;
    }

    setIsSubmitting(true);
    
    await createReviewMutation.mutateAsync({
      requestId,
      rating,
      comment: comment.trim() || undefined
    });

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lascia una recensione
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Il tuo feedback è importante per noi e aiuta altri clienti nella scelta del professionista.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valutazione *
        </label>
        <StarRating 
          rating={rating} 
          onRatingChange={setRating} 
          size="lg"
          showNumber={false}
        />
        <p className="text-xs text-gray-500 mt-2">
          Clicca sulle stelle per valutare il servizio
        </p>
      </div>

      <div>
        <label 
          htmlFor="comment" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Commento (opzionale)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={1000}
          placeholder="Raccontaci la tua esperienza con questo professionista..."
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            Minimo 10 caratteri se vuoi lasciare un commento
          </p>
          <p className="text-xs text-gray-500">
            {comment.length}/1000 caratteri
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || createReviewMutation.isPending}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Invio in corso...' : 'Invia Recensione'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Annulla
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t">
        <p>
          <strong>Nota:</strong> La tua recensione sarà visibile pubblicamente. 
          Non includere informazioni personali sensibili nel commento.
        </p>
      </div>
    </form>
  );
};
