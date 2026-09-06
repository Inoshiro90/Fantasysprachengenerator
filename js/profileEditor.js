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
	setzeBenutzerdefinierteProfile,
	speichereProfil,
	ladeProfile,
} from './profileRepository.js';
import {SPRACHEN, findeSpracheNachCode, schriftLabel, romanisierungFuerCode} from './languages.js';
import {beispielsatzFuerCode} from './beispielsaetze.js';
import {
	problematischeRegelnErmitteln,
	schluesselParsen,
	schluesselKodieren,
	GUELTIGE_POSITIONEN,
} from './phonemeTransformer.js';

let aktuelleProfilId = null;
let onGespeichertCallback = null;

export function initProfilEditor({onGespeichert} = {}) {
	onGespeichertCallback = onGespeichert || null;
	spracheSelectBefuellen();
	bindEvents();
}

function el(id) {
	return document.getElementById(id);
}

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
 * Befüllt die #editor-status Alert-Box (Guide-Komponente .alert). Der
 * Inhalt wird über `inhaltAufbauen(contentEl)` erzeugt, damit sowohl
 * einfache Textmeldungen als auch die Warnliste (verschachteltes <ul>)
 * darüber laufen können.
 */
function statusAnzeigen(art, inhaltAufbauen) {
	const statusEl = el('editor-status');
	statusEl.className = `alert ${ALERT_KLASSE[art] || ALERT_KLASSE.info}`;

	statusEl.querySelector('.alert-icon').innerHTML = ALERT_ICON[art] || ALERT_ICON.info;

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

	const sprachen = [...SPRACHEN].sort((a, b) => a.name.localeCompare(b.name, 'de'));

	for (const sprache of sprachen) {
		const option = document.createElement('option');
		option.value = sprache.code;
		option.innerHTML = sprache.name;
		select.appendChild(option);
	}
}

/** Zeigt ein (effektives) Profil zur Bearbeitung an. */
export async function zeigeProfilImEditor(profilId) {
	aktuelleProfilId = profilId;
	const profil = await findeProfilNachId(profilId);
	if (!profil) return;

	el('editor-profil-name').innerHTML = profil.name;

	const benutzerdefiniert = istBenutzerdefiniertesProfil(profilId);
	const ueberschrieben = hatUeberschreibung(profilId);
	const badge = el('editor-override-badge');
	badge.hidden = !(benutzerdefiniert || ueberschrieben);
	badge.innerHTML = benutzerdefiniert ? 'Importiert' : 'Angepasst';

	// "Zurücksetzen" ergibt bei einem importierten Profil keinen Sinn
	// (es gibt keinen Auslieferungszustand dafür) - dort stattdessen "Löschen".
	el('editor-zuruecksetzen-button').hidden = !ueberschrieben || benutzerdefiniert;
	el('editor-loeschen-button').hidden = !benutzerdefiniert;

	spracheImEditorAnzeigen(profil);

	el('editor-silbenverdopplung-checkbox').checked = Boolean(profil.silbenverdopplung);
	el('editor-silbenvertauschung-checkbox').checked = Boolean(profil.silbenvertauschung);
	el('editor-wortspiegelung-checkbox').checked = Boolean(profil.wortspiegelung);

	el('editor-cluster-checkbox').checked = Boolean(profil.konsonantencluster_aufloesen);
	el('editor-cluster-fuellvokal').value = profil.konsonantencluster_fuellvokal || 'e';

	el('editor-wortlaenge-checkbox').checked = Boolean(profil.wortlaenge_kuerzen);
	el('editor-wortlaenge-maximal').value = profil.wortlaenge_maximal || 8;

	listeNeuAufbauen(
		'editor-vokal-liste',
		austauschZeileErzeugen,
		Object.entries(profil.vokal_austausch || {}).map(([schluesselRoh, zu]) => {
			const {muster, position} = schluesselParsen(schluesselRoh);
			return [muster, zu, position];
		}),
	);

	listeNeuAufbauen(
		'editor-konsonant-liste',
		austauschZeileErzeugen,
		Object.entries(profil.konsonant_austausch || {}).map(([schluesselRoh, zu]) => {
			const {muster, position} = schluesselParsen(schluesselRoh);
			return [muster, zu, position];
		}),
	);

	el('editor-status').hidden = true;
}

