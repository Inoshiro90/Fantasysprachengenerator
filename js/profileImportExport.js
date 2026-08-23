/**
 * profileImportExport.js
 * Export der aktuell wirksamen Sprachprofile (Basis + Überschreibungen +
 * benutzerdefinierte/importierte Profile) als JSON-Datei sowie Import
 * einer selbst erstellten/bearbeiteten profiles.json.
 *
 * Validierungsphilosophie beim Import: möglichst granular. Ein einzelner
 * kaputter Wert soll nicht dazu führen, dass ein ganzes Profil oder gar
 * die gesamte Datei verworfen wird - siehe profilEintragValidieren() und
 * tabelleBereinigen() weiter unten. Nur wenn ein Profil nicht einmal die
 * nötigsten Identitätsfelder (id/name/zielsprache) hat, wird dieses EINE
 * Profil komplett übersprungen; alles andere in der Datei bleibt davon
 * unberührt.
 */

import { ladeProfile, ladeBasisProfile, setzeUeberschreibung, setzeBenutzerdefinierteProfile } from './profileRepository.js';
import { schluesselParsen, GUELTIGE_POSITIONEN } from './phonemeTransformer.js';

const ZIELSPRACHE_MUSTER = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/;
const ID_MUSTER = /^[a-zA-Z0-9_-]+$/;
// Buchstaben (inkl. Umlaute/Akzente, falls jemand eine bereits umschriebene
// Zwischensprache als Regel-Ausgangspunkt nutzt) und Apostroph, wie sie in
// den mitgelieferten Profilen und im Profil-Editor vorkommen.
const REGEL_MUSTER_MUSTER = /^[a-zA-ZÀ-ÖØ-öø-ÿ']{1,16}$/;
const REGEL_WERT_MAX_LAENGE = 24;

// --- Export -----------------------------------------------------------

/**
 * Sammelt die aktuell wirksamen Profile (inkl. Überschreibungen und
 * benutzerdefinierter/importierter Profile) in exportierbarer Form: nur
 * die im Schema vorgesehenen Felder, in stabiler Reihenfolge.
 * @returns {Promise<object[]>}
 */
export async function profileFuerExportSammeln() {
  const profile = await ladeProfile();
  return profile.map((p) => ({
    id: p.id,
    name: p.name,
    zielsprache: p.zielsprache,
    zielsprache_name: p.zielsprache_name || p.zielsprache,
    romanisierung_noetig: !!p.romanisierung_noetig,
    vokal_austausch: p.vokal_austausch || {},
    konsonant_austausch: p.konsonant_austausch || {},
  }));
}

/**
 * Baut die Export-JSON und stößt den Browser-Download an.
 * @returns {Promise<number>} Anzahl exportierter Profile
 */
export async function profileExportieren() {
  const daten = await profileFuerExportSammeln();
  const json = JSON.stringify(daten, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const datum = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `fantasysprachen-profile-${datum}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return daten.length;
}

// --- Import: Validierung ------------------------------------------------

function istGueltigerRegelSchluessel(schluesselRoh) {
  if (typeof schluesselRoh !== 'string' || schluesselRoh.length === 0) return false;
  if (schluesselRoh === '*') return true;
  const { muster, position } = schluesselParsen(schluesselRoh);
  if (position !== null && !GUELTIGE_POSITIONEN.includes(position)) return false;
  if (muster === '*') return true;
  return REGEL_MUSTER_MUSTER.test(muster);
}

/**
 * Bereinigt eine Austausch-Tabelle (vokal_austausch/konsonant_austausch)
 * Regel für Regel: nur die einzelne fehlerhafte Regel wird übersprungen
 * (mit Warnmeldung), der Rest der Tabelle bleibt vollständig erhalten.
 * Ist die Tabelle als Ganzes kein Objekt, wird sie durch eine leere
 * Tabelle ersetzt (das Profil selbst bleibt trotzdem gültig).
 */
function tabelleBereinigen(tabelle, tabellenName, bezeichnung, warnungen) {
  if (tabelle === undefined) return {};
  if (tabelle === null || typeof tabelle !== 'object' || Array.isArray(tabelle)) {
    warnungen.push(`${bezeichnung}: "${tabellenName}" ist kein Objekt und wurde als leere Tabelle übernommen.`);
    return {};
  }

  const bereinigt = {};
  for (const [schluesselRoh, wert] of Object.entries(tabelle)) {
    if (!istGueltigerRegelSchluessel(schluesselRoh)) {
      warnungen.push(
        `${bezeichnung}: Regel "${schluesselRoh}" in "${tabellenName}" hat ein ungültiges Format ` +
        `(erlaubt: Buchstaben, optional gefolgt von ":anfang"/":mitte"/":ende", oder "*") und wurde übersprungen.`
      );
      continue;
    }
    if (typeof wert !== 'string') {
      warnungen.push(`${bezeichnung}: Regel "${schluesselRoh}" in "${tabellenName}" hat keinen Textwert und wurde übersprungen.`);
      continue;
    }
    if (wert.length > REGEL_WERT_MAX_LAENGE) {
      warnungen.push(`${bezeichnung}: Regel "${schluesselRoh}" in "${tabellenName}" ist mit ${wert.length} Zeichen unplausibel lang und wurde übersprungen.`);
      continue;
    }
    bereinigt[schluesselRoh] = wert;
  }
  return bereinigt;
}

function sprachcodeNormalisieren(code) {
  const teile = code.split('-');
  if (teile.length === 2) return `${teile[0].toLowerCase()}-${teile[1].toUpperCase()}`;
  return teile[0].toLowerCase();
}

/**
 * Validiert + bereinigt ein einzelnes rohes Profilobjekt aus der
 * importierten Datei.
 * @returns {{ profil: object, warnungenAnzahl: number } | { fehler: string }}
 */
function profilEintragValidieren(roh, index, warnungen) {
  const startWarnungen = warnungen.length;
  const vorlaeufigeBezeichnung = roh && typeof roh.id === 'string' && roh.id.trim().length > 0
    ? `Profil "${roh.id.trim()}"`
    : `Eintrag #${index + 1}`;

  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) {
    return { fehler: `${vorlaeufigeBezeichnung}: kein gültiges JSON-Objekt.` };
  }
  if (typeof roh.id !== 'string' || !ID_MUSTER.test(roh.id.trim())) {
    return { fehler: `${vorlaeufigeBezeichnung}: "id" fehlt oder enthält ungültige Zeichen (erlaubt: Buchstaben, Zahlen, "_" und "-").` };
  }
  const id = roh.id.trim();
  const bezeichnung = `Profil "${id}"`;

  if (typeof roh.name !== 'string' || roh.name.trim().length === 0) {
    return { fehler: `${bezeichnung}: "name" fehlt oder ist leer.` };
  }
  if (typeof roh.zielsprache !== 'string' || !ZIELSPRACHE_MUSTER.test(roh.zielsprache.trim())) {
    return { fehler: `${bezeichnung}: "zielsprache" fehlt oder ist kein gültiger Sprachcode (z. B. "fi-FI" oder "grc-GR").` };
  }

  const zielsprache = sprachcodeNormalisieren(roh.zielsprache.trim());
  let zielsprache_name = roh.zielsprache_name;
  if (typeof zielsprache_name !== 'string' || zielsprache_name.trim().length === 0) {
    if (roh.zielsprache_name !== undefined) {
      warnungen.push(`${bezeichnung}: "zielsprache_name" war leer/ungültig, wurde durch den Sprachcode ersetzt.`);
    }
    zielsprache_name = zielsprache.toUpperCase();
  } else {
    zielsprache_name = zielsprache_name.trim();
  }

  let romanisierung_noetig = roh.romanisierung_noetig;
  if (typeof romanisierung_noetig !== 'boolean') {
    if (romanisierung_noetig !== undefined) {
      warnungen.push(`${bezeichnung}: "romanisierung_noetig" war kein true/false-Wert, wurde auf false gesetzt.`);
    }
    romanisierung_noetig = false;
  }

  const vokal_austausch = tabelleBereinigen(roh.vokal_austausch, 'vokal_austausch', bezeichnung, warnungen);
  const konsonant_austausch = tabelleBereinigen(roh.konsonant_austausch, 'konsonant_austausch', bezeichnung, warnungen);

  return {
    profil: { id, name: roh.name.trim(), zielsprache, zielsprache_name, romanisierung_noetig, vokal_austausch, konsonant_austausch },
    warnungenAnzahl: warnungen.length - startWarnungen,
  };
}

/**
 * Parst und validiert den Inhalt einer importierten JSON-Datei granular.
 * Wirft nur, wenn die Datei als Ganzes nicht verarbeitbar ist (kein JSON /
 * kein Array). Alles Feinere landet in den zurückgegebenen Listen.
 *
 * @param {string} rohtext
 * @returns {{
 *   erfolgreich: object[],
 *   fehler: string[],
 *   warnungen: string[],
 * }}
 */
export function profileJsonValidieren(rohtext) {
  let daten;
  try {
    daten = JSON.parse(rohtext);
  } catch (fehler) {
    throw new Error(`Die Datei enthält kein gültiges JSON (${fehler.message}).`);
  }

  if (Array.isArray(daten) === false) {
    if (daten && typeof daten === 'object') {
      throw new Error('Die JSON-Datei muss ein Array von Profilobjekten sein ([ {...}, {...} ]), nicht ein einzelnes Objekt.');
    }
    throw new Error('Die JSON-Datei muss ein Array von Profilobjekten sein.');
  }
  if (daten.length === 0) {
    throw new Error('Die JSON-Datei enthält keine Profile (leeres Array).');
  }

  const erfolgreich = [];
  const fehler = [];
  const warnungen = [];
  const gesehenIds = new Set();

  daten.forEach((roh, index) => {
    const ergebnis = profilEintragValidieren(roh, index, warnungen);
    if ('fehler' in ergebnis) {
      fehler.push(ergebnis.fehler);
      return;
    }
    if (gesehenIds.has(ergebnis.profil.id)) {
      fehler.push(`Profil "${ergebnis.profil.id}": id kommt mehrfach in der Datei vor - nur das erste Vorkommen wurde übernommen.`);
      return;
    }
    gesehenIds.add(ergebnis.profil.id);
    erfolgreich.push(ergebnis.profil);
  });

  return { erfolgreich, fehler, warnungen };
}

// --- Import: Übernahme ---------------------------------------------------

/**
 * Validiert den Dateiinhalt und übernimmt alle gültigen Profile: Profile,
 * deren id mit einem mitgelieferten Basisprofil übereinstimmt, werden als
 * Überschreibung gespeichert ("verändertes Profil"); alle anderen ids
 * werden als neue benutzerdefinierte Profile angelegt ("hinzugefügtes
 * Profil"). Nichts wird angewendet, wenn KEIN Eintrag gültig war.
 *
 * @param {string} rohtext
 * @returns {Promise<{
 *   uebernommenGesamt: number,
 *   alsUeberschreibungUebernommen: number,
 *   alsNeuUebernommen: number,
 *   fehler: string[],
 *   warnungen: string[],
 * }>}
 */
export async function profileImportieren(rohtext) {
  const { erfolgreich, fehler, warnungen } = profileJsonValidieren(rohtext);

  if (erfolgreich.length === 0) {
    return { uebernommenGesamt: 0, alsUeberschreibungUebernommen: 0, alsNeuUebernommen: 0, fehler, warnungen };
  }

  const basisListe = await ladeBasisProfile();
  const basisIds = new Set(basisListe.map((p) => p.id));

  const alsUeberschreibung = [];
  const alsNeu = [];
  for (const profil of erfolgreich) {
    if (basisIds.has(profil.id)) {
      alsUeberschreibung.push(profil);
    } else {
      alsNeu.push(profil);
    }
  }

  for (const profil of alsUeberschreibung) {
    const { id, ...patch } = profil;
    setzeUeberschreibung(id, patch);
  }
  if (alsNeu.length > 0) {
    setzeBenutzerdefinierteProfile(alsNeu);
  }

  return {
    uebernommenGesamt: erfolgreich.length,
    alsUeberschreibungUebernommen: alsUeberschreibung.length,
    alsNeuUebernommen: alsNeu.length,
    fehler,
    warnungen,
  };
}
