/**
 * khmerTransliteration.js
 * Vereinfachte, lesbare Umschrift für Khmer (Kambodschanisch).
 *
 * WICHTIGER HINWEIS ZUR HERKUNFT: Diese Datei wurde NICHT aus dem vom
 * Nutzer hochgeladenen "Khmer-Transliteration-Keyboard"-Repository
 * übernommen (das Repo läuft ohnehin in die Gegenrichtung - Latein zu
 * Khmer, für eine Eingabemethode/IME - und liegt ohne erkennbare Lizenz
 * vor). Stattdessen basiert dieses Modul auf öffentlich dokumentierten,
 * nicht schutzfähigen linguistischen Fakten der Khmer-Orthographie
 * (Konsonantenserien, Vokal-Lesungen), abgeglichen mit der offiziellen
 * "Khmer Romanization Table" der US Library of Congress (ALA-LC-System,
 * 2013) sowie unabhängig verifizierten IPA-Werten. Die konkreten
 * Buchstaben-Codepoints wurden zusätzlich programmatisch über
 * unicodedata gegengeprüft, nicht aus dem Gedächtnis übernommen.
 *
 * GRUNDPRINZIP (wie bei den anderen Abugida-Modulen dieses Projekts):
 * Ein Konsonant trägt einen inhärenten Vokal, sofern kein Vokalzeichen
 * oder "Bantoc" (Vokal-Unterdrückung, siehe unten) folgt. Khmer hat
 * zusätzlich eine Besonderheit, die es mit Dzongkha teilt, aber
 * regelmäßiger/besser dokumentiert ist: Die 33 Konsonanten sind in zwei
 * SERIEN eingeteilt (ähnlich einer Tonogenese-Vorstufe) - je nachdem, zu
 * welcher Serie der Konsonant gehört, wird ein und dasselbe Vokalzeichen
 * unterschiedlich gelesen (Serie 1 hat inhärenten Vokal "a", Serie 2 "o").
 * Beispiel: ា (Vokalzeichen AA) liest sich nach einem Serie-1-Konsonanten
 * als "a", nach einem Serie-2-Konsonanten als "ie".
 *
 * WEITERE BESONDERHEITEN:
 * - COENG (្): stapelt einen zweiten (dritten, ...) Konsonanten OHNE
 *   eigenen Vokal darunter (Konsonantencluster), vergleichbar mit dem
 *   Konjunkt-Virama in dzongkhaTransliteration.js.
 * - BANTOC (់): unterdrückt den (inhärenten) Vokal vollständig - die
 *   Funktion entspricht dem Asat in myanmarTransliteration.js bzw. dem
 *   Sukun in transliterationClient.js (Arabisch). Anders als beim
 *   tibetischen Modul ist die Silbengrenze bei Khmer damit tatsächlich
 *   IMMER explizit markiert (kein Tsheg-Rateproblem).
 * - MUUSIKATOAN (៉) / TRIISAP (៊): verschieben die effektive Serie eines
 *   Konsonanten für die nachfolgende Vokal-Lesung (Muusikatoan: Serie 2
 *   -> Serie 1; Triisap: Serie 1 -> Serie 2), z. B. bei Lehnwörtern.
 * - NIKAHIT (ំ) / REAHMUK (ះ): nasalieren bzw. "öffnen" den Vokal; für
 *   die von der Quelle dokumentierten Kombinationen wird die belegte
 *   Lesung verwendet, sonst eine generische Näherung (Anhängen von
 *   "m"/"h").
 *
 * EINSCHRÄNKUNG: Khmer-Text trennt Wörter nicht durch Leerzeichen
 * (Leerzeichen markieren nur Sinnpausen). Innerhalb eines Wortes ist die
 * Silbengrenze dank Bantoc/Coeng aber eindeutig aus der Schreibung
 * ableitbar - dieses Modul liefert daher eine lesbare Näherung ohne auf
 * ein Wörterbuch angewiesen zu sein, ist aber (wie die anderen Module
 * dieses Projekts) keine wissenschaftlich exakte Transliteration.
 */

