/**
 * tibetischTransliteration.js
 *
 * Umschrift von Standard-Tibetisch (tibetische Schrift, bo-CN) nach
 * lateinischer Lesung. Zwei Stufen, in dieser Reihenfolge:
 *
 * 1. WÖRTERBUCH (bevorzugt, wo vorhanden): ein aus WikiPron/Wiktionary
 *    erzeugtes Aussprachewörterbuch (siehe data/TIBETISCH_AUSSPRACHE_LIZENZ.md
 *    für Quelle, Lizenz und Methodik) liefert die tatsaechlich gesprochene
 *    (Lhasa-)Aussprache - inklusive der im Tibetischen sehr haeufigen
 *    STUMMEN Praefix-/Suffixbuchstaben, die keine reine Schriftumschrift
 *    kennen kann.
 * 2. WYLIE-FALLBACK (neu, fuer alles ausserhalb der 1.564 Woerterbuch-
 *    Eintraege): eine algorithmische, rein SCHRIFTBASIERTE Umschrift nach
 *    dem in der Tibetologie etablierten Wylie-System (Turrell Wylie, 1959) -
 *    siehe wyileTransliteriereSilbe() unten. Anders als beim Woerterbuch
 *    ist das AUSDRÜCKLICH KEINE Ausspracheumschrift, sondern eine
 *    buchstabengetreue Wiedergabe der SCHREIBUNG: stumme Praefix-/
 *    Suffixbuchstaben, die in der gesprochenen Sprache verschwinden,
 *    erscheinen hier weiterhin (z. B. wird རྒྱན wörterbuchlos zu "rgyan"
 *    statt der tatsaechlich gesprochenen Form "gyän" - vgl. die
 *    rekonstruierten (*) WikiPron-Eintraege mit demselben bekannten
 *    Problem, siehe Lizenzdatei). Das ist dennoch eine erhebliche
 *    Verbesserung gegenueber dem vorherigen Zustand, in dem Woerter ausserhalb
 *    des Woerterbuchs GAR NICHT umgeschrieben wurden (0%, nicht angenaehert) -
 *    Wylie ist zumindest lesbares, konsistent rekonstruierbares Latein statt
 *    liegengebliebener tibetischer Schrift in der Ausgabe.
 *
 * WORTGRENZEN: Tibetischer Text trennt einzelne SILBEN durch das
 * Tsheg-Zeichen (་, U+0F0B), aber nicht notwendigerweise ganze WÖRTER
 * (mehrsilbige Wörter wie ཐལ་བ enthalten selbst ein Tsheg). Die
 * Worterkennung sucht daher - wie beim strukturell verwandten
 * Khmer-Modul (siehe khmerTransliteration.js) - nach der LÄNGSTEN
 * Wörterbuch-Übereinstimmung ab jeder Position innerhalb eines
 * zusammenhängenden Laufs tibetischer Schriftzeichen. Nur wenn dabei
 * KEIN Wörterbuch-Treffer gefunden wird, uebernimmt der Wylie-Fallback
 * genau eine Silbe (bis zum naechsten Tsheg/Shad/Nicht-Tibetisch-Zeichen).
 */

const TIBETISCH_AUSSPRACHE_URL = new URL('../data/tibetischAussprache.json', import.meta.url).href;

let tibetischAusspracheePromise = null;
let tibetischWoerterbuchMaxLaenge = 0;

/**
 * Lädt (einmalig, gecached) das Tibetisch-Aussprachewörterbuch.
 * Schlägt das Laden fehl, wird `null` geliefert - es greift dann
 * ausschliesslich der Wylie-Fallback unten (kein Totalausfall mehr wie
 * frueher, siehe Moduldoku).
 * @returns {Promise<Map<string, string> | null>}
 */
function ladeTibetischAussprache() {
  if (!tibetischAusspracheePromise) {
    tibetischAusspracheePromise = fetch(TIBETISCH_AUSSPRACHE_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => {
        const woerterbuch = new Map(Object.entries(daten.woerter ?? {}));
        for (const wort of woerterbuch.keys()) {
          tibetischWoerterbuchMaxLaenge = Math.max(tibetischWoerterbuchMaxLaenge, wort.length);
        }
        return woerterbuch;
      })
      .catch((fehler) => {
        console.warn(
          'Tibetisch-Aussprachewörterbuch konnte nicht geladen werden, ' +
            'nur der Wylie-Fallback ist verfuegbar:',
          fehler,
        );
        return null;
      });
  }
  return tibetischAusspracheePromise;
}

