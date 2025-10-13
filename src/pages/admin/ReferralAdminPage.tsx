import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { referralService, type ReferralAnalytics } from '@/services/referral.service';
import { apiClient as api } from '@/services/api';
import toast from 'react-hot-toast';

export default function ReferralAdminPage() {
  const queryClient = useQueryClient();

  const { data: analytics, isLoading, error } = useQuery<ReferralAnalytics>({
    queryKey: ['referral-analytics'],
    queryFn: referralService.getAnalytics,
    staleTime: 60 * 1000,
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      await api.post('/referrals/cleanup-expired');
    },
    onSuccess: () => {
      toast.success('Referral scaduti puliti con successo');
      queryClient.invalidateQueries({ queryKey: ['referral-analytics'] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Errore nella pulizia dei referral scaduti';
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          Errore nel caricamento degli analytics referral.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Referral Admin</h1>
        <button
          onClick={() => cleanupMutation.mutate()}
          disabled={cleanupMutation.isPending}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {cleanupMutation.isPending ? 'Pulizia…' : 'Pulisci Referral Scaduti'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Metriche Generali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Totale Referral</p>
                <p className="text-2xl font-bold">{analytics?.totalReferrals ?? 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Totale Utenti</p>
                <p className="text-2xl font-bold">{analytics?.totalUsers ?? 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics?.conversionRate ?? '0%'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stato Referral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-yellow-50 rounded">
                <p className="text-sm text-gray-600">In Attesa</p>
                <p className="text-2xl font-bold">{analytics?.statusBreakdown?.PENDING ?? 0}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Registrati</p>
                <p className="text-2xl font-bold">{analytics?.statusBreakdown?.REGISTERED ?? 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Convertiti</p>
                <p className="text-2xl font-bold">{analytics?.statusBreakdown?.CONVERTED ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Attività Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {!analytics?.recentActivity || analytics.recentActivity.length === 0 ? (
            <p className="text-gray-600">Nessuna attività recente.</p>
          ) : (
            <div className="space-y-2">
              {analytics.recentActivity.map((r: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">
                      {r.referee ? `${r.referee.firstName} ${r.referee.lastName}` : r.email}
                    </p>
                    <p className="text-sm text-gray-600">Referrer: {r.referrer ? `${r.referrer.firstName} ${r.referrer.lastName}` : '-'}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'REGISTERED' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}