// Serie-1-Konsonanten (inhärenter Vokal "a") und Serie-2-Konsonanten
// (inhärenter Vokal "o"), samt Basis-Lautwert (ohne Vokal). Quelle:
// IPA-Referenzwerte + LOC-Romanisierungstabelle (siehe Moduldoku).
const KONSONANTEN = {
  '\u1780': { laut: 'k', serie: 1 }, '\u1781': { laut: 'kh', serie: 1 },
  '\u1782': { laut: 'k', serie: 2 }, '\u1783': { laut: 'kh', serie: 2 },
  '\u1784': { laut: 'ng', serie: 2 },
  '\u1785': { laut: 'ch', serie: 1 }, '\u1786': { laut: 'chh', serie: 1 },
  '\u1787': { laut: 'ch', serie: 2 }, '\u1788': { laut: 'chh', serie: 2 },
  '\u1789': { laut: 'ny', serie: 2 },
  '\u178A': { laut: 'd', serie: 1 }, '\u178B': { laut: 'th', serie: 1 },
  '\u178C': { laut: 'd', serie: 2 }, '\u178D': { laut: 'th', serie: 2 },
  '\u178E': { laut: 'n', serie: 1 },
  '\u178F': { laut: 't', serie: 1 }, '\u1790': { laut: 'th', serie: 1 },
  '\u1791': { laut: 't', serie: 2 }, '\u1792': { laut: 'th', serie: 2 },
  '\u1793': { laut: 'n', serie: 2 },
  '\u1794': { laut: 'b', serie: 1 }, '\u1795': { laut: 'ph', serie: 1 },
  '\u1796': { laut: 'p', serie: 2 }, '\u1797': { laut: 'ph', serie: 2 },
  '\u1798': { laut: 'm', serie: 2 }, '\u1799': { laut: 'y', serie: 2 },
  '\u179A': { laut: 'r', serie: 2 }, '\u179B': { laut: 'l', serie: 2 },
  '\u179C': { laut: 'v', serie: 2 },
  '\u179D': { laut: 'sh', serie: 1 }, '\u179E': { laut: 'ss', serie: 2 }, // selten (Pali/Sanskrit)
  '\u179F': { laut: 's', serie: 1 }, '\u17A0': { laut: 'h', serie: 1 },
  '\u17A1': { laut: 'l', serie: 1 },
  '\u17A2': { laut: '', serie: 1 }, // អ - stummer Vokalträger
};

// Unabhängige Vokale (eigenständige Silbe ohne vorangehenden Konsonanten).
const UNABHAENGIGE_VOKALE = {
  '\u17A5': 'e', '\u17A6': 'ei', '\u17A7': 'u', '\u17A9': 'uu', '\u17AA': 'euo',
  '\u17AB': 'reu', '\u17AC': 'reuu', '\u17AD': 'leu', '\u17AE': 'leuu',
  '\u17AF': 'ee', '\u17B0': 'e', '\u17B1': 'aao', '\u17B2': 'aao', '\u17B3': 'ao',
};

// Abhängige Vokalzeichen: je Serie eine andere Lesung (siehe Moduldoku).
const VOKALZEICHEN = {
  '\u17B6': { 1: 'a', 2: 'ie' }, '\u17B7': { 1: 'e', 2: 'i' },
  '\u17B8': { 1: 'ei', 2: 'i' }, '\u17B9': { 1: 'e', 2: 'eu' },
  '\u17BA': { 1: 'eeu', 2: 'eu' }, '\u17BB': { 1: 'o', 2: 'u' },
  '\u17BC': { 1: 'ou', 2: 'u' }, '\u17BD': { 1: 'ue', 2: 'ue' },
  '\u17BE': { 1: 'ae', 2: 'e' }, '\u17BF': { 1: 'eue', 2: 'eue' },
  '\u17C0': { 1: 'ie', 2: 'ie' }, '\u17C1': { 1: 'ei', 2: 'e' },
  '\u17C2': { 1: 'ae', 2: 'e' }, '\u17C3': { 1: 'ay', 2: 'eui' },
  '\u17C4': { 1: 'ao', 2: 'o' }, '\u17C5': { 1: 'aw', 2: 'euw' },
};

