/**
 * profileRepository.js
 * Lädt und verwaltet die Sprachprofile aus data/profiles.json.
 * Kein Backend, keine Datenbank – rein statische JSON-Datei per fetch().
 *
 * Nutzer:innen können pro Profil eigene Anpassungen vornehmen (reale
 * Zwischensprache, Vokal-/Konsonantenaustausch). Diese werden NICHT in profiles.json geschrieben
 * (rein statische Datei, kein Server), sondern als Overrides in
 * localStorage abgelegt und beim Laden über die Basisdaten gelegt.
 */

const PROFILES_URL = new URL('../data/profiles.json', import.meta.url).href;
const OVERRIDES_KEY = 'fantasysprachen_profil_overrides_v1';
const CUSTOM_KEY = 'fantasysprachen_profil_custom_v1';

let cachedBasisProfile = null;

/**
 * Prüft, ob ein rohes Profilobjekt die erwartete Struktur hat.
 * Fehlerhafte Einträge werden übersprungen (mit Konsolen-Warnung),
 * statt die gesamte App abstürzen zu lassen.
 */
function isValidProfile(profil) {
  if (!profil || typeof profil !== 'object') return false;
  const requiredStrings = ['id', 'name', 'zielsprache'];
  for (const feld of requiredStrings) {
    if (typeof profil[feld] !== 'string' || profil[feld].length === 0) {
      return false;
    }
  }
  if (typeof profil.romanisierung_noetig !== 'boolean') return false;
  if (typeof profil.vokal_austausch !== 'object') return false;
  if (typeof profil.konsonant_austausch !== 'object') return false;
  return true;
}

/**
 * Lädt die unveränderten Basisprofile aus profiles.json (ohne Overrides).
 * Ergebnis wird im Modul zwischengespeichert, damit die Datei nur einmal
 * pro Seitenaufruf geladen wird.
 * @returns {Promise<Array<object>>}
 */
export async function ladeBasisProfile() {
  if (cachedBasisProfile) {
    return cachedBasisProfile;
  }

  let response;
  try {
    response = await fetch(PROFILES_URL);
  } catch (fehler) {
    throw new Error(
      'Sprachprofile konnten nicht geladen werden (Netzwerkfehler). ' +
      'Läuft die Seite über einen lokalen/statischen Server?'
    );
  }

  if (!response.ok) {
    throw new Error(
      `Sprachprofile konnten nicht geladen werden (HTTP ${response.status}).`
    );
  }

  let rohdaten;
  try {
    rohdaten = await response.json();
  } catch (fehler) {
    throw new Error('data/profiles.json enthält kein gültiges JSON.');
  }

  if (!Array.isArray(rohdaten)) {
    throw new Error('data/profiles.json muss ein Array von Profilobjekten sein.');
  }

  const gueltigeProfile = [];
  for (const eintrag of rohdaten) {
    if (isValidProfile(eintrag)) {
      gueltigeProfile.push(eintrag);
    } else {
      console.warn('Ungültiges Sprachprofil übersprungen:', eintrag);
    }
  }

  if (gueltigeProfile.length === 0) {
    throw new Error('Keine gültigen Sprachprofile gefunden.');
  }

  cachedBasisProfile = gueltigeProfile;
  return cachedBasisProfile;
}

// --- Overrides (nutzerseitige Anpassungen), gespeichert in localStorage ---

function overridesLesen() {
  try {
    const roh = localStorage.getItem(OVERRIDES_KEY);
    return roh ? JSON.parse(roh) : {};
  } catch {
    return {};
  }
}

function overridesSchreiben(map) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    throw new Error('Änderung konnte nicht gespeichert werden (localStorage nicht verfügbar).');
  }
}

/** Liefert die rohe Override-Teilmenge für ein Profil (oder null). */
export function holeUeberschreibung(id) {
  const alle = overridesLesen();
  return alle[id] || null;
}

/**
 * Speichert eine vollständige Überschreibung für ein Profil. `patch` sollte
 * die Felder zielsprache, zielsprache_name, romanisierung_noetig,
 * vokal_austausch und konsonant_austausch enthalten (jeweils vollständig,
 * nicht als Diff).
 */
export function setzeUeberschreibung(id, patch) {
  const alle = overridesLesen();
  alle[id] = patch;
  overridesSchreiben(alle);
}

/** Entfernt die Überschreibung für ein Profil (zurück auf den Auslieferungszustand). */
export function entferneUeberschreibung(id) {
  const alle = overridesLesen();
  delete alle[id];
  overridesSchreiben(alle);
}

