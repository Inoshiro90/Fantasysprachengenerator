/**
 * phonemeTransformer.js
 * Wendet die im Sprachprofil hinterlegten Austauschmuster (Vokale,
 * Konsonanten) auf einen bereits übersetzten (und ggf. romanisierten)
 * Text an.
 */

import { wortInSilbenZerlegen } from './silbentrennung.js';

const WILDCARD_SCHLUESSEL = '*';
const VOKALE = new Set('aeiouyAEIOUY'.split(''));

/**
 * Regeln in vokal_austausch/konsonant_austausch können optional auf eine
 * bestimmte Stelle im Wort beschränkt werden, indem an den eigentlichen
 * Buchstaben-Schlüssel ein Doppelpunkt plus Positionsangabe angehängt wird:
 *
 *   "en": "tus"          -> greift überall im Wort (Standardverhalten,
 *                            100% rückwärtskompatibel zu bestehenden Profilen)
 *   "en:ende": "tus"      -> greift NUR, wenn "en" am Wortende steht
 *   "en:anfang": "tus"    -> greift NUR, wenn "en" am Wortanfang steht
 *   "en:mitte": "tus"     -> greift NUR, wenn "en" weder am Anfang noch am
 *                            Ende steht (also mindestens ein Zeichen davor
 *                            UND danach im Wort vorhanden ist)
 *   "i:gesamt": "a"       -> greift NUR, wenn "i" das GESAMTE Wort ist (das
 *                            Muster deckt also Wortanfang UND Wortende
 *                            gleichzeitig ab). Ersetzt den bisherigen
 *                            Behelf, ein Leerzeichen mit ins Muster
 *                            aufzunehmen (" i " -> " a "), um nur ein
 *                            alleinstehendes Wort wie "i" zu treffen, nicht
 *                            aber das "i" in "inter" - dieser Leerzeichen-
 *                            Behelf bleibt aus Kompatibilitätsgründen
 *                            weiterhin nutzbar, ist aber nicht mehr nötig.
 *
 * "Wort" bezieht sich dabei auf den reinen Wortkern OHNE umgebende
 * Satzzeichen (siehe apply()/applyMitAnnotationen(): "Haus." wird als
 * Kern "Haus" + Satzzeichen "." behandelt, das Wortende ist also das Ende
 * von "Haus", nicht das Ende von "Haus.").
 */
const POSITION_TRENNER = ':';
export const GUELTIGE_POSITIONEN = ['anfang', 'mitte', 'ende', 'gesamt'];
const POSITION_LABEL = { anfang: 'Wortanfang', mitte: 'Wortmitte', ende: 'Wortende', gesamt: 'Gesamtwort' };

/**
 * Zerlegt einen rohen Tabellen-Schlüssel in das eigentliche Buchstaben-
 * Muster und eine optionale Positionsbeschränkung.
 * @param {string} schluesselEintrag
 * @returns {{ muster: string, position: 'anfang'|'mitte'|'ende'|null }}
 *   position ist null, wenn keine (gültige) Beschränkung angegeben wurde
 *   ("überall" - das bisherige Standardverhalten).
 */
export function schluesselParsen(schluesselEintrag) {
  const trennerIndex = schluesselEintrag.indexOf(POSITION_TRENNER);
  if (trennerIndex === -1) {
    return { muster: schluesselEintrag, position: null };
  }
  const muster = schluesselEintrag.slice(0, trennerIndex);
  const positionRoh = schluesselEintrag.slice(trennerIndex + 1).toLowerCase();
  if (muster.length > 0 && GUELTIGE_POSITIONEN.includes(positionRoh)) {
    return { muster, position: positionRoh };
  }
  // Unbekannter/leerer Teil nach dem Doppelpunkt: den gesamten String
  // sicherheitshalber als (ungewöhnliches, aber gültiges) Muster ohne
  // Positionsbeschränkung behandeln, statt die Regel stillschweigend
  // zu verwerfen.
  return { muster: schluesselEintrag, position: null };
}

/**
 * Kehrfunktion zu schluesselParsen(): baut aus Muster + optionaler Position
 * wieder den kodierten Tabellen-Schlüssel. Wird vom Profil-Editor benutzt.
 * @param {string} muster
 * @param {'anfang'|'mitte'|'ende'|null|''} position
 * @returns {string}
 */
export function schluesselKodieren(muster, position) {
  if (!position || !GUELTIGE_POSITIONEN.includes(position)) {
    return muster;
  }
  return `${muster}${POSITION_TRENNER}${position}`;
}

