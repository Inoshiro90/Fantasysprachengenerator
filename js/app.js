/**
 * app.js
 * Orchestriert den gesamten Ablauf (SDLC Abschnitt 3.3):
 * Eingabe lesen -> Profil laden -> übersetzen -> ggf. romanisieren
 * -> auf URL-sicheres ASCII normalisieren -> Phonem-Transformation
 * anwenden -> Ergebnis anzeigen.
 */

import { ladeProfile, findeProfilNachId } from './profileRepository.js';
import {
  translate,
  verbleibendeZeichenHeute,
  tageslimitZeichen,
  gespeicherteEmailLesen,
  emailSpeichern,
  emailEntfernen,
} from './translationClient.js';
import { romanize } from './transliterationClient.js';
import { zuUrlSicheremAscii } from './asciiSanitizer.js';
import { applyMitAnnotationen } from './phonemeTransformer.js';
import { initProfilEditor, zeigeProfilImEditor } from './profileEditor.js';

const eingabeFeld = document.getElementById('eingabe-text');
const profilAuswahl = document.getElementById('profil-auswahl');
const generierenButton = document.getElementById('generieren-button');
const zwischenergebnisFeld = document.getElementById('zwischenergebnis-text');
const ausgabeFeld = document.getElementById('ausgabe-text');
const statusZeile = document.getElementById('status-zeile');
const limitHinweis = document.getElementById('limit-hinweis');
const limitBadge = document.getElementById('limit-badge');
const zielspracheInfo = document.getElementById('zielsprache-info');

const ausgabeDiffAnsicht = document.getElementById('ausgabe-diff');
const diffAnzeigenToggle = document.getElementById('diff-anzeigen-toggle');
const diffLegende = document.getElementById('diff-legende');

const emailEingabe = document.getElementById('email-eingabe');
const emailSpeichernButton = document.getElementById('email-speichern-button');
const emailEntfernenButton = document.getElementById('email-entfernen-button');
const emailAktuellerStand = document.getElementById('email-aktueller-stand');
const emailStatus = document.getElementById('email-status');

const THEME_KEY = 'ds-warm-theme';

/** Icon + Guide-Alert-Klasse je nach Nachrichtenart (siehe .alert-* in style.css). */
const ALERT_ICON = { info: 'ℹ️', erfolg: '✅', warnung: '⚠️', fehler: '⚠️' };
const ALERT_KLASSE = { info: 'alert-info', erfolg: 'alert-success', warnung: 'alert-warning', fehler: 'alert-error' };

/**
 * Befüllt eine der drei Alert-Boxen (#status-zeile, #email-status,
 * #editor-status - siehe profileEditor.js für die dritte) mit Icon,
 * Textinhalt und passender Guide-Farbklasse und blendet sie ein.
 */
function alertAnzeigen(element, nachricht, art = 'info') {
  element.className = `alert ${ALERT_KLASSE[art] || ALERT_KLASSE.info}`;
  element.querySelector('.alert-icon').textContent = ALERT_ICON[art] || ALERT_ICON.info;
  element.querySelector('.alert-content').textContent = nachricht;
  element.hidden = false;
}

function alertAusblenden(element) {
  element.hidden = true;
}

/**
 * Zeigt oder verändert die generelle Ablauf-Statusmeldung unten im Formular.
 */
function statusSetzen(nachricht, art = 'info') {
  alertAnzeigen(statusZeile, nachricht, art);
}

/**
 * Zwischenspeicher der zuletzt tatsächlich bei MyMemory übersetzten
 * Anfrage (Text + Profil + Zielsprache -> reine Übersetzung/Umschrift,
 * VOR der Fantasy-Verfremdung). Stimmen Text und Profil beim nächsten
 * Klick auf "Generieren" überein, wird MyMemory nicht erneut aufgerufen -
 * das spart Zeichen-Kontingent. Die Fantasysprach-Verfremdung wird dabei
 * immer frisch angewendet, damit Anpassungen im Profil-Editor sofort
 * wirken, auch ohne neue Übersetzung.
 */
