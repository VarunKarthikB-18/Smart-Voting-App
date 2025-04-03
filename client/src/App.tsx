import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import VotePage from "@/pages/vote";
import ResultsPage from "@/pages/results";
import InfoPage from "@/pages/info";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Toaster } from "@/components/ui/toaster";

function Router() {
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
      
      {/* Admin route */}
      <ProtectedRoute path="/admin" component={() => (
        <Layout>
          <AdminPage />
        </Layout>
      )} />
      
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
