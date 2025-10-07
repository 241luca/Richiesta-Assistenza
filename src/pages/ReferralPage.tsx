import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShareIcon, UserPlusIcon, ChartBarIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { GiftIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import referralApi from '../services/referralApi';

/**
 * 🎁 PAGINA SISTEMA REFERRAL
 * 
 * Permette agli utenti di:
 * - Ottenere il proprio codice referral
 * - Invitare amici via email 
 * - Condividere sui social
 * - Vedere statistiche e punti guadagnati
 */
export const ReferralPage = () => {
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  // 📊 Carica dati referral
  const { data: referralData, isLoading: loadingCode } = useQuery({
    queryKey: ['my-referral-code'],
    queryFn: referralApi.getMyReferralCode,
    staleTime: 5 * 60 * 1000 // Cache per 5 minuti
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: referralApi.getReferralStats,
    staleTime: 2 * 60 * 1000 // Cache per 2 minuti
  });

  // 📨 Invita via email
  const inviteMutation = useMutation({
    mutationFn: referralApi.sendReferralInvite,
    onSuccess: () => {
      setEmail('');
      toast.success('🎉 Invito inviato con successo!');
      // Ricarica le statistiche
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore nell\'invio dell\'invito';
      toast.error(message);
    }
  });

  // 📋 Copia negli appunti
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('📋 Copiato negli appunti!');
    }).catch(() => {
      toast.error('Errore nella copia');
    });
  };

  // 📱 Condividi su WhatsApp
  const shareViaWhatsApp = () => {
    if (!referralData?.data?.whatsappText) return;
    
    const text = encodeURIComponent(referralData.data.whatsappText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // 🐦 Condividi su Twitter
  const shareViaTwitter = () => {
    if (!referralData?.data) return;
    
    const text = encodeURIComponent(`🎯 Scopri questo fantastico servizio di assistenza! Usa il mio codice ${referralData.data.code} per ricevere punti bonus! 🎁`);
    const url = encodeURIComponent(referralData.data.link);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  // 📧 Condividi via Email
  const shareViaEmail = () => {
    if (!referralData?.data) return;
    
    const subject = encodeURIComponent('Ti consiglio questo servizio!');
    const body = encodeURIComponent(`Ciao!\n\nTi consiglio questo fantastico servizio di assistenza!\n\nUsa il mio codice invito: ${referralData.data.code}\n\nLink diretto: ${referralData.data.link}\n\nRiceverai punti bonus alla registrazione!\n\nA presto! 😊`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (loadingCode || loadingStats) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 🎯 Header con gradiente */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <GiftIcon className="h-8 w-8" />
              Invita Amici, Guadagna Punti!
            </h1>
            <p className="text-lg opacity-90">
              Per ogni amico che si registra guadagni <strong>20 punti</strong>.
              Se completa una richiesta: <strong>50 punti bonus!</strong> 🚀
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <SparklesIcon className="h-12 w-12 text-yellow-300" />
            <div>
              <p className="text-2xl font-bold">{stats?.data?.currentPoints || 0}</p>
              <p className="text-sm opacity-80">Punti attuali</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📱 Mobile: Punti attuali */}
      <div className="md:hidden bg-white rounded-lg shadow-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-xl font-bold text-gray-900">{stats?.data?.currentPoints || 0}</p>
            <p className="text-sm text-gray-600">Punti attuali</p>
          </div>
        </div>
        <TrophyIcon className="h-8 w-8 text-purple-500" />
      </div>

      {/* 🔗 Il Tuo Codice Referral */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
          <ClipboardDocumentIcon className="h-6 w-6 text-blue-500" />
          Il Tuo Codice Referral
        </h2>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Codice</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-blue-600 font-mono">
              {referralData?.data?.code || 'Loading...'}
            </p>
            <button
              onClick={() => copyToClipboard(referralData?.data?.code || '')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              Copia
            </button>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Link Diretto</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 truncate mr-4 font-mono">
              {referralData?.data?.link || 'Loading...'}
            </p>
            <button
              onClick={() => copyToClipboard(referralData?.data?.link || '')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              Copia
            </button>
          </div>
        </div>

        {/* 🚀 Pulsanti condivisione */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={shareViaWhatsApp}
            className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShareIcon className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={shareViaTwitter}
            className="bg-blue-400 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <ShareIcon className="h-4 w-4" />
            Twitter
          </button>
          <button
            onClick={shareViaEmail}
            className="bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShareIcon className="h-4 w-4" />
            Email
          </button>
          <button
            onClick={() => copyToClipboard(referralData?.data?.shareText || '')}
            className="bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            Messaggio
          </button>
        </div>
      </div>

      {/* 📨 Invita via Email */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
          <UserPlusIcon className="h-6 w-6 text-green-500" />
          Invita via Email
        </h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@amico.com"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={inviteMutation.isPending}
          />
          <button
            onClick={() => inviteMutation.mutate(email)}
            disabled={!email || inviteMutation.isPending}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {inviteMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <UserPlusIcon className="h-4 w-4" />
            )}
            {inviteMutation.isPending ? 'Invio...' : 'Invita'}
          </button>
        </div>
      </div>

      {/* 📊 Le Tue Statistiche */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-blue-500" />
          Le Tue Statistiche
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{stats?.data?.total || 0}</p>
            <p className="text-sm text-gray-600">Inviti Totali</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats?.data?.pending || 0}</p>
            <p className="text-sm text-gray-600">In Attesa</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.data?.converted || 0}</p>
            <p className="text-sm text-gray-600">Convertiti</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{stats?.data?.totalPointsEarned || 0}</p>
            <p className="text-sm text-gray-600">Punti Guadagnati</p>
          </div>
        </div>

        {/* 📈 Grafico semplice percentuali */}
        {stats?.data?.total > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Tasso di Conversione</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                style={{ 
                  width: `${((stats.data.converted / stats.data.total) * 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {((stats.data.converted / stats.data.total) * 100).toFixed(1)}% dei tuoi inviti si è convertito
            </p>
          </div>
        )}
      </div>

      {/* 🎓 Come Funziona */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
          💡 Come Funziona il Sistema Referral
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <span>Condividi il tuo codice o link con gli amici</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <span>Il tuo amico si registra usando il tuo codice</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <span>Tu ricevi <strong>20 punti</strong> subito! 🎉</span>
            </li>
          </ol>
          <ol className="space-y-3 text-sm" start={4}>
            <li className="flex items-start gap-3">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
              <span>Quando completa la prima richiesta: <strong>50 punti bonus</strong>! 🚀</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
              <span>Il tuo amico riceve <strong>10 punti</strong> di benvenuto!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-500">✨</span>
              <span>Più amici inviti, più punti guadagni!</span>
            </li>
          </ol>
        </div>
      </div>

      {/* 🎯 Recent Activity (se ci sono inviti recenti) */}
      {stats?.data?.recentReferrals && stats.data.recentReferrals.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="font-bold text-lg mb-4">🕒 Attività Recente</h3>
          <div className="space-y-3">
            {stats.data.recentReferrals.slice(0, 3).map((referral: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">
                    {referral.referee ? 
                      `${referral.referee.firstName} ${referral.referee.lastName}` : 
                      referral.email
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {referral.status === 'PENDING' && 'Invito inviato'}
                    {referral.status === 'REGISTERED' && 'Si è registrato! +20 punti'}
                    {referral.status === 'CONVERTED' && 'Ha completato prima richiesta! +70 punti'}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    referral.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    referral.status === 'REGISTERED' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {referral.status === 'PENDING' && '⏳ In attesa'}
                    {referral.status === 'REGISTERED' && '✅ Registrato'}
                    {referral.status === 'CONVERTED' && '🎉 Convertito'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralPage;