/**
 * Prüft, ob eine Regel mit der angegebenen Positionsbeschränkung an der
 * konkreten Fundstelle (startIndex bis endIndexExklusiv) greifen darf.
 * wortStart/wortEnde bezeichnen die Grenzen des ECHTEN Wortkerns innerhalb
 * des übergebenen Zeichen-Arrays - normalerweise 0 bzw. die Array-Länge,
 * aber bei einer testweise angehängten Rand-Leerzeichen-Markierung (siehe
 * wortKernMitGrenzenTransformieren()) um die Markierung nach innen versetzt,
 * damit "Wortanfang"/"Wortende" weiterhin das echte Wort meinen und nicht
 * die künstlich angefügte Markierung.
 */
function positionErlaubt(position, startIndex, endIndexExklusiv, wortStart, wortEnde) {
  if (position === null) return true;
  const istAnfang = startIndex === wortStart;
  const istEnde = endIndexExklusiv === wortEnde;
  if (position === 'anfang') return istAnfang;
  if (position === 'ende') return istEnde;
  if (position === 'mitte') return !istAnfang && !istEnde;
  // "gesamt": das Muster darf NUR greifen, wenn es gleichzeitig am
  // Wortanfang UND am Wortende steht - also exakt den gesamten Wortkern
  // ausmacht (z. B. "i" bei "i", aber nicht bei "inter").
  if (position === 'gesamt') return istAnfang && istEnde;
  return true;
}

function istLateinischerBuchstabe(zeichen) {
  return /^[a-zA-Z]$/.test(zeichen);
}

function istVokalBuchstabe(zeichen) {
  return VOKALE.has(zeichen);
}

function istKonsonantBuchstabe(zeichen) {
  return istLateinischerBuchstabe(zeichen) && !VOKALE.has(zeichen);
}

/**
 * Kernimplementierung des Zeichenaustauschs: arbeitet auf einem Array aus
 * {zeichen, art}-Einträgen statt auf einem reinen String. Dadurch kann bei
 * jedem Durchlauf (Vokal- UND Konsonantenaustausch) mitgeführt werden,
 * WELCHE Zeichen durch eine Profilregel verändert wurden und WIE (siehe
 * `art`: 'hinzugefuegt' | 'geaendert' | 'entfernt' | null). Von einer
 * vorherigen Stufe unveränderte Zeichen behalten ihre bisherige `art` bei,
 * von der aktuellen Stufe getroffene Zeichen bekommen ihre `art` neu
 * zugewiesen (überschreibt eine eventuelle `art` aus der Vorstufe).
 *
 * `zeichenAustauschAnwenden()` (reiner String, siehe unten) und
 * `applyMitAnnotationen()` nutzen exakt dieselbe Logik hier - damit die
 * fürs Diff-Overlay berechneten Markierungen garantiert zum tatsächlich
 * erzeugten Text passen.
 */
function zeichenAustauschKernAnwenden(
  zeichenArray,
  austauschTabelle,
  istWildcardPassend = istLateinischerBuchstabe,
  wortBereich = null
) {
  const schluesselDaten = Object.keys(austauschTabelle || {})
    .filter((k) => k.length > 0 && k !== WILDCARD_SCHLUESSEL)
    .map((roh) => ({ roh, ...schluesselParsen(roh) }))
    .sort((a, b) => b.muster.length - a.muster.length);
  const wildcardErsatz = austauschTabelle ? austauschTabelle[WILDCARD_SCHLUESSEL] : undefined;

  if (schluesselDaten.length === 0 && wildcardErsatz === undefined) {
    return zeichenArray;
  }

  const textKlein = zeichenArray.map((e) => e.zeichen).join('');
  const wortStart = wortBereich ? wortBereich.start : 0;
  const wortEnde = wortBereich ? wortBereich.ende : zeichenArray.length;

  const ergebnis = [];
  let i = 0;
  while (i < zeichenArray.length) {
    let getroffen = false;

    for (const { roh, muster, position } of schluesselDaten) {
      const laenge = muster.length;
      const ausschnitt = textKlein.slice(i, i + laenge);
      if (ausschnitt.length === laenge && ausschnitt.toLowerCase() === muster.toLowerCase()) {
        // Cluster-Erkennung: siehe zeichenAustauschAnwenden weiter unten.
        let laufLaenge = laenge;
        while (
          textKlein.slice(i + laufLaenge, i + laufLaenge + laenge).toLowerCase() ===
          muster.toLowerCase()
        ) {
          laufLaenge += laenge;
        }

        // Positionsbeschränkung ("...:anfang"/"...:mitte"/"...:ende"):
        // greift die Regel an dieser Fundstelle nicht, gilt sie hier als
        // NICHT getroffen - es wird mit der nächstkürzeren Regel bzw.
        // der Wildcard weitergemacht, statt das Zeichen fälschlich zu
        // verändern oder zu blockieren.
        if (!positionErlaubt(position, i, i + laufLaenge, wortStart, wortEnde)) {
          continue;
        }

        let ersatz = austauschTabelle[roh];
        if (ausschnitt.charAt(0) !== ausschnitt.charAt(0).toLowerCase()) {
          // Ursprung war (mindestens am Anfang) großgeschrieben -> Ersatz anpassen
          ersatz = ersatz.charAt(0).toUpperCase() + ersatz.slice(1);
        }

        const art = regelArtKlassifizieren(laufLaenge, ersatz.length);
        for (const zeichen of ersatz) {
          ergebnis.push({ zeichen, art });
        }
        i += laufLaenge;
        getroffen = true;
        break;
      }
    }

    if (!getroffen && wildcardErsatz !== undefined && istWildcardPassend(zeichenArray[i].zeichen)) {
      const buchstabe = zeichenArray[i].zeichen;
      let ersatz = wildcardErsatz;
      if (buchstabe !== buchstabe.toLowerCase()) {
        ersatz = ersatz.charAt(0).toUpperCase() + ersatz.slice(1);
      }

      let laufLaenge = 1;
      while (
        zeichenArray[i + laufLaenge] &&
        zeichenArray[i + laufLaenge].zeichen.toLowerCase() === buchstabe.toLowerCase()
      ) {
        laufLaenge += 1;
      }

      const art = regelArtKlassifizieren(laufLaenge, ersatz.length);
      for (const zeichen of ersatz) {
        ergebnis.push({ zeichen, art });
      }
      i += laufLaenge;
      getroffen = true;
    }

    if (!getroffen) {
      ergebnis.push(zeichenArray[i]);
      i += 1;
    }
  }
  return ergebnis;
}

