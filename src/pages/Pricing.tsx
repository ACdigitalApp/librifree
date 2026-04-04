import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, X, Zap, BookOpen, Clock, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const FEATURES = [
  { label: "Lettura libri classici completi", free: true, premium: true },
  { label: "Riassunti", free: false, premium: true },
  { label: "Analisi letteraria", free: false, premium: true },
  { label: "Personaggi", free: false, premium: true },
  { label: "Citazioni", free: false, premium: true },
  { label: "Temi del libro", free: false, premium: true },
  { label: "Contesto storico", free: false, premium: true },
  { label: "Contenuti per la scuola", free: false, premium: true },
  { label: "Segnalibri avanzati", free: false, premium: true },
  { label: "Nessuna pubblicità", free: false, premium: true },
  { label: "Supporto prioritario", free: false, premium: true },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const { user, isPremium, isInTrial, trialDaysRemaining } = useAuth();

  const monthlyPrice = 2.99;
  const annualPrice = 19.99;
  const annualMonthlyEquiv = (annualPrice / 12).toFixed(2);
  const annualSavingPercent = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);

  return (
    <>
      <Helmet>
        <title>Piani e Prezzi – Librifree</title>
        <meta name="description" content="Scegli il piano Librifree. Trial gratuito di 30 giorni, poi Free o Premium con riassunti, analisi e molto altro." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="border-b border-border/40 py-4 px-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Torna alla home
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6">

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Piani e Prezzi
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Scegli il tuo piano
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sblocca tutto il potenziale di Librifree. Accedi a riassunti, analisi letterarie,
              personaggi e molto altro per i migliori classici della letteratura.
            </p>
          </div>

          {/* Trial Banner */}
          {!user && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-4 mb-10 max-w-2xl mx-auto">
              <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  30 giorni di prova Premium gratuita
                </p>
                <p className="text-sm text-muted-foreground">
                  Nessuna carta di credito richiesta. Accedi a tutte le funzionalità Premium per un mese intero.
                </p>
              </div>
            </div>
          )}

          {/* In-trial banner */}
          {user && isInTrial && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-4 mb-10 max-w-2xl mx-auto">
              <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Sei nel periodo di prova Premium
                </p>
                <p className="text-sm text-muted-foreground">
                  Hai ancora {trialDaysRemaining} giorn{trialDaysRemaining === 1 ? "o" : "i"} di trial gratuito.
                  Passa a Premium per continuare ad avere accesso illimitato.
                </p>
              </div>
            </div>
          )}

          {/* Already premium banner */}
          {user && isPremium && !isInTrial && (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-6 py-4 mb-10 max-w-2xl mx-auto">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <p className="font-semibold text-primary">
                Hai già un abbonamento Premium attivo. Grazie per il tuo supporto!
              </p>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensile
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "annual"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuale
              <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                -{annualSavingPercent}%
              </span>
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">

            {/* Free Card */}
            <div className="relative rounded-2xl border border-border bg-card p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Free</h2>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold">€0</span>
                </div>
                <p className="text-sm text-muted-foreground">Per sempre gratuito</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Lettura libri classici completi</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Riassunti e analisi</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Personaggi e citazioni</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Contenuti per la scuola</span>
                </li>
              </ul>

              {user ? (
                <div className="w-full py-3 rounded-xl border border-border text-center text-sm text-muted-foreground font-medium">
                  Piano attuale
                </div>
              ) : (
                <Link
                  to="/registrazione"
                  className="block w-full py-3 rounded-xl border border-border text-center text-sm font-medium hover:bg-accent transition-colors"
                >
                  Inizia gratis
                </Link>
              )}
            </div>

            {/* Premium Card */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-lg shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  CONSIGLIATO
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Premium</h2>
                </div>
                {billingCycle === "monthly" ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold">€{monthlyPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground text-sm">/mese</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Fatturazione mensile</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold">€{annualMonthlyEquiv}</span>
                      <span className="text-muted-foreground text-sm">/mese</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      €{annualPrice.toFixed(2)} fatturati annualmente
                      <span className="ml-2 text-emerald-500 font-semibold">Risparmi {annualSavingPercent}%</span>
                    </p>
                  </>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Lettura libri classici completi</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Riassunti completi</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Analisi letteraria approfondita</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Schede personaggi</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Citazioni memorabili</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Temi principali del libro</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Contesto storico e culturale</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Contenuti per la scuola</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Segnalibri avanzati</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Nessuna pubblicità</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Supporto prioritario</span>
                </li>
              </ul>

              {user ? (
                <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  {billingCycle === "monthly"
                    ? `Abbonati a €${monthlyPrice.toFixed(2)}/mese`
                    : `Abbonati a €${annualPrice.toFixed(2)}/anno`}
                </button>
              ) : (
                <Link
                  to="/registrazione"
                  className="block w-full py-3 rounded-xl bg-primary text-primary-foreground text-center text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Inizia il trial gratuito di 30 giorni
                </Link>
              )}
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Confronto completo delle funzionalità</h2>

            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 px-6 py-3 text-sm font-semibold text-muted-foreground border-b border-border">
                <div>Funzionalità</div>
                <div className="text-center">Free</div>
                <div className="text-center text-primary">Premium</div>
              </div>

              {FEATURES.map((feature, index) => (
                <div
                  key={feature.label}
                  className={`grid grid-cols-3 px-6 py-4 text-sm items-center ${
                    index !== FEATURES.length - 1 ? "border-b border-border/50" : ""
                  } ${index % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <div className="font-medium">{feature.label}</div>
                  <div className="flex justify-center">
                    {feature.free ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    {feature.premium ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ / Note */}
          <div className="mt-16 text-center text-sm text-muted-foreground max-w-xl mx-auto space-y-2">
            <p>Il trial di 30 giorni inizia automaticamente alla registrazione, senza carta di credito.</p>
            <p>Puoi disdire l'abbonamento in qualsiasi momento dal tuo profilo.</p>
            <p>
              Hai domande?{" "}
              <Link to="/chi-siamo" className="text-primary underline underline-offset-2">
                Contattaci
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
