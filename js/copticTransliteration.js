/**
 * copticTransliteration.js
 * Umschrift von Koptisch (bohairischer Dialekt, liturgische Aussprache)
 * nach lateinischer Näherung.
 *
 * HERKUNFT: Der Nutzer hat ein Referenz-Repository ("Coptic
 * Transliterator") hochgeladen, das dieselbe Aufgabe löst, aber ohne
 * erkennbaren Lizenzhinweis vorliegt. Diese Datei wurde NICHT aus jenem
 * Code übernommen, sondern eigenständig neu geschrieben. Übernommen
 * wurden nur die darin erkennbaren SPRACHLICHEN FAKTEN (welcher
 * koptische Buchstabe klingt wie, welche Kontextregeln gelten) - das
 * sind linguistische Fakten, keine schutzfähige Programmleistung -,
 * gegengeprüft mit den offiziellen Unicode-Zeichennamen (siehe
 * Kommentare unten) statt ungeprüft übernommen.
 *
 * Koptisch ist - anders als die Abugida-Schriften in diesem Projekt
 * (Arabisch, Indisch, Birmanisch, Dzongkha, Khmer) - ein echtes Alphabet
 * (von der griechischen Schrift abgeleitet, plus sieben zusätzliche, aus
 * dem Demotischen übernommene Buchstaben für Laute, die das Griechische
 * nicht kennt). Es braucht daher keine Vokal-Trägerlogik, dafür aber ein
 * paar kontextabhängige Ausspracheregeln (unten mit Fundstelle als
 * Kommentar), die eine reine 1:1-Zeichentabelle nicht abbilden könnte:
 *
 * - ⲅ vor ⲓ/ⲉ wird "g" statt des sonst üblichen "gh" (weiches Gamma).
 * - ⲅⲅ (doppeltes Gamma) wird "ng" (zweites ⲅ nasaliert).
 * - ϫ vor ⲁ/ⲟ/ⲱ/ⲡ/ⲣ/ⲫ oder am Wortende wird "g" statt des sonst
 *   üblichen "j".
 * - ⲭ vor ⲉ wird "sh" statt des sonst üblichen "k".
 * - ⲃ am Wortende wird "b" statt des sonst üblichen "v".
 * - Diphthonge ⲁⲩ/ⲉⲩ werden "av"/"ev" (ⲩ wird zu "v"), ⲟⲩ wird "ou".
 * - ⲏⲓ wird als eine Einheit zu "i".
 * - Jenkim (übergeschriebener Strich über einem Konsonanten ohne
 *   Vokalbuchstaben, markiert eine unbetonte "e"-Sprechsilbe) wird als
 *   eingefügtes "e" VOR den betroffenen Konsonanten umgesetzt - in
 *   Unicode-Koptisch üblicherweise mit dem allgemeinen "combining grave
 *   accent" (U+0300) kodiert, da Koptisch dafür kein eigenes
 *   Kombinationszeichen hat.
 *
 * EINSCHRÄNKUNG: Diese Datei deckt die bohairische Aussprache ab (der in
 * der koptisch-orthodoxen Liturgie heute übliche Dialekt) und die
 * moderne Unicode-Kernbuchstaben. Historische Dialektvarianten
 * (sahidisch, achmimisch, alt-nubische Zusatzbuchstaben usw.) und
 * seltene Sonderzeichen werden nicht speziell behandelt.
 */

// Vokale (reiner Lautwert, ohne Kontextregeln).
const VOKALE = {
  '\u2C80': 'A', '\u2C81': 'a', // Ⲁ ⲁ (Alfa)
  '\u2C88': 'E', '\u2C89': 'e', // Ⲉ ⲉ (Eie)
  '\u2C8E': 'I', '\u2C8F': 'i', // Ⲏ ⲏ (Hate, lang gesprochenes i)
  '\u2C92': 'I', '\u2C93': 'i', // Ⲓ ⲓ (Iauda)
  '\u2C9E': 'O', '\u2C9F': 'o', // Ⲟ ⲟ (O)
  '\u2CA8': 'I', '\u2CA9': 'i', // Ⲩ ⲩ (Ua/Upsilon, in bohairischer Aussprache wie "i")
  '\u2CB0': 'O', '\u2CB1': 'o', // Ⲱ ⲱ (Oou)
};

