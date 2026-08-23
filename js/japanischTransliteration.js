/**
 * japanischTransliteration.js
 *
 * Umschrift von Japanisch (Kanji + Hiragana + Katakana, ja-JP) nach
 * lateinischer Lesung. Siehe data/JAPANISCH_AUSSPRACHE_LIZENZ.md für
 * Quellen, Lizenzen und die genaue Methodik.
 *
 * PROBLEM: Kanji sind eine Wortschrift - ohne Wörterbuch ist eine correcte
 * Umschrift unmöglich (jedes Zeichen hat je nach Wort meist mehrere
 * mögliche Lesungen). Bisher (siehe alte JAPANISCH_KANA_MAP) wurden Kanji
 * daher komplett übersprungen und landeten unverändert im finalen
 * ASCII-Sicherheitsnetz (Datenverlust).
 *
 * LÖSUNG (zweistufig, nach Priorität):
 *  1. JMdict-Wörterbuch (CC BY-SA 4.0): Kanji-Schreibung -> tatsächliche
 *     wortspezifische Lesung, bereits als lateinische Lesung
 *     vorberechnet (siehe Build-Skript-Dokumentation in der Lizenzdatei).
 *     Längste-Treffer-Suche wie bei tibetischTransliteration.js/
 *     khmerTransliteration.js - skaliert unabhängig von der
 *     Wörterbuchgröße (Laufzeit ~ Textlänge × maximale Wortlänge, NICHT
 *     × Anzahl Wörterbucheinträge).
 *  2. Einzelzeichen-Kanji-Fallback (Wikipedia-Tabelle, 2.136 Zeichen):
 *     nur für Kanji, die JMdict nicht als eigenständiges Wort kennt -
 *     liefert eine kontextfreie (und daher nicht immer korrekte)
 *     On-Lesung, ist aber immer noch besser als Totalverlust.
 *  3. Reine Kana (Hiragana/Katakana), die nicht Teil eines erkannten
 *     Wortes sind (Partikel, Verbendungen, ...), werden über die
 *     JAPANISCH_KANA_MAP aus transliterationClient.js zeichenweise
 *     romanisiert, inkl. Sonderbehandlung von Verdopplungspunkt (っ/ッ)
 *     und Längungszeichen (ー).
 *
 * Alle drei Stufen laufen in EINEM gemeinsamen Längste-Treffer-Durchlauf:
 * das Wörterbuch (Stufe 1+2, bereits vorberechnete lateinische Strings)
 * und die Kana-Tabelle (Stufe 3) werden zu einer einzigen Nachschlage-
 * struktur zusammengefasst; längere Treffer (mehrsilbige JMdict-Wörter)
 * gewinnen automatisch gegen kürzere (einzelne Kana-Digraphen).
 *
 * WORTTRENNUNG: Japanisch schreibt ohne Leerzeichen, das waere also auch
 * fuer die lateinische Umschrift die technisch treue Wiedergabe - in der
 * Praxis macht das den Text aber unlesbar (ein einziger Zeichenblock ohne
 * jede Struktur, siehe Bugreport). Analog zu chineseWordSegmentation.js/
 * khmerTransliteration.js werden daher an Wortgrenzen Leerzeichen
 * eingefuegt: jeder JMdict-/Kanji-Fallback-Treffer bildet ein eigenes
 * Wort, ebenso jede unbekannte Einzelsilbe. Reine Kana-Folgen (Partikel,
 * Verbendungen, Hilfsverben, ...), die NICHT im Woerterbuch stehen,
 * werden dagegen zu einem zusammenhaengenden Block verschmolzen (z. B.
 * "imasu" statt "i ma su"), weil diese Morae grammatisch zusammengehoeren
 * und einzeln getrennt kein sinnvolles Wortbild ergeben.
 */

import { JAPANISCH_KANA_MAP } from './transliterationClient.js';

const JAPANISCH_WOERTERBUCH_URL = new URL('../data/japanischWoerterbuch.json', import.meta.url).href;

let japanischWoerterbuchPromise = null;
let japanischMaxLaenge = 0;

const GEMINATION_ZEICHEN = new Set(['っ', 'ッ']);
const LANGVOKAL_ZEICHEN = new Set(['ー']);