// --- Wylie-Fallback (siehe Moduldoku oben) ---

// Basiskonsonanten -> Wylie-Buchstabe. ཨ (blosser Vokaltraeger, wie
// hebraeisch Alef/arabisch Alif) hat keinen eigenen Lautwert (''). Seltene
// Sanskrit-Retroflexe (ཊཋཌཎ) und Konjunkte (ཀྵ) folgen der akademischen
// Wylie-Konvention (T/D/N-Reihe), hier als Doppelbuchstaben angenaehert, da
// das Projekt keine Grossbuchstaben-Diakritika im Ausgabealphabet nutzt.
const WYLIE_BASIS = {
  'ཀ': 'k', 'ཁ': 'kh', 'ག': 'g', 'གྷ': 'gh', 'ང': 'ng',
  'ཅ': 'c', 'ཆ': 'ch', 'ཇ': 'j', 'ཉ': 'ny',
  'ཊ': 'tt', 'ཋ': 'tth', 'ཌ': 'dd', 'ཌྷ': 'ddh', 'ཎ': 'nn',
  'ཏ': 't', 'ཐ': 'th', 'ད': 'd', 'དྷ': 'dh', 'ན': 'n',
  'པ': 'p', 'ཕ': 'ph', 'བ': 'b', 'བྷ': 'bh', 'མ': 'm',
  'ཙ': 'ts', 'ཚ': 'tsh', 'ཛ': 'dz', 'ཛྷ': 'dzh',
  'ཝ': 'w', 'ཞ': 'zh', 'ཟ': 'z', 'འ': "'", 'ཡ': 'y', 'ར': 'r', 'ལ': 'l',
  'ཤ': 'sh', 'ཥ': 'ss', 'ས': 's', 'ཧ': 'h', 'ཨ': '',
  'ཀྵ': 'ksh', 'ཪ': 'r', 'ཫ': 'kk', 'ཬ': 'rr',
};

// Subskribierte (gestapelte) Konsonanten liegen im Unicode-Ethiopic-Block
// -aehnlich systematisch: JEDE subskribierte Form liegt exakt +0x50 hinter
// ihrer Basisform (z. B. ཀ U+0F40 -> ྐ U+0F90, verifiziert fuer den
// gesamten Bereich U+0F40-U+0F68). Wylie unterscheidet Basis- und
// Subskript-Form NICHT durch unterschiedliche Buchstaben (die Position im
// Stapel drueckt sich allein durch die Zeichenfolge aus), daher hier
// automatisch aus WYLIE_BASIS abgeleitet statt von Hand gepflegt. Die drei
// "Fixed-Form"-Buchstaben (ཪཫཬ, nur fuer Sanskrit-Transliteration) folgen
// dem Muster NICHT einheitlich und werden bewusst ausgenommen (in echtem
// Tibetisch-Flietext praktisch nie als Subskript verwendet).
const WYLIE_SUBSKRIPT = {};
for (const [basis, wert] of Object.entries(WYLIE_BASIS)) {
  if (basis.length === 1 && basis.codePointAt(0) < 0x0f6a) {
    WYLIE_SUBSKRIPT[String.fromCodePoint(basis.codePointAt(0) + 0x50)] = wert;
  }
}

// Vokalzeichen -> Wylie-Vokal. Kein Vokalzeichen an der Silbe -> impliziter
// Vokal "a" (siehe wylieTransliteriereSilbe() unten). Die seltenen
// vokalischen r/l (Sanskrit-Entlehnung) werden als "ri"/"li" angenaehert,
// da das Projekt keine silbischen Konsonanten im Ausgabealphabet vorsieht.
const WYLIE_VOKAL = {
  'ཱ': 'aa', // Laengungszeichen (Vokal Sign AA) - haengt an implizitem a.
  'ི': 'i', 'ཱི': 'ii',
  'ུ': 'u', 'ཱུ': 'uu',
  'ྲྀ': 'ri', 'ཷ': 'rii', 'ླྀ': 'li', 'ཹ': 'lii',
  'ེ': 'e', 'ཻ': 'ee',
  'ོ': 'o', 'ཽ': 'au',
  'ྀ': 'i', // Reversed I (selten).
};