/**
 * Klassifiziert eine Regelanwendung anhand der Zeichenlänge VOR und NACH
 * der Ersetzung - unabhängig davon, ob es sich um eine explizite Regel
 * oder die Wildcard handelt, und unabhängig davon, ob ein zusammenhängender
 * Lauf (z. B. "ll") auf einmal ersetzt wurde.
 * @param {number} originalLaenge - Anzahl konsumierter Original-Zeichen
 * @param {number} ersatzLaenge - Anzahl erzeugter Zeichen
 * @returns {'hinzugefuegt'|'geaendert'|'entfernt'}
 */
function regelArtKlassifizieren(originalLaenge, ersatzLaenge) {
  if (ersatzLaenge > originalLaenge) return 'hinzugefuegt';
  if (ersatzLaenge < originalLaenge) return 'entfernt';
  return 'geaendert';
}

/**
 * Ersetzt Zeichenfolgen gemäß einer Zuordnungstabelle. Unterstützt sowohl
 * einzelne Buchstaben (z. B. "a" -> "aa") als auch mehrzeichige, von
 * Nutzer:innen frei definierbare Regeln (z. B. "sch" -> "zh"). An jeder
 * Position wird zuerst der längste passende Schlüssel geprüft, damit
 * längere Regeln kürzere nicht versehentlich verdecken.
 *
 * Optionaler Wildcard-Eintrag "*": greift für jeden lateinischen Buchstaben,
 * der von keiner der übrigen Regeln dieser Tabelle abgedeckt ist. Damit
 * müssen Profile nicht mehr alle ~21 Konsonanten bzw. 5 Vokale einzeln
 * auflisten, um jeden Buchstaben zu verfremden - eine einzige "*"-Regel
 * (z. B. "*": "'" für einen leichten Apostroph-Einschub) sorgt dafür, dass
 * kein Buchstabe mehr roh/unverändert durchgereicht wird, nur weil er in
 * der bisherigen, oft dünnen Tabelle schlicht vergessen wurde.
 *
 * @param {string} text
 * @param {object} austauschTabelle
 * @param {(zeichen: string) => boolean} istWildcardPassend - entscheidet,
 *   ob ein gegebener Buchstabe überhaupt für DIESE Tabelle in Frage kommt
 *   (z. B. beim Aufruf für vokal_austausch nur Vokale, bei konsonant_austausch
 *   nur Konsonanten) - verhindert, dass ein "*" in der Vokal-Tabelle
 *   versehentlich auch Konsonanten verändert und umgekehrt.
 */
function zeichenAustauschAnwenden(text, austauschTabelle, istWildcardPassend = istLateinischerBuchstabe) {
  const zeichenArray = [...text].map((zeichen) => ({ zeichen, art: null }));
  const ergebnisArray = zeichenAustauschKernAnwenden(zeichenArray, austauschTabelle, istWildcardPassend);
  return ergebnisArray.map((e) => e.zeichen).join('');
}

