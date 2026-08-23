/**
 * thaiWordSegmentation.js
 *
 * Wortgrenzen-Erkennung für Thailändisch VOR der eigentlichen
 * silbenbasierten Umschrift (thaiSyllableTransliteration.js).
 *
 * PROBLEM: Thailändisch schreibt, wie Khmer/Lao/Chinesisch/Japanisch in
 * diesem Projekt, ohne Leerzeichen zwischen Wörtern (Leerzeichen markieren
 * im Thai nur Satz-/Sinnpausen). Eine reine Zeichen-für-Zeichen-Umschrift
 * liefert daher pro Satz einen einzigen, praktisch unlesbaren
 * Buchstabenblock (siehe Bugreport) statt einzelner Wörter.
 *
 * LÖSUNG: analog zu chineseWordSegmentation.js/khmerTransliteration.js -
 * eine reine Wortliste (KEINE Ausspracheinformationen, siehe
 * data/THAI_WORTLISTE_LIZENZ.md) wird per Längste-Treffer-Suche über den
 * Thai-Text gelegt, um an erkannten Wortgrenzen Leerzeichen einzufügen.
 * Erst danach läuft die eigentliche (silbenbasierte) Umschrift ueber den so
 * angereicherten Text. Nicht erkannte Zeichenfolgen (Wörter, die nicht in
 * der Liste stehen, z. B. Eigennamen oder seltene Wörter) werden
 * zeichenweise durchgereicht wie bisher - keine Regression gegenüber dem
 * Stand vor diesem Modul, nur eine zusätzliche Verbesserung der
 * Lesbarkeit dort, wo die Liste greift.
 */

const THAI_WORTLISTE_URL = new URL('../data/thaiWortliste.json', import.meta.url).href;

let thaiWortlistePromise = null;
let thaiWortlisteMaxLaenge = 0;

/**
 * Lädt (einmalig, gecached) die bereinigte Thai-Wortliste (siehe
 * data/THAI_WORTLISTE_LIZENZ.md). Schlägt das Laden fehl, wird `null`
 * geliefert - die Transliteration fällt dann transparent auf die reine
 * Zeichen-für-Zeichen-Umschrift ohne Wortgrenzen-Erkennung zurück (wie
 * vor diesem Modul, keine Regression).
 * @returns {Promise<Set<string> | null>}
 */
function ladeThaiWortliste() {
  if (!thaiWortlistePromise) {
    thaiWortlistePromise = fetch(THAI_WORTLISTE_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => {
        const woerter = new Set(daten.woerter ?? []);
        for (const wort of woerter) {
          thaiWortlisteMaxLaenge = Math.max(thaiWortlisteMaxLaenge, wort.length);
        }
        return woerter;
      })
      .catch((fehler) => {
        console.warn(
          'Thai-Wortliste konnte nicht geladen werden, nutze nur die ' +
            'zeichenbasierte Umschrift ohne Wortgrenzen-Erkennung:',
          fehler,
        );
        return null;
      });
  }
  return thaiWortlistePromise;
}

// Thai-Unicode-Block (U+0E00-U+0E7F). Deckt Konsonanten, Vokalzeichen,
// Tonzeichen und thailändische Ziffern ab - identisch mit dem Bereich, den
// thaiSyllableTransliteration.js abdeckt.
const THAI_SCHRIFT_REGEX = /[\u0E00-\u0E7F]/u;

/**
 * Fügt in einem ganzen (auch gemischtsprachigen) Text an erkannten
 * Wörterbuch-Wortgrenzen Leerzeichen ein - nicht erkannte Thai-Zeichen
 * werden einzeln durchgereicht, ebenfalls per Leerzeichen abgetrennt
 * (analog chineseWordSegmentation.js). Nicht-thailändische Abschnitte
 * (Interpunktion, Leerraum, lateinischer Text) werden unverändert
 * durchgereicht, OHNE an der Wortgrenzen-Logik teilzunehmen - sie bringen
 * ihre eigene Trennung schon mit (gleiches Vorgehen wie in
 * japanischTransliteration.js für Satzzeichen).
 *
 * SONDERFALL ๆ (Mai Yamok, Wiederholungszeichen): verdoppelt im
 * Thailändischen das direkt vorangehende Wort (z. B. เด็กๆ = "Kinder",
 * wörtlich "Kind Kind"). Eine reine Silbenumschrift kann
 * das nicht abbilden, da es kein eigenes Lautbild hat, sondern das ganze
 * vorherige Wort wiederholt. Da diese Funktion die Wortgrenzen bereits
 * kennt, wird ๆ hier aufgelöst: das zuletzt erkannte Thai-Token wird ein
 * zweites Mal angehängt statt das Zeichen selbst durchzureichen. Der
 * Zustand ("letztes Thai-Token") wird über den GANZEN Text hinweg
 * verfolgt, nicht nur innerhalb eines zusammenhängenden Thai-Laufs -
 * manche Schreibweisen setzen vor ๆ ein Leerzeichen (z. B. "บ้าง ๆ"
 * statt "บ้างๆ"), das darf die Wiederholung nicht verlieren.
 */
