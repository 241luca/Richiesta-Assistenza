import api, { apiClient } from './api';

export type ReferralCode = {
  code: string;
  link: string;
  shareText: string;
  whatsappText: string;
};

export type ReferralStats = {
  total: number;
  pending: number;
  registered: number;
  converted: number;
  expired: number;
  totalPointsEarned: number;
  currentPoints: number;
  recentReferrals: any[];
};

export type ReferralAnalytics = {
  totalReferrals: number;
  statusBreakdown: Record<string, number>;
  conversionRate: string;
  totalUsers: number;
  recentSignups: number;
  recentActivity: any[];
};

export const referralService = {
  /**
   * Ottieni il codice referral personale dell'utente.
   */
  async getMyReferralCode(): Promise<ReferralCode> {
    const res = await api.get('/referrals/my-code');
    return res.data?.data || res.data;
  },

  /**
   * Invia un invito referral via email.
   */
  async sendInvite(email: string, message?: string) {
    const res = await api.post('/referrals/invite', { email, message });
    return res.data?.data || res.data;
  },

  /**
   * Ottieni statistiche personali del sistema referral.
   */
  async getStats(): Promise<ReferralStats> {
    const res = await api.get('/referrals/stats');
    return res.data?.data || res.data;
  },

  /**
   * Traccia la registrazione di un utente con un codice referral.
   */
  async trackSignup(referralCode: string) {
    const res = await api.post('/referrals/track-signup', { referralCode });
    return res.data?.data || res.data;
  },

  /**
   * Traccia la conversione (prima richiesta completata) dell'utente.
   */
  async trackConversion() {
    const res = await api.post('/referrals/track-conversion');
    return res.data?.data || res.data;
  },

  /**
   * Ottieni analytics globali del sistema referral (solo ADMIN/SUPER_ADMIN).
   */
  async getAnalytics(): Promise<ReferralAnalytics> {
    const res = await api.get('/referrals/analytics');
    return res.data?.data || res.data;
  },

  /**
   * Pulisci referral scaduti (solo ADMIN/SUPER_ADMIN).
   */
  async cleanupExpired() {
    const res = await api.post('/referrals/cleanup-expired');
    return res.data?.data || res.data;
  },

  /**
   * Genera un link trackabile per il codice referral.
   */
  generateTrackableLink(code: string) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3200';
    return `${base}/api/referrals/track/${code}`;
  },
};

export default referralService;