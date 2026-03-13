import { Link } from "react-router-dom";
import LanguageSelector from "@/components/LanguageSelector";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

const ChiSiamo = () => (
  <>
    <SEOHead
      title="Chi siamo – Librifree"
      description="Scopri cos'è Librifree: una biblioteca digitale gratuita con migliaia di libri classici di pubblico dominio, pensata per studenti, insegnanti e appassionati di lettura."
      path="/chi-siamo"
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Chi siamo", url: "/chi-siamo" },
      ]}
    />

    <div className="min-h-svh flex flex-col bg-background">
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
          <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
            Librifree
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/biblioteca" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Biblioteca
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </nav>

      <main className="flex-1 px-6 sm:px-8 py-12 max-w-[680px] mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-6">
          Chi siamo
        </h1>

        <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Librifree</strong> è una biblioteca digitale completamente gratuita
            che offre accesso a migliaia di libri classici della letteratura mondiale. Tutte le opere presenti
            nel catalogo appartengono al <strong className="text-foreground">pubblico dominio</strong> e possono
            essere lette liberamente da chiunque.
          </p>

          <p>
            Il progetto nasce con l'obiettivo di rendere la grande letteratura accessibile a tutti,
            senza costi e senza registrazione. Che tu sia uno <strong className="text-foreground">studente</strong> alla
            ricerca di un riassunto per la scuola, un <strong className="text-foreground">insegnante</strong> che
            vuole condividere testi classici con la classe, o semplicemente un <strong className="text-foreground">appassionato
            di lettura</strong>, Librifree è pensato per te.
          </p>

          <p>
            Nel nostro catalogo troverai opere di letteratura italiana, inglese, francese, russa e americana,
            complete di riassunti, analisi letterarie, citazioni e approfondimenti sui personaggi principali.
          </p>

          <h2 className="text-lg font-semibold text-foreground pt-4">Le nostre fonti</h2>
          <p>
            I testi disponibili su Librifree provengono da archivi di pubblico dominio come
            Project Gutenberg e LiberLiber. Ogni libro è stato verificato per assicurarne la qualità
            e la leggibilità.
          </p>

          <h2 className="text-lg font-semibold text-foreground pt-4">Contatti</h2>
          <p>
            Per domande, suggerimenti o segnalazioni puoi scriverci all'indirizzo{" "}
            <a href="mailto:info@librifree.it" className="text-foreground underline hover:no-underline">
              info@librifree.it
            </a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  </>
);

export default ChiSiamo;