// Abhaengige (kombinierende) Zeichen, die NIE fuer sich allein ein Wort
// bilden koennen: Tonzeichen, Laengungs-/Kuerzungszeichen, ำ. Findet die
// Wortliste an einer Position keinen Treffer und das aktuelle Zeichen ist
// eines davon, wird es an das VORHERIGE Token angehaengt statt als eigenes,
// durch Leerzeichen abgetrenntes Roh-Zeichen auszugeben. Das faengt
// Faelle ab, in denen ein laengeres Wortlisten-Wort zufaellig mitten in
// einem laengeren, selbst nicht gelisteten Wort endet und dabei ein
// Diakritikum von seinem Basiszeichen abtrennt (Bugreport: "แม่น้ำ" [Fluss]
// enthaelt zufaellig das echte, aber andere Wort "แม่น" [genau] als
// laengsten Treffer - ohne diese Absicherung blieben "้" und "ำ" als
// eigene, durch Leerzeichen getrennte "Woerter" uebrig).
const THAI_ABHAENGIGE_ZEICHEN = new Set(['่', '้', '๊', '๋', 'ะ', 'ั', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'ำ', '็', 'ๆ', '์', 'ฺ', '๎']);

function fuegeWortgrenzenEin(text, wortliste) {
  const zeichen = Array.from(text);
  const n = zeichen.length;
  let ergebnis = '';
  let i = 0;
  let letztesThaiToken = null;

  while (i < n) {
    const z = zeichen[i];

    if (!THAI_SCHRIFT_REGEX.test(z)) {
      ergebnis += z;
      i += 1;
      continue;
    }

    if (z === 'ๆ') {
      if (letztesThaiToken !== null) {
        ergebnis += (ergebnis && !/\s$/.test(ergebnis) ? ' ' : '') + letztesThaiToken;
      }
      i += 1;
      continue;
    }

    let treffer = null;
    const maxLaenge = Math.min(thaiWortlisteMaxLaenge, n - i);
    for (let laenge = maxLaenge; laenge >= 2; laenge -= 1) {
      const kandidat = zeichen.slice(i, i + laenge).join('');
      if (wortliste.has(kandidat)) {
        treffer = kandidat;
        break;
      }
    }

    if (!treffer && THAI_ABHAENGIGE_ZEICHEN.has(z) && letztesThaiToken !== null && ergebnis.endsWith(letztesThaiToken)) {
      ergebnis += z;
      letztesThaiToken += z;
      i += 1;
      continue;
    }

    const token = treffer ?? z;
    ergebnis += (ergebnis && !/\s$/.test(ergebnis) ? ' ' : '') + token;
    letztesThaiToken = token;
    i += token.length;
  }

  return ergebnis;
}

/**
 * Transliteriert thailändischen Text und nutzt dafür VOR der eigentlichen
 * Umschrift die bereinigte Wortliste (siehe data/THAI_WORTLISTE_LIZENZ.md),
 * um Wortgrenzen in den (im Original leerzeichenlosen) Thai-Text
 * einzufügen. Nimmt die Umschrift-Funktion bewusst als Parameter entgegen
 * (statt thaiSyllableTransliteration.js hier zu importieren), um einen zirkulären Import
 * zwischen diesem Modul und transliterationClient.js zu vermeiden (siehe
 * gleiches Vorgehen in chineseWordSegmentation.js).
 * @param {string} text
 * @param {(text: string) => string} umschriftFn
 * @returns {Promise<string>}
 */
export async function transliteriereThaiMitWortliste(text, umschriftFn) {
  const wortliste = await ladeThaiWortliste();
  if (!wortliste) {
    return umschriftFn(text);
  }

  const angereicherterText = fuegeWortgrenzenEin(text, wortliste);
  const romanisiert = umschriftFn(angereicherterText);

  // Kosmetische Nachbereinigung: einzelne Thai-Zeichen wie ฯ (Paiyannoi)
  // werden dort zu '' (kein Lautwert, siehe thaiSyllableTransliteration.js), was an dieser
  // Stelle - VOR der Umschrift, auf reinen Thai-Zeichen - noch nicht
  // vorhersehbar war und daher ein Leerzeichen an dieser Wortgrenze
  // hinterlassen haben kann. Mehrfache/rand­staendige Leerzeichen werden
  // deshalb am Ende einmalig zusammengefasst.
  return romanisiert.replace(/[ \t]+/g, ' ').trim();
}
