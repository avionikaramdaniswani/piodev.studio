import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/home";
import IconsList from "@/pages/icons";
import IconDetail from "@/pages/icons/[slug]";
import ToolsHub from "@/pages/tools";
import SVGOptimizer from "@/pages/tools/svg-optimizer";
import ImageConverter from "@/pages/tools/image-converter";
import ColorConverter from "@/pages/tools/color-converter";
import Base64Tool from "@/pages/tools/base64";
import JsonFormatter from "@/pages/tools/json-formatter";
import CssShadowGenerator from "@/pages/tools/css-shadow-generator";
import FaviconGenerator from "@/pages/tools/favicon-generator";
import GradientGenerator from "@/pages/tools/gradient-generator";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminPage from "@/pages/admin";
import AdminIconsPage from "@/pages/admin/icons";
import AdminUsersPage from "@/pages/admin/users";
import AdminUploadPage from "@/pages/admin/upload";
import AdminCodesPage from "@/pages/admin/codes";
import ProfilPage from "@/pages/profil";
import PlusPage from "@/pages/plus";
import PackDetail from "@/pages/packs/[slug]";
import PacksPage from "@/pages/packs/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const [location] = useLocation();

  if (location.startsWith("/admin")) {
    return (
      <Switch>
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/icons" component={AdminIconsPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/upload" component={AdminUploadPage} />
        <Route path="/admin/codes" component={AdminCodesPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/icons" component={IconsList} />
        <Route path="/icons/:slug" component={IconDetail} />
        <Route path="/tools" component={ToolsHub} />
        <Route path="/tools/svg-optimizer" component={SVGOptimizer} />
        <Route path="/tools/image-converter" component={ImageConverter} />
        <Route path="/tools/color-converter" component={ColorConverter} />
        <Route path="/tools/base64" component={Base64Tool} />
        <Route path="/tools/json-formatter" component={JsonFormatter} />
        <Route path="/tools/css-shadow-generator" component={CssShadowGenerator} />
        <Route path="/tools/favicon-generator" component={FaviconGenerator} />
        <Route path="/tools/gradient-generator" component={GradientGenerator} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profil" component={ProfilPage} />
        <Route path="/plus" component={PlusPage} />
        <Route path="/packs" component={PacksPage} />
        <Route path="/packs/:slug" component={PackDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
