/**
 * chineseWordSegmentation.js
 * Chinesisch wird ohne Leerzeichen zwischen den Wörtern geschrieben - eine
 * reine Zeichen-für-Zeichen-Pinyin-Umschrift (siehe chinesePinyin.js)
 * ergibt deshalb einen einzigen, unlesbaren Zeichenblock ohne Wortgrenzen.
 * Dieses Modul erkennt VOR der eigentlichen Umschrift Wortgrenzen anhand
 * einer aus CC-CEDICT extrahierten Wortliste (siehe
 * data/CHINESISCH_WORTLISTE_LIZENZ.md) und fügt an diesen Stellen
 * Leerzeichen in den chinesischen Text ein.
 *
 * Vorgehen (Greedy-Longest-Match, wie bei khmerTransliteration.js):
 * an jeder Position wird zunächst versucht, das LÄNGSTE in der Wortliste
 * vorhandene Wort zu finden; erst wenn keines passt, wird ein einzelnes
 * Zeichen als eigenständiges (einsilbiges) Wort behandelt. Anders als im
 * Khmer-Modul wird dabei auch vor/zwischen nicht gefundenen
 * Einzelzeichen ein Leerzeichen gesetzt, da im Chinesischen praktisch
 * jedes Schriftzeichen eine potenziell eigenständige Silbe/ein
 * eigenständiges Morphem ist - das entspricht der in der Hanyu-Pinyin-
 * Rechtschreibung (GB/T 16159) üblichen wortweisen Leerzeichen-Setzung.
 *
 * POLYPHON-KORREKTUR: Zusätzlich zur reinen Wortgrenzen-Liste wird eine
 * zweite, kleinere Tabelle geladen (chinesischWortPinyinSimp/Trad.json),
 * die für rund 14.400 mehrsilbige Wörter je Schriftvariante die WORT-
 * BASIERTE (kontextrichtige) Pinyin-Lesung aus CC-CEDICT enthält - nur für
 * Wörter, bei denen diese von der zeichenweisen Standardlesung abweicht
 * (z. B. 行动 "xingdong", nicht zeichenweise "hangdong"). Erkennt die
 * Wortgrenzen-Suche unten ein Wort, das AUCH dort steht, wird direkt
 * dessen fertige Lesung eingesetzt statt der Zeichen-fuer-Zeichen-Tabelle
 * (siehe fuegeWortgrenzenEin() unten). Das behebt die in chinesePinyin.js
 * dokumentierte Polyphon-Einschränkung fuer alle abgedeckten Wörter.
 */

const CHINESISCH_WORTLISTE_SIMP_URL = new URL('../data/chinesischWortlisteSimp.json', import.meta.url).href;
const CHINESISCH_WORTLISTE_TRAD_URL = new URL('../data/chinesischWortlisteTrad.json', import.meta.url).href;
const CHINESISCH_WORT_PINYIN_SIMP_URL = new URL('../data/chinesischWortPinyinSimp.json', import.meta.url).href;
const CHINESISCH_WORT_PINYIN_TRAD_URL = new URL('../data/chinesischWortPinyinTrad.json', import.meta.url).href;

let wortlistePromiseSimp = null;
let wortlistePromiseTrad = null;
let maxLaengeSimp = 0;
let maxLaengeTrad = 0;

let wortPinyinPromiseSimp = null;
let wortPinyinPromiseTrad = null;

/**
 * Lädt (einmalig, gecached) eine der beiden Wortlisten. Schlägt das Laden
 * fehl, wird `null` geliefert - die Umschrift fällt dann transparent auf
 * die reine Zeichen-für-Zeichen-Umschrift ohne Wortgrenzen-Erkennung
 * zurück (ein langer Zeichenblock statt eines Fehlers).
 * @param {string} url
 * @param {(laenge: number) => void} setzeMaxLaenge
 * @returns {Promise<Set<string> | null>}
 */
