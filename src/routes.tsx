import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from './hooks/useAuth';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';
import LoginPage from './pages/LoginPage';
import PendingApprovalPage from './pages/PendingApprovalPage'; // NUOVO

// Professional Management Pages
import ProfessionalLayout from './pages/admin/professionals/ProfessionalLayout';
import ProfessionalRouteWrapper from './components/ProfessionalRouteWrapper';
import ProfessionalSkillsRedirect from './components/ProfessionalSkillsRedirect';
import ProfessionalsList from './pages/admin/ProfessionalsList';
import ProfessionalCompetenze from './pages/admin/professionals/competenze/ProfessionalCompetenze';
import ProfessionalTariffe from './pages/admin/professionals/ProfessionalTariffe';
import ProfessionalSkills from './pages/admin/professionals/ProfessionalSkills';

import RegisterPage from './pages/RegisterPage';
import { RegisterChoicePage } from './pages/auth/RegisterChoicePage';
import { RegisterClientPage } from './pages/auth/RegisterClientPage';
import RegisterProfessionalPageV2 from './pages/auth/RegisterProfessionalPageV2';
import DashboardPage from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import RequestsPage from './pages/RequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import EditRequestPage from './pages/EditRequestPage';
import QuotesPage from './pages/QuotesPage';
import QuoteDetailPage from './pages/QuoteDetailPage';
import NewQuotePage from './pages/NewQuotePage';
import EditQuotePage from './pages/EditQuotePage';
import PaymentsPage from './pages/PaymentsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import TaxonomyPage from './pages/admin/TaxonomyPage';
import { AiConfigPage } from "./pages/admin/AiConfigPage";
import { AiManagement } from "./pages/admin/AiManagement";
import SettingsPage from './pages/admin/SettingsPage';
// NEW: Import new admin pages
import SystemEnumsPage from './pages/admin/SystemEnumsPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import ImageConfigPage from './pages/admin/ImageConfigPage';
// TEMP: Import test page
import SystemSettingsTestPage from './pages/admin/SystemSettingsTestPage';
import SystemSettingsSimplePage from './pages/admin/SystemSettingsSimplePage';
import NewRequestPage from './pages/NewRequestPage';
import ProfessionalCalendarPage from './pages/ProfessionalCalendarPage';
import { AvailableRequests } from './pages/professional/AvailableRequests';
import UsersPage from './pages/UsersPage';
import ApiKeysOverview from './pages/admin/api-keys/ApiKeysOverview';
import GoogleMapsConfig from './pages/admin/api-keys/GoogleMapsConfig';
import BrevoConfig from './pages/admin/api-keys/BrevoConfig';
import OpenAIConfig from './pages/admin/api-keys/OpenAIConfig';
import TinyMCEConfig from './pages/admin/api-keys/TinyMCEConfig';
import GoogleCalendarConfig from './pages/admin/api-keys/GoogleCalendarConfig';
import StripeConfig from './pages/admin/api-keys/StripeConfig';
import ClientLegalDocuments from './pages/client/ClientLegalDocuments';
import ProfessionalLegalDocuments from './pages/professional/ProfessionalLegalDocuments';
import WhatsAppConfig from './pages/admin/api-keys/WhatsAppConfig';

// WhatsApp and Knowledge Base imports
import WhatsAppManager from './components/admin/whatsapp/WhatsAppManager';
import WhatsAppWPPManager from './pages/admin/WhatsAppWPPManager';  // NUOVO - Manager WPPConnect principale
import WhatsAppMessages from './pages/admin/WhatsAppMessages';  // NUOVO - Messaggi WPPConnect
import WhatsAppContacts from './pages/admin/WhatsAppContacts';  // NUOVO - Contatti WhatsApp
import KnowledgeBase from './components/knowledgebase/KnowledgeBase';
import AdminTestsPage from './pages/admin/tests';
// NUOVO: Import Sistema Notifiche
import NotificationDashboard from './components/notifications/NotificationDashboard';
import AdminNotificationsPage from './pages/admin/NotificationsPage';
import Layout from './components/Layout';
// NUOVO: Import per creazione richieste per conto clienti
import CreateRequestForClient from './pages/admin/CreateRequestForClient';
import SimpleBackupPage from './pages/admin/SimpleBackupPage';

