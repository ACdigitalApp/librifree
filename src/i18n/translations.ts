export type Locale = "it" | "en";

export const translations = {
  it: {
    // Index
    heroTitle: "Librifree – Biblioteca Digitale Gratuita",
    heroSubtitle: "Leggi gratuitamente centinaia di libri classici online.",
    enterLibrary: "Entra nella Libreria",

    // Library
    library: "Biblioteca",
    librarySubtitle: "Scegli un libro e inizia a leggere.",
    home: "Home",
    coverAlt: "Copertina di",

    // BookPage
    bookNotFound: "Libro non trovato",
    backToLibrary: "Torna alla Biblioteca",

    // Language names
    italiano: "Italiano",
    english: "English",
  },
  en: {
    heroTitle: "Librifree – Free Digital Library",
    heroSubtitle: "Read hundreds of classic books online for free.",
    enterLibrary: "Enter Library",

    library: "Library",
    librarySubtitle: "Choose a book and start reading.",
    home: "Home",
    coverAlt: "Cover of",

    bookNotFound: "Book not found",
    backToLibrary: "Back to Library",

    italiano: "Italiano",
    english: "English",
  },
} as const;

export type TranslationKey = keyof typeof translations.it;