const INHAERENTER_VOKAL = { 1: 'a', 2: 'o' };

const COENG = '\u17D2';
const BANTOC = '\u17CB'; // ់ - unterdrückt den Vokal vollständig
const NIKAHIT = '\u17C6'; // ំ - Nasalierung
const REAHMUK = '\u17C7'; // ះ - "offener" Abschluss
const MUUSIKATOAN = '\u17C9'; // ៉ - Serie 2 -> Serie 1
const TRIISAP = '\u17CA'; // ៊ - Serie 1 -> Serie 2
const TOANDAKHIAT = '\u17CD'; // ៍ - macht vorangehenden Buchstaben stumm (Pali/Sanskrit)

// Dokumentierte Sonderlesungen für Vokalzeichen + Nikahit/Reahmuk
// (Schlüssel: Vokalzeichen oder "" für inhärenten Vokal, je Serie).
const NIKAHIT_KOMBINATIONEN = {
  '': { 1: 'am', 2: 'um' },
  '\u17B6': { 1: 'am', 2: 'oem' },
  '\u17BB': { 1: 'om', 2: 'um' },
};
const REAHMUK_KOMBINATIONEN = {
  '': { 1: 'ah', 2: 'eh' },
  '\u17B7': { 1: 'eh', 2: 'ih' },
  '\u17BB': { 1: 'oh', 2: 'uh' },
  '\u17C1': { 1: 'eih', 2: 'eh' },
  '\u17C4': { 1: 'ah', 2: 'oueh' },
};

const SONSTIGE = {
  '\u17E0': '0', '\u17E1': '1', '\u17E2': '2', '\u17E3': '3', '\u17E4': '4',
  '\u17E5': '5', '\u17E6': '6', '\u17E7': '7', '\u17E8': '8', '\u17E9': '9',
  '\u17D4': '.', '\u17D5': '.', // ។ ៕ - Satzende
};

const KHMER_SPRACHCODES = new Set(['km-KM']);

/** Ob für einen Sprachcode die Khmer-Umschrift zuständig ist. */
export function hatKhmerSchema(code) {
  return KHMER_SPRACHCODES.has(code);
}

// --- Wörterbuch-gestützte Wortgrenzen-Erkennung (aus dem Chuon-Nath-
// Khmer-Wörterbuch, per tools/generate-khmer-wordlist.py offline erzeugt)
// ---
//
// Khmer-Text trennt Wörter nicht durch Leerzeichen (nur gelegentlich
// Sinnabschnitte). Die Zeichen-für-Zeichen-Umschrift oben trifft daher bei
// mehrsilbigen Wörtern gelegentlich falsche lokale Annahmen darüber, ob
// ein Konsonant ein stummer Endkonsonant der aktuellen oder der Anlaut
// der nächsten Silbe ist (siehe Moduldoku oben).
//
// WICHTIGE EINSCHRÄNKUNG: Diese Wortliste enthält NUR Schreibweisen
// ("dieses Zeichenfolge ist ein gültiges Khmer-Wort"), KEINE
// Ausspracheinformationen (das Wörterbuch selbst ist eine Khmer->Khmer-
// Definitionssammlung, kein Ausspracheverzeichnis). Die
// Wortgrenzen-Erkennung verbessert daher vor allem die LESBARKEIT der
// Ausgabe (Wortzwischenräume an erkannten Wortgrenzen, statt eines
// durchgehenden Zeichenblocks) - sie behebt NICHT die oben beschriebene
// silbeninterne Unschärfe bei der Vokal-Zuordnung selbst, da dafür eine
// aussprache-annotierte Quelle nötig wäre (die hier nicht vorliegt).
const KHMER_WORTLISTE_URL = new URL('../data/khmerWortliste.json', import.meta.url).href;

