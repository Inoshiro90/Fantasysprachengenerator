/**
 * myanmarTransliteration.js
 * Vereinfachte, lesbare Umschrift für die birmanische (Myanmar-)Schrift.
 *
 * Wie die Schriften in indicTransliteration.js ist Myanmar ein Abugida:
 * ein Konsonantenzeichen trägt einen inhärenten Vokal "a", sofern ihm kein
 * Vokalzeichen oder Asat (Vokal-Unterdrückungszeichen) folgt. Zusätzlich zu
 * dieser aus indicTransliteration.js bekannten Grundlogik hat Myanmar zwei
 * Besonderheiten, die eine eigene (statt eine wiederverwendete) Umsetzung
 * nötig machen:
 *
 * 1. MEDIALE (ျ ြ ွ ှ): direkt an den Konsonanten angehängte
 *    Gleitlaut-/Aspirations-Zeichen, die VOR dem Vokal eingefügt werden
 *    (z. B. ကျ = "kya"). ျ (ya-Medial) und ြ (ra-Medial) werden hier
 *    bewusst beide als "y" umgeschrieben, da sie in der modernen
 *    Aussprache zusammengefallen sind - genau wie z. B. "Myanmar"
 *    (မြန်မာ, mit ra-Medial) im Alltag "y" ausgesprochen und geschrieben
 *    wird, nicht "Mranma". Das entspricht dem in diesem Projekt
 *    durchgängig verfolgten Prinzip "natürlich lesbare Näherung vor
 *    wissenschaftlicher Exaktheit".
 * 2. TONZEICHEN (Punkt unten ့, Doppelpunkt း): markieren im
 *    Birmanischen einen von drei Tönen. Da eine lateinische Umschrift
 *    ohne Tonzeichen-Konvention (die dieses Projekt für keine andere
 *    Schrift nutzt) Töne ohnehin nicht sinnvoll darstellen kann, werden
 *    sie hier - wie in den meisten informellen Umschriften auch -
 *    verworfen statt (z. B. mit hochgestellten Zahlen) nachgebildet.
 *
 * Das Myanmar-Unicode-Virama (\u1039) hat NICHT dieselbe Funktion wie in
 * den indischen Schriften: Es erzeugt gestapelte Konjunktkonsonanten
 * (v. a. in Pali-/Sanskrit-Lehnwörtern), tötet aber nicht selbst den Vokal
 * des ERSTEN Konsonanten - das übernimmt das separate Asat-Zeichen
 * (\u103a). Beide werden hier entsprechend unterschiedlich behandelt.
 *
 * Einschränkung: seltene Pali-/Sanskrit-Sonderzeichen und exakte Tonhöhen
 * werden vereinfacht behandelt; das Ergebnis ist eine lesbare Näherung,
 * keine wissenschaftlich exakte Transliteration (für Letztere gibt es
 * akademische Systeme wie DCL/OBI, die aber - siehe Projektbesprechung -
 * bewusst nicht verwendet werden). Anders als bei Thailändisch/Laotisch/
 * Khmer gibt es HIER KEINE wörterbuchgestützte Wortgrenzen-Erkennung -
 * birmanischer Text ohne Leerzeichen zwischen Wörtern wird daher als ein
 * einziger, durchgehender Lautblock ausgegeben. Das wäre der naheliegende
 * nächste Verbesserungsschritt (bräuchte eine offen lizenzierte
 * Myanmar-Wortliste, analog zur Thai-Wortliste, siehe
 * data/THAI_WORTLISTE_LIZENZ.md), ist aber (noch) nicht umgesetzt.
 */