/**
 * Wendet Vokal- und Konsonantenaustausch nacheinander auf einen einzelnen
 * Wortkern an - genau wie apply()/applyMitAnnotationen() es bisher direkt
 * gemacht haben - erlaubt dabei aber zusätzlich, dass eine Regel ein
 * Leerzeichen als Teil ihres Musters UND/ODER ihres Ersatzes hat (z. B.
 * " i " -> " a ", um im Walisischen NUR das eigenständige Wort "i" zu
 * treffen, nicht aber ein "i" innerhalb eines längeren Wortes).
 *
 * Da apply()/applyMitAnnotationen() Wörter grundsätzlich schon anhand von
 * Leerzeichen in einzelne Tokens zerlegen, kann der eigentliche Wortkern
 * (kern) selbst nie ein Leerzeichen enthalten - ein Leerzeichen kann also
 * nur GENAU an seinem Anfang oder Ende eine Rolle spielen, dort, wo im
 * echten Text ein Leerzeichen (oder der Text-Rand) angrenzt. Für die Dauer
 * dieses einen Wortes wird dafür testweise ein einzelnes, mit `istGrenze`
 * markiertes Leerzeichen an die jeweilige Seite angehängt:
 *
 *   - Bleibt diese Markierung nach beiden Austausch-Durchläufen unverändert
 *     erhalten (keine Regel hat sie "verbraucht"), wird sie am Ende wieder
 *     entfernt - das eigentliche, echte Leerzeichen im Text bleibt also
 *     exakt wie zuvor unangetastet.
 *   - Wurde sie dagegen von einer Regel mitverarbeitet (weil deren Muster
 *     ein Leerzeichen an dieser Stelle enthielt), bleibt das Ergebnis
 *     dieser Regel Teil der Wort-Ausgabe, und die aufrufende Funktion muss
 *     dafür sorgen, dass GENAU EIN Leerzeichen aus dem echten, angrenzenden
 *     Text-Token entfernt wird (siehe `vorLeerzeichenVerbraucht`/
 *     `nachLeerzeichenVerbraucht` im Rückgabewert), damit dort kein
 *     doppeltes Leerzeichen entsteht.
 *
 * Die Wortgrenzen für die Positionsbeschränkung (":anfang"/":ende") werden
 * dabei bewusst anhand des ECHTEN Wortkerns nachgeführt (nicht anhand der
 * Markierung) - bestehende positionsbeschränkte Regeln verhalten sich also
 * unverändert, auch wenn nun testweise ein Rand-Leerzeichen angehängt wird.
 *
 * @param {string} kern - der reine Wortkern (ohne Satzzeichen), garantiert
 *   ohne eingebettete Leerzeichen.
 * @param {{ vorLeerzeichen: boolean, nachLeerzeichen: boolean }} grenzen -
 *   ob im echten Text direkt vor bzw. nach diesem Wort ein Leerzeichen
 *   steht (oder der Text-Rand erreicht ist) und somit ein Rand-Leerzeichen
 *   testweise angehängt werden darf.
 * @param {object} vokalTabelle
 * @param {object} konsonantTabelle
 * @returns {{
 *   zeichenArray: Array<{zeichen: string, art: string|null}>,
 *   vorLeerzeichenVerbraucht: boolean,
 *   nachLeerzeichenVerbraucht: boolean,
 * }}
 */
function wortKernMitGrenzenTransformieren(kern, grenzen, vokalTabelle, konsonantTabelle) {
  const { vorLeerzeichen, nachLeerzeichen } = grenzen;

  let zeichenArray = [
    ...(vorLeerzeichen ? [{ zeichen: ' ', art: null, istGrenze: true }] : []),
    ...[...kern].map((zeichen) => ({ zeichen, art: null })),
    ...(nachLeerzeichen ? [{ zeichen: ' ', art: null, istGrenze: true }] : []),
  ];

  let wortStart = vorLeerzeichen ? 1 : 0;
  let wortEnde = wortStart + kern.length;

  zeichenArray = zeichenAustauschKernAnwenden(zeichenArray, vokalTabelle, istVokalBuchstabe, {
    start: wortStart,
    ende: wortEnde,
  });

  // Grenzen für den zweiten Durchlauf ggf. neu bestimmen: nur wenn die
  // Rand-Markierung den ersten Durchlauf unverändert überstanden hat,
  // verschiebt sie den echten Wortanfang/-ende weiterhin um eins - wurde
  // sie bereits ersetzt, zählt sie ab jetzt als normaler Wortbestandteil.
  const vorneNochMarkiert = vorLeerzeichen && zeichenArray[0]?.istGrenze === true;
  const hintenNochMarkiert =
    nachLeerzeichen && zeichenArray.length > 0 && zeichenArray[zeichenArray.length - 1]?.istGrenze === true;

  wortStart = vorneNochMarkiert ? 1 : 0;
  wortEnde = zeichenArray.length - (hintenNochMarkiert ? 1 : 0);

  zeichenArray = zeichenAustauschKernAnwenden(zeichenArray, konsonantTabelle, istKonsonantBuchstabe, {
    start: wortStart,
    ende: wortEnde,
  });

  const vorneUnveraendert = vorLeerzeichen && zeichenArray[0]?.istGrenze === true;
  const hintenUnveraendert =
    nachLeerzeichen && zeichenArray.length > 0 && zeichenArray[zeichenArray.length - 1]?.istGrenze === true;

  if (vorneUnveraendert) zeichenArray = zeichenArray.slice(1);
  if (hintenUnveraendert) zeichenArray = zeichenArray.slice(0, -1);

  return {
    zeichenArray,
    vorLeerzeichenVerbraucht: vorLeerzeichen && !vorneUnveraendert,
    nachLeerzeichenVerbraucht: nachLeerzeichen && !hintenUnveraendert,
  };
}

