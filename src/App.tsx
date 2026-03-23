import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

// Eager: homepage + library (most visited, public)
import Index from "./pages/Index.tsx";
import Library from "./pages/Library.tsx";

// Lazy: all other pages
const BookPage = lazy(() => import("./pages/BookPage.tsx"));
const SummaryPage = lazy(() => import("./pages/SummaryPage.tsx"));
const AuthorPage = lazy(() => import("./pages/AuthorPage.tsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.tsx"));
const TagPage = lazy(() => import("./pages/TagPage.tsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.tsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.tsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.tsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ChiSiamo = lazy(() => import("./pages/ChiSiamo.tsx"));

// SEO content pages
const CharactersPage = lazy(() => import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.CharactersPage })));
const QuotesPage = lazy(() => import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.QuotesPage })));
const AnalysisPage = lazy(() => import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.AnalysisPage })));
const ChaptersPage = lazy(() => import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.ChaptersPage })));
const ThemesPage = lazy(() => import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.ThemesPage })));
const HistoricalContextPage = lazy(() => import("./pages/SEOContentPage.tsx").then((m) => ({ default: m.HistoricalContextPage })));

// Education pages
const SchoolSummaryPage = lazy(() => import("./pages/EducationPage.tsx").then((m) => ({ default: m.SchoolSummaryPage })));
const SchoolAnalysisPage = lazy(() => import("./pages/EducationPage.tsx").then((m) => ({ default: m.SchoolAnalysisPage })));
const CharactersExplainedPage = lazy(() => import("./pages/EducationPage.tsx").then((m) => ({ default: m.CharactersExplainedPage })));

// Alphabetical index pages
const BooksAlphabeticalPage = lazy(() => import("./pages/AlphabeticalPages.tsx").then((m) => ({ default: m.BooksAlphabeticalPage })));
const AuthorsAlphabeticalPage = lazy(() => import("./pages/AlphabeticalPages.tsx").then((m) => ({ default: m.AuthorsAlphabeticalPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
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

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public pages */}
                  <Route path="/" element={<Index />} />
                  <Route path="/biblioteca" element={<Library />} />
                  <Route path="/chi-siamo" element={<ChiSiamo />} />
                  <Route path="/accedi" element={<LoginPage />} />
                  <Route path="/registrazione" element={<RegisterPage />} />
                  <Route path="/password-dimenticata" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Book pages - public access, content gated inside component */}
                  <Route path="/libri/:slug" element={<BookPage />} />
                  <Route path="/libro/:slug" element={<BookPage />} />

                  {/* Public browsing pages */}
                  <Route path="/autore/:name" element={<AuthorPage />} />
                  <Route path="/author/:name" element={<AuthorPage />} />
                  <Route path="/categoria/:slug" element={<CategoryPage />} />
                  <Route path="/tag/:slug" element={<TagPage />} />
                  <Route path="/libri-:letter" element={<BooksAlphabeticalPage />} />
                  <Route path="/autori-:letter" element={<AuthorsAlphabeticalPage />} />

                  {/* Protected: full content pages (require auth) */}
                  <Route path="/riassunto/:slug" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
                  <Route path="/personaggi/:slug" element={<ProtectedRoute><CharactersPage /></ProtectedRoute>} />
                  <Route path="/citazioni/:slug" element={<ProtectedRoute><QuotesPage /></ProtectedRoute>} />
                  <Route path="/analisi/:slug" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
                  <Route path="/capitoli/:slug" element={<ProtectedRoute><ChaptersPage /></ProtectedRoute>} />
                  <Route path="/temi/:slug" element={<ProtectedRoute><ThemesPage /></ProtectedRoute>} />
                  <Route path="/contesto-storico/:slug" element={<ProtectedRoute><HistoricalContextPage /></ProtectedRoute>} />
                  <Route path="/riassunto-scuola/:slug" element={<ProtectedRoute><SchoolSummaryPage /></ProtectedRoute>} />
                  <Route path="/analisi-scolastica/:slug" element={<ProtectedRoute><SchoolAnalysisPage /></ProtectedRoute>} />
                  <Route path="/personaggi-spiegati/:slug" element={<ProtectedRoute><CharactersExplainedPage /></ProtectedRoute>} />

                  {/* Admin */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