// Basis-Konsonanten (U+1000-U+1021). Enthält NUR den Laut ohne inhärenten
// Vokal (analog zu indicTransliteration.js) - der Vokal wird unten je nach
// Kontext ergänzt. Seltene, aus Pali/Sanskrit entlehnte Retroflex-Buchstaben
// (U+100B-U+100F) werden - wie in indicTransliteration.js für die
// entsprechenden indischen Buchstaben - auf dieselbe Umschrift wie ihre
// gebräuchlicheren dentalen Pendants abgebildet (bewusste Vereinfachung).
const KONSONANTEN = {
  '\u1000': 'k', '\u1001': 'kh', '\u1002': 'g', '\u1003': 'gh', '\u1004': 'ng', // က ခ ဂ ဃ င
  '\u1005': 's', '\u1006': 'sh', '\u1007': 'z', '\u1008': 'zh', // စ ဆ ဇ ဈ
  '\u1009': 'ny', '\u100a': 'ny', // ည ဉ
  '\u100b': 't', '\u100c': 'th', '\u100d': 'd', '\u100e': 'dh', '\u100f': 'n', // ဋ ဌ ဍ ဎ ဏ (Retroflex, wie dental unten)
  '\u1010': 't', '\u1011': 'th', '\u1012': 'd', '\u1013': 'dh', '\u1014': 'n', // တ ထ ဒ ဓ န
  '\u1015': 'p', '\u1016': 'ph', '\u1017': 'b', '\u1018': 'bh', '\u1019': 'm', // ပ ဖ ဗ ဘ မ
  '\u101a': 'y', '\u101b': 'r', '\u101c': 'l', '\u101d': 'w', '\u101e': 'th', // ယ ရ လ ဝ သ
  '\u101f': 'h', '\u1020': 'l', '\u1021': 'a', // ဟ ဠ အ
  '\u103f': 'ss', // ဿ (Ligatur "Great Sa")
};

// Mediale (U+103B-U+103E): werden direkt nach dem Basiskonsonanten, aber
// vor dem Vokal eingefügt. ျ und ြ absichtlich beide "y" (siehe Moduldoku).
const MEDIALE = {
  '\u103b': 'y', // ျ (Ya-Medial)
  '\u103c': 'y', // ြ (Ra-Medial, moderne Aussprache wie Ya-Medial)
  '\u103d': 'w', // ွ (Wa-Medial)
  '\u103e': 'h', // ှ (Ha-Medial, Aspiration/Entstimmlichung)
};

// Abhängige Vokalzeichen: ersetzen den inhärenten Vokal "a". Lange Vokale
// werden - wie im gesamten Projekt üblich (siehe Arabisch-/Indic-Module) -
// als Doppelbuchstabe dargestellt, um sie vom inhärenten kurzen "a" bzw.
// den kurzen Vokalzeichen zu unterscheiden.
const VOKALZEICHEN = {
  '\u102b': 'a', '\u102c': 'aa', // ါ ာ
  '\u102d': 'i', '\u102e': 'ii', // ိ ီ
  '\u102f': 'u', '\u1030': 'uu', // ု ူ
  '\u1031': 'e', '\u1032': 'ai', // ေ ဲ
};

// ZUSAMMENGESETZTE Vokalzeichen: zwei (bzw. drei mit Asat) einzelne
// Vokalzeichen-Codepoints, die zusammen EINEN eigenen Diphthong bilden -
// NICHT einfach zwei Vokale nacheinander. Eine reine Einzelzeichen-
// Nachschlage (wie oben in VOKALZEICHEN) erkennt nur das erste Zeichen
// und laesst das zweite als vermeintlich "unbekanntes Zeichen" roh in der
// Ausgabe stehen (Bugreport: "myanmaaniုngngan" statt "...nain...", das
// zweite Vokalzeichen ု der Kombination ိ+ု blieb unuebersetzt). Werden
// VOR der Einzelzeichen-Tabelle geprueft (siehe leseVokalKombination()
// unten).
//  - ိ+ု ("I" + "U"): OHNE nasalen Auslaut (kein Konsonant+Asat aus
//    {ind,မ} direkt danach) der Vokal "o", z. B. offen in "မိုး" (mo,
//    "Regen"). Steht direkt ein nasal schliessender Konsonant (ind/မ)+Asat
//    dahinter, verschmilzt die Kombination phonologisch stattdessen zum
//    Diphthong "ai" (z. B. "နိုင်" nain, Teil von "Myanmar/Land") - die
//    Lesung haengt hier vom FOLGENDEN Laut ab, daher gibt leseVokal()
//    unten eine Funktion statt eines festen Strings zurueck.
//  - ေ+ာ ("E" + "AA") = eigener Diphthong "aw", z. B. in "ကျော" (kyaw).
//    Ein DIREKT folgendes Asat gehoert bei dieser Kombination (anders als
//    sonst) noch mit ZUR Vokalschreibung selbst (schreibt eine knarrende
//    Tonvariante desselben Vokals, keinen eigenen Folgekonsonanten, siehe
//    z. B. "တော်" taw/daw) und wird hier mitkonsumiert statt separat als
//    Silbenschluss-Asat fuer einen (nicht vorhandenen) Konsonanten
//    behandelt zu werden.
const NASALE_AUSLAUT_KONSONANTEN = new Set(['\u1004', '\u1019']); // ind, မ
const VOKAL_KOMBINATIONEN = [
  {
    zeichen: ['\u102d', '\u102f'],
    laut: (zeichen, nachPosition) =>
      NASALE_AUSLAUT_KONSONANTEN.has(zeichen[nachPosition]) && zeichen[nachPosition + 1] === ASAT ? 'ai' : 'o',
  },
  { zeichen: ['\u1031', '\u102c', '\u103a'], laut: 'aw' }, // ေ + ာ + ်
  { zeichen: ['\u1031', '\u102c'], laut: 'aw' }, // ေ + ာ
];