/**
 * Gemeinsame Groß-/Kleinschreibungs-Korrektur für alle Verfremdungsarten,
 * die die REIHENFOLGE von Zeichen oder Zeichengruppen innerhalb eines
 * Wortes verändern (Wortspiegelung, Silbenvertauschung, ...): der
 * Großbuchstabe, der im Original nur am eigentlichen Wortanfang stand
 * (deutsche Substantiv-Großschreibung betrifft praktisch immer nur den
 * allerersten Buchstaben), würde durch das Umsortieren sonst an einer
 * zufälligen Stelle mitten im Wort landen. Stattdessen wird das gesamte
 * Ergebnis kleingeschrieben und - falls das Original großgeschrieben war -
 * nur der NEUE erste Buchstabe wieder großgeschrieben.
 * @param {Array<{zeichen: string, art: string|null}>} zeichenArray
 * @param {boolean} warUrspruenglichGross
 * @param {boolean} artUeberschreiben
 */
function grossKleinschreibungAmWortanfangAnpassen(zeichenArray, warUrspruenglichGross, artUeberschreiben) {
  return zeichenArray.map((eintrag, index) => {
    const zeichenKlein = eintrag.zeichen.toLowerCase();
    const zeichenFinal =
      index === 0 && warUrspruenglichGross && istLateinischerBuchstabe(zeichenKlein)
        ? zeichenKlein.toUpperCase()
        : zeichenKlein;

    return {
      ...eintrag,
      zeichen: zeichenFinal,
      art: artUeberschreiben ? 'geaendert' : eintrag.art,
    };
  });
}

/**
 * Spiegelt einen bereits transformierten Wortkern buchstabenweise (z. B.
 * wird aus "Garten" -> "Netrag"). Wird als letzter Schritt der Wort-
 * Transformation angewandt, NACH Vokal- und Konsonantenaustausch sowie
 * nach einer eventuellen Silbenvertauschung, sodass Ersatzregeln weiterhin
 * auf das "normale" Wort greifen und die Spiegelung unabhängig davon als
 * zusätzliche, rein optische/lautliche Verfremdung hinzukommt.
 *
 * @param {Array<{zeichen: string, art: string|null}>} zeichenArray
 * @param {{ artUeberschreiben: boolean }} [optionen] - wenn true, wird die
 *   `art` aller Zeichen auf 'geaendert' gesetzt, damit ein Diff-Overlay die
 *   Spiegelung als Änderung sichtbar macht (siehe applyMitAnnotationen()).
 * @returns {Array<{zeichen: string, art: string|null}>}
 */
export function wortspiegelungAnwenden(zeichenArray, { artUeberschreiben = false } = {}) {
  if (!zeichenArray || zeichenArray.length === 0) return zeichenArray;

  const erstesZeichen = zeichenArray[0].zeichen;
  const warGrossgeschrieben =
    istLateinischerBuchstabe(erstesZeichen) && erstesZeichen !== erstesZeichen.toLowerCase();

  const gespiegelt = [...zeichenArray].reverse();

  return grossKleinschreibungAmWortanfangAnpassen(gespiegelt, warGrossgeschrieben, artUeberschreiben);
}

/**
 * Vertauscht die Silben-Reihenfolge eines bereits transformierten
 * Wortkerns (z. B. wird aus "Garten" -> "Tengar"). Nutzt die heuristische
 * Silbentrennung aus silbentrennung.js auf dem ERGEBNIS von Vokal-/
 * Konsonantenaustausch (nicht auf dem Ausgangswort), damit die Silbengrenzen
 * zum tatsächlich sichtbaren Fantasiewort passen.
 *
 * Die Silbenreihenfolge wird komplett umgekehrt (letzte Silbe zuerst) -
 * bei genau zwei Silben ist das ein einfaches Vertauschen, bei mehr als
 * zwei eine vollständige Umkehrung der Silbenkette. Wörter mit weniger als
 * zwei erkannten Silben bleiben unverändert, da es dort nichts zu
 * vertauschen gibt.
 *
 * @param {Array<{zeichen: string, art: string|null}>} zeichenArray
 * @param {{ artUeberschreiben: boolean }} [optionen]
 * @returns {Array<{zeichen: string, art: string|null}>}
 */