let letzteUebersetzung = null;

/** Segmente (Text + Änderungsart) der zuletzt generierten Ausgabe, für das Diff-Overlay. */
let letzteDiffSegmente = [];

function limitAnzeigeAktualisieren() {
  const verbleibend = verbleibendeZeichenHeute();
  const limit = tageslimitZeichen();
  limitHinweis.textContent = `${verbleibend.toLocaleString('de-DE')} von ${limit.toLocaleString('de-DE')} Zeichen heute übrig.`;

  const email = gespeicherteEmailLesen();
  if (email) {
    limitBadge.textContent = '50.000 Zeichen/Tag';
    limitBadge.className = 'badge badge-green';
  } else {
    limitBadge.textContent = '5.000 Zeichen/Tag (anonym)';
    limitBadge.className = 'badge badge-neutral';
  }
}

/** Aktualisiert die permanente Statuszeile ("Hinterlegt: .../Ohne E-Mail: ..."). */
function emailUiAktualisieren() {
  const email = gespeicherteEmailLesen();
  if (email) {
    emailEingabe.value = email;
    emailAktuellerStand.textContent = `Hinterlegt: ${email} — dein persönliches Limit liegt bei 50.000 Zeichen/Tag.`;
    emailEntfernenButton.hidden = false;
  } else {
    emailAktuellerStand.textContent = 'Ohne E-Mail: 5.000 Zeichen/Tag (pro IP-Adresse gezählt).';
    emailEntfernenButton.hidden = true;
  }
}

function emailSpeichernKlick() {
  try {
    emailSpeichern(emailEingabe.value);
    emailUiAktualisieren();
    limitAnzeigeAktualisieren();
    alertAnzeigen(emailStatus, 'E-Mail-Adresse gespeichert.', 'erfolg');
    statusSetzen('E-Mail-Adresse gespeichert. Dein Tageslimit liegt jetzt bei 50.000 Zeichen.', 'erfolg');
  } catch (fehler) {
    alertAnzeigen(emailStatus, fehler.message, 'fehler');
  }
}

function emailEntfernenKlick() {
  emailEntfernen();
  emailEingabe.value = '';
  emailUiAktualisieren();
  limitAnzeigeAktualisieren();
  alertAusblenden(emailStatus);
  statusSetzen('E-Mail-Adresse entfernt. Tageslimit zurück auf 5.000 Zeichen.', 'info');
}

async function profileInDropdownLaden() {
  try {
    const vorherigeAuswahl = profilAuswahl.value;
    const profile = await ladeProfile();
    profilAuswahl.innerHTML = '';
    for (const profil of profile) {
      const option = document.createElement('option');
      option.value = profil.id;
      option.textContent = `${profil.name} (${profil.zielsprache_name || profil.zielsprache})`;
      profilAuswahl.appendChild(option);
    }
    if (vorherigeAuswahl && profile.some((p) => p.id === vorherigeAuswahl)) {
      profilAuswahl.value = vorherigeAuswahl;
    }
    profilAuswahl.disabled = false;
    generierenButton.disabled = false;
    zielspracheAnzeigen();
  } catch (fehler) {
    statusSetzen(`Sprachprofile konnten nicht geladen werden: ${fehler.message}`, 'fehler');
  }
}

async function zielspracheAnzeigen() {
  const profil = await findeProfilNachId(profilAuswahl.value);
  if (!profil) return;
  zielspracheInfo.textContent = `Zwischensprache: ${profil.zielsprache_name || profil.zielsprache}${profil.romanisierung_noetig ? ' (wird romanisiert)' : ''}`;
}

const DIFF_ART_KLASSE = {
  hinzugefuegt: 'diff-hinzugefuegt',
  geaendert: 'diff-geaendert',
  entfernt: 'diff-entfernt',
};

