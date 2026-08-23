/**
 * translationClient.js
 * Kapselt die Übersetzungslösung. Nach außen gibt es nur eine Funktion
 * translate(text, zielsprache) – so bleibt der Client austauschbar
 * (z. B. späterer Umstieg auf eine Premium-API + Proxy, siehe SDLC 4.2/4.4).
 *
 * Aktuell implementiert: MyMemory Translation API (kostenlos, CORS-fähig,
 * kein Key nötig -> passt zum "rein statisch, kein Server"-Constraint).
 *
 * E-Mail-Parameter (`de`): Laut MyMemory-Doku erhöht eine mitgegebene
 * Kontakt-E-Mail das Tageslimit von 5.000 auf 50.000 Zeichen. Da dies eine
 * rein statische GitHub-Pages-App ohne eigenen Server ist, würde eine fest
 * einprogrammierte E-Mail-Adresse das Limit für ALLE Besucher gemeinsam
 * verbrauchen. Stattdessen kann jede:r Nutzer:in die eigene E-Mail-Adresse
 * hinterlegen (nur lokal im Browser via localStorage gespeichert) und erhält
 * dadurch ihr/sein eigenes 50.000-Zeichen-Kontingent pro Tag.
 * Quelle: https://lilting.ch/en/articles/mymemory-api
 */

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';

// MyMemory akzeptiert sowohl reine ISO-639-1-Codes ("de") als auch
// Locale-Codes ("de-DE"); wir nutzen hier konsequent das Locale-Format,
// da auch die Zielsprachen-Liste (js/languages.js) diese Codes verwendet
// (1:1 aus dem offiziellen MyMemory-Sprachauswahlmenü übernommen).
const QUELLSPRACHE = 'de-DE';

// Max. Bytes pro Anfrage laut MyMemory-Doku. Etwas konservativer angesetzt,
// um Mehrbyte-Zeichen (Umlaute etc.) nicht versehentlich zu überschreiten.
const MAX_BYTES_PRO_CHUNK = 480;

const LOCALSTORAGE_KEY_VERBRAUCH = 'fantasysprachen_verbrauch_v1';
const LOCALSTORAGE_KEY_EMAIL = 'fantasysprachen_mymemory_email_v1';

const TAGESLIMIT_ANONYM = 5000;
const TAGESLIMIT_MIT_EMAIL = 50000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Liest die vom Nutzer hinterlegte E-Mail-Adresse (falls vorhanden).
 * @returns {string|null}
 */
export function gespeicherteEmailLesen() {
  try {
    return localStorage.getItem(LOCALSTORAGE_KEY_EMAIL) || null;
  } catch {
    return null;
  }
}

/**
 * Speichert die E-Mail-Adresse des Nutzers für den `de`-Parameter, um das
 * persönliche Tageslimit von 5.000 auf 50.000 Zeichen zu erhöhen.
 * @param {string} email
 * @throws {Error} wenn die E-Mail-Adresse ungültig ist
 */
export function emailSpeichern(email) {
  const bereinigt = (email || '').trim();
  if (!EMAIL_REGEX.test(bereinigt)) {
    throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
  }
  try {
    localStorage.setItem(LOCALSTORAGE_KEY_EMAIL, bereinigt);
  } catch {
    throw new Error('E-Mail konnte nicht gespeichert werden (localStorage nicht verfügbar).');
  }
}

/** Entfernt die hinterlegte E-Mail-Adresse wieder (zurück auf anonymes Limit). */
export function emailEntfernen() {
  try {
    localStorage.removeItem(LOCALSTORAGE_KEY_EMAIL);
  } catch {
    // localStorage evtl. nicht verfügbar - kein Problem.
  }
}

/**
 * Teilt einen Text in Chunks von max. MAX_BYTES_PRO_CHUNK Bytes,
 * möglichst an Satzgrenzen, damit die API-Anfrage nicht abgeschnitten wird.
 */
function inChunksAufteilen(text) {
  const saetze = text.match(/[^.!?]+[.!?]*|\s+/g) || [text];
  const chunks = [];
  let aktuell = '';

  const byteLaenge = (s) => new TextEncoder().encode(s).length;

  for (const satz of saetze) {
    if (byteLaenge(aktuell + satz) <= MAX_BYTES_PRO_CHUNK) {
      aktuell += satz;
    } else {
      if (aktuell.trim().length > 0) chunks.push(aktuell);
      // Falls ein einzelner "Satz" bereits zu lang ist, hart aufteilen.
      if (byteLaenge(satz) > MAX_BYTES_PRO_CHUNK) {
        let rest = satz;
        while (byteLaenge(rest) > MAX_BYTES_PRO_CHUNK) {
          let schnitt = MAX_BYTES_PRO_CHUNK;
          chunks.push(rest.slice(0, schnitt));
          rest = rest.slice(schnitt);
        }
        aktuell = rest;
      } else {
        aktuell = satz;
      }
    }
  }
  if (aktuell.trim().length > 0) chunks.push(aktuell);
  return chunks.length > 0 ? chunks : [text];
}