export function silbenVertauschungAnwenden(zeichenArray, { artUeberschreiben = false } = {}) {
  if (!zeichenArray || zeichenArray.length < 2) return zeichenArray;

  const wortText = zeichenArray.map((e) => e.zeichen).join('');
  const silbenLaengen = wortInSilbenZerlegen(wortText).map((silbe) => silbe.length);

  if (silbenLaengen.length < 2) return zeichenArray;

  // zeichenArray anhand der Silbenlängen in Segmente (Teil-Arrays der
  // Zeichen-Einträge) zerlegen, ...
  const segmente = [];
  let position = 0;
  for (const laenge of silbenLaengen) {
    segmente.push(zeichenArray.slice(position, position + laenge));
    position += laenge;
  }

  // ... und die Segment-REIHENFOLGE umkehren (die Zeichen INNERHALB jeder
  // Silbe bleiben dabei unangetastet in ihrer ursprünglichen Reihenfolge).
  const vertauscht = [...segmente].reverse().flat();

  const erstesZeichen = zeichenArray[0].zeichen;
  const warGrossgeschrieben =
    istLateinischerBuchstabe(erstesZeichen) && erstesZeichen !== erstesZeichen.toLowerCase();

  return grossKleinschreibungAmWortanfangAnpassen(vertauscht, warGrossgeschrieben, artUeberschreiben);
}

/**
 * Ermittelt, welche lateinischen Buchstaben in einer Austauschtabelle NICHT
 * durch eine eigene Regel (oder die Wildcard "*") abgedeckt sind. Gedacht
 * als Hilfsfunktion für den Profil-Editor (Warnhinweis "diese Buchstaben
 * bleiben unverändert") oder für eigene Tests/Auswertungen - ändert selbst
 * nichts an der Transformation.
 * @param {object} austauschTabelle
 * @returns {string[]} fehlende Buchstaben in Kleinschreibung, alphabetisch
 */
export function fehlendeBuchstabenErmitteln(austauschTabelle) {
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
  if (!austauschTabelle) return ALPHABET;
  if (austauschTabelle[WILDCARD_SCHLUESSEL] !== undefined) return [];

  const abgedeckt = new Set();
  for (const schluessel of Object.keys(austauschTabelle)) {
    const { muster } = schluesselParsen(schluessel);
    if (muster.length === 1) {
      abgedeckt.add(muster.toLowerCase());
    }
    // Mehrzeichige Regeln (z. B. "sch") decken den einzelnen Buchstaben
    // absichtlich NICHT pauschal ab, da sie nur in genau dieser
    // Buchstabenkombination greifen, nicht bei jedem Vorkommen des
    // Buchstabens für sich. Eine Positionsbeschränkung (z. B. ":ende")
    // wird hier bewusst ignoriert - selbst eine nur teilweise greifende
    // Regel zählt als "irgendeine Abdeckung" für diesen Buchstaben, um
    // keine unnötigen Warnungen zu erzeugen.
  }
  return ALPHABET.filter((buchstabe) => !abgedeckt.has(buchstabe));
}

/**
 * Ab diesem absoluten Zeichen-Zuwachs (ersatz.length - muster.length)
 * UND diesem Vielfachen der Originallänge gilt eine Austausch-Regel als
 * "entartet" und wird von problematischeRegelnErmitteln() gemeldet.
 * Normales Verdoppeln (z. B. "a" -> "aa", Zuwachs 1) bleibt bewusst
 * unauffällig - das ist ein gängiges, gewolltes Profil-Muster.
 */
const REGEL_WARN_MIN_ZUWACHS = 3;
const REGEL_WARN_FAKTOR = 3;

function regelIstUebermaessig(muster, ersatz) {
  if (typeof ersatz !== 'string') return false;
  const zuwachs = ersatz.length - muster.length;
  return zuwachs >= REGEL_WARN_MIN_ZUWACHS && ersatz.length >= muster.length * REGEL_WARN_FAKTOR;
}

/**
 * Sucht in einem (Teil-)Profil nach Austausch-Regeln, die im Verhältnis zu
 * ihrem Ausgangswert unverhältnismäßig viel Text erzeugen und Wörter
 * dadurch stark aufblähen könnten (z. B. eine versehentlich eingetippte
 * Regel "a" -> "aaaaaaaa"). Reine Warnungen zur Anzeige im Profil-Editor -
 * blockiert das Speichern nicht und verändert die eigentliche
 * Transformation nicht.
 * @param {object} profilTeil - { vokal_austausch, konsonant_austausch }
 * @returns {string[]} menschenlesbare Warnmeldungen (leer, wenn alles unauffällig ist)
 */
