/**
 * dzongkhaTransliteration.js
 * Umschrift von Dzongkha (Nationalsprache Bhutans, geschrieben in
 * tibetischer Schrift) nach "Roman Dzongkha" - dem 1991 von der Dzongkha
 * Development Commission entwickelten offiziellen Romanisierungssystem
 * (Quelle: George van Driem, "Guide to Official Dzongkha Romanization",
 * zusammengefasst im Wikipedia-Artikel "Roman Dzongkha").
 *
 * WICHTIGER UNTERSCHIED zu den anderen Umschrift-Modulen dieses Projekts:
 * Roman Dzongkha ist keine reine Schriftumschrift (wie z. B. bei
 * Devanagari oder Birmanisch, wo Schriftzeichen ziemlich direkt Lauten
 * entsprechen), sondern eine PHONOLOGISCHE Romanisierung. Ein einzelner
 * tibetischer Grundbuchstabe kann je nach vorangestelltem Präfixbuchstaben
 * unterschiedlich gelesen werden, weil sich historische
 * Stimmhaftigkeitsunterschiede im Tibetischen im modernen Dzongkha zu
 * einem Tonsystem entwickelt haben ("Tonogenese"). Beispiel aus der
 * Quelltabelle:
 *   རྒ་ (mit Präfix ར) -> "g"   [g]      "klar"
 *   ག་  (ohne Präfix)   -> "g°"  [g̥]~[k]  "mit gehauchtem/murmeltem Vokal"
 * Beide sind TIEF-Ton, der Unterschied liegt in der Vokalqualität, nicht
 * im Ton. Diese Datei bildet GENAU DIE ACHT durch die Quelle belegten
 * Präfix/Murmel-Paare ab (ར vor ག/ཇ/ད/བ, ས vor སྦྱ/སྦྲ, ག vor ཞ/ཟ);
 * andere, in der Quelle nicht dokumentierte Präfixkombinationen werden
 * nicht speziell behandelt (das Präfixzeichen verstummt dann einfach,
 * wie in vielen Fällen der echten tibetischen Orthographie auch).
 *
 * TON: Bei den in der Quelle grün markierten Konsonanten ist der Ton
 * IMMER hoch, bei blau markierten IMMER tief - in beiden Fällen wird das
 * NICHT extra markiert (das im Roman-Dzongkha-System selbst so
 * vorgesehen: der Konsonant allein verrät den Ton). Nur bei den rot
 * markierten Konsonanten (y w l n ng ny m) sowie bei vokalisch
 * beginnenden Silben ist der Ton laut Quelle "nicht vorhersagbar" und
 * müsste eigentlich pro Wort mit vorangestelltem Apostroph für hohen Ton
 * markiert werden. Da das nicht aus der Schreibung ableitbar ist, wird
 * hier - wie im System selbst als Standardfall vorgesehen ("the low tone
 * is always unmarked") - der unmarkierte (tiefe) Fall angenommen. Das ist
 * eine Näherung, keine linguistisch exakte Tonbestimmung.
 *
 * VOKALLÄNGE: Tibetische Schrift markiert Vokallänge grundsätzlich nicht.
 * Die einzige in der Quelle dokumentierte, aus der Schreibung ableitbare
 * Regel ("vowels are always long before ng") wird umgesetzt (Verdopplung
 * des Vokalbuchstabens, analog zur Konvention in den anderen Modulen
 * dieses Projekts). Alle anderen Fälle bleiben kurz - eine Näherung.
 * Die zusätzlichen Roman-Dzongkha-Vokale ä/ö/ü (lexikalisch bedingt, nicht
 * aus der Schreibung ableitbar) werden nicht erzeugt.
 *
 * ASCII-HINWEIS: Das offizielle System markiert den oben beschriebenen
 * "murmelnden" Fall mit einem hochgestellten Kreis (g°, j°, d°, b°, zh°,
 * z°, bj°, dr°). Dieses Zeichen wird von asciiSanitizer.js (Schritt nach
 * der Umschrift) entfernt, wodurch z. B. "g" und "g°" im Endergebnis
 * ununterscheidbar werden. Das ist ein bewusster Kompromiss - siehe
 * Rückmeldung im Chat, falls stattdessen eine ASCII-sichere Markierung
 * gewünscht ist.
 *
 * BEKANNTE GRENZE DER QUELLE (wichtig): Der Wikipedia-Artikel dokumentiert
 * nur genau die oben genannten ACHT Präfix/Murmel-Paare (ར vor ག/ཇ/ད/བ,
 * ས vor སྦྱ/སྦྲ, ག vor ཞ/ཟ). Klassisches Tibetisch kennt daneben weitere
 * Präfixbuchstaben (ག ད བ མ འ), die vor vielen Grundbuchstaben stehen
 * können und dabei oft stumm sind (z. B. བཀོད་ = "kö[d]", nicht
 * "b°akod°"), aber die genauen Kombinationsregeln dafür liefert dieser
 * Artikel nicht - er erklärt das Roman-Dzongkha-System allgemeinverständ-
 * lich, ist aber keine vollständige Referenz der tibetischen
 * Präfixgrammatik. Diese Datei behandelt daher nur die acht belegten
 * Paare korrekt; bei allen anderen Präfix+Basis-Kombinationen wird der
 * Präfixbuchstabe wie ein eigenständiger Konsonant mit eigenem Vokal
 * behandelt, was zu einer zu langen, nicht immer korrekten Umschrift
 * führt (funktionale Näherung, kein Datenverlust, aber linguistisch nicht
 * immer exakt). Für eine vollständigere Abdeckung bräuchte es eine
 * dedizierte Referenz zur tibetischen Präfixorthographie über diesen
 * Artikel hinaus.
 */