// Nicht-lautliche Interpunktion/Ziffern (siehe Bugreports zu vergleichbaren
// Zeichen bei Thai/Lao/Khmer: Satzzeichen bekommen eine sinnvolle ASCII-
// Entsprechung statt stillschweigend zu verschwinden).
const TIBETISCH_INTERPUNKTION = {
  '\u0F0B': ' ', // Tsheg - Silbentrenner, siehe Moduldoku.
  '\u0F0C': ' ', // Tsheg bstar (Variante).
  '\u0F0D': '.', // Shad - Satzende/Pause.
  '\u0F0E': '.', // Nyis shad (doppeltes Shad) - staerkere Pause, hier gleich behandelt.
  '\u0F20': '0', '\u0F21': '1', '\u0F22': '2', '\u0F23': '3', '\u0F24': '4',
  '\u0F25': '5', '\u0F26': '6', '\u0F27': '7', '\u0F28': '8', '\u0F29': '9',
};

function istWylieBasisOderSubskript(z) {
  return z !== undefined && (Object.prototype.hasOwnProperty.call(WYLIE_BASIS, z) || Object.prototype.hasOwnProperty.call(WYLIE_SUBSKRIPT, z));
}

// Die 5 moeglichen Praefixbuchstaben (ངོན་འཇུག, ngonjug) - eine
// grammatikalisch klar definierte, GESCHLOSSENE Menge (kein lexikalisches/
// woerterbuchpflichtiges Wissen, sondern eine feste Regel der
// tibetischen Rechtschreibung): steht einer dieser fuenf Buchstaben ganz
// am Anfang einer Tsheg-Einheit UND folgt ihm ein weiterer gueltiger
// Wurzelbuchstabe, ist er ein stummer Praefix, kein eigener Vokaltraeger.
// Ohne diese Erkennung wuerde z. B. འཇིག ("jig") faelschlich in drei
// separate Silben "'a" + "ji" + "ga" auseinanderfallen, weil der Parser
// nach dem Praefix voreilig einen eigenen (impliziten) Vokal annehmen
// wuerde, statt weiterzulesen bis zum tatsaechlichen Vokalzeichen.
const PRAEFIXBUCHSTABEN = new Set(['ག', 'ད', 'བ', 'མ', 'འ']);

/**
 * Liest ab Position i genau eine tibetische Silbe (Tsheg-Einheit: optionaler
 * Praefix + Konsonantenstapel + optionales Vokalzeichen + optionale
 * Suffixbuchstaben, endet vor dem naechsten Tsheg/Shad/Nicht-Tibetisch-
 * Zeichen) und liefert deren Wylie-Umschrift plus Anzahl konsumierter
 * Zeichen. Gibt null zurueck, wenn an dieser Position kein gueltiger
 * Tibetisch-Buchstabe steht.
 * @param {string[]} zeichen
 * @param {number} start
 * @returns {{text: string, consumed: number} | null}
 */
