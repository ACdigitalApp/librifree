import { Link } from "react-router-dom";

const Index = () => {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center text-center px-6">
      <h1 className="font-display font-medium text-4xl md:text-6xl text-foreground" style={{ textWrap: "balance", letterSpacing: "-0.02em" }}>
        Librifree – Biblioteca Digitale Gratuita
      </h1>
      <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground font-body">
        Leggi gratuitamente centinaia di libri classici online.
      </p>
      <Link
        to="/biblioteca"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Entra nella Libreria
      </Link>
    </main>
  );
};

export default Index;