let khmerWortlistePromise = null;
let khmerWortlisteMaxLaenge = 0;

/**
 * Lädt (einmalig, gecached) die aus dem Chuon-Nath-Wörterbuch erzeugte
 * Wortliste. Schlägt das Laden fehl, wird `null` geliefert - die
 * Transliteration fällt dann transparent auf die reine
 * Zeichen-für-Zeichen-Heuristik ohne Wortgrenzen-Erkennung zurück.
 * @returns {Promise<Set<string> | null>}
 */
function ladeKhmerWortliste() {
  if (!khmerWortlistePromise) {
    khmerWortlistePromise = fetch(KHMER_WORTLISTE_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => {
        const woerter = new Set(daten.woerter ?? []);
        for (const wort of woerter) {
          khmerWortlisteMaxLaenge = Math.max(khmerWortlisteMaxLaenge, wort.length);
        }
        return woerter;
      })
      .catch((fehler) => {
        console.warn(
          'Khmer-Wortliste konnte nicht geladen werden, nutze nur die ' +
            'zeichenbasierte Umschrift ohne Wortgrenzen-Erkennung:',
          fehler,
        );
        return null;
      });
  }
  return khmerWortlistePromise;
}

const KHMER_LAUF_REGEX = /[\u1780-\u17FF]+/gu;

/** Fügt innerhalb eines zusammenhängenden Khmer-Textlaufs an erkannten
 * Wörterbuch-Treffern (längste Übereinstimmung zuerst) Leerzeichen ein. */
function fuegeWortgrenzenEin(lauf, wortliste) {
  const zeichen = Array.from(lauf);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    let treffer = null;
    const maxLaenge = Math.min(khmerWortlisteMaxLaenge, zeichen.length - i);
    for (let laenge = maxLaenge; laenge >= 2; laenge -= 1) {
      const kandidat = zeichen.slice(i, i + laenge).join('');
      if (wortliste.has(kandidat)) {
        treffer = kandidat;
        break;
      }
    }

    if (treffer) {
      ergebnis += (ergebnis ? ' ' : '') + treffer;
      i += treffer.length;
    } else {
      ergebnis += zeichen[i];
      i += 1;
    }
  }

  return ergebnis;
}