function wylieTransliteriereSilbe(zeichen, start) {
  if (!istWylieBasisOderSubskript(zeichen[start])) {
    return null;
  }

  let i = start;
  let praefix = '';
  // WICHTIG: Der Buchstabe NACH einem moeglichen Praefix muss eine
  // BASISFORM sein (Beginn eines neuen Wurzelstapels) - folgt direkt ein
  // SUBSKRIBIERTES Zeichen, ist der vermeintliche Praefix in Wirklichkeit
  // selbst die Stapelbasis (z. B. བྐྲ "bkra": བ traegt hier ཀ/ར als
  // eigenen Stapel, ist also KEIN Praefix vor einem separaten Kha-Stamm).
  if (PRAEFIXBUCHSTABEN.has(zeichen[i]) && Object.prototype.hasOwnProperty.call(WYLIE_BASIS, zeichen[i + 1])) {
    praefix = WYLIE_BASIS[zeichen[i]];
    i += 1;
  }

  let konsonanten = '';
  // Konsonantenstapel: erstes Zeichen ist die Basisform, alles direkt
  // danach Folgende an Subskript-Zeichen gehoert zum selben Stapel
  // (z. B. སྒྲ = ས + subskribiert ག + subskribiert ར). Sicherheitsnetz:
  // faellt der Aufruf durch eine ungewoehnliche Zeichenfolge ausnahmsweise
  // direkt auf ein subskribiertes Zeichen (sollte bei reguraerer
  // tibetischer Rechtschreibung nicht vorkommen), wird trotzdem dessen
  // Lautwert verwendet statt eine leere Lesung zu erzeugen.
  konsonanten += WYLIE_BASIS[zeichen[i]] ?? WYLIE_SUBSKRIPT[zeichen[i]] ?? '';
  i += 1;
  while (Object.prototype.hasOwnProperty.call(WYLIE_SUBSKRIPT, zeichen[i])) {
    konsonanten += WYLIE_SUBSKRIPT[zeichen[i]];
    i += 1;
  }

  // Vokalzeichen einsammeln (Laengungszeichen ཱ + ein weiteres Vokalzeichen
  // kombinieren zu einer eigenen langen Lesung, z. B. ཱི = "ii").
  let vokalStr = '';
  while (Object.prototype.hasOwnProperty.call(WYLIE_VOKAL, zeichen[i]) || zeichen[i] === '\u0F71') {
    vokalStr += zeichen[i];
    i += 1;
  }
  const vokal = vokalStr.length > 0 ? (WYLIE_VOKAL[vokalStr] ?? 'a') : 'a';
  let nachsilbe = '';

  // Anusvara (Nasalierung, z. B. in Mantras wie ཨོཾ "om") bzw. Visarga
  // (seltener, Sanskrit-Endbehauchung) haengen sich an den Vokal an, statt
  // selbst eine neue Silbe zu beginnen.
  if (zeichen[i] === '\u0F7E') {
    nachsilbe = 'm';
    i += 1;
  } else if (zeichen[i] === '\u0F7F') {
    nachsilbe = 'h';
    i += 1;
  }

  // Suffixbuchstaben (bis zu zwei, z. B. ད/ས als zweiter Suffix): weitere
  // Basisbuchstaben DIREKT im Anschluss (kein eigener Stapel, kein
  // eigenes Vokalzeichen - ein Tsheg-Block enthaelt laut Definition immer
  // nur EINEN vokaltragenden Wurzelstamm) gehoeren noch zu dieser
  // Tsheg-Einheit und werden direkt angehaengt, ohne einen weiteren
  // impliziten Vokal zu bekommen (z. B. das g in འཇིག "jig").
  let suffixe = '';
  while (Object.prototype.hasOwnProperty.call(WYLIE_BASIS, zeichen[i])) {
    suffixe += WYLIE_BASIS[zeichen[i]];
    i += 1;
  }

  return { text: praefix + konsonanten + vokal + nachsilbe + suffixe, consumed: i - start };
}

// Lauf zusammenhängender tibetischer Schriftzeichen (Unicode-Block
// U+0F00-U+0FFF, deckt Buchstaben, Vokalzeichen, Tsheg und Interpunktion ab).
const TIBETISCH_LAUF_REGEX = /[\u0F00-\u0FFF]+/gu;

/**
 * Ersetzt innerhalb eines zusammenhängenden tibetischen Textlaufs jede per
 * längster Übereinstimmung gefundene Wörterbuch-Silbe/-Wort durch ihre
 * lateinische (Aussprache-)Lesung. Findet sich an einer Position KEIN
 * Wörterbuch-Treffer, übernimmt wylieTransliteriereSilbe() genau eine
 * Silbe als Schrift-Naeherung (siehe Moduldoku). Tsheg/Shad zwischen zwei
 * umgeschriebenen Abschnitten werden zu Leerzeichen bzw. Punkt.
 * @param {string} lauf
 * @param {Map<string, string> | null} woerterbuch
 * @returns {string}
 */