function ladeWortliste(url, setzeMaxLaenge) {
  return fetch(url)
    .then((antwort) => {
      if (!antwort.ok) {
        throw new Error(`HTTP ${antwort.status}`);
      }
      return antwort.json();
    })
    .then((daten) => {
      const woerter = new Set(daten.woerter ?? []);
      let maxLaenge = 0;
      for (const wort of woerter) {
        maxLaenge = Math.max(maxLaenge, Array.from(wort).length);
      }
      setzeMaxLaenge(maxLaenge);
      return woerter;
    })
    .catch((fehler) => {
      console.warn(
        'Chinesische Wortliste konnte nicht geladen werden, nutze nur die ' +
          'zeichenbasierte Umschrift ohne Wortgrenzen-Erkennung:',
        fehler,
      );
      return null;
    });
}

function ladeWortlisteSimp() {
  if (!wortlistePromiseSimp) {
    wortlistePromiseSimp = ladeWortliste(CHINESISCH_WORTLISTE_SIMP_URL, (l) => {
      maxLaengeSimp = l;
    });
  }
  return wortlistePromiseSimp;
}

function ladeWortlisteTrad() {
  if (!wortlistePromiseTrad) {
    wortlistePromiseTrad = ladeWortliste(CHINESISCH_WORTLISTE_TRAD_URL, (l) => {
      maxLaengeTrad = l;
    });
  }
  return wortlistePromiseTrad;
}

/**
 * Lädt (einmalig, gecached) die wortbasierte Polyphon-Korrektur-Tabelle.
 * Schlägt das Laden fehl, wird ein leeres Map geliefert - die Umschrift
 * fällt dann transparent auf die reine Wortgrenzen-Erkennung ohne
 * Polyphon-Korrektur zurück (keine Verschlechterung ggü. vorher).
 * @param {string} url
 * @returns {Promise<Map<string, string>>}
 */
function ladeWortPinyin(url) {
  return fetch(url)
    .then((antwort) => {
      if (!antwort.ok) {
        throw new Error(`HTTP ${antwort.status}`);
      }
      return antwort.json();
    })
    .then((daten) => new Map(Object.entries(daten.woerter ?? {})))
    .catch((fehler) => {
      console.warn(
        'Chinesische Wort-Pinyin-Tabelle (Polyphon-Korrektur) konnte nicht ' +
          'geladen werden, nutze nur die zeichenbasierte Standardlesung:',
        fehler,
      );
      return new Map();
    });
}

function ladeWortPinyinSimp() {
  if (!wortPinyinPromiseSimp) {
    wortPinyinPromiseSimp = ladeWortPinyin(CHINESISCH_WORT_PINYIN_SIMP_URL);
  }
  return wortPinyinPromiseSimp;
}

function ladeWortPinyinTrad() {
  if (!wortPinyinPromiseTrad) {
    wortPinyinPromiseTrad = ladeWortPinyin(CHINESISCH_WORT_PINYIN_TRAD_URL);
  }
  return wortPinyinPromiseTrad;
}

// CJK Unified Ideographs (Hauptblock, U+4E00-U+9FFF). Deckt den weit
// überwiegenden Teil realer chinesischer Texte ab; seltene
// Erweiterungsblöcke sind bewusst ausgeklammert (Konsistenz mit
// chinesePinyin.js, das denselben Bereich abdeckt).
const HAN_LAUF_REGEX = /[\u4E00-\u9FFF]+/gu;

// Marker-Zeichen (Private-Use-Area), das ein bereits FERTIG umgeschriebenes
// Token umschließt - siehe fuegeWortgrenzenEin() unten. Kein echtes
// Chinesisch-Zeichen, daher unproblematisch als Trennzeichen; wird von
// ersetzeMitLaengstemTreffer() (transliterationClient.js) beim finalen
// Zeichenkarten-Durchlauf nicht angefasst und danach entfernt.
const FERTIG_MARKER_START = '\uE010';
const FERTIG_MARKER_ENDE = '\uE011';