// --- Benutzerdefinierte Profile (per Import hinzugefügt, existieren NICHT
// in data/profiles.json), gespeichert in localStorage ---

function benutzerdefinierteProfileLesen() {
  try {
    const roh = localStorage.getItem(CUSTOM_KEY);
    return roh ? JSON.parse(roh) : {};
  } catch {
    return {};
  }
}

function benutzerdefinierteProfileSchreiben(map) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(map));
  } catch {
    throw new Error('Benutzerdefinierte Profile konnten nicht gespeichert werden (localStorage nicht verfügbar).');
  }
}

/** Liefert alle benutzerdefinierten (importierten) Profile als Array, id-sortiert. */
export function holeBenutzerdefinierteProfile() {
  return Object.values(benutzerdefinierteProfileLesen()).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Fügt ein oder mehrere vollständige, bereits validierte Profilobjekte als
 * benutzerdefinierte Profile hinzu bzw. überschreibt bestehende gleichen
 * Namens (per id). Wird vom Import (profileImportExport.js) sowie beim
 * Bearbeiten eines bereits importierten Profils im Editor verwendet.
 */
export function setzeBenutzerdefinierteProfile(profile) {
  const alle = benutzerdefinierteProfileLesen();
  for (const profil of profile) {
    alle[profil.id] = profil;
  }
  benutzerdefinierteProfileSchreiben(alle);
}

/** Entfernt ein benutzerdefiniertes (importiertes) Profil vollständig. */
export function entferneBenutzerdefiniertesProfil(id) {
  const alle = benutzerdefinierteProfileLesen();
  delete alle[id];
  benutzerdefinierteProfileSchreiben(alle);
}

/** Ob es sich um ein per Import hinzugefügtes Profil handelt (nicht in profiles.json enthalten). */
export function istBenutzerdefiniertesProfil(id) {
  return Object.prototype.hasOwnProperty.call(benutzerdefinierteProfileLesen(), id);
}

/**
 * Einheitliche Speicherfunktion für den Profil-Editor: aktualisiert je
 * nach Herkunft entweder die Überschreibung eines Basisprofils oder direkt
 * ein benutzerdefiniertes (importiertes) Profil - der Editor muss den
 * Unterschied nicht selbst kennen.
 */
export function speichereProfil(id, patch) {
  if (istBenutzerdefiniertesProfil(id)) {
    const alle = benutzerdefinierteProfileLesen();
    alle[id] = { ...alle[id], ...patch, id };
    benutzerdefinierteProfileSchreiben(alle);
  } else {
    setzeUeberschreibung(id, patch);
  }
}

function mitUeberschreibungZusammenfuehren(basisProfil, override) {
  if (!override) return basisProfil;
  return {
    ...basisProfil,
    ...override,
    // Verschachtelte Objekte/Arrays vollständig ersetzen, nicht flach mergen,
    // damit z. B. ein gelöschter Vokal-Eintrag auch wirklich verschwindet.
    vokal_austausch: override.vokal_austausch ?? basisProfil.vokal_austausch,
    konsonant_austausch: override.konsonant_austausch ?? basisProfil.konsonant_austausch,
  };
}

/**
 * Lädt alle Sprachprofile inkl. nutzerseitiger Überschreibungen UND per
 * Import hinzugefügter benutzerdefinierter Profile (effektive Profile, wie
 * sie bei der Generierung tatsächlich verwendet werden).
 * @returns {Promise<Array<object>>}
 */
export async function ladeProfile() {
  const basisListe = await ladeBasisProfile();
  const overrides = overridesLesen();
  const effektiveBasis = basisListe.map((basis) =>
    mitUeberschreibungZusammenfuehren(basis, overrides[basis.id])
  );
  return [...effektiveBasis, ...holeBenutzerdefinierteProfile()];
}

/**
 * Liefert ein einzelnes (effektives, ggf. überschriebenes) Profil anhand
 * seiner id.
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export async function findeProfilNachId(id) {
  const profile = await ladeProfile();
  return profile.find((p) => p.id === id);
}

/** Liefert das unveränderte Basisprofil (für "Auf Standard zurücksetzen"). */
export async function findeBasisProfilNachId(id) {
  const profile = await ladeBasisProfile();
  return profile.find((p) => p.id === id);
}

/** Ob für ein Profil aktuell eine nutzerseitige Überschreibung existiert. */
export function hatUeberschreibung(id) {
  return holeUeberschreibung(id) !== null;
}