// NUOVO: Import Sistema Rapporti Intervento
import ProfessionalReportsPage from './pages/professional/reports/index';

// NUOVO: Import Script Manager
import { ScriptManager } from './pages/admin/ScriptManager';
import ScriptConfigurationManager from './pages/admin/ScriptConfigurationManager';
import TestScriptConfig from './pages/admin/TestScriptConfig';

// SISTEMA AUDIT LOG - Added 07/01/2025
import AuditDashboard from './components/admin/audit/AuditDashboard';
import OnboardingAnalyticsPage from './pages/admin/OnboardingAnalyticsPage';

// SISTEMA HEALTH CHECK - Added 07/01/2025
import HealthCheckDashboard from './pages/admin/HealthCheckDashboard';
import SystemStatusPage from './pages/admin/SystemStatusPage';

import LegalConsentDashboard from './pages/LegalConsentDashboard';

// Legal Documents Pages
import LegalDocumentsPage from './pages/admin/LegalDocumentsPage';
import LegalDocumentFormPage from './pages/admin/LegalDocumentFormPage';
import LegalDocumentDetailPage from './pages/admin/LegalDocumentDetailPage';
import LegalDocumentVersionForm from './pages/admin/LegalDocumentVersionForm';
import LegalDocumentEditor from './pages/admin/LegalDocumentEditor';
import LegalAcceptancesPage from './pages/admin/LegalAcceptancesPage';
import LegalAnalyticsPage from './pages/admin/LegalAnalyticsPage';
import LegalTemplatesPage from './pages/admin/LegalTemplatesPage';
import DocumentManagementPage from './pages/admin/DocumentManagementPage';
import DocumentTypesPage from './pages/admin/DocumentTypesPage';
import ExtendedDocumentTypesPage from './pages/admin/ExtendedDocumentTypesPage'; // NUOVO - Document Integration
import UnifiedDocumentsDashboard from './pages/admin/UnifiedDocumentsDashboard'; // NUOVO - Unified Documents
import DocumentCategoriesPage from './pages/admin/DocumentCategoriesPage';
import ApprovalWorkflowsPage from './pages/admin/ApprovalWorkflowsPage';
import UIConfigPage from './pages/admin/UIConfigPage';
import SystemConfigPage from './pages/admin/SystemConfigPage';
import DocumentPermissionsPage from './pages/admin/DocumentPermissionsPage';
import DocumentNotificationsPage from './pages/admin/DocumentNotificationsPage';
import ContactPage from './pages/ContactPage';  // NUOVO - Pagina Contatti
import GuaranteesPage from './pages/GuaranteesPage';  // NUOVO - Pagina Garanzie
import GeocodingToolPage from './pages/admin/GeocodingToolPage';  // NUOVO - Tool Geocoding
import DocumentFieldsPage from './pages/admin/DocumentFieldsPage';
import LegalDocumentsIndexPage from './pages/legal/LegalDocumentsIndexPage';
import PublicLegalDocumentPage from './pages/legal/PublicLegalDocumentPage';

// 🧪 TEST - Pagina test certificazioni
import TestCertificationsPage from './pages/TestCertificationsPage';

// 🧪 TEST - Pagina test Sistema Bozze
import TestDraftSystem from './pages/TestDraftSystem';
import { TestCelebrationsPage } from './pages/TestCelebrationsPage';

// SISTEMA AI DUALE - Added 15/01/2025
import AIDualeDashboard from './pages/admin/AIDualeDashboard';
import ReportsListPage from './pages/professional/reports/list';
import NewReportPage from './pages/professional/reports/new';
import ProfessionalPhrasesPage from './pages/professional/reports/phrases';
import ProfessionalMaterialsPage from './pages/professional/reports/materials';
import ProfessionalTemplatesPage from './pages/professional/reports/templates';
import ProfessionalSettingsPage from './pages/professional/reports/settings';
import ClientReportsPage from './pages/client/reports/index';
import ClientReportDetailPage from './pages/client/reports/detail';
import RequestChat from './pages/requests/RequestChat';
import RequestForms from './pages/requests/RequestForms';

