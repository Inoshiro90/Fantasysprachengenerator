/**
 * silbentrennung.js
 * Heuristische Trennung eines Wortkerns in Sprech-Silben, angelehnt an die
 * klassische Faustregel: von einem Konsonanten-Cluster ZWISCHEN zwei
 * Silbenkernen (= zusammenhängenden Vokal-Läufen) bleibt genau EIN
 * Konsonant beim FOLGENDEN Silbenkern, alle übrigen beim vorangehenden -
 * z. B. "Garten" -> ["Gar", "ten"], "Anna" -> ["An", "na"].
 *
 * Bewusst KEINE vollständige linguistische Analyse: Diphthonge (z. B. "au",
 * "ei") werden als ein einziger Silbenkern behandelt statt gesondert
 * erkannt, Präfix-/Fremdwortgrenzen (z. B. "Wachs-tube" vs. "Wach-stube")
 * werden nicht berücksichtigt. Für die Verfremdungs-Optionen
 * (Silbenvertauschung, -verdopplung, Betonungs-Markierung) reicht eine
 * grobe, aber deterministische und für Nutzer:innen nachvollziehbare
 * Annäherung - exakte Duden-Trennung ist hier kein Ziel.
 */

const VOKALE = new Set('aeiouyAEIOUY'.split(''));

function istVokal(zeichen) {
  return VOKALE.has(zeichen);
}

/**
 * Zerlegt einen Wortkern (ohne Satzzeichen/Leerzeichen) in Silben.
 * Die zurückgegebenen Teil-Strings ergeben aneinandergehängt wieder exakt
 * das Original - es gehen also keine Zeichen verloren oder werden verändert,
 * nur die Schnittstellen zwischen den Teilen werden bestimmt.
 *
 * @param {string} kern
 * @returns {string[]} Silben in der ursprünglichen Reihenfolge. Enthält
 *   Wörter ohne jeden Vokal (z. B. "pst") als ein einziges Segment.
 */
export function wortInSilbenZerlegen(kern) {
  if (!kern) return [];

  // 1. Zusammenhängende Vokal-Läufe (= Silbenkerne) finden. Mehrere Vokale
  // hintereinander (Diphthong oder Hiatus) zählen dabei bewusst als EIN
  // Kern, nicht mehrere - eine Trennung mitten im Vokal-Lauf wäre ohne
  // echtes Wörterbuchwissen nicht zuverlässig möglich.
  const vokalLaeufe = [];
  let i = 0;
  while (i < kern.length) {
    if (istVokal(kern[i])) {
      const start = i;
      while (i < kern.length && istVokal(kern[i])) i += 1;
      vokalLaeufe.push({ start, ende: i });
    } else {
      i += 1;
    }
  }

  // Kein Vokal im Wort -> keine erkennbare Silbengrenze möglich.
  if (vokalLaeufe.length === 0) {
    return [kern];
  }

  // 2. Grenze zwischen je zwei benachbarten Silbenkernen bestimmen: vom
  // Konsonanten-Block dazwischen bleibt der LETZTE Konsonant beim
  // folgenden Kern, der Rest beim vorangehenden (z. B. bei "rt" zwischen
  // "a" und "e" in "Garten": "r" bleibt bei "Gar", "t" wandert zu "ten").
  // Stehen die beiden Kerne direkt nebeneinander (kein Konsonant dazwischen,
  // z. B. Hiatus wie in "Kaos"), verläuft die Grenze direkt zwischen ihnen.
  const grenzen = [];
  for (let index = 0; index < vokalLaeufe.length - 1; index += 1) {
    const consStart = vokalLaeufe[index].ende;
    const consEnde = vokalLaeufe[index + 1].start;
    const consAnzahl = consEnde - consStart;
    grenzen.push(consStart + Math.max(consAnzahl - 1, 0));
  }

  // 3. Wortkern anhand der Grenzen in die einzelnen Silben zerschneiden.
  // Führende Konsonanten vor dem ersten Kern gehören automatisch zur
  // ersten Silbe, nachfolgende Konsonanten nach dem letzten Kern
  // automatisch zur letzten - beides ergibt sich von selbst, da vor der
  // ersten bzw. nach der letzten Grenze geschnitten wird.
  const silben = [];
  let vorherigeGrenze = 0;
  for (const grenze of grenzen) {
    silben.push(kern.slice(vorherigeGrenze, grenze));
    vorherigeGrenze = grenze;
  }
  silben.push(kern.slice(vorherigeGrenze));

  return silben;
}
