import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Lazy load agent portal pages
const AgentLayout = lazy(() => import('../layouts/AgentLayout'));
const AgentDashboard = lazy(() => import('../pages/agent/Dashboard'));
const AgentCustomers = lazy(() => import('../pages/agent/Customers'));
const AgentQuoteRequests = lazy(() => import('../pages/agent/QuoteRequests'));
const AgentBookings = lazy(() => import('../pages/agent/Bookings'));
const RequestQuote = lazy(() => import('../pages/agent/RequestQuote'));
const AgentSubUsers = lazy(() => import('../pages/agent/SubUsers'));

/**
 * Agent Portal Routes
 * Protected routes for users with 'agent' role
 */
const agentRoutes = {
  path: '/agent',
  element: <AgentLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="/agent/dashboard" replace />,
    },
    {
      path: 'dashboard',
      element: <AgentDashboard />,
    },
    {
      path: 'customers',
      element: <AgentCustomers />,
    },
    {
      path: 'quotes',
      element: <AgentQuoteRequests />,
    },
    {
      path: 'quotes/new',
      element: <RequestQuote />,
    },
    {
      path: 'bookings',
      element: <AgentBookings />,
    },
    {
      path: 'sub-users',
      element: <AgentSubUsers />,
    },
  ],
};

export default agentRoutes;