// SISTEMA REFERRAL - Added 05/10/2025
import ReferralPage from './pages/ReferralPage';
import ReferralAdminPage from './pages/admin/ReferralAdminPage';

// SISTEMA MODULI - Added 05/10/2025
import { ModuleManager } from './pages/admin/ModuleManager';

// SISTEMA SMARTDOCS - Added 24/10/2025
import SmartDocsDashboard from './pages/admin/SmartDocsDashboard';
import SmartDocsSettings from './pages/admin/SmartDocsSettings';
import SmartDocsTestLab from './pages/admin/SmartDocsTestLab';
import SmartDocsSyncSettings from './pages/admin/SmartDocsSyncSettings';
import SmartDocsStorageDashboard from './pages/admin/SmartDocsStorageDashboard';
import SmartDocsSyncMonitor from './pages/admin/SmartDocsSyncMonitor';
import SmartDocsSystemStatus from './pages/admin/SmartDocsSystemStatus';
import MyKnowledgeBase from './pages/MyKnowledgeBase';
import SmartDocsPreferences from './pages/SmartDocsPreferences';
import MyDocumentsUpload from './pages/MyDocumentsUpload';
import ProfessionalSmartDocsPage from './pages/professional/MySmartDocsPage';
import ClientSmartDocsPage from './pages/client/MySmartDocsPage';

// SISTEMA RECENSIONI - Added 15/10/2025
import ReviewSystemConfigPage from './pages/admin/ReviewSystemConfigPage';

// SISTEMA CUSTOM FORMS - Added 15/01/2025
import { CustomFormPage } from './pages/CustomFormPage';
import { CustomFormManager } from './components/custom-forms/CustomFormManager';
import { ProfessionalCustomFormsPage } from './pages/professional/ProfessionalCustomFormsPage';
import { CustomFormsPage as ClientCustomFormsPage } from './pages/client/CustomFormsPage';

// Admin Route wrapper component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

// Super Admin Route wrapper component (SUPER_ADMIN only)
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