// は/へ/を werden als grammatische PARTIKEL ("wa"/"e"/"o") anders gelesen
// als als gewoehnliche Kana-Mora ("ha"/"he"/"wo") - der klassische
// Stolperstein der Hepburn-Umschrift. Alle drei Zeichen kommen als
// STANDALONE (nicht Teil eines laengeren Kana-Digraphen) praktisch
// ausschliesslich in genau dieser Partikel-Funktion vor, wenn sie NICHT
// bereits Teil eines laengeren JMdict-Wortes sind (siehe Stufe 1+2 oben,
// die hat immer Vorraing) - は als eigenstaendiges Wort ist so gut wie
// immer die Themapartikel, を ist AUSSCHLIESSLICH die Objektpartikel, へ
// so gut wie immer die Richtungspartikel. Siehe Verwendung unten.
const PARTIKEL_LESUNG = { 'は': 'wa', 'へ': 'e', 'を': 'o' };

// Hiragana, Katakana (inkl. Halbbreite), CJK-Kanji-Hauptblock. Alles
// ausserhalb (lateinische Satzzeichen, japanische Satzzeichen wie 、 。,
// Leerraum, ...) wird unveraendert durchgereicht und nimmt NICHT an der
// Worttrennungs-Logik teil (siehe `anhaengen` in
// transliteriereJapanischMitWoerterbuch) - Satzzeichen bringen ihre
// eigene Abtrennung schon mit, ein zusaetzliches Leerzeichen davor waere
// falsch (", " statt " , ").
const JAPANISCHE_SCHRIFT_REGEX = /[\u3040-\u30FF\uFF66-\uFF9F\u4E00-\u9FFF]/u;

/**
 * Lädt (einmalig, gecached) das JMdict-/Kanji-Fallback-Wörterbuch und
 * ermittelt die längste vorkommende Schlüssellänge (für die
 * Längste-Treffer-Suche). Schlägt das Laden fehl, wird `null` geliefert -
 * es wird dann nur noch die reine Kana-Tabelle verwendet (Kanji bleiben
 * unverändert stehen, wie vor diesem Update - keine Regression).
 * @returns {Promise<Map<string, string> | null>}
 */
function ladeJapanischWoerterbuch() {
  if (!japanischWoerterbuchPromise) {
    japanischWoerterbuchPromise = fetch(JAPANISCH_WOERTERBUCH_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => {
        const woerterbuch = new Map(Object.entries(daten.woerter ?? {}));
        for (const wort of woerterbuch.keys()) {
          japanischMaxLaenge = Math.max(japanischMaxLaenge, Array.from(wort).length);
        }
        return woerterbuch;
      })
      .catch((fehler) => {
        console.warn(
          'Japanisch-Wörterbuch (JMdict) konnte nicht geladen werden, ' +
            'Kanji bleiben unveraendert stehen, nur Kana wird umgeschrieben:',
          fehler,
        );
        return null;
      });
  }
  return japanischWoerterbuchPromise;
}

/**
 * Romanisiert eine einzelne Kana-Mora ab Position i in `zeichen` per
 * Längste-Treffer-Suche in JAPANISCH_KANA_MAP.
 * @returns {{treffer: string, latein: string} | null}
 */
function findeKanaTreffer(zeichen, i) {
  const kanaSchluessel = Object.keys(JAPANISCH_KANA_MAP);
  const maxLaenge = Math.min(3, zeichen.length - i); // längster Kana-Digraph ist 3 Zeichen
  for (let laenge = maxLaenge; laenge >= 1; laenge -= 1) {
    const kandidat = zeichen.slice(i, i + laenge).join('');
    if (Object.prototype.hasOwnProperty.call(JAPANISCH_KANA_MAP, kandidat)) {
      return { treffer: kandidat, latein: JAPANISCH_KANA_MAP[kandidat] };
    }
  }
  void kanaSchluessel;
  return null;
}

