import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

// Eager: homepage + library (most visited)
import Index from "./pages/Index.tsx";
import Library from "./pages/Library.tsx";

// Lazy: all other pages
const BookPage = lazy(() => import("./pages/BookPage.tsx"));
const SummaryPage = lazy(() => import("./pages/SummaryPage.tsx"));
const AuthorPage = lazy(() => import("./pages/AuthorPage.tsx"));
const SEOContentPage = lazy(() => import("./pages/SEOContentPage.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min cache
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-svh flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// Lazy wrappers for named exports
const CharactersPage = lazy(() =>
  import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.CharactersPage }))
);
const QuotesPage = lazy(() =>
  import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.QuotesPage }))
);
const AnalysisPage = lazy(() =>
  import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.AnalysisPage }))
);
const ChaptersPage = lazy(() =>
  import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.ChaptersPage }))
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/libri/:slug" element={<BookPage />} />
                <Route path="/libro/:slug" element={<BookPage />} />
                <Route path="/riassunto/:slug" element={<SummaryPage />} />
                <Route path="/personaggi/:slug" element={<CharactersPage />} />
                <Route path="/citazioni/:slug" element={<QuotesPage />} />
                <Route path="/analisi/:slug" element={<AnalysisPage />} />
                <Route path="/capitoli/:slug" element={<ChaptersPage />} />
                <Route path="/author/:name" element={<AuthorPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
