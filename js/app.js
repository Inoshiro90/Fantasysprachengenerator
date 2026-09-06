/**
 * app.js
 * Orchestriert den gesamten Ablauf (SDLC Abschnitt 3.3):
 * Eingabe lesen -> Profil laden -> übersetzen -> ggf. romanisieren
 * -> auf URL-sicheres ASCII normalisieren -> Phonem-Transformation
 * anwenden -> Ergebnis anzeigen.
 */

import {ladeProfile, findeProfilNachId} from './profileRepository.js';
import {
	profileExportieren,
	profileImportieren,
	profileAusgewaehlteExportieren,
} from './profileImportExport.js';
import {
	translate,
	verbleibendeZeichenHeute,
	tageslimitZeichen,
	gespeicherteEmailLesen,
	emailSpeichern,
	emailEntfernen,
} from './translationClient.js';
import {romanize} from './transliterationClient.js';
import {zuUrlSicheremAscii} from './asciiSanitizer.js';
import {applyMitAnnotationen} from './phonemeTransformer.js';
import {initProfilEditor, zeigeProfilImEditor} from './profileEditor.js';
import {zufaelligerInspirationssatz} from './inspirationssaetze.js';

const eingabeFeld = document.getElementById('eingabe-text');
const beispielsatzButton = document.getElementById('beispielsatz-button');
const profilAuswahl = document.getElementById('profil-auswahl');
const generierenButton = document.getElementById('generieren-button');
const zwischenergebnisFeld = document.getElementById('zwischenergebnis-text');
const zwischenergebnisEinfuegenButton = document.getElementById(
	'zwischenergebnis-einfuegen-button',
);
const zwischenergebnisManuellToggle = document.getElementById('zwischenergebnis-manuell-toggle');
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

const profileExportButton = document.getElementById('profile-export-button');
const profileImportButton = document.getElementById('profile-import-button');
const profileImportDatei = document.getElementById('profile-import-datei');
const importExportStatus = document.getElementById('import-export-status');

const exportAuswahlDialog = document.getElementById('export-auswahl-dialog');
const exportProfilListe = document.getElementById('export-profil-liste');
const exportEinzelnOeffnenButton = document.getElementById('export-einzeln-oeffnen-button');
const exportAlleAuswaehlenButton = document.getElementById('export-alle-auswaehlen-button');
const exportKeineAuswaehlenButton = document.getElementById('export-keine-auswaehlen-button');
const exportDialogAbbrechenButton = document.getElementById('export-dialog-abbrechen-button');
const exportDialogBestaetigenButton = document.getElementById('export-dialog-bestaetigen-button');

const importEinzelnDialog = document.getElementById('import-einzeln-dialog');
const importEinzelnOeffnenButton = document.getElementById('import-einzeln-oeffnen-button');
const importEinzelnTextarea = document.getElementById('import-einzeln-textarea');
const importEinzelnDateiButton = document.getElementById('import-einzeln-datei-button');
const importEinzelnDatei = document.getElementById('import-einzeln-datei');
const importEinzelnStatus = document.getElementById('import-einzeln-status');
const importEinzelnAbbrechenButton = document.getElementById('import-einzeln-abbrechen-button');
const importEinzelnBestaetigenButton = document.getElementById('import-einzeln-bestaetigen-button');

const THEME_KEY = 'ds-warm-theme';

/** Icon + Guide-Alert-Klasse je nach Nachrichtenart (siehe .alert-* in style.css). */
const ALERT_ICON = {
	info: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
	erfolg: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>',
	warnung:
		'<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert-icon lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
	fehler: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
};
const ALERT_KLASSE = {
	info: 'alert-info',
	erfolg: 'alert-success',
	warnung: 'alert-warning',
	fehler: 'alert-error',
};

/**
 * Befüllt eine der drei Alert-Boxen (#status-zeile, #email-status,
 * #editor-status - siehe profileEditor.js für die dritte) mit Icon,
 * Textinhalt und passender Guide-Farbklasse und blendet sie ein.
 */
function alertAnzeigen(element, nachricht, art = 'info') {
	element.className = `alert ${ALERT_KLASSE[art] || ALERT_KLASSE.info}`;
	element.querySelector('.alert-icon').innerHTML = ALERT_ICON[art] || ALERT_ICON.info;
	element.querySelector('.alert-content').innerHTML = nachricht;
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
	limitHinweis.innerHTML = `${verbleibend.toLocaleString('de-DE')} von ${limit.toLocaleString('de-DE')} Zeichen heute übrig.`;

	const email = gespeicherteEmailLesen();
	if (email) {
		limitBadge.innerHTML = '50.000 Zeichen/Tag';
		limitBadge.className = 'badge badge-green';
	} else {
		limitBadge.innerHTML = '5.000 Zeichen/Tag (anonym)';
		limitBadge.className = 'badge badge-neutral';
	}
}