// Konsonanten-Cluster (inkl. ggf. Präfix + Subskript), sortiert nach Länge
// absteigend gematcht (siehe transliteriereDzongkha()). Schlüssel sind die
// exakten Zeichenfolgen aus der Quelltabelle (ohne das abschließende Tsheg
// "་", das separat behandelt wird).
const KONSONANTEN_CLUSTER = {
  // Einfache Grundbuchstaben (grün = immer hoher Ton)
  '\u0F40': 'k', '\u0F41': 'kh', '\u0F45': 'c', '\u0F46': 'ch',
  '\u0F4F': 't', '\u0F50': 'th', '\u0F54': 'p', '\u0F55': 'ph',
  '\u0F59': 'ts', '\u0F5A': 'tsh', '\u0F64': 'sh', '\u0F66': 's', '\u0F67': 'h',
  // Einfache Grundbuchstaben (blau = immer tiefer Ton)
  '\u0F47': 'j\u00b0', '\u0F42': 'g\u00b0', '\u0F51': 'd\u00b0', '\u0F56': 'b\u00b0',
  '\u0F5B': 'dz', '\u0F5E': 'zh\u00b0', '\u0F5F': 'z\u00b0', '\u0F62': 'r',
  // Einfache Grundbuchstaben (rot = default tiefer Ton, siehe Moduldoku)
  '\u0F61': 'y', '\u0F5D': 'w', '\u0F63': 'l', '\u0F53': 'n',
  '\u0F44': 'ng', '\u0F49': 'ny', '\u0F58': 'm',
  // "Murmelnde" Varianten mit Subskript (blau)
  '\u0F56\u0FB1': 'bj\u00b0', // བྱ
  '\u0F56\u0FB2': 'dr\u00b0', // བྲ
  // Feste Subskript-Cluster ohne Präfix-Ambiguität (grün)
  '\u0F54\u0FB1': 'pc', // པྱ
  '\u0F55\u0FB1': 'pch', // ཕྱ
  '\u0F40\u0FB2': 'tr', // ཀྲ
  '\u0F41\u0FB2': 'thr', // ཁྲ
  '\u0F67\u0FB2': 'hr', // ཧྲ
  '\u0F63\u0FB7': 'lh', // ལྷ
  // Präfix ར vor ག/ཇ/ད/བ (Subskript-Form) -> "klare" Variante (blau)
  '\u0F62\u0F92': 'g', // རྒ
  '\u0F62\u0F97': 'j', // རྗ
  '\u0F62\u0FA1': 'd', // རྡ
  '\u0F62\u0FA6': 'b', // རྦ
  // Präfix ས vor བྱ/བྲ (Subskript-Form) -> "klare" Variante (blau)
  '\u0F66\u0FA6\u0FB1': 'bj', // སྦྱ
  '\u0F66\u0FA6\u0FB2': 'dr', // སྦྲ
  // Präfix ག vor ཞ/ཟ (volle Buchstabengröße, kein Subskript) -> "klare" Variante (blau)
  '\u0F42\u0F5E': 'zh', // གཞ
  '\u0F42\u0F5F': 'z', // གཟ
};