// Zeichen, die NIE eine Silbe/ein Wort beginnen, sondern immer an das
// vorangehende Zeichen "andocken": Vokalzeichen/-laengungszeichen/
// Kombinationsmarker (U+0F71-U+0F84) und subskribierte Konsonanten
// (U+0F90-U+0FBC, siehe WYLIE_SUBSKRIPT oben). Folgt eines dieser Zeichen
// DIREKT auf einen Woerterbuch-Kandidaten, ist dieser Kandidat noch nicht
// zuende - selbst wenn die reine Buchstabenfolge zufaellig einen eigenen
// Eintrag trifft (das WikiPron-Woerterbuch enthaelt u. a. auch einzelne
// Buchstaben unter ihrem eigenen Lautnamen, z. B. ཀ -> "ka" - ohne diese
// Pruefung wuerde "ཀི" [ki] am ཀ-Eintrag abgeschnitten und das folgende
// Vokalzeichen ི bliebe als Rohzeichen uebrig statt mit ཀ zu "ki" zu
// verschmelzen).
function istFortsetzungszeichen(z) {
  if (z === undefined) return false;
  const cp = z.codePointAt(0);
  return (cp >= 0x0f71 && cp <= 0x0f84) || (cp >= 0x0f90 && cp <= 0x0fbc);
}

function ersetzeLauf(lauf, woerterbuch) {
  const zeichen = Array.from(lauf);
  let ergebnis = '';
  let i = 0;

  const haengeAn = (text) => {
    const brauchtLeerzeichen = ergebnis.length > 0 && text.length > 0 && !ergebnis.endsWith(' ') && !ergebnis.endsWith('.');
    ergebnis += (brauchtLeerzeichen ? ' ' : '') + text;
  };

  while (i < zeichen.length) {
    let treffer = null;
    if (woerterbuch) {
      const maxLaenge = Math.min(tibetischWoerterbuchMaxLaenge, zeichen.length - i);
      for (let laenge = maxLaenge; laenge >= 1; laenge -= 1) {
        if (istFortsetzungszeichen(zeichen[i + laenge])) continue;
        const kandidat = zeichen.slice(i, i + laenge).join('');
        if (woerterbuch.has(kandidat)) {
          treffer = kandidat;
          break;
        }
      }
    }

    if (treffer) {
      haengeAn(woerterbuch.get(treffer));
      i += treffer.length;
    } else {
      const silbe = wylieTransliteriereSilbe(zeichen, i);
      if (silbe) {
        haengeAn(silbe.text);
        i += silbe.consumed;
      } else if (Object.prototype.hasOwnProperty.call(TIBETISCH_INTERPUNKTION, zeichen[i])) {
        ergebnis += TIBETISCH_INTERPUNKTION[zeichen[i]];
        i += 1;
        continue;
      } else {
        ergebnis += zeichen[i];
        i += 1;
        continue;
      }
    }

    // Ein direkt folgendes Tsheg/Shad trennt zwei bereits umschriebene
    // Abschnitte - als Leerzeichen/Punkt ausgeben statt es unveraendert
    // stehen zu lassen.
    if (Object.prototype.hasOwnProperty.call(TIBETISCH_INTERPUNKTION, zeichen[i])) {
      ergebnis += TIBETISCH_INTERPUNKTION[zeichen[i]];
      i += 1;
    }
  }

  return ergebnis.replace(/ +/g, ' ').trim();
}

/**
 * Transliteriert tibetische Schrift nach lateinischer Lesung: bevorzugt
 * ueber das WikiPron/Wiktionary-Aussprachewörterbuch, fuer alles ausserhalb
 * davon ueber den Wylie-Fallback (siehe Moduldoku oben fuer den wichtigen
 * Unterschied zwischen den beiden - Aussprache vs. reine Schriftumschrift).
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereTibetischMitWoerterbuch(text) {
  const woerterbuch = await ladeTibetischAussprache();
  return text.replace(TIBETISCH_LAUF_REGEX, (lauf) => ersetzeLauf(lauf, woerterbuch));
}

const TIBETISCH_SPRACHCODES = new Set(['bo-CN']);

/** Ob für einen Sprachcode die Tibetisch-Umschrift zuständig ist. */
export function hatTibetischesSchema(code) {
  return TIBETISCH_SPRACHCODES.has(code);
}
