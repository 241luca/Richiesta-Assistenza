import { Routes, Route, Navigate } from 'react-router-dom';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from './hooks/useAuth';
// import { GoogleMapsProvider } from './contexts/GoogleMapsContext'; // TEMPORANEAMENTE DISABILITATO
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
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoriesPage from './pages/admin/CategoriesPage';
import SubcategoriesPage from './pages/admin/SubcategoriesPage';
import { AiConfigPage } from "./pages/admin/AiConfigPage";
import { AiManagement } from "./pages/admin/AiManagement";
import SettingsPage from './pages/admin/SettingsPage';
// NEW: Import new admin pages
import SystemEnumsPage from './pages/admin/SystemEnumsPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
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
import WhatsAppConfig from './pages/admin/api-keys/WhatsAppConfig';

// WhatsApp and Knowledge Base imports
import WhatsAppManager from './components/admin/whatsapp/WhatsAppManagerV2';
import { WhatsAppAdminPage } from './pages/admin/WhatsAppAdmin';  // NUOVO
import WhatsAppDashboard from './pages/admin/WhatsAppDashboard';  // NUOVO - Dashboard messaggi
import WhatsAppSettings from './pages/admin/WhatsAppSettings';  // NUOVO - Impostazioni WhatsApp
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

// SISTEMA HEALTH CHECK - Added 07/01/2025
import HealthCheckDashboard from './pages/admin/HealthCheckDashboard';

// SISTEMA AI DUALE - Added 15/01/2025
import AIDualeDashboard from './pages/admin/AIDualeDashboard';
import ProfessionCategoriesPage from './pages/admin/ProfessionCategoriesPage';
import ReportsListPage from './pages/professional/reports/list';
import NewReportPage from './pages/professional/reports/new';
import ProfessionalPhrasesPage from './pages/professional/reports/phrases';
import ProfessionalMaterialsPage from './pages/professional/reports/materials';
import ProfessionalTemplatesPage from './pages/professional/reports/templates';
import ProfessionalSettingsPage from './pages/professional/reports/settings';
import ClientReportsPage from './pages/client/reports/index';
import ClientReportDetailPage from './pages/client/reports/detail';
import RequestChat from './pages/requests/RequestChat';

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
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      
      {/* Registration routes - Updated with new flow */}
      <Route path="/register" element={!isAuthenticated ? <RegisterChoicePage /> : <Navigate to="/dashboard" />} />
      <Route path="/register/client" element={!isAuthenticated ? <RegisterClientPage /> : <Navigate to="/dashboard" />} />
      <Route path="/register/professional" element={!isAuthenticated ? <RegisterProfessionalPageV2 /> : <Navigate to="/dashboard" />} />
      
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
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <Layout><AdminDashboard /></Layout>
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
      <Route path="/admin/categories" element={
        <AdminRoute>
          <Layout><CategoriesPage /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/subcategories" element={
        <AdminRoute>
          <Layout><SubcategoriesPage /></Layout>
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
      
      {/* SISTEMA AUDIT LOG - Added 07/01/2025 (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/audit" element={
        <AdminRoute>
          <Layout><AuditDashboard /></Layout>
        </AdminRoute>
      } />
      
      {/* SISTEMA HEALTH CHECK - Added 07/01/2025 (ADMIN e SUPER_ADMIN) */}
      <Route path="/admin/health" element={
        <AdminRoute>
          <Layout><HealthCheckDashboard /></Layout>
        </AdminRoute>
      } />
      
      {/* API Keys management routes */}
      <Route path="/admin/api-keys" element={
        <AdminRoute>
          <Layout><ApiKeysOverview /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/api-keys/google-maps" element={
        <AdminRoute>
          <Layout><GoogleMapsConfig /></Layout>
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
      <Route path="/admin/api-keys/whatsapp" element={
        <AdminRoute>
          <Layout><WhatsAppConfig /></Layout>
        </AdminRoute>
      } />
      
      {/* Profession Categories Management (SUPER_ADMIN only) */}
      <Route path="/admin/profession-categories" element={
        <SuperAdminRoute>
          <Layout><ProfessionCategoriesPage /></Layout>
        </SuperAdminRoute>
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
          <Layout><WhatsAppAdminPage /></Layout>
        </AdminRoute>
      } />
      
      {/* WhatsApp Dashboard - Visualizzazione messaggi */}
      <Route path="/admin/whatsapp/dashboard" element={
        <AdminRoute>
          <Layout><WhatsAppDashboard /></Layout>
        </AdminRoute>
      } />
      
      {/* WhatsApp Settings - Impostazioni sistema */}
      <Route path="/admin/whatsapp/settings" element={
        <AdminRoute>
          <Layout><WhatsAppSettings /></Layout>
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
      
      {/* NUOVO: Sistema Rapporti Intervento - Client Routes */}
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
  );
}