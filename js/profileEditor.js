/**
 * profileEditor.js
 * Baut und steuert die "Profil bearbeiten"-Karte: reale Zwischensprache
 * auswählen (aus kuratierter Liste oder als freier ISO-Code), sowie
 * Vokal-/Konsonantenaustausch frei bearbeiten und erweitern.
 *
 * Änderungen werden als Overrides über profileRepository.js in
 * localStorage gespeichert und wirken sich sofort auf die Generierung aus.
 */

import {
  findeProfilNachId,
  entferneUeberschreibung,
  hatUeberschreibung,
  istBenutzerdefiniertesProfil,
  entferneBenutzerdefiniertesProfil,
  speichereProfil,
} from './profileRepository.js';
import {
  SPRACHEN,
  findeSpracheNachCode,
  schriftLabel,
  romanisierungFuerCode,
} from './languages.js';
import { problematischeRegelnErmitteln, schluesselParsen, schluesselKodieren, GUELTIGE_POSITIONEN } from './phonemeTransformer.js';

let aktuelleProfilId = null;
let onGespeichertCallback = null;

export function initProfilEditor({ onGespeichert } = {}) {
  onGespeichertCallback = onGespeichert || null;
  spracheSelectBefuellen();
  bindEvents();
}

function el(id) {
  return document.getElementById(id);
}

/** Icon + Guide-Alert-Klasse je nach Nachrichtenart (siehe .alert-* in style.css). */
const ALERT_ICON = { info: 'ℹ️', erfolg: '✅', warnung: '⚠️', fehler: '⚠️' };
const ALERT_KLASSE = { info: 'alert-info', erfolg: 'alert-success', warnung: 'alert-warning', fehler: 'alert-error' };

/**
 * Befüllt die #editor-status Alert-Box (Guide-Komponente .alert). Der
 * Inhalt wird über `inhaltAufbauen(contentEl)` erzeugt, damit sowohl
 * einfache Textmeldungen als auch die Warnliste (verschachteltes <ul>)
 * darüber laufen können.
 */
function statusAnzeigen(art, inhaltAufbauen) {
  const statusEl = el('editor-status');
  statusEl.className = `alert ${ALERT_KLASSE[art] || ALERT_KLASSE.info}`;
  statusEl.querySelector('.alert-icon').textContent = ALERT_ICON[art] || ALERT_ICON.info;
  const content = statusEl.querySelector('.alert-content');
  content.innerHTML = '';
  inhaltAufbauen(content);
  statusEl.hidden = false;
}

/**
 * Baut das Dropdown, gruppiert nach Umschrift-Qualität (🟢/🟡/🔴, siehe
 * QUALITAET_REIHENFOLGE in languages.js) und innerhalb jeder Gruppe
 * alphabetisch nach Sprachname sortiert. Wichtig: es wird über ALLE
 * Sprachen aus SPRACHEN iteriert (keine feste Schrift-Allowlist mehr,
 * wie es sie vorher gab) - so kann keine Sprache mehr versehentlich aus
 * dem Dropdown verschwinden, nur weil ihr Schriftsystem beim Anlegen
 * einer neuen Umschrift vergessen wurde (siehe Git-Historie: Chinesisch
 * fehlte dadurch zuvor komplett).
 */
function spracheSelectBefuellen() {
  const select = el('editor-sprache-select');
  select.innerHTML = '';

  const sprachen = [...SPRACHEN].sort((a, b) =>
    a.name.localeCompare(b.name, 'de')
  );

  for (const sprache of sprachen) {
    const option = document.createElement('option');
    option.value = sprache.code;
    option.textContent = sprache.name;
    select.appendChild(option);
  }
}

/** Zeigt ein (effektives) Profil zur Bearbeitung an. */
export async function zeigeProfilImEditor(profilId) {
  aktuelleProfilId = profilId;
  const profil = await findeProfilNachId(profilId);
  if (!profil) return;

  el('editor-profil-name').textContent = profil.name;

  const benutzerdefiniert = istBenutzerdefiniertesProfil(profilId);
  const ueberschrieben = hatUeberschreibung(profilId);
  const badge = el('editor-override-badge');
  badge.hidden = !(benutzerdefiniert || ueberschrieben);
  badge.textContent = benutzerdefiniert ? 'Importiert' : 'Angepasst';
  // "Zurücksetzen" ergibt bei einem importierten Profil keinen Sinn (es
  // gibt keinen Auslieferungszustand dafür) - dort stattdessen "Löschen".
  el('editor-zuruecksetzen-button').hidden = !ueberschrieben || benutzerdefiniert;
  el('editor-loeschen-button').hidden = !benutzerdefiniert;

  spracheImEditorAnzeigen(profil);

  listeNeuAufbauen(
    'editor-vokal-liste',
    austauschZeileErzeugen,
    Object.entries(profil.vokal_austausch || {}).map(([schluesselRoh, zu]) => {
      const { muster, position } = schluesselParsen(schluesselRoh);
      return [muster, zu, position];
    })
  );
  listeNeuAufbauen(
    'editor-konsonant-liste',
    austauschZeileErzeugen,
    Object.entries(profil.konsonant_austausch || {}).map(([schluesselRoh, zu]) => {
      const { muster, position } = schluesselParsen(schluesselRoh);
      return [muster, zu, position];
    })
  );

  el('editor-status').hidden = true;
}

