/**
 * dhivehiTransliteration.js
 * Umschrift von Dhivehi/Maledivisch (Thaana-Schrift) nach lateinischer
 * Näherung.
 *
 * QUELLE: Die Zeichentabellen stammen direkt aus der vom Nutzer
 * bereitgestellten Wiktionary-Umschriftrichtlinie für Dhivehi
 * (Thaana-Konsonanten, die 14 zusätzlichen für arabische Lehnwörter
 * verwendeten Buchstaben, sowie die Vokaldiakritika). Alle Codepoints
 * wurden programmatisch gegen die offiziellen Unicode-Zeichennamen
 * verifiziert (nicht aus dem Gedächtnis übernommen) - die Tabellen
 * decken lückenlos den kompletten Thaana-Unicode-Block (U+0780-U+07B1)
 * ab, es fehlt nichts.
 *
 * WICHTIGER STRUKTURUNTERSCHIED ZU ARABISCH: Thaana ist - anders als das
 * arabische Abdschad - kein Schriftsystem mit auslassbaren Kurzvokalen.
 * JEDER Konsonant trägt in normaler Schreibung ein explizites
 * Vokalzeichen (oder ein Sukun, wenn er keinen Vokal trägt). Die in
 * transliterationClient.js für Arabisch nötige
 * Standardvokal-Rate-Heuristik ist hier deshalb unnötig - dieses Modul
 * ist dadurch einfacher und zugleich genauer.
 *
 * SONDERFALL ALIFU+SUKUN: Der Vokalträger-Buchstabe "Alifu" (އ) hat für
 * sich genommen keinen eigenen Lautwert (dient nur als Träger für
 * vokalisch beginnende Silben, z. B. "އަ" = "a"). Mit Sukun kombiniert
 * (އް) steht er jedoch laut Quelltabelle für einen echten Knacklaut
 * [ʔ] - dieser Sonderfall wird explizit behandelt (Ausgabe "'", analog
 * zur Hamza-Behandlung im Arabisch-Modul dieses Projekts).
 *
 * ASCII-SICHERE ERSATZSCHREIBWEISEN: Die Quelltabelle nutzt IAST-artige
 * Diakritika (ṣ, ḷ, ñ, ḍ, ṭ, ṇ, ṯ, ḥ, ḏ, ž, š, ş, ḑ, ţ, ẓ, ʿ sowie
 * Makron-Langvokale ā/ī/ū/ē/ō), die der nachgelagerte
 * asciiSanitizer.js-Schritt entfernen würde. Ersetzt durch eigene
 * ASCII-sichere Schreibweisen (Länge weiterhin per Verdopplung,
 * konsistent mit den anderen Modulen dieses Projekts). Für die
 * einheimischen Thaana-Retroflexbuchstaben (ṣ/ḍ/ṭ/ṇ - anders als bei den
 * Indic-Modulen KEINE seltenen Sanskrit-Lehnbuchstaben, sondern fester
 * Bestandteil des Alphabets, deshalb NICHT mit ihren dentalen/alveolaren
 * Pendants zusammengelegt) wird der Buchstabe verdoppelt (t/tt, d/dd,
 * n/nn, s/ss); ḷ folgt der real gebräuchlichen maledivischen
 * Umschreibung "lh" (z. B. Lhaviyani-Atoll). Bei den arabischen
 * Lehnbuchstaben werden pharyngalisierte/emphatische Varianten teils auf
 * dieselbe Ersatzschreibweise wie ihr einheimisches Pendant abgebildet
 * (ş/ḑ/ţ wie ṣ/ḍ/ṭ), da beide ähnliche "emphatische" Konsonanten sind -
 * eine bewusste Vereinfachung, keine exakte phonetische Unterscheidung.
 */

// Alle 39 Konsonanten (25 Grundbuchstaben + 14 für arabische Lehnwörter).
const KONSONANTEN = {
  '\u0780': 'h', '\u0781': 'sh', '\u0782': 'n', '\u0783': 'r', '\u0784': 'b',
  '\u0785': 'lh', '\u0786': 'k', '\u0787': '', '\u0788': 'v', '\u0789': 'm',
  '\u078A': 'f', '\u078B': 'd', '\u078C': 't', '\u078D': 'l', '\u078E': 'g',
  '\u078F': 'ny', '\u0790': 's', '\u0791': 'dd', '\u0792': 'z', '\u0793': 'tt',
  '\u0794': 'y', '\u0795': 'p', '\u0796': 'j', '\u0797': 'c', '\u07B1': 'nn',

  '\u0798': 'th', '\u0799': 'hh', '\u079A': 'x', '\u079B': 'dh', '\u079C': 'zh',
  '\u079D': 'sh', '\u079E': 'ss', '\u079F': 'dd', '\u07A0': 'tt', '\u07A1': 'zz',
  '\u07A2': "'", '\u07A3': 'gh', '\u07A4': 'q', '\u07A5': 'w',
};

// Vokaldiakritika (immer explizit geschrieben, siehe Moduldoku).
const VOKALE = {
  '\u07A6': 'a', '\u07A7': 'aa', '\u07A8': 'i', '\u07A9': 'ii',
  '\u07AA': 'u', '\u07AB': 'uu', '\u07AC': 'e', '\u07AD': 'ee',
  '\u07AE': 'o', '\u07AF': 'oo',
};

const SUKUN = '\u07B0';
const ALIFU = '\u0787';

const SONSTIGE = {
  // Arabisch-indische Ziffern (in religiösen/formellen Texten gelegentlich
  // neben westlichen Ziffern verwendet) - selbe Zuordnung wie im
  // Arabisch-Modul dieses Projekts.
  '\u0660': '0', '\u0661': '1', '\u0662': '2', '\u0663': '3', '\u0664': '4',
  '\u0665': '5', '\u0666': '6', '\u0667': '7', '\u0668': '8', '\u0669': '9',
};

const DHIVEHI_SPRACHCODES = new Set(['dv-MV']);

/** Ob für einen Sprachcode die Thaana-Umschrift zuständig ist. */
export function hatDhivehiSchema(code) {
  return DHIVEHI_SPRACHCODES.has(code);
}

/**
 * Transliteriert Dhivehi/Thaana-Schrift nach lateinischer Näherung.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereDhivehi(text) {
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];

    if (Object.prototype.hasOwnProperty.call(KONSONANTEN, aktuelles)) {
      const konsonantenLaut = KONSONANTEN[aktuelles];
      const naechstes = zeichen[i + 1];

      if (Object.prototype.hasOwnProperty.call(VOKALE, naechstes)) {
        ergebnis += konsonantenLaut + VOKALE[naechstes];
        i += 2;
        continue;
      }

      if (naechstes === SUKUN) {
        // Alifu+Sukun: Sonderfall Knacklaut (siehe Moduldoku).
        ergebnis += aktuelles === ALIFU ? "'" : konsonantenLaut;
        i += 2;
        continue;
      }

      // Kein Vokalzeichen und kein Sukun (regulär sollte in Thaana immer
      // eines von beiden folgen) - Konsonant ohne Vokal ausgeben statt zu
      // raten, siehe Moduldoku zum Unterschied zu Arabisch.
      ergebnis += konsonantenLaut;
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(SONSTIGE, aktuelles)) {
      ergebnis += SONSTIGE[aktuelles];
      i += 1;
      continue;
    }

    // Unbekanntes Zeichen (Leerzeichen, Satzzeichen, verwaiste
    // Vokalzeichen/Sukun ohne vorangehenden Konsonanten) unverändert
    // durchreichen.
    ergebnis += aktuelles;
    i += 1;
  }

  return ergebnis;
}
