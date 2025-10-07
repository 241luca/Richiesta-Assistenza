import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService, type ProfessionalCertification, type CreateCertificationData, type UpdateCertificationData } from '../services/certifications';

/**
 * 🔍 Hook per ottenere le certificazioni di un professionista
 */
export const useCertifications = (professionalId: string) => {
  return useQuery<ProfessionalCertification[]>({
    queryKey: ['certifications', professionalId],
    queryFn: () => certificationsService.getCertifications(professionalId),
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    enabled: !!professionalId, // Esegui solo se professionalId esiste
  });
};

/**
 * ➕ Hook per creare una nuova certificazione
 */
export const useCreateCertification = (professionalId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCertificationData) => 
      certificationsService.createCertification(professionalId, data),
    onSuccess: () => {
      // Aggiorna la cache delle certificazioni
      queryClient.invalidateQueries({ queryKey: ['certifications', professionalId] });
    },
  });
};

/**
 * ✏️ Hook per aggiornare una certificazione
 */
export const useUpdateCertification = (professionalId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ certificationId, data }: { certificationId: string; data: UpdateCertificationData }) => 
      certificationsService.updateCertification(professionalId, certificationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', professionalId] });
    },
  });
};

/**
 * 🗑️ Hook per eliminare una certificazione
 */
export const useDeleteCertification = (professionalId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificationId: string) => 
      certificationsService.deleteCertification(professionalId, certificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', professionalId] });
    },
  });
};

/**
 * ✅ Hook per verificare una certificazione (solo admin)
 */
export const useVerifyCertification = (professionalId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificationId: string) => 
      certificationsService.verifyCertification(professionalId, certificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', professionalId] });
    },
  });
};

/**
 * 🚫 Hook per rimuovere verifica certificazione (solo admin)
 */
export const useUnverifyCertification = (professionalId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificationId: string) => 
      certificationsService.unverifyCertification(professionalId, certificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications', professionalId] });
    },
  });
};