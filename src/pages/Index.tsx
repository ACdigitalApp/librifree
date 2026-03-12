import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const Index = () => {
  const { t } = useLanguage();

  return (
    <main className="min-h-svh flex flex-col">
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 max-w-[1280px] mx-auto w-full">
        <span className="text-sm font-semibold tracking-tight">Librifree</span>
        <LanguageSelector />
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
        <h1 className="font-semibold text-4xl md:text-5xl lg:text-6xl text-foreground tracking-tight max-w-3xl" style={{ textWrap: "balance" }}>
          {t("heroTitle")}
        </h1>
        <p className="mt-4 max-w-xl text-base md:text-lg text-muted-foreground">
          {t("heroSubtitle")}
        </p>
        <Link
          to="/biblioteca"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          {t("enterLibrary")}
        </Link>
      </div>
    </main>
  );
};

export default Index;