/** Liest den heutigen Zeichenverbrauch aus localStorage (client-seitiges Tracking). */
function heutigenVerbrauchLesen() {
  try {
    const roh = localStorage.getItem(LOCALSTORAGE_KEY_VERBRAUCH);
    if (!roh) return { datum: heutigesDatum(), zeichen: 0 };
    const daten = JSON.parse(roh);
    if (daten.datum !== heutigesDatum()) {
      return { datum: heutigesDatum(), zeichen: 0 };
    }
    return daten;
  } catch {
    return { datum: heutigesDatum(), zeichen: 0 };
  }
}

function heutigesDatum() {
  return new Date().toISOString().slice(0, 10);
}

function verbrauchSchreiben(zusaetzlicheZeichen) {
  const stand = heutigenVerbrauchLesen();
  stand.zeichen += zusaetzlicheZeichen;
  try {
    localStorage.setItem(LOCALSTORAGE_KEY_VERBRAUCH, JSON.stringify(stand));
  } catch {
    // localStorage evtl. nicht verfügbar (Privatmodus) – kein Abbruch nötig.
  }
  return stand.zeichen;
}

/** Aktuelles Tageslimit: 50.000 mit hinterlegter E-Mail, sonst 5.000 (anonym). */
export function tageslimitZeichen() {
  return gespeicherteEmailLesen() ? TAGESLIMIT_MIT_EMAIL : TAGESLIMIT_ANONYM;
}

/** Öffentlich nutzbar für die UI, um proaktiv vor Erreichen des Limits zu warnen. */
export function verbleibendeZeichenHeute() {
  const stand = heutigenVerbrauchLesen();
  return Math.max(0, tageslimitZeichen() - stand.zeichen);
}

/**
 * Übersetzt einen deutschen Text in die angegebene Zielsprache.
 * @param {string} text - Eingabetext (Deutsch)
 * @param {string} zielsprache - ISO-639-1-Code, z. B. "sv"
 * @returns {Promise<string>} übersetzter Text
 */
export async function translate(text, zielsprache) {
  if (!text || text.trim().length === 0) {
    throw new Error('Bitte zuerst einen Text eingeben.');
  }

  if (verbleibendeZeichenHeute() < text.length) {
    throw new Error(
      'Tageslimit der Übersetzungs-API erreicht, bitte morgen erneut versuchen ' +
      '(oder eine E-Mail-Adresse hinterlegen, um das Limit auf 50.000 Zeichen zu erhöhen).'
    );
  }

  const chunks = inChunksAufteilen(text);
  const uebersetzteChunks = [];

  for (const chunk of chunks) {
    const uebersetzt = await chunkUebersetzen(chunk, zielsprache);
    uebersetzteChunks.push(uebersetzt);
  }

  verbrauchSchreiben(text.length);

  return uebersetzteChunks.join('');
}

async function chunkUebersetzen(chunk, zielsprache) {
  const params = new URLSearchParams({
    q: chunk,
    langpair: `${QUELLSPRACHE}|${zielsprache}`,
  });

  const email = gespeicherteEmailLesen();
  if (email) {
    params.set('de', email);
  }

  let response;
  try {
    response = await fetch(`${MYMEMORY_ENDPOINT}?${params.toString()}`);
  } catch (fehler) {
    throw new Error(
      'Übersetzungs-API nicht erreichbar. Bitte Internetverbindung prüfen.'
    );
  }

  if (!response.ok) {
    throw new Error(`Übersetzungs-API-Fehler (HTTP ${response.status}).`);
  }

  let daten;
  try {
    daten = await response.json();
  } catch {
    throw new Error('Antwort der Übersetzungs-API war kein gültiges JSON.');
  }

  const status = daten?.responseStatus;
  // MyMemory liefert bei Limitüberschreitung/Fehlern oft Status 403 oder
  // eine Fehlermeldung im responseDetails-Feld statt einer Übersetzung.
  if (status && Number(status) !== 200) {
    if (Number(status) === 403 || /LIMIT/i.test(String(daten?.responseDetails || ''))) {
      throw new Error(
        'Tageslimit der Übersetzungs-API erreicht, bitte morgen erneut versuchen.'
      );
    }
    throw new Error(`Übersetzung fehlgeschlagen: ${daten?.responseDetails || status}`);
  }

  const ergebnis = daten?.responseData?.translatedText;
  if (typeof ergebnis !== 'string' || ergebnis.length === 0) {
    // MyMemory antwortet für manche (meist sehr ressourcenarme) Sprachpaare
    // mit HTTP 200/Status 200, aber leerem translatedText, wenn weder ein
    // Treffer im Übersetzungsspeicher noch eine funktionierende Anbindung
    // an die dahinterliegende Machine-Translation-Engine existiert - das
    // ist kein technischer Fehler dieser App, sondern eine Abdeckungslücke
    // der kostenlosen API für diese konkrete Sprache.
    throw new Error(
      'Übersetzungs-API lieferte kein verwertbares Ergebnis. Das deutet ' +
        'meist darauf hin, dass die gewählte Zielsprache von der ' +
        'kostenlosen MyMemory-API nicht (zuverlässig) unterstützt wird - ' +
        'unabhängig vom Schriftsystem. Bitte eine andere Sprache probieren ' +
        'oder es später erneut versuchen.'
    );
  }

  return ergebnis;
}
