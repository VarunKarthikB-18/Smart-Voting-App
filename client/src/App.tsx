import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import VotePage from "@/pages/vote";
import ResultsPage from "@/pages/results";
import InfoPage from "@/pages/info";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={VotePage} />
        <Route path="/results" component={ResultsPage} />
        <Route path="/info" component={InfoPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