/**
 * Baut die Diff-Overlay-Ansicht aus den Segmenten neu auf (per DOM-APIs
 * statt innerHTML, damit generierter Text niemals als HTML interpretiert
 * werden kann).
 */
function diffAnsichtRendern(segmente) {
  ausgabeDiffAnsicht.innerHTML = '';
  if (!segmente || segmente.length === 0) {
    ausgabeDiffAnsicht.appendChild(
      document.createTextNode('Noch nichts generiert – klicke auf "Generieren", um die Hervorhebung zu sehen.')
    );
    return;
  }
  for (const { text, art } of segmente) {
    const klasse = DIFF_ART_KLASSE[art];
    if (!klasse) {
      ausgabeDiffAnsicht.appendChild(document.createTextNode(text));
    } else {
      const span = document.createElement('span');
      span.className = klasse;
      span.textContent = text;
      ausgabeDiffAnsicht.appendChild(span);
    }
  }
}

/** Blendet je nach Checkbox-Status zwischen reinem Textfeld und Diff-Overlay um. */
function diffSichtbarkeitAktualisieren() {
  const anzeigen = diffAnzeigenToggle.checked;
  ausgabeFeld.hidden = anzeigen;
  ausgabeDiffAnsicht.hidden = !anzeigen;
  ausgabeDiffAnsicht.setAttribute('aria-hidden', String(!anzeigen));
  diffLegende.hidden = !anzeigen;
  if (anzeigen) {
    diffAnsichtRendern(letzteDiffSegmente);
  }
}

async function generieren() {
  const text = eingabeFeld.value.trim();
  if (text.length === 0) {
    statusSetzen('Bitte zuerst einen Text eingeben.', 'fehler');
    eingabeFeld.focus();
    return;
  }

  const profil = await findeProfilNachId(profilAuswahl.value);
  if (!profil) {
    statusSetzen('Kein gültiges Sprachprofil ausgewählt.', 'fehler');
    return;
  }

  generierenButton.disabled = true;
  generierenButton.textContent = 'Generiere …';
  zwischenergebnisFeld.value = '';
  ausgabeFeld.value = '';
  letzteDiffSegmente = [];
  if (diffAnzeigenToggle.checked) {
    diffAnsichtRendern(letzteDiffSegmente);
  }

  try {
    const cacheTreffer =
      letzteUebersetzung &&
      letzteUebersetzung.text === text &&
      letzteUebersetzung.profilId === profil.id &&
      letzteUebersetzung.zielsprache === profil.zielsprache;

    let zwischenergebnis;

    if (cacheTreffer) {
      statusSetzen('Text und Profil unverändert – nutze vorhandene Übersetzung (kein erneuter API-Aufruf) …', 'info');
      zwischenergebnis = letzteUebersetzung.zwischenergebnis;
    } else {
      statusSetzen('Übersetze …', 'info');
      zwischenergebnis = await translate(text, profil.zielsprache);

      if (profil.romanisierung_noetig) {
        statusSetzen('Romanisiere …', 'info');
        zwischenergebnis = await romanize(zwischenergebnis, profil.zielsprache);
      }

      // Sicherstellen, dass keine Umlaute/Akzente aus der Zwischensprache
      // (z. B. Schwedisch å/ä/ö, Isländisch, Esperanto) übrig bleiben, bevor
      // die Fantasy-Verfremdung angewendet wird.
      zwischenergebnis = zuUrlSicheremAscii(zwischenergebnis);

      letzteUebersetzung = {
        text,
        profilId: profil.id,
        zielsprache: profil.zielsprache,
        zwischenergebnis,
      };
    }

    zwischenergebnisFeld.value = zwischenergebnis;

    statusSetzen('Wende Fantasy-Verfremdung an …', 'info');
    const { text: rohErgebnis, segmente } = applyMitAnnotationen(zwischenergebnis, profil);

    // Sicherheitsnetz: auch nach der Profil-Transformation garantiert
    // ausschliesslich URL-sicheres ASCII ausgeben.
    let ergebnis = zuUrlSicheremAscii(rohErgebnis);

    // Die Diff-Segmente stammen aus applyMitAnnotationen() (VOR dem
    // Ascii-Sicherheitsnetz). Bei den mitgelieferten Profilen ist das
    // Ergebnis ohnehin bereits reines ASCII (siehe tests.html), daher
    // stimmen Segmente und sanitiertes Ergebnis im Normalfall exakt
    // überein. Nur zur Sicherheit: weicht der sanitierte Text vom
    // unsanitierten ab, wird die Hervorhebung übersprungen (ein
    // einzelnes, unmarkiertes Segment) statt eine falsch ausgerichtete
    // Färbung anzuzeigen.
    letzteDiffSegmente = rohErgebnis === ergebnis ? segmente : [{ text: ergebnis, art: null }];

    ausgabeFeld.value = ergebnis;
    if (diffAnzeigenToggle.checked) {
      diffAnsichtRendern(letzteDiffSegmente);
    }
    statusSetzen('Fertig!', 'erfolg');
  } catch (fehler) {
    statusSetzen(fehler.message || 'Unbekannter Fehler bei der Generierung.', 'fehler');
  } finally {
    generierenButton.disabled = false;
    generierenButton.textContent = 'Generieren';
    limitAnzeigeAktualisieren();
  }
}