export function problematischeRegelnErmitteln({ vokal_austausch, konsonant_austausch } = {}) {
  const warnungen = [];

  for (const [bezeichnung, tabelle] of [
    ['Vokal-Regel', vokal_austausch],
    ['Konsonant-Regel', konsonant_austausch],
  ]) {
    for (const [schluesselRoh, ersatz] of Object.entries(tabelle || {})) {
      if (schluesselRoh === WILDCARD_SCHLUESSEL) continue;
      const { muster, position } = schluesselParsen(schluesselRoh);
      if (regelIstUebermaessig(muster, ersatz)) {
        const positionsHinweis = position ? ` (nur ${POSITION_LABEL[position]})` : '';
        warnungen.push(
          `${bezeichnung} "${muster}"${positionsHinweis} → "${ersatz}": Ersatz ist auffällig viel länger als das Original ` +
            `(${muster.length} → ${ersatz.length} Zeichen) und könnte Wörter stark aufblähen.`
        );
      }
    }
  }

  return warnungen;
}

/**
 * Hauptfunktion: wendet alle Muster eines Sprachprofils auf einen Text an.
 * @param {string} text
 * @param {object} profil - Sprachprofil gemäß profiles.json-Schema.
 * @returns {string}
 */
export function apply(text, profil) {
  if (!text) return '';
  if (!profil) return text;

  // Wortgrenzen erhalten (Leerzeichen, Satzzeichen), nur die reinen
  // Wort-Token werden transformiert. `tokens` wird unten bewusst in-place
  // mutiert: ein Rand-Leerzeichen-Muster (siehe
  // wortKernMitGrenzenTransformieren()) kann dazu führen, dass einem
  // Nachbar-Token genau ein Leerzeichen entzogen wird.
  const tokens = text.split(/(\s+)/);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (/^\s+$/.test(token) || token.length === 0) {
      continue;
    }

    // Satzzeichen am Rand abtrennen, damit z. B. "Haus." korrekt behandelt wird.
    const match = token.match(/^(\W*)(.*?)(\W*)$/);
    const [, praefixZeichen, kern, suffixZeichen] = match || ['', '', token, ''];

    if (kern.length === 0) {
      continue;
    }

    const vorToken = tokens[index - 1];
    const nachToken = tokens[index + 1];
    const vorLeerzeichen =
      praefixZeichen === '' && (index === 0 || (typeof vorToken === 'string' && vorToken.endsWith(' ')));
    const nachLeerzeichen =
      suffixZeichen === '' &&
      (index === tokens.length - 1 || (typeof nachToken === 'string' && nachToken.startsWith(' ')));

    const { zeichenArray, vorLeerzeichenVerbraucht, nachLeerzeichenVerbraucht } = wortKernMitGrenzenTransformieren(
      kern,
      { vorLeerzeichen, nachLeerzeichen },
      profil.vokal_austausch,
      profil.konsonant_austausch
    );

    if (vorLeerzeichenVerbraucht && index > 0) {
      tokens[index - 1] = tokens[index - 1].slice(0, -1);
    }
    if (nachLeerzeichenVerbraucht && index < tokens.length - 1) {
      tokens[index + 1] = tokens[index + 1].slice(1);
    }

    let zeichenArrayFinal = zeichenArray;
    if (profil.silbenvertauschung) {
      zeichenArrayFinal = silbenVertauschungAnwenden(zeichenArrayFinal);
    }
    if (profil.wortspiegelung) {
      zeichenArrayFinal = wortspiegelungAnwenden(zeichenArrayFinal);
    }

    tokens[index] = praefixZeichen + zeichenArrayFinal.map((e) => e.zeichen).join('') + suffixZeichen;
  }

  return tokens.join('');
}

/**
 * Fasst aufeinanderfolgende Zeichen mit identischer `art` zu einem Segment
 * zusammen, damit die Anzeige (Diff-Overlay) nicht pro Einzelzeichen,
 * sondern pro zusammenhängendem Änderungsblock ein HTML-Element erzeugen
 * muss.
 */
function nachArtGruppieren(zeichenArray) {
  const segmente = [];
  for (const { zeichen, art } of zeichenArray) {
    const letztes = segmente[segmente.length - 1];
    if (letztes && letztes.art === art) {
      letztes.text += zeichen;
    } else {
      segmente.push({ text: zeichen, art });
    }
  }
  return segmente;
}