function spracheImEditorAnzeigen(profil) {
	const select = el('editor-sprache-select');
	select.value = profil.zielsprache;

	schriftHinweisAktualisieren();
	beispielsatzAktualisieren();
}

function schriftHinweisAktualisieren() {
	const hinweis = el('editor-schrift-hinweis');
	const select = el('editor-sprache-select');
	const sprache = findeSpracheNachCode(select.value);

	if (!sprache) {
		hinweis.innerHTML = '';
		return;
	}

	const KLASSE_NACH_QUALITAET = {
		gruen: 'form-hint-erfolg',
		gelb: 'form-hint-warnung',
		rot: 'form-hint-fehler',
	};

	hinweis.className = `form-hint ${KLASSE_NACH_QUALITAET[sprache.qualitaet] || ''}`.trim();
}

/**
 * Zeigt unterhalb der Sprachauswahl einen kurzen Beispielsatz in der
 * aktuell gewählten realen Zwischensprache an (siehe beispielsaetze.js) -
 * nur zur Orientierung, welches Lautbild/welche Buchstabenfolgen die
 * gewählte Sprache typischerweise hat, bevor man Vokal-/Konsonantenregeln
 * definiert.
 */
function beispielsatzAktualisieren() {
	const anzeige = el('editor-sprache-beispielsatz');
	const select = el('editor-sprache-select');
	const satz = beispielsatzFuerCode(select.value);

	if (!satz) {
		anzeige.hidden = true;
		anzeige.innerHTML = '';
		return;
	}

	anzeige.innerHTML = `Beispielsatz in dieser Sprache: <em>${satz}</em>`;
	anzeige.hidden = false;
}

function listeNeuAufbauen(containerId, zeilenErzeuger, eintraege) {
	const container = el(containerId);
	container.innerHTML = '';

	if (eintraege.length === 0) {
		zeilenErzeuger(container);
	} else {
		for (const eintrag of eintraege) {
			zeilenErzeuger(container, ...eintrag);
		}
	}
}

function erzeugeEntfernenButton(zeileElement) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'btn-icon-entfernen';
	button.setAttribute('aria-label', 'Regel entfernen');
	button.innerHTML = '✕';

	button.addEventListener('click', () => zeileElement.remove());

	return button;
}

const POSITION_OPTIONEN = [
	['', 'Überall'],
	['anfang', 'Wortanfang'],
	['mitte', 'Wortmitte'],
	['ende', 'Wortende'],
	['gesamt', 'Gesamtwort'],
];

function austauschZeileErzeugen(container, von = '', zu = '', position = null) {
	const zeile = document.createElement('div');
	zeile.className = 'editor-zeile';

	const vonInput = document.createElement('input');
	vonInput.className = 'form-input editor-von';
	vonInput.type = 'text';
	vonInput.maxLength = 6;
	vonInput.placeholder = 'von (z. B. a, sch)';
	vonInput.value = von;

	const pfeil = document.createElement('span');
	pfeil.className = 'editor-pfeil';
	pfeil.innerHTML = '→';

	const zuInput = document.createElement('input');
	zuInput.className = 'form-input editor-zu';
	zuInput.type = 'text';
	zuInput.placeholder = 'zu (z. B. aa, leer = entfernen)';
	zuInput.value = zu;

	const positionSelect = document.createElement('select');
	positionSelect.className = 'form-input editor-position';
	positionSelect.setAttribute('aria-label', 'Position im Wort');

	for (const [wert, label] of POSITION_OPTIONEN) {
		const option = document.createElement('option');
		option.value = wert;
		option.innerHTML = label;

		if (wert === (position || '')) {
			option.selected = true;
		}

		positionSelect.appendChild(option);
	}

	zeile.append(vonInput, pfeil, zuInput, positionSelect, erzeugeEntfernenButton(zeile));

	container.appendChild(zeile);

	return zeile;
}