const KONSONANTEN_SCHLUESSEL = Object.keys(KONSONANTEN_CLUSTER).sort((a, b) => b.length - a.length);

// Generischer Fallback für Basis+Subskript-Kombinationen, die NICHT in der
// Wikipedia-Quelltabelle als eigener (ggf. tonrelevanter) Cluster benannt
// sind (z. B. ལྟ in ལྟོ་ཚང་, "lto tshang"). Programmatisch aus den
// offiziellen Unicode-Zeichennamen abgeleitet (TIBETAN SUBJOINED LETTER X
// -> TIBETAN LETTER X), nicht auswendig übertragen - siehe Kommentar unten
// zur Herkunft. Wird nur genutzt, wenn sowohl Basis- als auch
// Subskript-Buchstabe als einfacher Konsonant in KONSONANTEN_CLUSTER
// bekannt sind (deckt also nur die modernen Dzongkha-Konsonanten ab,
// nicht die zusätzlichen Sanskrit-Retroflex-/Aspiraten-Buchstaben, die im
// Wikipedia-Artikel gar nicht erst vorkommen).
const SUBSKRIPT_ZU_BASIS = {
  '\u0F90': '\u0F40', '\u0F91': '\u0F41', '\u0F92': '\u0F42', '\u0F94': '\u0F44',
  '\u0F95': '\u0F45', '\u0F96': '\u0F46', '\u0F97': '\u0F47', '\u0F99': '\u0F49',
  '\u0F9F': '\u0F4F', '\u0FA0': '\u0F50', '\u0FA1': '\u0F51', '\u0FA3': '\u0F53',
  '\u0FA4': '\u0F54', '\u0FA5': '\u0F55', '\u0FA6': '\u0F56', '\u0FA8': '\u0F58',
  '\u0FA9': '\u0F59', '\u0FAA': '\u0F5A', '\u0FAB': '\u0F5B', '\u0FAD': '\u0F5D',
  '\u0FAE': '\u0F5E', '\u0FAF': '\u0F5F', '\u0FB1': '\u0F61', '\u0FB2': '\u0F62',
  '\u0FB3': '\u0F63', '\u0FB4': '\u0F64', '\u0FB6': '\u0F66', '\u0FB7': '\u0F67',
};

// "Stille" Vokalträger (kein eigener Konsonantenlaut) für vokalisch
// beginnende Silben.
const VOKALTRAEGER = new Set(['\u0F60', '\u0F68']); // འ ཨ

// Abhängige Vokalzeichen. Kein Zeichen -> inhärentes "a".
const VOKALZEICHEN = {
  '\u0F72': 'i', '\u0F74': 'u', '\u0F7A': 'e', '\u0F7C': 'o',
};

const NGA = '\u0F44'; // ང - siehe "immer lang vor ng"-Regel in der Moduldoku
const TSHEG = '\u0F0B'; // ་ - Silbentrenner, wird als Leerzeichen ausgegeben

const SONSTIGE = {
  [TSHEG]: ' ',
  '\u0F0D': '.', '\u0F0E': '.', // ། ༎ (Shad/Doppel-Shad, Satzende)
  '\u0F20': '0', '\u0F21': '1', '\u0F22': '2', '\u0F23': '3', '\u0F24': '4',
  '\u0F25': '5', '\u0F26': '6', '\u0F27': '7', '\u0F28': '8', '\u0F29': '9',
};

const DZONGKHA_SPRACHCODES = new Set(['dz-BT']);

/** Ob für einen Sprachcode die Dzongkha-Umschrift zuständig ist. */
export function hatDzongkhaSchema(code) {
  return DZONGKHA_SPRACHCODES.has(code);
}

