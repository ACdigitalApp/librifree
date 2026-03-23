import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";

const AuthHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
        <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
          Librifree
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/biblioteca" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t("library")}
          </Link>
          <Link to="/chi-siamo" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
            Chi siamo
          </Link>
          <LanguageSelector />

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <button
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Esci</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/accedi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Accedi
              </Link>
              <Link to="/registrazione">
                <Button size="sm" className="h-8 text-xs px-3">
                  Inizia Gratis
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AuthHeader;