function sammleAustauschTabelle(containerId) {
	const tabelle = {};

	for (const zeile of el(containerId).querySelectorAll('.editor-zeile')) {
		// Bewusst KEIN .trim() auf "von": ein Leerzeichen am Rand ist ein
		// gültiger, bedeutungstragender Teil des Musters (siehe
		// wortKernMitGrenzenTransformieren() in phonemeTransformer.js) - z. B.
		// " i " -> " a ", um NUR das eigenständige Wort "i" zu treffen, nicht
		// aber ein "i" innerhalb eines längeren Wortes. Dieser Leerzeichen-
		// Behelf bleibt aus Kompatibilitätsgründen nutzbar, für neue Regeln
		// ist dafür aber die Positions-Option "Gesamtwort" gedacht (siehe
		// POSITION_OPTIONEN) - sie braucht kein Leerzeichen im Muster. Nur ein
		// wirklich komplett leeres Feld macht die Zeile bedeutungslos.
		const von = zeile.querySelector('.editor-von').value.toLowerCase();
		const zu = zeile.querySelector('.editor-zu').value;
		const position = zeile.querySelector('.editor-position').value || null;

		// "zu" darf bewusst leer sein - das bedeutet "durch nichts ersetzen",
		// also das gefundene Zeichen/Muster ersatzlos entfernen (siehe
		// zeichenAustauschKernAnwenden in phonemeTransformer.js, das einen
		// leeren Ersatzstring bereits korrekt als Löschung verarbeitet).
		// Nur eine leere "von"-Spalte macht eine Zeile bedeutungslos und wird
		// daher weiterhin übersprungen.
		if (von.length > 0) {
			// Nur für die Wildcard-Erkennung robust gegen ein versehentlich
			// mitgetipptes Leerzeichen sein (z. B. "* "); als eigentliches
			// Muster bleibt "von" aber unverändert (siehe Kommentar oben).
			const schluessel =
				von.trim() === '*'
					? von.trim()
					: schluesselKodieren(
							von,
							GUELTIGE_POSITIONEN.includes(position) ? position : null,
						);

			tabelle[schluessel] = zu;
		}
	}

	return tabelle;
}

async function speichern() {
	if (!aktuelleProfilId) return;

	const select = el('editor-sprache-select');
	const sprache = findeSpracheNachCode(select.value);

	const zielsprache = select.value;
	const zielsprache_name = sprache?.name || select.value;
	const romanisierung_noetig = romanisierungFuerCode(select.value);

	const vokal_austausch = sammleAustauschTabelle('editor-vokal-liste');

	const konsonant_austausch = sammleAustauschTabelle('editor-konsonant-liste');

	const wortspiegelung = el('editor-wortspiegelung-checkbox').checked;
	const silbenvertauschung = el('editor-silbenvertauschung-checkbox').checked;
	const silbenverdopplung = el('editor-silbenverdopplung-checkbox').checked;

	const konsonantencluster_aufloesen = el('editor-cluster-checkbox').checked;
	const konsonantencluster_fuellvokal = el('editor-cluster-fuellvokal').value || 'e';

	const wortlaenge_kuerzen = el('editor-wortlaenge-checkbox').checked;
	const wortlaenge_maximal = Math.max(2, Number.parseInt(el('editor-wortlaenge-maximal').value, 10) || 8);

	try {
		speichereProfil(aktuelleProfilId, {
			zielsprache,
			zielsprache_name,
			romanisierung_noetig,
			vokal_austausch,
			konsonant_austausch,
			wortspiegelung,
			silbenvertauschung,
			silbenverdopplung,
			konsonantencluster_aufloesen,
			konsonantencluster_fuellvokal,
			wortlaenge_kuerzen,
			wortlaenge_maximal,
		});

		const warnungen = problematischeRegelnErmitteln({
			vokal_austausch,
			konsonant_austausch,
		});

		if (warnungen.length > 0) {
			statusAnzeigen('warnung', (content) => {
				const zusammenfassung = document.createElement('p');

				zusammenfassung.innerHTML =
					warnungen.length === 1
						? 'Änderungen gespeichert. Ein Hinweis dazu:'
						: `Änderungen gespeichert. ${warnungen.length} Hinweise dazu:`;

				content.appendChild(zusammenfassung);

				const liste = document.createElement('ul');
				liste.className = 'editor-warnliste';

				for (const warnung of warnungen) {
					const eintrag = document.createElement('li');
					eintrag.innerHTML = warnung;
					liste.appendChild(eintrag);
				}

				content.appendChild(liste);
			});
		} else {
			statusAnzeigen('erfolg', (content) => {
				content.innerHTML = 'Änderungen gespeichert.';
			});
		}

		el('editor-override-badge').hidden = false;
		el('editor-zuruecksetzen-button').hidden = false;

		if (onGespeichertCallback) {
			onGespeichertCallback(aktuelleProfilId);
		}
	} catch (fehler) {
		statusAnzeigen('fehler', (content) => {
			content.innerHTML = fehler.message;
		});
	}
}