/** Sucht ab Position i den längsten passenden Konsonanten-Cluster:
 * zuerst kuratierte Mehrzeichen-Cluster (längste zuerst), dann der
 * generische Basis+Subskript-Fallback, zuletzt ein einfacher
 * Einzelbuchstabe (siehe SUBSKRIPT_ZU_BASIS). */
function findeKonsonantenCluster(zeichen, i) {
  for (const schluessel of KONSONANTEN_SCHLUESSEL) {
    if (schluessel.length === 1 || schluessel.length > zeichen.length - i) continue;
    let passt = true;
    for (let k = 0; k < schluessel.length; k += 1) {
      if (zeichen[i + k] !== schluessel[k]) {
        passt = false;
        break;
      }
    }
    if (passt) return { laut: KONSONANTEN_CLUSTER[schluessel], laenge: schluessel.length };
  }

  const basisLaut = KONSONANTEN_CLUSTER[zeichen[i]];
  const subskript = zeichen[i + 1];
  if (
    basisLaut !== undefined &&
    subskript !== undefined &&
    Object.prototype.hasOwnProperty.call(SUBSKRIPT_ZU_BASIS, subskript)
  ) {
    const subskriptBasisLaut = KONSONANTEN_CLUSTER[SUBSKRIPT_ZU_BASIS[subskript]];
    if (subskriptBasisLaut !== undefined) {
      return { laut: basisLaut + subskriptBasisLaut, laenge: 2 };
    }
  }

  if (Object.prototype.hasOwnProperty.call(KONSONANTEN_CLUSTER, zeichen[i])) {
    return { laut: KONSONANTEN_CLUSTER[zeichen[i]], laenge: 1 };
  }

  return null;
}

/**
 * Transliteriert Dzongkha (tibetische Schrift) nach Roman Dzongkha.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereDzongkha(text) {
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];

    const istVokaltraeger = VOKALTRAEGER.has(aktuelles);

    // འ/ཨ können auch als STUMMES Präfix vor einem Konsonanten stehen
    // (z. B. འཆར་ "char", nicht "achar" - vgl. Wylie "'char"), nicht nur
    // als eigener vokalischer Silbenanlaut. Nur wenn danach KEIN
    // erkennbarer Konsonanten-Cluster folgt, wird der Vokalträger als
    // eigene Silbe behandelt.
    if (istVokaltraeger && findeKonsonantenCluster(zeichen, i + 1)) {
      i += 1;
      continue;
    }

    const cluster = istVokaltraeger ? null : findeKonsonantenCluster(zeichen, i);

    if (istVokaltraeger || cluster) {
      const konsonantenLaut = cluster ? cluster.laut : '';
      let j = i + (cluster ? cluster.laenge : 1);

      let vokal;
      if (Object.prototype.hasOwnProperty.call(VOKALZEICHEN, zeichen[j])) {
        vokal = VOKALZEICHEN[zeichen[j]];
        j += 1;
      } else {
        vokal = 'a';
      }

      // "Vokale sind immer lang vor ng" (siehe Moduldoku); danach: alle
      // weiteren Konsonanten VOR dem nächsten Tsheg sind - wie in der
      // tibetischen Orthographie üblich - stumme Koda-Buchstaben ohne
      // eigenen Vokal, keine neue Silbe (z. B. འཆར་ = "char", nicht
      // "chara"). Werden hier bis zum nächsten Tsheg/Nicht-Konsonanten
      // konsumiert und als bloßer Konsonantenlaut angehängt.
      let kodaLaut = '';
      let erstesKoda = true;
      while (true) {
        const koda = findeKonsonantenCluster(zeichen, j);
        if (!koda) break;
        if (erstesKoda && zeichen[j] === NGA && koda.laenge === 1) {
          vokal += vokal;
        }
        erstesKoda = false;
        kodaLaut += koda.laut;
        j += koda.laenge;
      }

      ergebnis += konsonantenLaut + vokal + kodaLaut;
      i = j;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(SONSTIGE, aktuelles)) {
      ergebnis += SONSTIGE[aktuelles];
      i += 1;
      continue;
    }

    // Unbekanntes Zeichen (Leerzeichen, lateinische Reste, seltene/nicht
    // dokumentierte tibetische Sonderzeichen) unverändert durchreichen.
    ergebnis += aktuelles;
    i += 1;
  }

  return ergebnis;
}