// Konsonanten (Standardlautwert; Sonderregeln siehe transliteriereKoptisch()).
const KONSONANTEN = {
  '\u2C82': 'V', '\u2C83': 'v', // Ⲃ ⲃ (Vida)
  '\u2C84': 'Gh', '\u2C85': 'gh', // Ⲅ ⲅ (Gamma)
  '\u2C86': 'D', '\u2C87': 'd', // Ⲇ ⲇ (Dalda)
  '\u2C8A': '6', '\u2C8B': '6', // Ⲋ ⲋ (Sou, Zahlzeichen 6)
  '\u2C8C': 'Z', '\u2C8D': 'z', // Ⲍ ⲍ (Zata)
  '\u2C90': 'Th', '\u2C91': 'th', // Ⲑ ⲑ (Thethe)
  '\u2C94': 'K', '\u2C95': 'k', // Ⲕ ⲕ (Kapa)
  '\u2C96': 'L', '\u2C97': 'l', // Ⲗ ⲗ (Laula)
  '\u2C98': 'M', '\u2C99': 'm', // Ⲙ ⲙ (Mi)
  '\u2C9A': 'N', '\u2C9B': 'n', // Ⲛ ⲛ (Ni)
  '\u2C9C': 'Ks', '\u2C9D': 'ks', // Ⲝ ⲝ (Ksi)
  '\u2CA0': 'P', '\u2CA1': 'p', // Ⲡ ⲡ (Pi)
  '\u2CA2': 'R', '\u2CA3': 'r', // Ⲣ ⲣ (Ro)
  '\u2CA4': 'S', '\u2CA5': 's', // Ⲥ ⲥ (Sima)
  '\u2CA6': 'T', '\u2CA7': 't', // Ⲧ ⲧ (Tau)
  '\u2CAA': 'F', '\u2CAB': 'f', // Ⲫ ⲫ (Fi)
  '\u2CAC': 'K', '\u2CAD': 'k', // Ⲭ ⲭ (Khi)
  '\u2CAE': 'Ps', '\u2CAF': 'ps', // Ⲯ ⲯ (Psi)
  '\u03E2': 'Sh', '\u03E3': 'sh', // Ϣ ϣ (Shei)
  '\u03E4': 'F', '\u03E5': 'f', // Ϥ ϥ (Fei)
  '\u03E6': 'Kh', '\u03E7': 'kh', // Ϧ ϧ (Khei)
  '\u03E8': 'H', '\u03E9': 'h', // Ϩ ϩ (Hori)
  '\u03EA': 'J', '\u03EB': 'j', // Ϫ ϫ (Gangia)
  '\u03EC': 'Ch', '\u03ED': 'ch', // Ϭ ϭ (Shima)
  '\u03EE': 'Ti', '\u03EF': 'ti', // Ϯ ϯ (Dei)
};

const JENKIM = '\u0300'; // übergeschriebener Strich (siehe Moduldoku)
const ABKUERZUNGSSTRICH = '\u0305'; // Überstrich für nomina sacra u. Ä., wird verworfen

const SONSTIGE = {
  '\u2CFE': '.', // Koptischer Punkt
};

const KOPTISCH_SPRACHCODES = new Set(['cop-EG']);

/** Ob für einen Sprachcode die koptische Umschrift zuständig ist. */
export function hatKoptischesSchema(code) {
  return KOPTISCH_SPRACHCODES.has(code);
}

function istGross(zeichen) {
  return zeichen === zeichen.toUpperCase() && zeichen !== zeichen.toLowerCase();
}

function grossKleinAnpassen(wert, vorlage) {
  return istGross(vorlage) ? wert.charAt(0).toUpperCase() + wert.slice(1) : wert;
}

function istBuchstabe(zeichen) {
  return (
    zeichen !== undefined &&
    (Object.prototype.hasOwnProperty.call(VOKALE, zeichen) ||
      Object.prototype.hasOwnProperty.call(KONSONANTEN, zeichen))
  );
}

