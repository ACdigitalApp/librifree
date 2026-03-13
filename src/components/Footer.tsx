import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/50 mt-auto">
    <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© 2025 Librifree – Biblioteca Digitale Gratuita</p>
        <div className="flex items-center gap-4">
          <Link to="/chi-siamo" className="hover:text-foreground transition-colors">
            Chi siamo
          </Link>
          <a href="mailto:info@librifree.it" className="hover:text-foreground transition-colors">
            Contatti
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