async function zuruecksetzen() {
	if (!aktuelleProfilId) return;

	entferneUeberschreibung(aktuelleProfilId);
	await zeigeProfilImEditor(aktuelleProfilId);

	statusAnzeigen('info', (content) => {
		content.innerHTML = 'Auf Standardwerte zurückgesetzt.';
	});

	if (onGespeichertCallback) {
		onGespeichertCallback(aktuelleProfilId);
	}
}

/**
 * Löscht ein per Import/Neuanlage hinzugefügtes benutzerdefiniertes Profil
 * vollständig (nicht verfügbar für Basisprofile - dafür gibt es
 * stattdessen "Auf Standard zurücksetzen").
 *
 * Nutzt bewusst KEIN window.confirm(): in eingebetteten Vorschau-/Sandbox-
 * Umgebungen (iframes ohne "allow-modals") werden native Dialoge oft
 * stillschweigend unterdrückt - der Klick auf "Löschen" wirkte dann nach
 * außen so, als würde gar nichts passieren. Die Bestätigung läuft
 * stattdessen inline über die ohnehin vorhandene Alert-Box.
 */
function loeschen() {
	if (!aktuelleProfilId || !istBenutzerdefiniertesProfil(aktuelleProfilId)) {
		return;
	}

	const name = el('editor-profil-name').innerHTML;

	statusAnzeigen('warnung', (content) => {
		const text = document.createElement('p');
		text.innerHTML = `"${name}" wirklich unwiderruflich löschen?`;
		content.appendChild(text);

		const aktionen = document.createElement('div');
		aktionen.className = 'alert-aktionen';

		const abbrechenButton = document.createElement('button');
		abbrechenButton.type = 'button';
		abbrechenButton.className = 'btn btn-ghost btn-sm';
		abbrechenButton.innerHTML = 'Abbrechen';

		abbrechenButton.addEventListener('click', () => {
			el('editor-status').hidden = true;
		});

		const bestaetigenButton = document.createElement('button');
		bestaetigenButton.type = 'button';
		bestaetigenButton.className = 'btn btn-danger btn-sm';
		bestaetigenButton.innerHTML = 'Löschen';

		bestaetigenButton.addEventListener('click', loeschenAusfuehren);

		aktionen.append(abbrechenButton, bestaetigenButton);

		content.appendChild(aktionen);
	});
}

function loeschenAusfuehren() {
	if (!aktuelleProfilId) return;

	entferneBenutzerdefiniertesProfil(aktuelleProfilId);
	aktuelleProfilId = null;
	el('editor-status').hidden = true;

	if (onGespeichertCallback) {
		onGespeichertCallback(null);
	}
}

// --- Neues Profil erstellen -------------------------------------------

/** Wandelt einen freien Namen in eine URL-/id-sichere Kurzform um (Kleinbuchstaben, "_" statt Leer-/Sonderzeichen). */
function zuSlug(text) {
	return text
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Akzente entfernen (ä -> a usw.)
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 40);
}

async function eindeutigeIdErzeugen(basisSlug) {
	const alleProfile = await ladeProfile();
	const vorhandeneIds = new Set(alleProfile.map((p) => p.id));
	const slug = basisSlug.length > 0 ? basisSlug : 'profil';

	if (!vorhandeneIds.has(slug)) return slug;

	let zaehler = 2;

	while (vorhandeneIds.has(`${slug}_${zaehler}`)) {
		zaehler += 1;
	}

	return `${slug}_${zaehler}`;
}

function neuesProfilStatusAnzeigen(art, text) {
	const statusEl = el('profil-neu-status');

	statusEl.className = `alert ${ALERT_KLASSE[art] || ALERT_KLASSE.info}`;

	statusEl.querySelector('.alert-icon').innerHTML = ALERT_ICON[art] || ALERT_ICON.info;

	statusEl.querySelector('.alert-content').innerHTML = text;
	statusEl.hidden = false;
}

function neuesProfilFormularOeffnen() {
	el('profil-neu-karte').hidden = false;
	el('profil-neu-status').hidden = true;

	const nameInput = el('profil-neu-name');
	nameInput.value = '';
	nameInput.focus();
}

function neuesProfilFormularSchliessen() {
	el('profil-neu-karte').hidden = true;
}