/**
 * Transliteriert Khmer-Schrift und nutzt dafür VOR der eigentlichen
 * Umschrift die aus dem Chuon-Nath-Wörterbuch erzeugte Wortliste, um
 * Wortgrenzen in den (im Original leerzeichenlosen) Khmer-Text
 * einzufügen (siehe Erläuterung oben). Fällt bei fehlender/nicht
 * ladbarer Wortliste transparent auf transliteriereKhmer() zurück.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereKhmerMitWortliste(text) {
  const wortliste = await ladeKhmerWortliste();
  if (!wortliste) {
    return transliteriereKhmer(text);
  }

  const angereichertesText = text.replace(KHMER_LAUF_REGEX, (lauf) => fuegeWortgrenzenEin(lauf, wortliste));
  return transliteriereKhmer(angereichertesText);
}

/**
 * Transliteriert Khmer-Schrift nach lateinischer Näherung.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereKhmer(text) {
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];

    if (Object.prototype.hasOwnProperty.call(KONSONANTEN, aktuelles)) {
      let j = i + 1;
      let laut = KONSONANTEN[aktuelles].laut;
      let serie = KONSONANTEN[aktuelles].serie;

      // COENG-Cluster: weitere Konsonanten ohne eigenen Vokal anhängen.
      while (zeichen[j] === COENG && Object.prototype.hasOwnProperty.call(KONSONANTEN, zeichen[j + 1])) {
        laut += KONSONANTEN[zeichen[j + 1]].laut;
        j += 2;
      }

      // Register-Verschiebung durch Muusikatoan/Triisap (siehe Moduldoku).
      if (zeichen[j] === MUUSIKATOAN) {
        serie = 1;
        j += 1;
      } else if (zeichen[j] === TRIISAP) {
        serie = 2;
        j += 1;
      }

      // Toandakhiat: macht den Buchstaben stumm (Pali/Sanskrit-Lehnwörter).
      if (zeichen[j] === TOANDAKHIAT) {
        i = j + 1;
        continue;
      }

      // Vokalzeichen oder inhärenter Vokal (serie-abhängig).
      let vokalSchluessel = '';
      let vokal;
      if (
        Object.prototype.hasOwnProperty.call(VOKALZEICHEN, zeichen[j]) &&
        !(zeichen[j] === BANTOC)
      ) {
        vokalSchluessel = zeichen[j];
        vokal = VOKALZEICHEN[vokalSchluessel][serie];
        j += 1;
      } else {
        vokal = INHAERENTER_VOKAL[serie];
      }

      // Nikahit (Nasalierung) bzw. Reahmuk (offener Abschluss).
      if (zeichen[j] === NIKAHIT) {
        const kombi = NIKAHIT_KOMBINATIONEN[vokalSchluessel];
        vokal = kombi ? kombi[serie] : vokal + 'm';
        j += 1;
      } else if (zeichen[j] === REAHMUK) {
        const kombi = REAHMUK_KOMBINATIONEN[vokalSchluessel];
        vokal = kombi ? kombi[serie] : vokal + 'h';
        j += 1;
      }

      // Bantoc: unterdrückt den Vokal vollständig (siehe Moduldoku).
      let kodaLaut = '';
      if (zeichen[j] === BANTOC) {
        vokal = '';
        j += 1;
      } else if (
        vokal !== '' &&
        Object.prototype.hasOwnProperty.call(KONSONANTEN, zeichen[j]) &&
        zeichen[j + 1] !== COENG &&
        zeichen[j + 1] !== TOANDAKHIAT &&
        (!Object.prototype.hasOwnProperty.call(VOKALZEICHEN, zeichen[j + 1]) || zeichen[j + 1] === BANTOC)
      ) {
        // Silbenendkonsonant OHNE explizites Bantoc: In Khmer-Text trennen
        // Leerzeichen nur Sinnabschnitte, keine Silben - ob ein
        // nachfolgender Konsonant zu dieser Silbe (als stummer
        // Endkonsonant) oder zur nächsten (als eigener Anlaut) gehört,
        // ist ohne Wörterbuch grundsätzlich nicht immer eindeutig
        // bestimmbar (vgl. Thai/Lao). Näherung: Ein Konsonant OHNE
        // eigenes Coeng-Cluster und OHNE eigenes Vokalzeichen danach wird
        // als stummer Endkonsonant dieser Silbe gewertet - trifft die
        // häufigsten Fälle (z. B. ខ្មែរ = "khmaer", nicht "khmaero").
        // WICHTIG: Der bereits ermittelte Silbenvokal bleibt erhalten -
        // nur der Konsonant selbst bekommt keinen eigenen Vokal. Trägt
        // dieser Endkonsonant selbst noch ein (bestätigendes) Bantoc,
        // wird das gleich mitkonsumiert.
        kodaLaut = KONSONANTEN[zeichen[j]].laut;
        j += zeichen[j + 1] === BANTOC ? 2 : 1;
      }

      ergebnis += laut + vokal + kodaLaut;
      i = j;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(UNABHAENGIGE_VOKALE, aktuelles)) {
      ergebnis += UNABHAENGIGE_VOKALE[aktuelles];
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(SONSTIGE, aktuelles)) {
      ergebnis += SONSTIGE[aktuelles];
      i += 1;
      continue;
    }

    // Unbekanntes Zeichen (Leerzeichen, Satzzeichen, seltene Sonderzeichen)
    // unverändert durchreichen.
    ergebnis += aktuelles;
    i += 1;
  }

  return ergebnis;
}