function themeInitialisieren() {
  const html = document.documentElement;
  let gespeichertesTheme = null;
  try {
    gespeichertesTheme = localStorage.getItem(THEME_KEY);
  } catch {
    gespeichertesTheme = null;
  }

  if (gespeichertesTheme) {
    html.setAttribute('data-theme', gespeichertesTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.setAttribute('data-theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
  }
}

/**
 * Schaltet zwischen hellem und dunklem Theme um. Der Toggle-Button selbst
 * (#themeToggle in der Navbar) braucht dafür kein Text-Update - das
 * Sonne/Mond-Icon wird rein über CSS anhand von [data-theme] umgeschaltet
 * (siehe .icon-sun/.icon-moon in style.css).
 */
function themeUmschalten() {
  const html = document.documentElement;
  const neu = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', neu);
  try {
    localStorage.setItem(THEME_KEY, neu);
  } catch {
    // localStorage evtl. nicht verfügbar - Theme gilt dann nur für diese Sitzung.
  }
}

function init() {
  themeInitialisieren();
  document.getElementById('themeToggle')?.addEventListener('click', themeUmschalten);

  profilAuswahl.disabled = true;
  generierenButton.disabled = true;

  profilAuswahl.addEventListener('change', () => {
    zielspracheAnzeigen();
    zeigeProfilImEditor(profilAuswahl.value);
  });
  generierenButton.addEventListener('click', generieren);
  diffAnzeigenToggle.addEventListener('change', diffSichtbarkeitAktualisieren);
  emailSpeichernButton.addEventListener('click', emailSpeichernKlick);
  emailEntfernenButton.addEventListener('click', emailEntfernenKlick);
  emailEingabe.addEventListener('keydown', (ereignis) => {
    if (ereignis.key === 'Enter') {
      ereignis.preventDefault();
      emailSpeichernKlick();
    }
  });

  initProfilEditor({
    onGespeichert: async () => {
      // Dropdown-Beschriftung (Profilname + Zielsprache) neu aufbauen, falls
      // sich die Zwischensprache durch die Bearbeitung geändert hat.
      await profileInDropdownLaden();
      zielspracheAnzeigen();
    },
  });

  emailUiAktualisieren();
  limitAnzeigeAktualisieren();
  diffSichtbarkeitAktualisieren();
  profileInDropdownLaden().then(() => {
    zeigeProfilImEditor(profilAuswahl.value);
  });
}

init();