async function neuesProfilErstellen() {
	const nameInput = el('profil-neu-name');
	const name = nameInput.value.trim();

	if (name.length === 0) {
		neuesProfilStatusAnzeigen(
			'fehler',
			'Bitte einen Namen für die neue Fantasysprache eingeben.',
		);

		nameInput.focus();
		return;
	}

	const slug = zuSlug(name);
	const id = await eindeutigeIdErzeugen(slug);

	// Sinnvoller Startpunkt: erste Sprache aus der kuratierten Liste
	// (alphabetisch, wie im Dropdown) - Zielsprache und Regeln stellt man
	// direkt danach im Editor darunter ein.
	const ersteSprache = [...SPRACHEN].sort((a, b) => a.name.localeCompare(b.name, 'de'))[0];

	const neuesProfil = {
		id,
		name,
		zielsprache: ersteSprache.code,
		zielsprache_name: ersteSprache.name,
		romanisierung_noetig: romanisierungFuerCode(ersteSprache.code),
		vokal_austausch: {},
		konsonant_austausch: {},
		wortspiegelung: false,
		silbenvertauschung: false,
		silbenverdopplung: false,
		konsonantencluster_aufloesen: false,
		konsonantencluster_fuellvokal: 'e',
		wortlaenge_kuerzen: false,
		wortlaenge_maximal: 8,
	};

	try {
		setzeBenutzerdefinierteProfile([neuesProfil]);
	} catch (fehler) {
		neuesProfilStatusAnzeigen('fehler', fehler.message);
		return;
	}

	neuesProfilFormularSchliessen();

	if (onGespeichertCallback) {
		onGespeichertCallback(id);
	}
}

/** Buchstaben, die zeichenAustauschKernAnwenden() als Vokal bzw. Konsonant
 * behandelt (siehe VOKALE in phonemeTransformer.js) - für die
 * "Alle verdoppeln"-Schnellaktion der jeweiligen Tabelle.
 */
const VOKAL_BUCHSTABEN = 'aeiouy'.split('');
const KONSONANT_BUCHSTABEN = 'bcdfghjklmnpqrstvwxz'.split('');

/**
 * Fügt für jeden Buchstaben der übergebenen Liste eine neue Austausch-Zeile
 * "Buchstabe -> Buchstabe+Buchstabe" mit der gewählten Position hinzu -
 * Schnellaktion, um nicht jede Verdopplungsregel einzeln von Hand anlegen
 * zu müssen (z. B. "alle Vokale am Wortende verdoppeln").
 */
function alleVerdoppelnHinzufuegen(containerId, buchstaben, position) {
	const container = el(containerId);
	for (const buchstabe of buchstaben) {
		austauschZeileErzeugen(container, buchstabe, buchstabe + buchstabe, position || null);
	}
}

function bindEvents() {
	el('editor-vokal-hinzufuegen').addEventListener('click', () => {
		austauschZeileErzeugen(el('editor-vokal-liste'));
	});

	el('editor-konsonant-hinzufuegen').addEventListener('click', () => {
		austauschZeileErzeugen(el('editor-konsonant-liste'));
	});

	el('editor-vokal-verdopplung-button').addEventListener('click', () => {
		const position = el('editor-vokal-verdopplung-position').value;
		alleVerdoppelnHinzufuegen('editor-vokal-liste', VOKAL_BUCHSTABEN, position);
	});

	el('editor-konsonant-verdopplung-button').addEventListener('click', () => {
		const position = el('editor-konsonant-verdopplung-position').value;
		alleVerdoppelnHinzufuegen('editor-konsonant-liste', KONSONANT_BUCHSTABEN, position);
	});

	el('editor-sprache-select').addEventListener('change', () => {
		schriftHinweisAktualisieren();
		beispielsatzAktualisieren();
	});

	el('editor-speichern-button').addEventListener('click', speichern);

	el('editor-zuruecksetzen-button').addEventListener('click', zuruecksetzen);

	el('editor-loeschen-button').addEventListener('click', loeschen);

	el('profil-neu-button').addEventListener('click', neuesProfilFormularOeffnen);

	el('profil-neu-abbrechen-button').addEventListener('click', neuesProfilFormularSchliessen);

	el('profil-neu-erstellen-button').addEventListener('click', neuesProfilErstellen);

	el('profil-neu-name').addEventListener('keydown', (ereignis) => {
		if (ereignis.key === 'Enter') {
			ereignis.preventDefault();
			neuesProfilErstellen();
		}
	});
}