/**
 * Fügt innerhalb eines zusammenhängenden Han-Zeichen-Laufs Leerzeichen an
 * Wortgrenzen ein: erkannte Wörterbuch-Treffer (längste Übereinstimmung
 * zuerst) werden als ein Block behandelt, nicht gefundene Zeichen jeweils
 * einzeln - in jedem Fall getrennt durch ein Leerzeichen vom
 * vorhergehenden Token. Steht ein erkanntes Wort AUCH in der Polyphon-
 * Korrektur-Tabelle (wortPinyin), wird direkt dessen fertige, kontext-
 * richtige Lesung eingesetzt (in Marker-Zeichen eingeschlossen, siehe
 * oben) statt der rohen Schriftzeichen - die spätere zeichenweise
 * Umschrift lässt so markierte Abschnitte unverändert.
 */
function fuegeWortgrenzenEin(lauf, wortliste, maxLaenge, wortPinyin) {
  const zeichen = Array.from(lauf);
  const tokens = [];
  let i = 0;

  while (i < zeichen.length) {
    let treffer = null;
    const obergrenze = Math.min(maxLaenge, zeichen.length - i);
    for (let laenge = obergrenze; laenge >= 2; laenge -= 1) {
      const kandidat = zeichen.slice(i, i + laenge).join('');
      if (wortliste.has(kandidat)) {
        treffer = kandidat;
        break;
      }
    }

    if (treffer) {
      const korrigierteLesung = wortPinyin.get(treffer);
      tokens.push(korrigierteLesung !== undefined ? FERTIG_MARKER_START + korrigierteLesung + FERTIG_MARKER_ENDE : treffer);
      i += treffer.length;
    } else {
      tokens.push(zeichen[i]);
      i += 1;
    }
  }

  return tokens.join(' ');
}

/**
 * Fügt Wortgrenzen (Leerzeichen) in chinesischen Text ein und ersetzt dabei
 * polyphon-relevante Wörter direkt durch ihre kontextrichtige Lesung
 * (siehe Moduldoku oben), bevor der Rest mit der übergebenen Umschrift-
 * Funktion (i. d. R. `ersetzeMitLaengstemTreffer(text, CHINESISCH_PINYIN_MAP)`
 * aus transliterationClient.js) zeichenweise in Pinyin umgewandelt wird.
 * Nimmt die Umschrift-Funktion bewusst als Parameter entgegen (statt sie
 * hier zu importieren), um einen zirkulären Import zwischen diesem Modul
 * und transliterationClient.js zu vermeiden.
 * @param {string} text
 * @param {string} zielsprache - 'zh-CN' (Vereinfacht) oder 'zh-TW' (Traditionell)
 * @param {(text: string) => string} umschriftFn
 * @returns {Promise<string>}
 */
export async function transliteriereChinesischMitWortliste(text, zielsprache, umschriftFn) {
  const istTraditionell = zielsprache === 'zh-TW';
  const wortliste = istTraditionell ? await ladeWortlisteTrad() : await ladeWortlisteSimp();
  const wortPinyin = istTraditionell ? await ladeWortPinyinTrad() : await ladeWortPinyinSimp();

  if (!wortliste) {
    return umschriftFn(text);
  }

  const maxLaenge = istTraditionell ? maxLaengeTrad : maxLaengeSimp;
  const angereicherterText = text.replace(HAN_LAUF_REGEX, (lauf) => fuegeWortgrenzenEin(lauf, wortliste, maxLaenge, wortPinyin));

  // Der finale Zeichenkarten-Durchlauf laesst die Marker-geschuetzten
  // Abschnitte unangetastet (keine Han-Zeichen darin), danach werden nur
  // noch die Marker-Zeichen selbst entfernt.
  return umschriftFn(angereicherterText).replaceAll(FERTIG_MARKER_START, '').replaceAll(FERTIG_MARKER_ENDE, '');
}