/** Prüft ab Position j auf eine der bekannten Vokalzeichen-Kombinationen
 * (siehe VOKAL_KOMBINATIONEN oben) - längste Kombination zuerst, damit die
 * 3-Zeichen-Variante (mit Asat) Vorrang vor der 2-Zeichen-Variante hat.
 * Gibt bei Erfolg {laut, laenge} zurück, sonst null. */
function leseVokalKombination(zeichen, j) {
  for (const { zeichen: muster, laut } of VOKAL_KOMBINATIONEN) {
    if (muster.every((z, k) => zeichen[j + k] === z)) {
      const aufgeloest = typeof laut === 'function' ? laut(zeichen, j + muster.length) : laut;
      return { laut: aufgeloest, laenge: muster.length };
    }
  }
  return null;
}

// Unabhängige Vokale (U+1023-U+102A): bilden ohne vorangehenden Konsonanten
// eine eigene Silbe.
const UNABHAENGIGE_VOKALE = {
  '\u1023': 'i', '\u1024': 'ii', '\u1025': 'u', '\u1026': 'uu', // ဣ ဤ ဥ ဦ
  '\u1027': 'e', '\u1028': 'e', '\u1029': 'o', '\u102a': 'au', // ဧ ဨ ဩ ဪ
};

const ASAT = '\u103a'; // ် - unterdrückt den Vokal des Konsonanten (geschlossene Silbe)
const VIRAMA_KONJUNKT = '\u1039'; // ္ - stapelt Konsonanten (Pali/Sanskrit-Lehnwörter), KEIN Vokal-Killer
const ANUSVARA = '\u1036'; // ံ - nasaliert den Vokal
const TONZEICHEN = new Set(['\u1037', '\u1038']); // ့ း - Tonzeichen, werden verworfen (siehe Moduldoku)

const SONSTIGE = {
  '\u1040': '0', '\u1041': '1', '\u1042': '2', '\u1043': '3', '\u1044': '4',
  '\u1045': '5', '\u1046': '6', '\u1047': '7', '\u1048': '8', '\u1049': '9',
  '\u104a': ',', '\u104b': '.',
};

const MYANMAR_SPRACHCODES = new Set(['my-MM']);

/** Ob für einen Sprachcode die birmanische Schrift-Umschrift zuständig ist. */
export function hatBirmanischesSchema(code) {
  return MYANMAR_SPRACHCODES.has(code);
}

