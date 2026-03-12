import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Index from "./pages/Index.tsx";
import Library from "./pages/Library.tsx";
import BookPage from "./pages/BookPage.tsx";
import SummaryPage from "./pages/SummaryPage.tsx";
import AuthorPage from "./pages/AuthorPage.tsx";
import { CharactersPage, QuotesPage, AnalysisPage, ChaptersPage } from "./pages/SEOContentPage.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