function spracheImEditorAnzeigen(profil) {
  const select = el('editor-sprache-select');
  const customToggle = el('editor-sprache-custom-toggle');
  const customFelder = el('editor-sprache-custom-felder');
  const bekannt = findeSpracheNachCode(profil.zielsprache);

  if (bekannt) {
    customToggle.checked = false;
    customFelder.hidden = true;
    select.disabled = false;
    select.value = profil.zielsprache;
  } else {
    customToggle.checked = true;
    customFelder.hidden = false;
    select.disabled = true;
    el('editor-sprache-custom-code').value = profil.zielsprache;
    el('editor-sprache-custom-name').value = profil.zielsprache_name || '';
    el('editor-sprache-custom-romanisierung').checked = !!profil.romanisierung_noetig;
  }
  schriftHinweisAktualisieren();
}

function schriftHinweisAktualisieren() {
  const hinweis = el('editor-schrift-hinweis');
  const customToggle = el('editor-sprache-custom-toggle');

  if (customToggle.checked) {
    hinweis.textContent =
      'Bei einem eigenen Sprachcode gibst du unten selbst an, ob eine Umschrift angewendet werden soll.';
    hinweis.className = 'form-hint';
    return;
  }

  const select = el('editor-sprache-select');
  const sprache = findeSpracheNachCode(select.value);
  if (!sprache) {
    hinweis.textContent = '';
    return;
  }

  const KLASSE_NACH_QUALITAET = {
    gruen: 'form-hint-erfolg',
    gelb: 'form-hint-warnung',
    rot: 'form-hint-fehler',
  };
  hinweis.className = `form-hint ${KLASSE_NACH_QUALITAET[sprache.qualitaet] || ''}`.trim();
}

function listeNeuAufbauen(containerId, zeilenErzeuger, eintraege) {
  const container = el(containerId);
  container.innerHTML = '';
  if (eintraege.length === 0) {
    zeilenErzeuger(container);
  } else {
    for (const eintrag of eintraege) zeilenErzeuger(container, ...eintrag);
  }
}

function erzeugeEntfernenButton(zeileElement) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn-icon-entfernen';
  button.setAttribute('aria-label', 'Regel entfernen');
  button.textContent = '✕';
  button.addEventListener('click', () => zeileElement.remove());
  return button;
}

const POSITION_OPTIONEN = [
  ['', 'Überall'],
  ['anfang', 'Wortanfang'],
  ['mitte', 'Wortmitte'],
  ['ende', 'Wortende'],
];

function austauschZeileErzeugen(container, von = '', zu = '', position = null) {
  const zeile = document.createElement('div');
  zeile.className = 'editor-zeile';

  const vonInput = document.createElement('input');
  vonInput.className = 'form-input editor-von';
  vonInput.type = 'text';
  vonInput.maxLength = 6;
  vonInput.placeholder = 'von (z. B. a)';
  vonInput.value = von;

  const pfeil = document.createElement('span');
  pfeil.className = 'editor-pfeil';
  pfeil.textContent = '→';

  const zuInput = document.createElement('input');
  zuInput.className = 'form-input editor-zu';
  zuInput.type = 'text';
  zuInput.placeholder = 'zu (z. B. aa)';
  zuInput.value = zu;

  const positionSelect = document.createElement('select');
  positionSelect.className = 'form-input editor-position';
  positionSelect.setAttribute('aria-label', 'Position im Wort');
  for (const [wert, label] of POSITION_OPTIONEN) {
    const option = document.createElement('option');
    option.value = wert;
    option.textContent = label;
    if (wert === (position || '')) option.selected = true;
    positionSelect.appendChild(option);
  }

  zeile.append(vonInput, pfeil, zuInput, positionSelect, erzeugeEntfernenButton(zeile));
  container.appendChild(zeile);
  return zeile;
}

function sammleAustauschTabelle(containerId) {
  const tabelle = {};
  for (const zeile of el(containerId).querySelectorAll('.editor-zeile')) {
    const von = zeile.querySelector('.editor-von').value.trim().toLowerCase();
    const zu = zeile.querySelector('.editor-zu').value;
    const position = zeile.querySelector('.editor-position').value || null;
    if (von.length > 0 && zu.length > 0) {
      const schluessel =
        von === '*' ? von : schluesselKodieren(von, GUELTIGE_POSITIONEN.includes(position) ? position : null);
      tabelle[schluessel] = zu;
    }
  }
  return tabelle;
}

