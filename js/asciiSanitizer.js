/**
 * asciiSanitizer.js
 * Erzwingt, dass der ausgegebene Text ausschliesslich aus Zeichen besteht,
 * die auch unkodiert in einer URL verwendet werden koennen: also im
 * Wesentlichen die Buchstaben des englischen Alphabets (a-z, A-Z), Ziffern
 * und unbedenkliche Satzzeichen. Insbesondere werden Umlaute, Akzente und
 * sonstige diakritische Zeichen entfernt (z. B. "e mit Doppelpunkt" -> ë),
 * die durch Uebersetzung in Sprachen wie Schwedisch, Islaendisch, Esperanto
 * oder Litauisch entstehen koennen.
 *
 * Wird nach translate()/romanize() und nach der phonemeTransformer-Stufe
 * angewendet, damit garantiert am Ende nur ASCII-Zeichen im Outputfeld
 * landen - unabhaengig davon, welches Profil oder welche Zwischensprache
 * verwendet wurde.
 */

// Buchstaben ohne kanonische Unicode-Zerlegung (NFD greift hier nicht),
// daher eigene, kleine Abbildungstabelle als erster Schritt.
const SONDERBUCHSTABEN_MAP = {
  'ø': 'o', 'Ø': 'O',
  'đ': 'd', 'Đ': 'D',
  'ð': 'd', 'Ð': 'D',
  'þ': 'th', 'Þ': 'Th',
  'ß': 'ss',
  'ł': 'l', 'Ł': 'L',
  'æ': 'ae', 'Æ': 'AE',
  'œ': 'oe', 'Œ': 'OE',
  'ŋ': 'ng', 'Ŋ': 'NG',
  'ħ': 'h', 'Ħ': 'H',
  'ŧ': 't', 'Ŧ': 'T',
  // IPA-Erweiterungsbuchstaben westafrikanischer Sprachen (Akan, Bambara,
  // Ewe, Fulah, Twi ua.) - eigenstaendige Codepoints ohne Akzent-Anteil,
  // daher wie oben ohne NFD-Zerlegung zerlegbar. ɔ/ɛ = offenes o/e, ɖ =
  // retroflexes d, ɗ = implosives d, ɲ = palatales n (span. ñ-Laut).
  'ɔ': 'o', 'Ɔ': 'O',
  'ɛ': 'e', 'Ɛ': 'E',
  'ɖ': 'd', 'Ɖ': 'D',
  'ɗ': 'd', 'Ɗ': 'D',
  'ɲ': 'ny', 'Ɲ': 'Ny',
  // Ostasiatische (vollbreite) Satzzeichen: werden auf ihr ASCII-Pendant
  // abgebildet statt ersatzlos entfernt. Ohne diese Abbildung wuerden
  // z. B. bei Chinesisch/Japanisch zwei durch ein Komma getrennte
  // Woerter nach dem Entfernen wieder direkt aneinanderkleben (siehe
  // chineseWordSegmentation.js, dessen Wortzwischenraeume sonst an jedem
  // Satzzeichen verlorengingen).
  '，': ', ', '。': '. ', '、': ', ', '；': '; ', '：': ': ',
  '！': '! ', '？': '? ', '（': ' (', '）': ') ',
  '「': '"', '」': '"', '『': '"', '』': '"',
  '“': '"', '”': '"',
  '……': '...', '…': '...', '—': '-', '～': '~',
};

// Typografische Anfuehrungszeichen und Modifier-Apostrophe (z. B. das
// usbekische Okina in "o'lma"/"g'oz") - werden ersatzlos entfernt, nicht
// durch ein normales Apostroph ersetzt, um Wortformen nicht zu verzerren.
const TYPOGRAFISCHE_ZEICHEN = /[\u2018\u2019\u201A\u201B\u02BB\u02BC\u00B4\u0060]/g;

/**
 * Wandelt einen beliebigen Unicode-Text in eine reine ASCII-Naeherung um.
 * @param {string} text
 * @returns {string}
 */
export function zuUrlSicheremAscii(text) {
  if (!text) return '';

  let ergebnis = '';
  for (const zeichen of text) {
    ergebnis += Object.prototype.hasOwnProperty.call(SONDERBUCHSTABEN_MAP, zeichen)
      ? SONDERBUCHSTABEN_MAP[zeichen]
      : zeichen;
  }

  // Kombinierte Akzentzeichen (á, é, í, ó, ú, ü, ä, ö, č, š, ...) ueber
  // Unicode-Normalisierung in Basisbuchstabe + Akzent zerlegen und
  // den Akzent anschliessend verwerfen.
  ergebnis = ergebnis.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  ergebnis = ergebnis.replace(TYPOGRAFISCHE_ZEICHEN, '');

  // Sicherheitsnetz: alles, was danach noch nicht im ASCII-Bereich liegt
  // (z. B. unbekannte Skripte), wird entfernt statt die App abstuerzen zu
  // lassen oder unverstaendliche Zeichen anzuzeigen.
  ergebnis = ergebnis.replace(/[^\x00-\x7F]/g, '');

  // Durch die Satzzeichen-Abbildung oben (z. B. '，' -> ', ') koennen
  // doppelte/fuehrende/nachgestellte Leerzeichen entstehen (etwa im
  // Zusammenspiel mit den von chineseWordSegmentation.js eingefuegten
  // Wortzwischenraeumen) - werden hier vereinheitlicht.
  ergebnis = ergebnis.replace(/[ \t]+/g, ' ').trim();

  return ergebnis;
}