/**
 * Transliteriert japanischen Text (Kanji + Kana) nach lateinischer Lesung.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereJapanischMitWoerterbuch(text) {
  const woerterbuch = await ladeJapanischWoerterbuch();
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;
  const n = zeichen.length;

  // Verfolgt den Typ des zuletzt angehaengten Tokens fuer die
  // Worttrennung (siehe Moduldoku): 'wort' (Woerterbuch-/Fallback-
  // Treffer), 'kana' (freie Kana-Mora ausserhalb des Woerterbuchs) oder
  // null (Textanfang). Nur bei aufeinanderfolgenden 'kana'-Morae wird KEIN
  // Leerzeichen eingefuegt, alles andere startet ein neues Wort.
  let letzterTyp = null;

  function anhaengen(latein, typ) {
    if (letzterTyp !== null && !(typ === 'kana' && letzterTyp === 'kana')) {
      ergebnis += ' ';
    }
    ergebnis += latein;
    letzterTyp = typ;
  }

  while (i < n) {
    const z = zeichen[i];

    // Laengungszeichen: verworfen (keine Vokallaenge im Projekt, siehe
    // auch Farsi/Urdu/Paschtu/Tibetisch).
    if (LANGVOKAL_ZEICHEN.has(z)) {
      i += 1;
      continue;
    }

    // Verdopplungspunkt: verdoppelt den Anfangskonsonant der naechsten
    // Mora. Zaehlt als Teil des laufenden Wortes/Kana-Blocks, aendert
    // `letzterTyp` daher nicht und laeuft nicht ueber `anhaengen`.
    if (GEMINATION_ZEICHEN.has(z)) {
      const naechsterTreffer = findeKanaTreffer(zeichen, i + 1);
      if (naechsterTreffer && naechsterTreffer.latein && !'aeiou'.includes(naechsterTreffer.latein[0])) {
        ergebnis += naechsterTreffer.latein[0];
      }
      i += 1;
      continue;
    }

    // Stufe 1+2: laengster Wörterbuch-Treffer (JMdict-Wort oder
    // Einzelzeichen-Kanji-Fallback, siehe Moduldoku oben). Bildet immer
    // ein eigenes Wort (eigener Token, mit Leerzeichen abgetrennt).
    if (woerterbuch) {
      let woerterbuchTreffer = null;
      const maxLaenge = Math.min(japanischMaxLaenge, n - i);
      for (let laenge = maxLaenge; laenge >= 1; laenge -= 1) {
        const kandidat = zeichen.slice(i, i + laenge).join('');
        if (woerterbuch.has(kandidat)) {
          woerterbuchTreffer = kandidat;
          break;
        }
      }
      if (woerterbuchTreffer) {
        anhaengen(woerterbuch.get(woerterbuchTreffer), 'wort');
        i += woerterbuchTreffer.length;
        continue;
      }
    }

    // Stufe 3: einzelne Kana-Mora (Digraph oder einfach). Reiht sich an
    // vorangehende Kana-Morae ohne Leerzeichen an (Partikel/Endungen
    // bleiben als ein Block zusammen), startet aber ein neues Wort, wenn
    // direkt zuvor ein Woerterbuch-Treffer stand.
    //
    // AUSNAHME は/へ/を: als eigenstaendige (nicht in Stufe 1+2 gefundene)
    // Mora praktisch immer eine grammatische Partikel mit eigener Lesung
    // (siehe PARTIKEL_LESUNG oben) - wird deshalb NICHT wie normale freie
    // Kana an den laufenden Block angehaengt, sondern immer als eigenes
    // Wort behandelt (erzwingt Leerzeichen davor UND danach). Das behebt
    // sowohl die falsche Lesung ("ha" statt "wa") als auch unlesbare
    // Kana-Bloecke wie "gaiidesune" statt "ga ii desu ne".
    const kanaTreffer = findeKanaTreffer(zeichen, i);
    if (kanaTreffer) {
      if (kanaTreffer.treffer.length === 1 && Object.prototype.hasOwnProperty.call(PARTIKEL_LESUNG, kanaTreffer.treffer)) {
        anhaengen(PARTIKEL_LESUNG[kanaTreffer.treffer], 'wort');
      } else {
        anhaengen(kanaTreffer.latein, 'kana');
      }
      i += kanaTreffer.treffer.length;
      continue;
    }

    // Nicht-japanisches Zeichen (lateinische/japanische Satzzeichen,
    // Leerraum, Ziffern, ...): unveraendert durchreichen, OHNE die
    // Worttrennungs-Logik zu durchlaufen - das Zeichen bringt seine
    // eigene Trennung schon mit. `letzterTyp` wird zurueckgesetzt, damit
    // danach kein erzwungenes Leerzeichen vor dem naechsten japanischen
    // Wort eingefuegt wird (das Satzzeichen/der Leerraum uebernimmt
    // diese Rolle bereits).
    if (!JAPANISCHE_SCHRIFT_REGEX.test(z)) {
      ergebnis += z;
      letzterTyp = null;
      i += 1;
      continue;
    }

    // Unbekanntes japanisches Zeichen (z. B. seltenes Kanji ohne
    // JMdict-/Fallback-Eintrag): unveraendert durchreichen, als eigenes
    // Wort (siehe Moduldoku).
    anhaengen(z, 'wort');
    i += 1;
  }

  return ergebnis;
}