async function speichern() {
  if (!aktuelleProfilId) return;
  const customToggle = el('editor-sprache-custom-toggle');

  let zielsprache;
  let zielsprache_name;
  let romanisierung_noetig;

  if (customToggle.checked) {
    zielsprache = el('editor-sprache-custom-code').value.trim();
    zielsprache_name = el('editor-sprache-custom-name').value.trim();
    romanisierung_noetig = el('editor-sprache-custom-romanisierung').checked;

    // MyMemory-Codes bestehen aus einem Sprachteil (2-3 Buchstaben) und
    // optional einem Regions-/Varianten-Suffix (2-3 Buchstaben), z. B.
    // "sv-SE", "zh-CN" oder "grc-GR".
    const codeMatch = zielsprache.match(/^([a-zA-Z]{2,3})(-[a-zA-Z]{2,3})?$/);
    if (!codeMatch) {
      statusAnzeigen('fehler', (content) => {
        content.textContent = 'Bitte einen gültigen MyMemory-Sprachcode eingeben (z. B. "fi-FI" oder "grc-GR").';
      });
      return;
    }
    // Konvention der Liste: Sprachteil klein, Regionsteil groß (z. B. "sv-SE").
    zielsprache = codeMatch[2]
      ? `${codeMatch[1].toLowerCase()}-${codeMatch[2].slice(1).toUpperCase()}`
      : codeMatch[1].toLowerCase();
    if (zielsprache_name.length === 0) {
      zielsprache_name = zielsprache.toUpperCase();
    }
  } else {
    const select = el('editor-sprache-select');
    const sprache = findeSpracheNachCode(select.value);
    zielsprache = select.value;
    zielsprache_name = sprache?.name || select.value;
    romanisierung_noetig = romanisierungFuerCode(select.value);
  }

  const vokal_austausch = sammleAustauschTabelle('editor-vokal-liste');
  const konsonant_austausch = sammleAustauschTabelle('editor-konsonant-liste');

  try {
    speichereProfil(aktuelleProfilId, {
      zielsprache,
      zielsprache_name,
      romanisierung_noetig,
      vokal_austausch,
      konsonant_austausch,
    });

    const warnungen = problematischeRegelnErmitteln({
      vokal_austausch,
      konsonant_austausch,
    });

    if (warnungen.length > 0) {
      statusAnzeigen('warnung', (content) => {
        const zusammenfassung = document.createElement('p');
        zusammenfassung.textContent =
          warnungen.length === 1
            ? 'Änderungen gespeichert. Ein Hinweis dazu:'
            : `Änderungen gespeichert. ${warnungen.length} Hinweise dazu:`;
        content.appendChild(zusammenfassung);

        const liste = document.createElement('ul');
        liste.className = 'editor-warnliste';
        for (const warnung of warnungen) {
          const eintrag = document.createElement('li');
          eintrag.textContent = warnung;
          liste.appendChild(eintrag);
        }
        content.appendChild(liste);
      });
    } else {
      statusAnzeigen('erfolg', (content) => {
        content.textContent = 'Änderungen gespeichert.';
      });
    }

    el('editor-override-badge').hidden = false;
    el('editor-zuruecksetzen-button').hidden = false;

    if (onGespeichertCallback) onGespeichertCallback(aktuelleProfilId);
  } catch (fehler) {
    statusAnzeigen('fehler', (content) => {
      content.textContent = fehler.message;
    });
  }
}

async function zuruecksetzen() {
  if (!aktuelleProfilId) return;
  entferneUeberschreibung(aktuelleProfilId);
  await zeigeProfilImEditor(aktuelleProfilId);
  statusAnzeigen('info', (content) => {
    content.textContent = 'Auf Standardwerte zurückgesetzt.';
  });
  if (onGespeichertCallback) onGespeichertCallback(aktuelleProfilId);
}

/**
 * Löscht ein per Import hinzugefügtes benutzerdefiniertes Profil
 * vollständig (nicht verfügbar für Basisprofile - dafür gibt es
 * stattdessen "Auf Standard zurücksetzen").
 */
async function loeschen() {
  if (!aktuelleProfilId || !istBenutzerdefiniertesProfil(aktuelleProfilId)) return;
  const name = el('editor-profil-name').textContent;
  const bestaetigt = window.confirm(`"${name}" wirklich endgültig löschen?`);
  if (!bestaetigt) return;

  entferneBenutzerdefiniertesProfil(aktuelleProfilId);
  aktuelleProfilId = null;
  if (onGespeichertCallback) onGespeichertCallback(null);
}

function bindEvents() {
  el('editor-vokal-hinzufuegen').addEventListener('click', () => {
    austauschZeileErzeugen(el('editor-vokal-liste'));
  });
  el('editor-konsonant-hinzufuegen').addEventListener('click', () => {
    austauschZeileErzeugen(el('editor-konsonant-liste'));
  });

  el('editor-sprache-select').addEventListener('change', schriftHinweisAktualisieren);
  el('editor-sprache-custom-toggle').addEventListener('change', (ereignis) => {
    const custom = ereignis.target.checked;
    el('editor-sprache-custom-felder').hidden = !custom;
    el('editor-sprache-select').disabled = custom;
    schriftHinweisAktualisieren();
  });

  el('editor-speichern-button').addEventListener('click', speichern);
  el('editor-zuruecksetzen-button').addEventListener('click', zuruecksetzen);
  el('editor-loeschen-button').addEventListener('click', loeschen);
}