/** Aktualisiert die permanente Statuszeile ("Hinterlegt: .../Ohne E-Mail: ..."). */
function emailUiAktualisieren() {
	const email = gespeicherteEmailLesen();
	if (email) {
		emailEingabe.value = email;
		emailAktuellerStand.innerHTML = `Hinterlegt: ${email} — dein persönliches Limit liegt bei 50.000 Zeichen/Tag.`;
		emailEntfernenButton.hidden = false;
	} else {
		emailAktuellerStand.innerHTML = 'Ohne E-Mail: 5.000 Zeichen/Tag (pro IP-Adresse gezählt).';
		emailEntfernenButton.hidden = true;
	}
}

function emailSpeichernKlick() {
	try {
		emailSpeichern(emailEingabe.value);
		emailUiAktualisieren();
		limitAnzeigeAktualisieren();
		alertAnzeigen(emailStatus, 'E-Mail-Adresse gespeichert.', 'erfolg');
		statusSetzen(
			'E-Mail-Adresse gespeichert. Dein Tageslimit liegt jetzt bei 50.000 Zeichen.',
			'erfolg',
		);
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

/**
 * Befüllt die #import-export-status Alert-Box mit Icon + strukturiertem
 * Inhalt (Zusammenfassung + ggf. Fehler-/Warnlisten). Analog zu
 * statusAnzeigen() in profileEditor.js, hier lokal gehalten, weil die
 * Import/Export-Logik komplett in app.js verdrahtet ist.
 */
function importExportStatusAnzeigen(art, inhaltAufbauen) {
	importExportStatus.className = `alert ${ALERT_KLASSE[art] || ALERT_KLASSE.info}`;
	importExportStatus.querySelector('.alert-icon').innerHTML = ALERT_ICON[art] || ALERT_ICON.info;
	const content = importExportStatus.querySelector('.alert-content');
	content.innerHTML = '';
	inhaltAufbauen(content);
	importExportStatus.hidden = false;
}

function meldungslisteAnhaengen(content, titel, meldungen) {
	const ueberschrift = document.createElement('p');
	ueberschrift.innerHTML = titel;
	content.appendChild(ueberschrift);
	const liste = document.createElement('ul');
	liste.className = 'editor-warnliste';
	for (const meldung of meldungen) {
		const eintrag = document.createElement('li');
		eintrag.innerHTML = meldung;
		liste.appendChild(eintrag);
	}
	content.appendChild(liste);
}

async function profileExportierenKlick() {
	try {
		const anzahl = await profileExportieren();
		importExportStatusAnzeigen('erfolg', (content) => {
			content.innerHTML = `${anzahl} Profile wurden als JSON-Datei exportiert.`;
		});
	} catch (fehler) {
		importExportStatusAnzeigen('fehler', (content) => {
			content.innerHTML = `Export fehlgeschlagen: ${fehler.message}`;
		});
	}
}

function profileImportierenKlick() {
	profileImportDatei.value = '';
	profileImportDatei.click();
}

async function profileImportDateiAusgewaehlt() {
	const datei = profileImportDatei.files[0];
	if (!datei) return;

	let rohtext;
	try {
		rohtext = await datei.text();
	} catch {
		importExportStatusAnzeigen('fehler', (content) => {
			content.innerHTML = 'Datei konnte nicht gelesen werden.';
		});
		return;
	}

	let ergebnis;
	try {
		ergebnis = await profileImportieren(rohtext);
	} catch (fehler) {
		// Nur bei komplett unverarbeitbarer Datei (kein JSON / kein Array):
		// hier gibt es nichts Granulares mehr zu retten.
		importExportStatusAnzeigen('fehler', (content) => {
			content.innerHTML = fehler.message;
		});
		return;
	}

	const {uebernommenGesamt, alsUeberschreibungUebernommen, alsNeuUebernommen, fehler, warnungen} =
		ergebnis;

	if (uebernommenGesamt === 0) {
		importExportStatusAnzeigen('fehler', (content) => {
			meldungslisteAnhaengen(
				content,
				'Import fehlgeschlagen - kein einziges Profil war gültig:',
				fehler,
			);
		});
		return;
	}

	const art = fehler.length > 0 ? 'warnung' : 'erfolg';
	importExportStatusAnzeigen(art, (content) => {
		const teile = [];
		if (alsUeberschreibungUebernommen > 0)
			teile.push(`${alsUeberschreibungUebernommen} verändert`);
		if (alsNeuUebernommen > 0) teile.push(`${alsNeuUebernommen} neu hinzugefügt`);
		const zusammenfassung = document.createElement('p');
		zusammenfassung.innerHTML = `${uebernommenGesamt} Profile übernommen (${teile.join(', ')}).`;
		content.appendChild(zusammenfassung);

		if (warnungen.length > 0) {
			meldungslisteAnhaengen(
				content,
				`${warnungen.length === 1 ? 'Ein Hinweis' : `${warnungen.length} Hinweise`} zu übernommenen Profilen:`,
				warnungen,
			);
		}
		if (fehler.length > 0) {
			meldungslisteAnhaengen(
				content,
				`${fehler.length === 1 ? 'Ein Eintrag' : `${fehler.length} Einträge`} wurden übersprungen:`,
				fehler,
			);
		}
	});

	await profileInDropdownLaden();
	zielspracheAnzeigen();
	zeigeProfilImEditor(profilAuswahl.value);
}

// --- Einzelne Profile exportieren (Dialogbox mit Checkboxen) ------------

async function exportDialogOeffnen() {
	const profile = await ladeProfile();
	exportProfilListe.innerHTML = '';

	for (const profil of profile) {
		const zeile = document.createElement('label');
		zeile.className = 'form-check';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.value = profil.id;
		checkbox.checked = true;
		checkbox.className = 'export-profil-checkbox';

		const beschriftung = document.createElement('span');
		beschriftung.className = 'form-check-label';
		const name = document.createElement('span');
		name.innerHTML = profil.name;
		const klein = document.createElement('small');
		klein.innerHTML = profil.zielsprache_name || profil.zielsprache;
		beschriftung.append(name, klein);

		zeile.append(checkbox, beschriftung);
		exportProfilListe.appendChild(zeile);
	}

	exportAuswahlDialog.showModal();
}

function exportAusgewaehlteIds() {
	return [...exportProfilListe.querySelectorAll('.export-profil-checkbox:checked')].map(
		(cb) => cb.value,
	);
}

async function exportDialogBestaetigenKlick() {
	const ids = exportAusgewaehlteIds();
	if (ids.length === 0) {
		importExportStatusAnzeigen('fehler', (content) => {
			content.innerHTML = 'Bitte mindestens ein Profil auswählen.';
		});
		return;
	}

	try {
		const anzahl = await profileAusgewaehlteExportieren(ids);
		exportAuswahlDialog.close();
		importExportStatusAnzeigen('erfolg', (content) => {
			content.innerHTML =
				anzahl === 1
					? '1 Profil wurde als JSON-Datei exportiert.'
					: `${anzahl} Profile wurden als JSON-Datei exportiert.`;
		});
	} catch (fehler) {
		importExportStatusAnzeigen('fehler', (content) => {
			content.innerHTML = `Export fehlgeschlagen: ${fehler.message}`;
		});
	}
}

// --- Einzelnes Profil importieren (Dialogbox: Text direkt oder Datei) ---

function importEinzelnDialogOeffnen() {
	importEinzelnTextarea.value = '';
	importEinzelnStatus.hidden = true;
	importEinzelnDialog.showModal();
	importEinzelnTextarea.focus();
}

function importEinzelnDateiKlick() {
	importEinzelnDatei.value = '';
	importEinzelnDatei.click();
}

async function importEinzelnDateiAusgewaehlt() {
	const datei = importEinzelnDatei.files[0];
	if (!datei) return;
	try {
		importEinzelnTextarea.value = await datei.text();
	} catch {
		importEinzelnStatusAnzeigen('fehler', (content) => {
			content.innerHTML = 'Datei konnte nicht gelesen werden.';
		});
	}
}

function importEinzelnStatusAnzeigen(art, inhaltAufbauen) {
	importEinzelnStatus.className = `alert ${ALERT_KLASSE[art] || ALERT_KLASSE.info}`;
	importEinzelnStatus.querySelector('.alert-icon').innerHTML = ALERT_ICON[art] || ALERT_ICON.info;
	const content = importEinzelnStatus.querySelector('.alert-content');
	content.innerHTML = '';
	inhaltAufbauen(content);
	importEinzelnStatus.hidden = false;
}

async function importEinzelnBestaetigenKlick() {
	const rohtext = importEinzelnTextarea.value.trim();
	if (rohtext.length === 0) {
		importEinzelnStatusAnzeigen('fehler', (content) => {
			content.innerHTML = 'Bitte JSON einfügen oder eine Datei hochladen.';
		});
		return;
	}

	let ergebnis;
	try {
		ergebnis = await profileImportieren(rohtext);
	} catch (fehler) {
		importEinzelnStatusAnzeigen('fehler', (content) => {
			content.innerHTML = fehler.message;
		});
		return;
	}

	const {
		uebernommenGesamt,
		alsUeberschreibungUebernommen,
		alsNeuUebernommen,
		importierteIds,
		fehler,
		warnungen,
	} = ergebnis;

	if (uebernommenGesamt === 0) {
		importEinzelnStatusAnzeigen('fehler', (content) => {
			meldungslisteAnhaengen(
				content,
				'Import fehlgeschlagen - kein einziges Profil war gültig:',
				fehler,
			);
		});
		return;
	}

	const art = fehler.length > 0 ? 'warnung' : 'erfolg';
	importEinzelnStatusAnzeigen(art, (content) => {
		const teile = [];
		if (alsUeberschreibungUebernommen > 0)
			teile.push(`${alsUeberschreibungUebernommen} verändert`);
		if (alsNeuUebernommen > 0) teile.push(`${alsNeuUebernommen} neu hinzugefügt`);
		const zusammenfassung = document.createElement('p');
		zusammenfassung.innerHTML = `${uebernommenGesamt} Profil(e) übernommen (${teile.join(', ')}).`;
		content.appendChild(zusammenfassung);

		if (warnungen.length > 0) {
			meldungslisteAnhaengen(
				content,
				`${warnungen.length === 1 ? 'Ein Hinweis' : `${warnungen.length} Hinweise`}:`,
				warnungen,
			);
		}
		if (fehler.length > 0) {
			meldungslisteAnhaengen(
				content,
				`${fehler.length === 1 ? 'Ein Eintrag' : `${fehler.length} Einträge`} übersprungen:`,
				fehler,
			);
		}
	});

	await profileInDropdownLaden();
	// Bei genau einem importierten Profil direkt zu diesem wechseln, damit
	// man das Ergebnis sofort im Editor sieht.
	if (
		importierteIds.length === 1 &&
		[...profilAuswahl.options].some((option) => option.value === importierteIds[0])
	) {
		profilAuswahl.value = importierteIds[0];
	}
	zielspracheAnzeigen();
	zeigeProfilImEditor(profilAuswahl.value);
}

async function profileInDropdownLaden() {
	try {
		const vorherigeAuswahl = profilAuswahl.value;
		const profile = await ladeProfile();
		profilAuswahl.innerHTML = '';
		for (const profil of profile) {
			const option = document.createElement('option');
			option.value = profil.id;
			option.innerHTML = `${profil.name} (${profil.zielsprache_name || profil.zielsprache})`;
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
	zielspracheInfo.innerHTML = `Zwischensprache: ${profil.zielsprache_name || profil.zielsprache}${profil.romanisierung_noetig ? ' (wird romanisiert)' : ''}`;
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
			document.createTextNode(
				'Noch nichts generiert – klicke auf "Generieren", um die Hervorhebung zu sehen.',
			),
		);
		return;
	}
	for (const {text, art} of segmente) {
		const klasse = DIFF_ART_KLASSE[art];
		if (!klasse) {
			ausgabeDiffAnsicht.appendChild(document.createTextNode(text));
		} else {
			const span = document.createElement('span');
			span.className = klasse;
			span.innerHTML = text;
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

/**
 * Setzt einen zufälligen Inspirationssatz (siehe inspirationssaetze.js) ins
 * deutsche Eingabefeld ein - praktisch, um den Generator schnell mit einem
 * längeren, stilistisch abwechslungsreichen Text auszuprobieren. Merkt sich
 * den zuletzt eingefügten Satz per data-Attribut am Button, damit derselbe
 * Satz nicht zweimal hintereinander erscheint.
 */
function beispielsatzKlick() {
	const vorheriger = beispielsatzButton.dataset.letzterSatz;
	const satz = zufaelligerInspirationssatz(vorheriger);

	eingabeFeld.value = satz;
	beispielsatzButton.dataset.letzterSatz = satz;

	// Löst absichtlich kein 'input'-Event aus - ein programmatisches
	// .value= feuert das ohnehin nicht (siehe Kommentar bei
	// zwischenergebnisFeld weiter unten), Auto-Übersetzung erfolgt hier wie
	// gewohnt erst beim Klick auf "Generieren".
}

/**
 * Fügt den Inhalt der System-Zwischenablage direkt ins Zwischensprache-Feld
 * ein und aktiviert automatisch den manuellen Modus (MyMemory überspringen).
 * Alternativ funktioniert auch normales Strg+V direkt im - dafür nicht mehr
 * readonly - Feld; dafür sorgt der 'input'-Listener in init() für dieselbe
 * automatische Modus-Umschaltung.
 */
async function zwischenergebnisEinfuegenKlick() {
	if (!navigator.clipboard || !navigator.clipboard.readText) {
		statusSetzen(
			'Dieser Browser erlaubt keinen direkten Lesezugriff auf die Zwischenablage. Füge den Text stattdessen mit Strg+V direkt ins Feld ein.',
			'fehler',
		);
		return;
	}
	try {
		const text = await navigator.clipboard.readText();
		if (!text) {
			statusSetzen('Die Zwischenablage ist leer.', 'fehler');
			return;
		}
		zwischenergebnisFeld.value = text;
		zwischenergebnisManuellToggle.checked = true;
		statusSetzen(
			'Text aus der Zwischenablage eingefügt. Klicke auf "Generieren", um ihn direkt zu verwenden.',
			'erfolg',
		);
	} catch {
		statusSetzen(
			'Zugriff auf die Zwischenablage wurde verweigert. Füge den Text stattdessen mit Strg+V direkt ins Feld ein.',
			'fehler',
		);
	}
}

async function generieren() {
	const manuellerModus = zwischenergebnisManuellToggle.checked;
	const text = eingabeFeld.value.trim();

	if (!manuellerModus && text.length === 0) {
		statusSetzen('Bitte zuerst einen Text eingeben.', 'fehler');
		eingabeFeld.focus();
		return;
	}

	const manuellerText = zwischenergebnisFeld.value.trim();
	if (manuellerModus && manuellerText.length === 0) {
		statusSetzen(
			'Bitte zuerst Text ins Feld "Übersetzung (unverändert)" einfügen oder eingeben.',
			'fehler',
		);
		zwischenergebnisFeld.focus();
		return;
	}

	const profil = await findeProfilNachId(profilAuswahl.value);
	if (!profil) {
		statusSetzen('Kein gültiges Sprachprofil ausgewählt.', 'fehler');
		return;
	}

	generierenButton.disabled = true;
	generierenButton.innerHTML = 'Generiere …';
	// Im manuellen Modus NICHT leeren - genau der Inhalt, den die Person dort
	// gerade eingefügt/eingegeben hat, soll erhalten bleiben.
	if (!manuellerModus) {
		zwischenergebnisFeld.value = '';
	}
	ausgabeFeld.value = '';
	letzteDiffSegmente = [];
	if (diffAnzeigenToggle.checked) {
		diffAnsichtRendern(letzteDiffSegmente);
	}

	try {
		let zwischenergebnis;

		if (manuellerModus) {
			statusSetzen('Verwende den manuell eingefügten Text (kein MyMemory-Aufruf) …', 'info');
			// Gleiches Sicherheitsnetz wie im Auto-Modus: auch selbst eingefügter
			// Text wird vor der Fantasy-Verfremdung auf URL-sicheres ASCII normiert.
			zwischenergebnis = zuUrlSicheremAscii(manuellerText);
		} else {
			const cacheTreffer =
				letzteUebersetzung &&
				letzteUebersetzung.text === text &&
				letzteUebersetzung.profilId === profil.id &&
				letzteUebersetzung.zielsprache === profil.zielsprache;

			if (cacheTreffer) {
				statusSetzen(
					'Text und Profil unverändert – nutze vorhandene Übersetzung (kein erneuter API-Aufruf) …',
					'info',
				);
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
		}

		zwischenergebnisFeld.value = zwischenergebnis;

		statusSetzen('Wende Fantasy-Verfremdung an …', 'info');
		const {text: rohErgebnis, segmente} = applyMitAnnotationen(zwischenergebnis, profil);

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
		letzteDiffSegmente = rohErgebnis === ergebnis ? segmente : [{text: ergebnis, art: null}];

		ausgabeFeld.value = ergebnis;
		if (diffAnzeigenToggle.checked) {
			diffAnsichtRendern(letzteDiffSegmente);
		}
		statusSetzen('Fertig!', 'erfolg');
	} catch (fehler) {
		statusSetzen(fehler.message || 'Unbekannter Fehler bei der Generierung.', 'fehler');
	} finally {
		generierenButton.disabled = false;
		generierenButton.innerHTML = 'Generieren';
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
	beispielsatzButton.addEventListener('click', beispielsatzKlick);
	diffAnzeigenToggle.addEventListener('change', diffSichtbarkeitAktualisieren);
	zwischenergebnisEinfuegenButton.addEventListener('click', zwischenergebnisEinfuegenKlick);
	// Tippt oder fügt die Person direkt (z. B. per Strg+V) Text ins jetzt
	// editierbare Zwischensprache-Feld ein, wird automatisch davon ausgegangen,
	// dass dieser Text auch verwendet werden soll - das 'input'-Event feuert
	// NICHT bei programmatischem .value= (siehe generieren()), daher keine
	// Kollision mit der normalen Auto-Übersetzung.
	zwischenergebnisFeld.addEventListener('input', () => {
		zwischenergebnisManuellToggle.checked = true;
	});
	emailSpeichernButton.addEventListener('click', emailSpeichernKlick);
	emailEntfernenButton.addEventListener('click', emailEntfernenKlick);
	emailEingabe.addEventListener('keydown', (ereignis) => {
		if (ereignis.key === 'Enter') {
			ereignis.preventDefault();
			emailSpeichernKlick();
		}
	});
	profileExportButton.addEventListener('click', profileExportierenKlick);
	profileImportButton.addEventListener('click', profileImportierenKlick);
	profileImportDatei.addEventListener('change', profileImportDateiAusgewaehlt);

	exportEinzelnOeffnenButton.addEventListener('click', exportDialogOeffnen);
	exportAlleAuswaehlenButton.addEventListener('click', () => {
		exportProfilListe.querySelectorAll('.export-profil-checkbox').forEach((cb) => {
			cb.checked = true;
		});
	});
	exportKeineAuswaehlenButton.addEventListener('click', () => {
		exportProfilListe.querySelectorAll('.export-profil-checkbox').forEach((cb) => {
			cb.checked = false;
		});
	});
	exportDialogAbbrechenButton.addEventListener('click', () => exportAuswahlDialog.close());
	exportDialogBestaetigenButton.addEventListener('click', exportDialogBestaetigenKlick);
	// Klick auf den Dialog-Hintergrund (::backdrop) schließt den Dialog: bei
	// einem Klick direkt auf das <dialog>-Element selbst (nicht auf ein Kind)
	// wurde außerhalb der eigentlichen Box geklickt.
	exportAuswahlDialog.addEventListener('click', (ereignis) => {
		if (ereignis.target === exportAuswahlDialog) exportAuswahlDialog.close();
	});

	importEinzelnOeffnenButton.addEventListener('click', importEinzelnDialogOeffnen);
	importEinzelnDateiButton.addEventListener('click', importEinzelnDateiKlick);
	importEinzelnDatei.addEventListener('change', importEinzelnDateiAusgewaehlt);
	importEinzelnAbbrechenButton.addEventListener('click', () => importEinzelnDialog.close());
	importEinzelnBestaetigenButton.addEventListener('click', importEinzelnBestaetigenKlick);
	importEinzelnDialog.addEventListener('click', (ereignis) => {
		if (ereignis.target === importEinzelnDialog) importEinzelnDialog.close();
	});

	initProfilEditor({
		onGespeichert: async (id) => {
			// Dropdown-Beschriftung (Profilname + Zielsprache) neu aufbauen, falls
			// sich die Zwischensprache durch die Bearbeitung geändert hat, ein
			// importiertes/erstelltes Profil gelöscht wurde (id === null, Auswahl
			// fällt automatisch auf das erste verbleibende Profil zurück) oder ein
			// neues Profil erstellt wurde (id = die neue Profil-id, wird gezielt
			// ausgewählt).
			await profileInDropdownLaden();
			if (id && [...profilAuswahl.options].some((option) => option.value === id)) {
				profilAuswahl.value = id;
			}
			zielspracheAnzeigen();
			zeigeProfilImEditor(profilAuswahl.value);
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
