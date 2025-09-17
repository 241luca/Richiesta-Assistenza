import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  SparklesIcon, 
  DocumentCheckIcon, 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckBadgeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../services/api';
import toast from 'react-hot-toast';

export default function ProfessionalSkills() {
  const { professionalId } = useParams();
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });
  const [newCert, setNewCert] = useState({ 
    name: '', 
    issuer: '', 
    validUntil: '', 
    isVerified: false 
  });

  const { data: professional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${professionalId}`);
      return response.data.data || response.data;
    }
  });

  const { data: skills = [], refetchSkills } = useQuery({
    queryKey: ['professional-skills', professionalId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/professionals/${professionalId}/skills`);
        return response.data.data || [];
      } catch (error) {
        console.error('Errore caricamento skills:', error);
        return [];
      }
    }
  });

  const { data: certifications = [], refetchCerts } = useQuery({
    queryKey: ['professional-certifications', professionalId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/professionals/${professionalId}/certifications`);
        return response.data.data || [];
      } catch (error) {
        console.error('Errore caricamento certificazioni:', error);
        return [];
      }
    }
  });

  const addSkillMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/professionals/${professionalId}/skills`, newSkill);
    },
    onSuccess: () => {
      toast.success('Skill aggiunta con successo');
      setShowAddSkill(false);
      setNewSkill({ name: '', level: 'intermediate' });
      refetchSkills();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiunta');
    }
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      return apiClient.delete(`/professionals/${professionalId}/skills/${skillId}`);
    },
    onSuccess: () => {
      toast.success('Skill rimossa');
      refetchSkills();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella rimozione');
    }
  });

  const addCertMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/professionals/${professionalId}/certifications`, newCert);
    },
    onSuccess: () => {
      toast.success('Certificazione aggiunta');
      setShowAddCert(false);
      setNewCert({ name: '', issuer: '', validUntil: '', isVerified: false });
      refetchCerts();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiunta');
    }
  });

  const deleteCertMutation = useMutation({
    mutationFn: async (certId: string) => {
      return apiClient.delete(`/professionals/${professionalId}/certifications/${certId}`);
    },
    onSuccess: () => {
      toast.success('Certificazione rimossa');
      refetchCerts();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella rimozione');
    }
  });

  const verifyCertMutation = useMutation({
    mutationFn: async (certId: string) => {
      return apiClient.patch(`/professionals/${professionalId}/certifications/${certId}/verify`);
    },
    onSuccess: () => {
      toast.success('Certificazione verificata');
      refetchCerts();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella verifica');
    }
  });

  const skillLevels = {
    beginner: { label: 'Principiante', color: 'bg-gray-100 text-gray-800' },
    intermediate: { label: 'Intermedio', color: 'bg-blue-100 text-blue-800' },
    advanced: { label: 'Avanzato', color: 'bg-green-100 text-green-800' },
    expert: { label: 'Esperto', color: 'bg-purple-100 text-purple-800' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Skills e Certificazioni</h1>
              <p className="text-gray-600">{professional?.firstName} {professional?.lastName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Skills Tecniche */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Skills Tecniche</h2>
            <button
              onClick={() => setShowAddSkill(true)}
              className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Aggiungi
            </button>
          </div>

          {showAddSkill && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Nome skill"
                value={newSkill.name}
                onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                className="w-full mb-2 px-3 py-2 border rounded-lg"
              />
              <select
                value={newSkill.level}
                onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
                className="w-full mb-3 px-3 py-2 border rounded-lg"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzato</option>
                <option value="expert">Esperto</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => addSkillMutation.mutate()}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Salva
                </button>
                <button
                  onClick={() => {
                    setShowAddSkill(false);
                    setNewSkill({ name: '', level: 'intermediate' });
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {skills.map((skill: any) => (
              <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{skill.name}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                    skillLevels[skill.level as keyof typeof skillLevels]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {skillLevels[skill.level as keyof typeof skillLevels]?.label || skill.level}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Rimuovere questa skill?')) {
                      deleteSkillMutation.mutate(skill.id);
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {skills.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nessuna skill aggiunta
              </p>
            )}
          </div>
        </div>

        {/* Certificazioni */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <DocumentCheckIcon className="h-5 w-5 mr-2" />
              Certificazioni
            </h2>
            <button
              onClick={() => setShowAddCert(true)}
              className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Aggiungi
            </button>
          </div>

          {showAddCert && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Nome certificazione"
                value={newCert.name}
                onChange={(e) => setNewCert({...newCert, name: e.target.value})}
                className="w-full mb-2 px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Ente rilasciante"
                value={newCert.issuer}
                onChange={(e) => setNewCert({...newCert, issuer: e.target.value})}
                className="w-full mb-2 px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                placeholder="Valida fino a"
                value={newCert.validUntil}
                onChange={(e) => setNewCert({...newCert, validUntil: e.target.value})}
                className="w-full mb-3 px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => addCertMutation.mutate()}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Salva
                </button>
                <button
                  onClick={() => {
                    setShowAddCert(false);
                    setNewCert({ name: '', issuer: '', validUntil: '', isVerified: false });
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {certifications.map((cert: any) => (
              <div key={cert.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium">{cert.name}</p>
                      {cert.isVerified && (
                        <CheckBadgeIcon className="h-5 w-5 text-green-600 ml-2" title="Verificata" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                    {cert.validUntil && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        Valida fino al: {new Date(cert.validUntil).toLocaleDateString('it-IT')}
                      </div>
                    )}
                    {!cert.isVerified && (
                      <button
                        onClick={() => verifyCertMutation.mutate(cert.id)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Verifica certificazione
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Rimuovere questa certificazione?')) {
                        deleteCertMutation.mutate(cert.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {certifications.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nessuna certificazione aggiunta
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Statistiche Riepilogative */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Riepilogo Profilo Professionale</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{skills.length}</p>
            <p className="text-sm text-gray-600">Skills Totali</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {skills.filter((s: any) => s.level === 'expert').length}
            </p>
            <p className="text-sm text-gray-600">Skills Esperto</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{certifications.length}</p>
            <p className="text-sm text-gray-600">Certificazioni</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {certifications.filter((c: any) => c.isVerified).length}
            </p>
            <p className="text-sm text-gray-600">Verificate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
