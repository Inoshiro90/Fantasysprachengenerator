/**
 * uigurischTransliteration.js
 * Umschrift von Uigurisch (Perso-Arabische Schrift) nach lateinischer
 * Näherung, angelehnt an die Uyghur Latin Yëziqi (ULY) - seit 2023
 * offizieller BGN/PCGN-Romanisierungsstandard für Uigurisch.
 *
 * WICHTIGER STRUKTURUNTERSCHIED ZU ARABISCH/FARSI/URDU/PASCHTU/SORANI:
 * Die uigurische Orthographie schreibt, anders als das klassische
 * arabische Abdschad, ALLE Vokale explizit als eigene Buchstaben (a, e,
 * i, o, u, ö, ü, ë) statt sie über Kurzvokal-Diakritika anzudeuten oder
 * ganz wegzulassen. Die in transliterationClient.js für Arabisch/Farsi/
 * Urdu/Paschtu/Sorani nötige Kurzvokal-Rate-Heuristik (bzw. das dortige
 * Aussprache-Wörterbuch) ist hier daher unnötig - strukturell näher an
 * Dhivehi/Thaana (siehe dhivehiTransliteration.js) als an Arabisch.
 *
 * HAMZA-TRÄGER (ئ, U+0626): Wortanlautende Vokale werden im Uigurischen
 * mit einem stummen "Träger"-Zeichen davor geschrieben (z. B. "ئا" für
 * anlautendes "a" statt blossem "ا"), das selbst keinen Lautwert hat.
 * Mittendrin im Wort steht der Vokalbuchstabe dagegen ohne Träger. Eine
 * reine Einzelzeichen-Tabelle würde das Trägerzeichen isoliert stehen
 * lassen; hier werden daher zusätzlich alle 8 Träger+Vokal-Kombinationen
 * als eigene (längere) Tabelleneintraege gefuehrt und von
 * ersetzeMitLaengstemTreffer() in transliterationClient.js (selbe
 * Technik wie beim Chinesisch-Pinyin-Modul) VOR den einzelnen
 * Buchstaben geprüft.
 *
 * ASCII-VEREINFACHUNG: Wie im Rest des Projekts (siehe z. B. ө/ү -> o/u
 * in der Kyrillisch-Tabelle) werden die ULY-Umlaute ö/ü nicht als
 * Diakritika uebernommen, sondern auf o/u vereinfacht. Das erzeugt zwei
 * bewusst in Kauf genommene Kollisionen (و/ۆ -> beide "o"; ۇ/ۈ -> beide
 * "u") - dieselbe Art Vereinfachung wie bei den Ge'ez-6.-Ordnungs- oder
 * den Kyrillisch-Zusatzbuchstaben-Faellen an anderer Stelle im Projekt.
 */

// Konsonanten (Einzelzeichen). Werte, die mit dem bestehenden
// arabischen Modul uebereinstimmen (b/p/t/j/ch/d/r/z/zh/s/sh/gh/f/q/k/g/
// l/m/n/w/y), folgen bewusst derselben Lesung fuer Konsistenz.
const KONSONANTEN = {
  'ب': 'b', 'پ': 'p', 'ت': 't', 'ج': 'j', 'چ': 'ch', 'خ': 'kh',
  'د': 'd', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh',
  'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'گ': 'g', 'ڭ': 'ng',
  'ل': 'l', 'م': 'm', 'ن': 'n', 'ھ': 'h', 'ۋ': 'w', 'ي': 'y',
};

// Vokalbuchstaben ohne vorangehenden Hamza-Traeger (Wortinneres).
const VOKALE = {
  'ا': 'a', 'ە': 'e', 'و': 'o', 'ۇ': 'u',
  'ۆ': 'o', 'ۈ': 'u', 'ې': 'e', 'ى': 'i',
};

const HAMZA = 'ئ';

// Hamza-Traeger + Vokalbuchstabe als zusammenhaengende, laengere
// Tabelleneintraege (siehe Moduldoku) - liefern denselben Lautwert wie
// der blosse Vokalbuchstabe in VOKALE oben.
const HAMZA_VOKALE = Object.fromEntries(
  Object.entries(VOKALE).map(([buchstabe, laut]) => [HAMZA + buchstabe, laut]),
);

const SONSTIGE = {
  // Arabisch-indische Ziffern, gleiche Zuordnung wie im Arabisch-Modul.
  '\u0660': '0', '\u0661': '1', '\u0662': '2', '\u0663': '3', '\u0664': '4',
  '\u0665': '5', '\u0666': '6', '\u0667': '7', '\u0668': '8', '\u0669': '9',
  // Verwaister Hamza-Traeger ohne folgenden Vokalbuchstaben (sollte in
  // regulaerer Orthographie nicht vorkommen) - traegt selbst keinen Laut.
  [HAMZA]: '',
};

// Vollstaendige Tabelle fuer ersetzeMitLaengstemTreffer(): die 2-Zeichen-
// Hamza-Kombinationen zuerst, damit sie vor den einzelnen Buchstaben
// (Konsonanten/Vokale/Sonstige) greifen.
export const UIGURISCH_MAP = {
  ...HAMZA_VOKALE,
  ...KONSONANTEN,
  ...VOKALE,
  ...SONSTIGE,
};

const UIGURISCH_SPRACHCODES = new Set(['ug-CN']);

/** Ob für einen Sprachcode die uigurische Umschrift zuständig ist. */
export function hatUigurischesSchema(code) {
  return UIGURISCH_SPRACHCODES.has(code);
}
