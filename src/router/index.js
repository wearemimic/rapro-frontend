// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import Dashboard from '@/views/Dashboard.vue'
import UserProfile from '@/views/UserProfile.vue'
import Register from '@/views/Register.vue'
import Login from '@/views/Login.vue'
import ClientList from '@/views/ClientList.vue'
import ClientsCreate from '@/views/ClientCreate.vue'
import ScenarioDetail from '@/views/ScenarioDetail.vue'
// import ScenarioDetail from '@/views/ScenarioDetailRefactored.vue' // TESTING: Refactored version for Safari fix
import UserManagement from '@/views/UserManagement.vue'
import ComparisonReport from '@/views/ComparisonReport.vue'

// Client Portal Components
import ClientPortalHome from '@/views/ClientPortal/ClientPortalHome.vue'
import ClientDashboard from '@/views/ClientPortal/ClientDashboard.vue'
import ClientPortalDocuments from '@/views/ClientPortal/ClientPortalDocuments.vue'
import ClientPortalMessages from '@/views/ClientPortal/ClientPortalMessages.vue'
import ClientPortalAppointments from '@/views/ClientPortal/ClientPortalAppointments.vue'
import ClientPortalScenarios from '@/views/ClientPortal/ClientPortalScenarios.vue'


const routes = [
  { path: '/register', name: 'Register', component: Register },
  { path: '/login', name: 'Login', component: Login },
  { path: '/auth/callback', name: 'Auth0Callback', component: () => import('@/views/Auth0CallbackSimple.vue') },
  { path: '/auth/success', name: 'Auth0Success', component: () => import('@/views/Auth0Success.vue') },
  { path: '/auth0-debug', name: 'Auth0Debug', component: () => import('@/views/Auth0Debug.vue') },
  { path: '/callback-debug', name: 'CallbackDebug', component: () => import('@/views/CallbackDebug.vue') },

  // NSSA/Kajabi Password Setup (accessible without authentication)
  {
    path: '/nssa/setup-password',
    name: 'NSSAPasswordSetup',
    component: () => import('@/views/NSSAPasswordSetup.vue')
  },

  // Legal pages - accessible without authentication
  { path: '/privacy-policy', name: 'PrivacyPolicy', component: () => import('@/views/PrivacyPolicy.vue') },
  { path: '/terms', name: 'TermsConditions', component: () => import('@/views/TermsConditions.vue') },

  // Client Portal Login (separate from advisor login)
  {
    path: '/portal/login',
    name: 'ClientPortalLogin',
    component: () => import('@/views/ClientPortalLogin.vue')
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
      { path: 'profile', name: 'UserProfile', component: UserProfile, meta: { requiresAuth: true } },
      { path: 'billing', name: 'Billing', component: () => import('@/views/Billing.vue'), meta: { requiresAuth: true } },
      { path: 'clients', name: 'Clients', component: ClientList, meta: { requiresAuth: true } },
      { path: 'clients/create', name: 'ClientsCreate', component: ClientsCreate, meta: { requiresAuth: true } },
      { path: 'clients/:id', name: 'ClientDetail', component: () => import('@/views/ClientDetail.vue'), meta: { requiresAuth: true } },
      { path: 'clients/:id/edit', name: 'ClientEdit', component: () => import('@/views/ClientEdit.vue'), meta: { requiresAuth: true } },
      { path: 'clients/:id/comparison-report', name: 'ComparisonReport', component: ComparisonReport, meta: { requiresAuth: true } },
      { path: 'clients/:id/scenarios/new', name: 'ScenarioCreate', component: () => import('@/views/ScenarioCreate.vue'), meta: { requiresAuth: true }, props: true },
      { path: 'clients/:id/scenarios/detail/:scenarioid', name: 'ScenarioDetail', component: ScenarioDetail, meta: { requiresAuth: true } },
      { path: 'communication-center', name: 'CommunicationCenter', component: () => import('@/components/CRM/CommunicationCenter.vue'), meta: { requiresAuth: true } },
      { path: 'tasks', name: 'TaskManagement', component: () => import('@/components/TaskDashboard.vue'), meta: { requiresAuth: true } },
      { path: 'calendar', name: 'Calendar', component: () => import('@/components/CRM/CalendarView.vue'), meta: { requiresAuth: true } },
      { path: 'integrations', name: 'Integrations', component: () => import('@/views/Integrations.vue'), meta: { requiresAuth: true } },
      { path: 'users', name: 'UserManagement', component: UserManagement, meta: { requiresAuth: true } },
      { path: 'documents', name: 'DocumentCenter', component: () => import('@/components/DocumentCenter.vue'), meta: { requiresAuth: true } },
      { path: 'activity-test', name: 'ActivityTest', component: () => import('@/views/ActivityTest.vue'), meta: { requiresAuth: true } },
      
      // Report Center Routes
      { path: 'report-center', name: 'ReportCenter', component: () => import('@/views/ReportCenter/ReportCenterDashboard.vue'), meta: { requiresAuth: true } },
      
      // FINRA Compliance Routes
      { path: 'compliance', name: 'ComplianceDashboard', component: () => import('@/views/ComplianceDashboard.vue'), meta: { requiresAuth: true, title: 'FINRA Compliance Dashboard' } },
      { path: 'compliance/audit-trail', name: 'AuditTrail', component: () => import('@/views/Compliance/AuditTrail.vue'), meta: { requiresAuth: true, title: 'Audit Trail' } },
      { path: 'compliance/retention', name: 'DocumentRetention', component: () => import('@/views/Compliance/DocumentRetention.vue'), meta: { requiresAuth: true, title: 'Document Retention' } },
      { path: 'compliance/reports', name: 'ComplianceReports', component: () => import('@/views/Compliance/ComplianceReports.vue'), meta: { requiresAuth: true, title: 'Compliance Reports' } },
      
      // Affiliate Management Routes (Admin Only)
      { path: 'affiliates', name: 'AffiliateList', component: () => import('@/views/affiliate/AffiliateList.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliate-dashboard', name: 'AffiliateAnalytics', component: () => import('@/views/affiliate/AffiliateDashboard.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliate-commissions', name: 'CommissionManagement', component: () => import('@/views/affiliate/CommissionManagement.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliates/:id', name: 'AffiliateDetail', component: () => import('@/views/affiliate/AffiliateDetail.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliates/:id/edit', name: 'AffiliateEdit', component: () => import('@/views/affiliate/AffiliateEdit.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliates/:id/dashboard', name: 'AffiliateDashboard', component: () => import('@/views/affiliate/AffiliateDetail.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliates/:id/links', name: 'AffiliateLinks', component: () => import('@/views/affiliate/AffiliateDetail.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliates/:id/commissions', name: 'AffiliateCommissions', component: () => import('@/views/affiliate/AffiliateDetail.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'affiliates/:id/stripe-connect', name: 'AffiliateStripeConnect', component: () => import('@/views/affiliate/StripeConnectOnboarding.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    ]
  },
  
  // Admin Routes - Require admin access
  {
    path: '/admin',
    component: DefaultLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { 
        path: '', 
        redirect: '/admin/dashboard' 
      },
      { 
        path: 'dashboard', 
        name: 'AdminDashboard', 
        component: () => import('@/views/Admin/AdminDashboard.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true } 
      },
      { 
        path: 'users', 
        name: 'AdminUsers', 
        component: () => import('@/views/Admin/AdminUsers.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'user_management' } 
      },
      { 
        path: 'impersonation', 
        name: 'AdminImpersonation', 
        component: () => import('@/views/Admin/AdminImpersonation.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'user_management' } 
      },
      { 
        path: 'analytics', 
        name: 'AdminAnalytics', 
        component: () => import('@/views/Admin/AdminAnalytics.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'analytics' } 
      },
      { 
        path: 'billing', 
        name: 'AdminBilling', 
        component: () => import('@/views/Admin/AdminBilling.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'billing' } 
      },
      { 
        path: 'monitoring', 
        name: 'AdminMonitoring', 
        component: () => import('@/views/Admin/AdminMonitoring.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'system_monitoring' } 
      },
      { 
        path: 'support', 
        name: 'AdminSupport', 
        component: () => import('@/views/Admin/AdminSupport.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'support_tools' } 
      },
      // Phase 2.3: System Performance Monitoring
      { 
        path: 'performance', 
        name: 'AdminPerformance', 
        component: () => import('@/views/Admin/AdminPerformance.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'system_monitoring' } 
      },
      // Phase 2.4: Support Ticket Management
      { 
        path: 'support/tickets', 
        name: 'AdminSupportTickets', 
        component: () => import('@/views/Admin/AdminSupportTickets.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'support_tools' } 
      },
      { 
        path: 'support/tickets/:ticketId', 
        name: 'AdminSupportTicketDetail', 
        component: () => import('@/views/Admin/AdminSupportTicketDetail.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'support_tools' } 
      },
      // Phase 2.5: Alert & Notification Management
      { 
        path: 'alerts', 
        name: 'AdminAlerts', 
        component: () => import('@/views/Admin/AdminAlerts.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'system_monitoring' } 
      },
      // Phase 3.1: Tax Data Management
      { 
        path: 'tax-data', 
        name: 'AdminTaxData', 
        component: () => import('@/views/Admin/AdminTaxData.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'system_configuration' } 
      },
      // Phase 3.2: Configuration Management
      { 
        path: 'configuration', 
        name: 'AdminConfiguration', 
        component: () => import('@/views/Admin/AdminConfiguration.vue'), 
        meta: { requiresAuth: true, requiresAdmin: true, adminSection: 'system_configuration' } 
      }
    ]
  },
  
  // Client Portal Routes
  {
    path: '/portal',
    component: ClientPortalHome,
    meta: { requiresAuth: true, isClientPortal: true },
    redirect: '/portal/dashboard',
    children: [
      { 
        path: 'dashboard', 
        name: 'client-portal-dashboard', 
        component: () => import('@/views/ClientPortalDashboard.vue'), 
        meta: { requiresAuth: true, isClientPortal: true } 
      },
      { 
        path: 'documents', 
        name: 'client-portal-documents', 
        component: ClientPortalDocuments, 
        meta: { requiresAuth: true, isClientPortal: true } 
      },
      { 
        path: 'messages', 
        name: 'client-portal-messages', 
        component: ClientPortalMessages, 
        meta: { requiresAuth: true, isClientPortal: true } 
      },
      { 
        path: 'appointments', 
        name: 'client-portal-appointments', 
        component: ClientPortalAppointments, 
        meta: { requiresAuth: true, isClientPortal: true } 
      },
      { 
        path: 'scenarios', 
        name: 'client-portal-scenarios', 
        component: ClientPortalScenarios, 
        meta: { requiresAuth: true, isClientPortal: true } 
      }
    ]
  },
  
  // Affiliate Portal Routes
  {
    path: '/affiliate/portal',
    children: [
      { 
        path: 'login', 
        name: 'AffiliatePortalLogin', 
        component: () => import('@/views/affiliate/AffiliatePortalLogin.vue')
      },
      { 
        path: 'dashboard', 
        name: 'AffiliatePortalDashboard', 
        component: () => import('@/views/affiliate/AffiliatePortalDashboard.vue'),
        meta: { requiresAffiliateAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

import { useAuthStore } from '@/stores/auth';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

const app = createApp({});
const pinia = createPinia();
app.use(pinia);

// Helper function to check admin section access
function checkAdminSectionAccess(user, section) {
  // Super admin can access everything
  if (user.admin_role === 'super_admin') {
    return true;
  }
  
  // Define section permissions mapping
  const sectionPermissions = {
    'user_management': ['admin', 'support'],
    'billing': ['admin', 'billing'], 
    'analytics': ['admin', 'analyst'],
    'system_monitoring': ['admin'],
    'support_tools': ['admin', 'support'],
    'system_configuration': ['admin'],  // Tax data management is restricted to admins only
  };
  
  const allowedRoles = sectionPermissions[section] || [];
  return allowedRoles.includes(user.admin_role);
}

router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore();

  // Allow public routes
  const publicRoutes = ['/login', '/register', '/auth/callback', '/auth/success', '/portal/login', '/auth0-debug', '/callback-debug', '/privacy-policy', '/terms'];
  if (publicRoutes.includes(to.path)) {
    console.log('✅ Public route, allowing access');
    next();
    return;
  }

  // Check if route requires auth (check user instead of token - tokens in httpOnly cookies)
  if (to.meta.requiresAuth) {
    // Wait for auth to initialize before checking
    if (!authStore.authInitialized) {
      // Wait for init to complete
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (authStore.authInitialized) {
            clearInterval(check);
            resolve();
          }
        }, 50);
      });
    }

    if (!authStore.user) {
      console.log('⚠️ Route requires auth but no user, redirecting to login');
      next('/login');
      return;
    }
  }
  
  // Check if route requires admin access
  if (to.meta.requiresAdmin) {
    const user = authStore.user;
    
    if (!user?.is_admin_user) {
      console.log('⚠️ Route requires admin access but user is not admin, redirecting to dashboard');
      next('/dashboard');
      return;
    }
    
    // Check specific admin section access if specified
    if (to.meta.adminSection) {
      const canAccess = checkAdminSectionAccess(user, to.meta.adminSection);
      if (!canAccess) {
        console.log(`⚠️ User cannot access admin section: ${to.meta.adminSection}, redirecting to admin dashboard`);
        next('/admin/dashboard');
        return;
      }
    }
  }
  
  next();
});

export default router