export default function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <GoogleMapsProvider>
      <Routes>
      {/* Auth routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      
      {/* Registration routes - Updated with new flow */}
      <Route path="/register" element={!isAuthenticated ? <RegisterChoicePage /> : <Navigate to="/dashboard" />} />
      <Route path="/register/client" element={!isAuthenticated ? <RegisterClientPage /> : <Navigate to="/dashboard" />} />
      <Route path="/register/professional" element={!isAuthenticated ? <RegisterProfessionalPageV2 /> : <Navigate to="/dashboard" />} />
      
      {/* User Legal Consent Dashboard */}
      <Route path="/my-consents" element={
        isAuthenticated ? <Layout><LegalConsentDashboard /></Layout> : <Navigate to="/login" />
      } />
      
      {/* Public Legal Documents Pages */}
      <Route path="/legal" element={<LegalDocumentsIndexPage />} />
      <Route path="/legal/:type" element={<PublicLegalDocumentPage />} />
      
      {/* Public Contact Page */}
      <Route path="/contact" element={<ContactPage />} />
      
      {/* Public Guarantees Page */}
      <Route path="/garanzie" element={<GuaranteesPage />} />
      
      {/* Legacy registration (backward compatibility) */}
      <Route path="/register-old" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        isAuthenticated ? <Layout><DashboardPage /></Layout> : <Navigate to="/login" />
      } />
      
      <Route path="/profile" element={
        isAuthenticated ? <Layout><ProfilePage /></Layout> : <Navigate to="/login" />
      } />
      
      {/* Request routes */}
      <Route path="/requests" element={
        isAuthenticated ? <Layout><RequestsPage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/requests/new" element={
        isAuthenticated ? <Layout><NewRequestPage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/requests/:id" element={
        isAuthenticated ? <Layout><RequestDetailPage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/requests/:id/chat" element={
        isAuthenticated ? <Layout><RequestChat /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/requests/:id/forms" element={
        isAuthenticated ? <Layout><RequestForms /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/requests/:id/edit" element={
        isAuthenticated ? <Layout><EditRequestPage /></Layout> : <Navigate to="/login" />
      } />
      
      {/* Quote routes */}
      <Route path="/quotes" element={
        isAuthenticated ? <Layout><QuotesPage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/quotes/new" element={
        isAuthenticated ? <Layout><NewQuotePage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/quotes/new/:requestId" element={
        isAuthenticated ? <Layout><NewQuotePage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/quotes/edit/:id" element={
        isAuthenticated ? <Layout><EditQuotePage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/quotes/:id" element={
        isAuthenticated ? <Layout><QuoteDetailPage /></Layout> : <Navigate to="/login" />
      } />
      
      {/* Payments routes */}
      <Route path="/payments" element={
        isAuthenticated ? <Layout><PaymentsPage /></Layout> : <Navigate to="/login" />
      } />
      <Route path="/admin" element={
        <AdminRoute>
          <Layout><AdminDashboard /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/referrals" element={
        <AdminRoute>
          <Layout><ReferralAdminPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/test" element={
        <AdminRoute>
          <Layout><AdminTestsPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <Layout><UsersPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/gestione-servizi" element={
        <AdminRoute>
          <Layout><TaxonomyPage /></Layout>
        </AdminRoute>
      } />
      {/* LEGACY: Per compatibilità */}
      <Route path="/admin/taxonomy" element={
        <AdminRoute>
          <Layout><TaxonomyPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/ai" element={
        <AdminRoute>
          <Layout><AiManagement /></Layout>
        </AdminRoute>
      } />
      
      {/* SISTEMA AI DUALE - Added 15/01/2025 */}
      <Route path="/admin/ai-duale" element={
        <SuperAdminRoute>
          <Layout><AIDualeDashboard /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/settings" element={
        <AdminRoute>
          <Layout><SettingsPage /></Layout>
        </AdminRoute>
      } />
      
      {/* NUOVO: Route per creazione richieste per conto clienti */}
      <Route path="/admin/requests/create-for-client" element={
        <AdminRoute>
          <Layout><CreateRequestForClient /></Layout>
        </AdminRoute>
      } />
      
      {/* NUOVO: Sistema Notifiche Professionale (SUPER_ADMIN only) */}
      <Route path="/admin/notifications" element={
        <SuperAdminRoute>
          <Layout><NotificationDashboard /></Layout>
        </SuperAdminRoute>
      } />
      
      {/* NUOVO: Sistema Backup Professionale (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/backup" element={
        <AdminRoute>
          <Layout><SimpleBackupPage /></Layout>
        </AdminRoute>
      } />
      
      {/* NUOVO: Script Manager (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/scripts" element={
        <AdminRoute>
          <Layout><ScriptManager /></Layout>
        </AdminRoute>
      } />
      
      {/* NUOVO: Script Configuration Manager (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/scripts/config" element={
        <AdminRoute>
          <Layout><ScriptConfigurationManager /></Layout>
        </AdminRoute>
      } />
      
      {/* SISTEMA MODULI - Added 05/10/2025 (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/modules" element={
        <AdminRoute>
          <Layout><ModuleManager /></Layout>
        </AdminRoute>
      } />
      
      {/* SISTEMA SMARTDOCS - Added 24/10/2025 (SUPER_ADMIN only) */}
      <Route path="/admin/smartdocs" element={
        <SuperAdminRoute>
          <Layout><SmartDocsDashboard /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/smartdocs/settings" element={
        <SuperAdminRoute>
          <Layout><SmartDocsSettings /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/smartdocs/test-lab" element={
        <SuperAdminRoute>
          <Layout><SmartDocsTestLab /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/smartdocs/sync-settings" element={
        <SuperAdminRoute>
          <Layout><SmartDocsSyncSettings /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/smartdocs/storage" element={
        <SuperAdminRoute>
          <Layout><SmartDocsStorageDashboard /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/smartdocs/sync-monitor" element={
        <SuperAdminRoute>
          <Layout><SmartDocsSyncMonitor /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/smartdocs/system-status" element={
        <SuperAdminRoute>
          <Layout><SmartDocsSystemStatus /></Layout>
        </SuperAdminRoute>
      } />
      
      {/* SISTEMA RECENSIONI - Added 15/10/2025 (ADMIN e SUPER_ADMIN) */}
      {/* Versione Avanzata */}
      <Route path="/admin/reviews-system-config" element={
        <AdminRoute>
          <Layout><ReviewSystemConfigPage /></Layout>
        </AdminRoute>
      } />
      {/* SISTEMA AUDIT LOG - Added 07/01/2025 (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/audit" element={
        <AdminRoute>
          <Layout><AuditDashboard /></Layout>
        </AdminRoute>
      } />
      
      {/* ONBOARDING ANALYTICS - usa audit logs (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/onboarding/analytics" element={
        <AdminRoute>
          <Layout><OnboardingAnalyticsPage /></Layout>
        </AdminRoute>
      } />
      {/* ONBOARDING MANAGEMENT - configurazione tutorial e checklist (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/onboarding/tutorials" element={
        <AdminRoute>
          <Layout><OnboardingAnalyticsPage /></Layout>
        </AdminRoute>
      } />
      
      {/* SISTEMA CUSTOM FORMS - Added 15/01/2025 (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/custom-forms" element={
        <AdminRoute>
          <Layout><CustomFormManager /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/custom-forms/new" element={
        <AdminRoute>
          <Layout><CustomFormPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/custom-forms/:id" element={
        <AdminRoute>
          <Layout><CustomFormPage /></Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/health" element={
        <AdminRoute>
          <Layout><HealthCheckDashboard /></Layout>
        </AdminRoute>
      } />
      
      {/* SYSTEM STATUS PAGE - Dettagli servizi monitorati */}
      <Route path="/admin/system-status" element={
        <AdminRoute>
          <Layout><SystemStatusPage /></Layout>
        </AdminRoute>
      } />

      {/* SYSTEM STATUS PAGE (accessibile a tutti gli utenti autenticati) */}
      <Route path="/system-status" element={
        isAuthenticated ? <Layout><SystemStatusPage /></Layout> : <Navigate to="/login" />
      } />
      
      {/* GEOCODING TOOL - Tool per testare geocodifica indirizzi */}
      <Route path="/admin/geocoding" element={
        <AdminRoute>
          <Layout><GeocodingToolPage /></Layout>
        </AdminRoute>
      } />
      
      {/* SISTEMA GESTIONE DOCUMENTI CONFIGURABILE - Added 19/01/2025 */}
      <Route path="/admin/document-management" element={
        <SuperAdminRoute>
          <Layout><DocumentManagementPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/types" element={
        <SuperAdminRoute>
          <Layout><DocumentTypesPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/types-extended" element={
        <SuperAdminRoute>
          <Layout><ExtendedDocumentTypesPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/unified" element={
        <SuperAdminRoute>
          <Layout><UnifiedDocumentsDashboard /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/categories" element={
        <SuperAdminRoute>
          <Layout><DocumentCategoriesPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/workflows" element={
        <SuperAdminRoute>
          <Layout><ApprovalWorkflowsPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/ui-config" element={
        <SuperAdminRoute>
          <Layout><UIConfigPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/system-config" element={
        <SuperAdminRoute>
          <Layout><SystemConfigPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/permissions" element={
        <SuperAdminRoute>
          <Layout><DocumentPermissionsPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/notifications" element={
        <SuperAdminRoute>
          <Layout><DocumentNotificationsPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/document-management/fields" element={
        <SuperAdminRoute>
          <Layout><DocumentFieldsPage /></Layout>
        </SuperAdminRoute>
      } />
      
      {/* SISTEMA DOCUMENTI LEGALI - Added 17/09/2025 */}
      <Route path="/admin/legal-documents" element={
        <AdminRoute>
          <Layout><LegalDocumentsPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/acceptances" element={
        <AdminRoute>
          <Layout><LegalAcceptancesPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/analytics" element={
        <AdminRoute>
          <Layout><LegalAnalyticsPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/editor" element={
        <AdminRoute>
          <Layout><LegalDocumentEditor /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/templates" element={
        <AdminRoute>
          <Layout><LegalTemplatesPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/new" element={
        <AdminRoute>
          <Layout><LegalDocumentFormPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/:id/versions/new" element={
        <AdminRoute>
          <Layout><LegalDocumentVersionForm /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/:id/new-version" element={
        <AdminRoute>
          <Layout><LegalDocumentVersionForm /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/:id" element={
        <AdminRoute>
          <Layout><LegalDocumentDetailPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/legal-documents/:id/:action" element={
        <AdminRoute>
          <Layout><LegalDocumentFormPage /></Layout>
        </AdminRoute>
      } />
      
      {/* API Keys management routes */}
      <Route path="/admin/api-keys" element={
        <AdminRoute>
          <Layout><ApiKeysOverview /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/google-calendar" element={
        <AdminRoute>
          <Layout><GoogleCalendarConfig /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/google-maps" element={
        <AdminRoute>
          <Layout><GoogleMapsConfig /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/stripe" element={
        <AdminRoute>
          <Layout><StripeConfig /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/brevo" element={
        <AdminRoute>
          <Layout><BrevoConfig /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/openai" element={
        <AdminRoute>
          <Layout><OpenAIConfig /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/tinymce" element={
        <AdminRoute>
          <Layout><TinyMCEConfig /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/whatsapp" element={
        <AdminRoute>
          <Layout><WhatsAppConfig /></Layout>
        </AdminRoute>
      } />
      
      {/* Professional Management routes */}
      <Route path="/admin/professionals" element={
        <AdminRoute>
          <Layout><ProfessionalsList /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/professionals/:professionalId" element={
        isAuthenticated ? <Layout><ProfessionalRouteWrapper /></Layout> : <Navigate to="/login" />
      }>
        <Route index element={<Navigate to="competenze" replace />} />
        <Route path="competenze" element={<ProfessionalCompetenze />} />
        <Route path="tariffe" element={<ProfessionalTariffe />} />
        <Route path="skills" element={<ProfessionalSkills />} />
      </Route>
      
      {/* WhatsApp Manager - NUOVO Sistema Completo */}
      <Route path="/admin/whatsapp" element={
        <AdminRoute>
          <Layout><WhatsAppWPPManager /></Layout>
        </AdminRoute>
      } />
      
      {/* WhatsApp Messages - Visualizzazione messaggi WPPConnect */}
      <Route path="/admin/whatsapp/messages" element={
        <AdminRoute>
          <Layout><WhatsAppMessages /></Layout>
        </AdminRoute>
      } />
      
      {/* WhatsApp Contacts - Gestione contatti WhatsApp */}
      <Route path="/admin/whatsapp/contacts" element={
        <AdminRoute>
          <Layout><WhatsAppContacts /></Layout>
        </AdminRoute>
      } />
      

      {/* Knowledge Base Routes */}
      <Route path="/kb" element={
        <Layout><KnowledgeBase /></Layout>
      } />
      <Route path="/admin/kb" element={
        <AdminRoute>
          <Layout><KnowledgeBase /></Layout>
        </AdminRoute>
      } />
      
      {/* System Configuration routes (SUPER_ADMIN only) */}
      <Route path="/admin/system-enums" element={
        <SuperAdminRoute>
          <Layout><SystemEnumsPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/system-settings" element={
        <SuperAdminRoute>
          <Layout><SystemSettingsPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/image-config" element={
        <SuperAdminRoute>
          <Layout><ImageConfigPage /></Layout>
        </SuperAdminRoute>
      } />
      {/* TEMP: Test route */}
      <Route path="/admin/system-settings-test" element={
        <SuperAdminRoute>
          <Layout><SystemSettingsTestPage /></Layout>
        </SuperAdminRoute>
      } />
      <Route path="/admin/system-settings-simple" element={
        <SuperAdminRoute>
          <Layout><SystemSettingsSimplePage /></Layout>
        </SuperAdminRoute>
      } />
      
      {/* 🧪 TEST: Pagina test certificazioni */}
      <Route path="/test/certifications" element={
        isAuthenticated
          ? <Layout><TestCertificationsPage /></Layout>
          : <Navigate to="/login" />
      } />
      
      {/* 🧪 TEST: Pagina test Sistema Bozze */}
      <Route path="/test/drafts" element={
        isAuthenticated
          ? <Layout><TestDraftSystem /></Layout>
          : <Navigate to="/login" />
      } />
      
      {/* 🧪 TEST: Pagina test Celebrazioni */}
      <Route path="/test/celebrations" element={
        isAuthenticated
          ? <Layout><TestCelebrationsPage /></Layout>
          : <Navigate to="/login" />
      } />
      
      {/* NUOVO: Sistema Rapporti Intervento - Professional Routes */}
      <Route path="/professional/reports" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ProfessionalReportsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      <Route path="/professional/reports/list" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ReportsListPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      <Route path="/professional/reports/new" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><NewReportPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* NUOVE ROUTE AGGIUNTE - Pagine Rapporti Professionali */}
      <Route path="/professional/reports/phrases" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ProfessionalPhrasesPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      <Route path="/professional/reports/materials" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ProfessionalMaterialsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      <Route path="/professional/reports/templates" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ProfessionalTemplatesPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      <Route path="/professional/reports/settings" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ProfessionalSettingsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Professional Custom Forms Management */}
      {/* Professional Custom Forms - Nuova versione */}
      <Route path="/professional/custom-forms" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ProfessionalCustomFormsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Professional Custom Forms - Nuovo form */}
      <Route path="/professional/custom-forms/new" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><CustomFormPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Professional Custom Forms - Modifica Form Specifico */}
      <Route path="/professional/custom-forms/:formId" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><CustomFormPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Professional SmartDocs - I Miei Container */}
      <Route path="/professional/smartdocs" element={
        isAuthenticated && (user?.role === 'PROFESSIONAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          ? <Layout><ProfessionalSmartDocsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Knowledge Base - Tutti gli utenti */}
      <Route path="/my-documents" element={
        isAuthenticated
          ? <Layout><MyKnowledgeBase /></Layout>
          : <Navigate to="/login" />
      } />
      
      {/* Upload Documents - Tutti gli utenti */}
      <Route path="/my-documents/upload" element={
        isAuthenticated
          ? <Layout><MyDocumentsUpload /></Layout>
          : <Navigate to="/login" />
      } />
      
      {/* SmartDocs Preferences - Tutti gli utenti */}
      <Route path="/settings/smartdocs" element={
        isAuthenticated
          ? <Layout><SmartDocsPreferences /></Layout>
          : <Navigate to="/login" />
      } />
      
      {/* Client Legal Documents Dashboard */}
      <Route path="/my-legal-documents" element={
        isAuthenticated && user?.role === 'CLIENT'
          ? <Layout><ClientLegalDocuments /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Professional Legal Documents Dashboard */}
      <Route path="/professional/legal-documents" element={
        isAuthenticated && user?.role === 'PROFESSIONAL'
          ? <Layout><ProfessionalLegalDocuments /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Client Report Routes */}
      <Route path="/client/reports" element={
        isAuthenticated && user?.role === 'CLIENT'
          ? <Layout><ClientReportsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      <Route path="/client/reports/:id" element={
        isAuthenticated && user?.role === 'CLIENT'
          ? <Layout><ClientReportDetailPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Client Custom Forms */}
      <Route path="/client/custom-forms" element={
        isAuthenticated && user?.role === 'CLIENT'
          ? <Layout><ClientCustomFormsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Client SmartDocs - I Miei Container */}
      <Route path="/client/smartdocs" element={
        isAuthenticated && user?.role === 'CLIENT'
          ? <Layout><ClientSmartDocsPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* SISTEMA REFERRAL - Added 05/10/2025 */}
      <Route path="/referrals" element={
        isAuthenticated 
          ? <Layout><ReferralPage /></Layout>
          : <Navigate to="/login" />
      } />
      
      {/* Professional routes - Also accessible by admins */}
      <Route path="/professional/available-requests" element={
        isAuthenticated && user?.role === 'PROFESSIONAL' 
          ? <Layout><AvailableRequests /></Layout>
          : <Navigate to="/dashboard" />
      } />
      <Route path="/professional/skills" element={
        isAuthenticated ? (
          user?.role === 'PROFESSIONAL' 
            ? <Layout><ProfessionalSkillsRedirect /></Layout>
            : <Layout><ProfessionalLayout /></Layout>
        ) : <Navigate to="/login" />
      } />
      <Route path="/professional/calendar" element={
        isAuthenticated && user?.role === 'PROFESSIONAL' 
          ? <Layout><ProfessionalCalendarPage /></Layout>
          : <Navigate to="/dashboard" />
      } />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </GoogleMapsProvider>
  );
}
