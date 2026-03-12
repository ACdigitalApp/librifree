import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/i18n/translations";

const LanguageSelector = () => {
  const { locale, setLocale, t } = useLanguage();

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger className="w-auto gap-2 border-none bg-transparent shadow-none h-9 px-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors focus:ring-0 focus:ring-offset-0">
        <Globe className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="it">{t("italiano")}</SelectItem>
        <SelectItem value="en">{t("english")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
