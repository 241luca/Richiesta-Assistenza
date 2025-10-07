import { api } from './api';

/**
 * 🎯 REFERRAL API SERVICE
 * 
 * Gestisce tutte le chiamate API per il sistema referral
 */

// 🔍 Ottieni il codice referral personale
export const getMyReferralCode = async () => {
  const response = await api.get('/referrals/my-code');
  return response.data;
};

// 📨 Invia invito referral via email
export const sendReferralInvite = async (email: string) => {
  const response = await api.post('/referrals/invite', { email });
  return response.data;
};

// 📊 Ottieni statistiche referral personali
export const getReferralStats = async () => {
  const response = await api.get('/referrals/stats');
  return response.data;
};

// 🎯 Traccia registrazione (chiamato durante signup)
export const trackReferralSignup = async (referralCode: string) => {
  const response = await api.post('/referrals/track-signup', { referralCode });
  return response.data;
};

// 🏆 Traccia conversione (chiamato quando completa prima richiesta)
export const trackReferralConversion = async () => {
  const response = await api.post('/referrals/track-conversion');
  return response.data;
};

// 📈 Ottieni analytics globali (solo admin)
export const getReferralAnalytics = async () => {
  const response = await api.get('/referrals/analytics');
  return response.data;
};

// 🧹 Pulisci referral scaduti (solo admin)
export const cleanupExpiredReferrals = async () => {
  const response = await api.post('/referrals/cleanup-expired');
  return response.data;
};

// 🔗 Genera link trackabile
export const generateTrackableLink = (code: string) => {
  return `${import.meta.env.VITE_API_URL || 'http://localhost:3200'}/api/referrals/track/${code}`;
};

export default {
  getMyReferralCode,
  sendReferralInvite,
  getReferralStats,
  trackReferralSignup,
  trackReferralConversion,
  getReferralAnalytics,
  cleanupExpiredReferrals,
  generateTrackableLink
};