/**
 * Wie `apply()`, liefert aber zusätzlich zurück, WELCHE Textstellen durch
 * eine Profilregel verändert wurden und WIE - gedacht für ein optionales
 * Diff-Overlay im UI, das genau nachvollziehbar macht, wo und wodurch das
 * Profil in die reale Zwischensprache eingreift:
 *
 *   - 'hinzugefuegt': die Regel hat MEHR Zeichen erzeugt, als sie
 *     konsumiert hat (z. B. "g" -> "gh").
 *   - 'geaendert': die Regel hat gleich viele Zeichen erzeugt, wie sie
 *     konsumiert hat (z. B. "cz" -> "gh").
 *   - 'entfernt': die Regel hat WENIGER Zeichen erzeugt, als sie
 *     konsumiert hat (z. B. "ll" -> "l").
 *   - null: unveränderter Text (keine Regel hat gegriffen).
 *
 * Vokal- und Konsonantenaustausch laufen nacheinander auf demselben
 * Zeichen-Array: von der ersten Stufe unangetastete Zeichen können in der
 * zweiten Stufe noch eine `art` bekommen (und umgekehrt bleibt eine bereits
 * gesetzte `art` erhalten, wenn die zweite Stufe die betroffenen Zeichen
 * unangetastet durchreicht).
 *
 * @param {string} text
 * @param {object} profil - Sprachprofil gemäß profiles.json-Schema.
 * @returns {{ text: string, segmente: Array<{ text: string, art: string|null }> }}
 */
export function applyMitAnnotationen(text, profil) {
  if (!text) return { text: '', segmente: [] };
  if (!profil) return { text, segmente: text ? [{ text, art: null }] : [] };

  const tokens = text.split(/(\s+)/);

  // 1. Durchlauf: jedes Wort-Token transformieren und dabei ggf. genau ein
  // Leerzeichen aus einem Nachbar-Token verbrauchen (siehe apply() sowie
  // wortKernMitGrenzenTransformieren() für die genaue Begründung). Das
  // Ergebnis pro Wort wird zunächst nur gemerkt (nicht sofort in Text/
  // Segmente umgewandelt), damit ein späteres Wort im selben Durchlauf noch
  // ein zuvor unangetastetes Leerzeichen-Token kürzen kann, BEVOR dieses
  // Token im 2. Durchlauf final zusammengesetzt wird.
  const wortErgebnisse = new Map();

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (/^\s+$/.test(token) || token.length === 0) {
      continue;
    }

    const match = token.match(/^(\W*)(.*?)(\W*)$/);
    const [, praefixZeichen, kern, suffixZeichen] = match || ['', '', token, ''];

    if (kern.length === 0) {
      continue;
    }

    const vorToken = tokens[index - 1];
    const nachToken = tokens[index + 1];
    const vorLeerzeichen =
      praefixZeichen === '' && (index === 0 || (typeof vorToken === 'string' && vorToken.endsWith(' ')));
    const nachLeerzeichen =
      suffixZeichen === '' &&
      (index === tokens.length - 1 || (typeof nachToken === 'string' && nachToken.startsWith(' ')));

    const { zeichenArray, vorLeerzeichenVerbraucht, nachLeerzeichenVerbraucht } = wortKernMitGrenzenTransformieren(
      kern,
      { vorLeerzeichen, nachLeerzeichen },
      profil.vokal_austausch,
      profil.konsonant_austausch
    );

    if (vorLeerzeichenVerbraucht && index > 0) {
      tokens[index - 1] = tokens[index - 1].slice(0, -1);
    }
    if (nachLeerzeichenVerbraucht && index < tokens.length - 1) {
      tokens[index + 1] = tokens[index + 1].slice(1);
    }

    let zeichenArrayFinal = zeichenArray;
    if (profil.silbenvertauschung) {
      zeichenArrayFinal = silbenVertauschungAnwenden(zeichenArrayFinal, { artUeberschreiben: true });
    }
    if (profil.wortspiegelung) {
      zeichenArrayFinal = wortspiegelungAnwenden(zeichenArrayFinal, { artUeberschreiben: true });
    }

    wortErgebnisse.set(index, { praefixZeichen, zeichenArray: zeichenArrayFinal, suffixZeichen });
  }

  // 2. Durchlauf: jetzt anhand der (ggf. gekürzten) Tokens den finalen Text
  // sowie die Diff-Segmente zusammensetzen.
  const segmenteGesamt = [];
  let ergebnisText = '';

  for (let index = 0; index < tokens.length; index += 1) {
    const wortErgebnis = wortErgebnisse.get(index);

    if (wortErgebnis) {
      const { praefixZeichen, zeichenArray, suffixZeichen } = wortErgebnis;

      if (praefixZeichen) segmenteGesamt.push({ text: praefixZeichen, art: null });
      segmenteGesamt.push(...nachArtGruppieren(zeichenArray));
      ergebnisText += praefixZeichen + zeichenArray.map((e) => e.zeichen).join('') + suffixZeichen;
      if (suffixZeichen) segmenteGesamt.push({ text: suffixZeichen, art: null });
      continue;
    }

    // Reines Leerzeichen- oder Satzzeichen-Token (ggf. durch eine
    // Randregel im 1. Durchlauf bereits um ein Zeichen gekürzt) unverändert
    // übernehmen.
    const token = tokens[index];
    if (token.length > 0) segmenteGesamt.push({ text: token, art: null });
    ergebnisText += token;
  }

  return { text: ergebnisText, segmente: segmenteGesamt };
}