/**
 * Transliteriert birmanische (Myanmar-)Schrift in lateinische Näherung.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereBirmanisch(text) {
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];

    if (Object.prototype.hasOwnProperty.call(KONSONANTEN, aktuelles)) {
      const konsonantenLaut = KONSONANTEN[aktuelles];
      let j = i + 1;

      // 0. KINZI (visuell ein kleiner Haken ÜBER dem folgenden Konsonanten,
      // z. B. in "မင်္ဂလာ" mingalar/"Segen"): ein BELIEBIGER Konsonant,
      // gefolgt von Asat+Virama, VOR einem weiteren Konsonanten - der
      // Kinzi-bildende Konsonant selbst traegt dabei KEINEN eigenen Laut,
      // sondern verwandelt die Silbe des vorangehenden (aktuellen)
      // Konsonanten in eine feste "-in"-Lautung (unabhaengig davon, welcher
      // Buchstabe den Kinzi bildet - historisch meist ​င, aber die Regel
      // gilt fuer jeden Konsonanten in dieser Position). Muss VOR den
      // anderen Regeln geprueft werden, da sie sonst faelschlich den
      // Kinzi-Konsonanten als eigene "ma"+"ng"-Silbe lesen wuerden (wie im
      // urspruenglichen Bugreport: "manggalaapa" statt "mingalarpar").
      if (
        zeichen[j] !== undefined &&
        Object.prototype.hasOwnProperty.call(KONSONANTEN, zeichen[j]) &&
        zeichen[j + 1] === ASAT &&
        zeichen[j + 2] === VIRAMA_KONJUNKT &&
        Object.prototype.hasOwnProperty.call(KONSONANTEN, zeichen[j + 3])
      ) {
        ergebnis += konsonantenLaut + 'in';
        i = j + 3;
        continue;
      }

      // 1. Mediale konsumieren (typischerweise 0-1, selten 2 gestapelt).
      let medialLaut = '';
      while (
        zeichen[j] !== undefined &&
        Object.prototype.hasOwnProperty.call(MEDIALE, zeichen[j])
      ) {
        medialLaut += MEDIALE[zeichen[j]];
        j += 1;
      }

      // 2. Konjunkt-Virama: Konsonant bleibt ohne Vokal, das Cluster geht
      // mit dem nächsten (gestapelten) Konsonanten weiter.
      if (zeichen[j] === VIRAMA_KONJUNKT && Object.prototype.hasOwnProperty.call(KONSONANTEN, zeichen[j + 1])) {
        ergebnis += konsonantenLaut + medialLaut;
        i = j + 1;
        continue;
      }

      // 3. Asat: Vokal wird unterdrückt (geschlossene Silbe).
      if (zeichen[j] === ASAT) {
        ergebnis += konsonantenLaut + medialLaut;
        j += 1;
        while (TONZEICHEN.has(zeichen[j])) j += 1;
        i = j;
        continue;
      }

      // 4. Zusammengesetztes Vokalzeichen (siehe VOKAL_KOMBINATIONEN oben),
      // sonst einzelnes Vokalzeichen, sonst inhärentes "a".
      let vokal;
      const kombi = leseVokalKombination(zeichen, j);
      if (kombi) {
        vokal = kombi.laut;
        j += kombi.laenge;
      } else if (zeichen[j] !== undefined && Object.prototype.hasOwnProperty.call(VOKALZEICHEN, zeichen[j])) {
        vokal = VOKALZEICHEN[zeichen[j]];
        j += 1;
      } else {
        vokal = 'a';
      }

      // 5. Anusvara (Nasalierung).
      if (zeichen[j] === ANUSVARA) {
        vokal += 'n';
        j += 1;
      }

      // 6. Tonzeichen verwerfen (siehe Moduldoku).
      while (TONZEICHEN.has(zeichen[j])) j += 1;

      ergebnis += konsonantenLaut + medialLaut + vokal;
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

    if (TONZEICHEN.has(aktuelles)) {
      // Verwaistes Tonzeichen ohne vorangehenden Konsonanten (Randfall).
      i += 1;
      continue;
    }

    if (aktuelles === VIRAMA_KONJUNKT) {
      // Verwaistes Konjunkt-Virama außerhalb eines Konsonanten-Lookaheads -
      // der Normalfall (Kinzi-Konstruktion, siehe Regel 0 oben) wird
      // bereits dort korrekt aufgelöst. Dieser Zweig ist nur noch ein
      // Sicherheitsnetz für den seltenen Rest (z. B. fehlerhaft kodierter
      // Text) und verwirft das Zeichen statt es roh durchzureichen.
      i += 1;
      continue;
    }

    // Unbekanntes Zeichen (Leerzeichen, Satzzeichen, seltene Pali-/
    // Sanskrit-Sonderzeichen) unverändert durchreichen.
    ergebnis += aktuelles;
    i += 1;
  }

  return ergebnis;
}