/**
 * Transliteriert koptische Schrift (bohairische Aussprache) nach
 * lateinischer Näherung.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereKoptisch(text) {
  // Jenkim wirkt auf den VORANGEHENDEN Buchstaben (fügt ein "e" davor
  // ein), steht in Unicode als Kombinationszeichen aber danach. Deshalb
  // vorab in "e" + Konsonant umschreiben, dann läuft die Hauptschleife
  // unverändert weiter.
  const vorverarbeitet = Array.from(text).reduce((akkumulator, aktuelles, index, alle) => {
    if (aktuelles === JENKIM) return akkumulator;
    if (alle[index + 1] === JENKIM && Object.prototype.hasOwnProperty.call(KONSONANTEN, aktuelles)) {
      return akkumulator + 'e' + aktuelles;
    }
    return akkumulator + aktuelles;
  }, '');

  const zeichen = Array.from(vorverarbeitet);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];
    const naechstes = zeichen[i + 1];

    if (aktuelles === ABKUERZUNGSSTRICH) {
      i += 1;
      continue;
    }

    // Diphthonge: ⲟⲩ -> "ou"; ⲁⲩ/ⲉⲩ -> Vokal + "v".
    if ((aktuelles === '\u2C9E' || aktuelles === '\u2C9F') && naechstes === (aktuelles === '\u2C9E' ? '\u2CA8' : '\u2CA9')) {
      ergebnis += grossKleinAnpassen(VOKALE[aktuelles], aktuelles) + (istGross(aktuelles) ? 'U' : 'u');
      i += 2;
      continue;
    }
    if (
      (aktuelles === '\u2C80' || aktuelles === '\u2C81' || aktuelles === '\u2C88' || aktuelles === '\u2C89') &&
      (naechstes === '\u2CA8' || naechstes === '\u2CA9')
    ) {
      ergebnis += grossKleinAnpassen(VOKALE[aktuelles], aktuelles) + (istGross(aktuelles) ? 'V' : 'v');
      i += 2;
      continue;
    }

    // ⲏⲓ als Einheit -> "i".
    if ((aktuelles === '\u2C8E' || aktuelles === '\u2C8F') && (naechstes === '\u2C92' || naechstes === '\u2C93')) {
      ergebnis += grossKleinAnpassen('i', aktuelles);
      i += 2;
      continue;
    }

    // ⲅ vor ⲓ/ⲉ -> weiches "g"; ⲅⲅ -> erstes ⲅ nasaliert zu "n", das
    // zweite behält seine eigene (ggf. wiederum weiche) Aussprache.
    if (aktuelles === '\u2C84' || aktuelles === '\u2C85') {
      if (naechstes === '\u2C84' || naechstes === '\u2C85') {
        ergebnis += grossKleinAnpassen('n', aktuelles);
        i += 1;
        continue;
      }
      if (['\u2C92', '\u2C93', '\u2C88', '\u2C89'].includes(naechstes)) {
        ergebnis += grossKleinAnpassen('g', aktuelles);
        i += 1;
        continue;
      }
    }

    // ϫ vor ⲁ/ⲟ/ⲱ/ⲡ/ⲣ/ⲫ oder am Wortende -> "g" statt "j".
    if (aktuelles === '\u03EA' || aktuelles === '\u03EB') {
      const weicheUmgebung = ['\u2C80', '\u2C81', '\u2C9E', '\u2C9F', '\u2CB0', '\u2CB1', '\u2CA0', '\u2CA1', '\u2CA2', '\u2CA3', '\u2CAA', '\u2CAB'];
      if (weicheUmgebung.includes(naechstes) || !istBuchstabe(naechstes)) {
        ergebnis += grossKleinAnpassen('g', aktuelles);
        i += 1;
        continue;
      }
    }

    // ⲭ vor ⲉ -> "sh" statt "k".
    if ((aktuelles === '\u2CAC' || aktuelles === '\u2CAD') && (naechstes === '\u2C88' || naechstes === '\u2C89')) {
      ergebnis += grossKleinAnpassen('sh', aktuelles);
      i += 1;
      continue;
    }

    // ⲃ am Wortende -> "b" statt "v".
    if ((aktuelles === '\u2C82' || aktuelles === '\u2C83') && !istBuchstabe(naechstes)) {
      ergebnis += grossKleinAnpassen('b', aktuelles);
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(VOKALE, aktuelles)) {
      ergebnis += VOKALE[aktuelles];
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(KONSONANTEN, aktuelles)) {
      ergebnis += KONSONANTEN[aktuelles];
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(SONSTIGE, aktuelles)) {
      ergebnis += SONSTIGE[aktuelles];
      i += 1;
      continue;
    }

    // Unbekanntes Zeichen (Leerzeichen, Satzzeichen, seltene historische
    // Dialektbuchstaben) unverändert durchreichen.
    ergebnis += aktuelles;
    i += 1;
  }

  return ergebnis;
}
