import React, { useEffect, Component } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import VotePage from "@/pages/vote";
import ResultsPage from "@/pages/results";
import InfoPage from "@/pages/info";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import VerificationFailedPage from "@/pages/verification-failed";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import { Toaster } from "@/components/ui/toaster";
import { initializeFaceApi } from "@/lib/face-api-init";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProfilePage from '@/pages/profile';
import FaceRegistrationPage from '@/pages/face-registration-page';

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Show loading spinner while checking auth state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Only redirect if not on auth page and not logged in
  if (!user && window.location.pathname !== '/auth') {
    console.log('Redirecting to auth page');
    return <Redirect to="/auth" />;
  }

  // If logged in and on auth page, redirect to appropriate page
  if (user && window.location.pathname === '/auth') {
    console.log('User logged in, redirecting to appropriate page');
    if (user.role === 'admin') {
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/" />;
    }
  }

  return (
    <Switch>
      {/* Protected routes that require login */}
      <ProtectedRoute path="/" component={() => (
        <Layout>
          <VotePage />
        </Layout>
      )} />
      <ProtectedRoute path="/results" component={() => (
        <Layout>
          <ResultsPage />
        </Layout>
      )} />
      <ProtectedRoute path="/info" component={() => (
        <Layout>
          <InfoPage />
        </Layout>
      )} />
      
      {/* Profile route */}
      <ProtectedRoute path="/profile" component={() => (
        <Layout>
          <ProfilePage />
        </Layout>
      )} />
      
      {/* Admin route */}
      <ProtectedRoute path="/admin" component={() => (
        <Layout>
          <AdminPage />
        </Layout>
      )} />
      
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Add the face registration route */}
      <ProtectedRoute 
        path="/register-face" 
        component={() => (
          <Layout>
            <FaceRegistrationPage 
              onComplete={() => {
                setLocation('/vote');
              }}
              onCancel={() => {
                window.history.back();
              }}
            />
          </Layout>
        )} 
      />

      {/* Add the verification failed route */}
      <ProtectedRoute 
        path="/verification-failed" 
        component={() => (
          <Layout>
            <VerificationFailedPage />
          </Layout>
        )} 
      />

      {/* Catch-all route for 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('App Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    // Initialize face-api models when the app starts
    initializeFaceApi().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
