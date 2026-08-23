/**
 * languages.js
 * Kuratierte Liste der als Zwischensprache nutzbaren MyMemory-Sprachen.
 * Locale-Codes wie "sv-SE", "zh-CN" statt reiner ISO-639-1-Codes,
 * da MyMemory diese Werte 1:1 als langpair-Parameter erwartet.
 *
 * Die Liste ist bewusst auf die Sprachen beschränkt, die in
 * Sprachen_MyMemory_Cleaned.xlsx als geprüfte, funktionierende
 * Zielsprachen (Quelle: Deutsch) dokumentiert sind. Sprachen, die dort
 * fehlen (z. B. Deutsch selbst als Quellsprache, Altgriechisch, Koptisch
 * oder diverse kleine Kreolsprachen), wurden entsprechend entfernt, um
 * ausschließlich verifizierte Zwischensprachen zur Auswahl zu stellen.
 * Chinesisch ist weiterhin mit den zwei MyMemory-Varianten zh-CN
 * (Vereinfacht) und zh-TW (Traditionell) vertreten, da beide dem
 * geprüften "Chinese"-Eintrag der Excel-Liste entsprechen.
 *
 * Jede Sprache trägt ein `schrift`-Attribut, das bestimmt, ob und wie
 * automatisch romanisiert wird:
 *
 *  - 'latein':      keine Romanisierung nötig
 *  - 'kyrillisch':  wird über transliterationClient.js automatisch umgeschrieben
 *  - 'griechisch':  dito
 *  - 'geez':        dito (vereinfachte Amharisch/Tigrinya-Umschrift)
 *  - 'andere':      Sammelbecken für Schriften ohne eigenen 'schrift'-Wert.
 *                    Aktuell nur Tibetisch (bo-CN), das über ein eigenes
 *                    wörterbuchgestütztes Modul (tibetischTransliteration.js)
 *                    umgeschrieben wird - anders als der Name vermuten lässt,
 *                    ist hier also doch ein Mapping hinterlegt. Für Sprachen,
 *                    die künftig hier landen, OHNE ein eigenes Modul zu haben,
 *                    bleibt der Text unveraendert und wird danach von
 *                    asciiSanitizer.js entfernt (Datenverlust möglich).
 *
 * Zusätzlich trägt jede Sprache ein `qualitaet`-Attribut, das einschätzt,
 * wie zuverlässig die Umschrift nach Latein tatsächlich ist (unabhängig
 * vom Schriftsystem selbst, siehe schriftLabel()). Grundlage ist eine
 * manuelle Durchsicht aller Umschrift-Module (Stand siehe Git-Historie):
 *
 *  - 'gruen': keine Romanisierung nötig (lateinische Schrift) ODER eine
 *    hochwertige, weitgehend vollständige Umschrift (z. B. eigene
 *    Skript-Tabellen für den indischen Schriftenkreis, algorithmisch
 *    exakte Hangul-Zerlegung für Koreanisch, wörterbuchgestützte
 *    Verfahren für Khmer/Arabisch/Farsi/Urdu/Paschtu/Kurdisch-Sorani).
 *  - 'gelb': eine brauchbare, aber erkennbar lückenhafte oder
 *    näherungsweise Umschrift (z. B. Thai mit unveränderter
 *    Vokalreihenfolge, Chinesisch ohne Polyphon-Disambiguierung,
 *    Tibetisch mit Wörterbuch-Abdeckung nur eines Teils des Wortschatzes,
 *    Rest bleibt unveraendert in tibetischer Schrift stehen).
 *  - 'rot': keine oder eine stark unvollständige Umschrift, bei der ein
 *    erheblicher Teil des Textes durch das finale ASCII-Sicherheitsnetz
 *    (asciiSanitizer.js) verloren geht.
 */

export const SPRACHEN = [
  { code: 'af-ZA', name: 'Afrikaans', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'sq-AL', name: 'Albanisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'am-ET', name: 'Amharisch', schrift: 'geez', qualitaet: 'gelb' },
  { code: 'ar-SA', name: 'Arabisch', schrift: 'arabisch', qualitaet: 'gruen' },
  { code: 'hy-AM', name: 'Armenisch', schrift: 'armenisch', qualitaet: 'gruen' },
  { code: 'az-AZ', name: 'Aserbaidschanisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'eu-ES', name: 'Baskisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'bem-ZM', name: 'Bemba', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'bn-IN', name: 'Bengalisch', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'be-BY', name: 'Belarussisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'bs-BA', name: 'Bosnisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'br-FR', name: 'Bretonisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'bg-BG', name: 'Bulgarisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'my-MM', name: 'Birmanisch', schrift: 'birmanisch', qualitaet: 'gelb' },
  { code: 'ca-ES', name: 'Katalanisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ceb-PH', name: 'Cebuano', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'zh-CN', name: 'Chinesisch (Vereinfacht)', schrift: 'chinesisch', qualitaet: 'gruen' },
  { code: 'zh-TW', name: 'Chinesisch (Traditionell)', schrift: 'chinesisch', qualitaet: 'gruen' },
  { code: 'ht-HT', name: 'Haitianisches Kreol', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'crs-SC', name: 'Seychellenkreol', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'hr-HR', name: 'Kroatisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'cs-CZ', name: 'Tschechisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'da-DK', name: 'Daenisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'nl-NL', name: 'Niederlaendisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'dz-BT', name: 'Dzongkha', schrift: 'dzongkha', qualitaet: 'gelb' },
  { code: 'en-GB', name: 'Englisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'eo-EU', name: 'Esperanto', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'et-EE', name: 'Estnisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'fo-FO', name: 'Faeroeisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'fi-FI', name: 'Finnisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'fr-FR', name: 'Franzoesisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'gl-ES', name: 'Galicisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ka-GE', name: 'Georgisch', schrift: 'georgisch', qualitaet: 'gruen' },
  { code: 'el-GR', name: 'Griechisch', schrift: 'griechisch', qualitaet: 'gruen' },
  { code: 'gu-IN', name: 'Gujarati', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'ha-NE', name: 'Hausa', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'haw-US', name: 'Hawaiianisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'he-IL', name: 'Hebraeisch', schrift: 'hebraeisch', qualitaet: 'gelb' },
  { code: 'hi-IN', name: 'Hindi', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'hu-HU', name: 'Ungarisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'is-IS', name: 'Islaendisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'id-ID', name: 'Indonesisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ga-IE', name: 'Irisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'it-IT', name: 'Italienisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ja-JP', name: 'Japanisch', schrift: 'japanisch', qualitaet: 'gelb' },
  { code: 'kea-CV', name: 'Kabuverdianu', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'kab-DZ', name: 'Kabylisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'kn-IN', name: 'Kannada', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'kk-KZ', name: 'Kasachisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'km-KM', name: 'Khmer', schrift: 'khmer', qualitaet: 'gruen' },
  { code: 'rw-RW', name: 'Kinyarwanda', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'rn-BI', name: 'Kirundi', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ko-KR', name: 'Koreanisch', schrift: 'koreanisch', qualitaet: 'gruen' },
  { code: 'ku-TR', name: 'Kurdisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ckb-IQ', name: 'Kurdisch (Sorani)', schrift: 'arabisch', qualitaet: 'gruen' },
  { code: 'ky-KG', name: 'Kirgisisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'lo-LA', name: 'Laotisch', schrift: 'laotisch', qualitaet: 'gruen' },
  { code: 'la-VA', name: 'Latein', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'lv-LV', name: 'Lettisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'lt-LT', name: 'Litauisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'lb-LU', name: 'Luxemburgisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'mk-MK', name: 'Mazedonisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'mg-MG', name: 'Malagasy', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ms-MY', name: 'Malaiisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'dv-MV', name: 'Maledivisch', schrift: 'dhivehi', qualitaet: 'gruen' },
  { code: 'mt-MT', name: 'Maltesisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'mi-NZ', name: 'Maori', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'mn-MN', name: 'Mongolisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'ne-NP', name: 'Nepalesisch', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'no-NO', name: 'Norwegisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ny-MW', name: 'Chichewa (Nyanja)', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ur-PK', name: 'Urdu', schrift: 'arabisch', qualitaet: 'gruen' },
  { code: 'pa-IN', name: 'Punjabi', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'pap-CW', name: 'Papiamentu', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ps-PK', name: 'Paschtu', schrift: 'arabisch', qualitaet: 'gruen' },
  { code: 'fa-IR', name: 'Persisch', schrift: 'arabisch', qualitaet: 'gruen' },
  { code: 'pl-PL', name: 'Polnisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'pt-PT', name: 'Portugiesisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'qu-PE', name: 'Quechua', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ro-RO', name: 'Rumaenisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'ru-RU', name: 'Russisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'sm-WS', name: 'Samoanisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'sg-CF', name: 'Sango', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'gd-GB', name: 'Gaelisch (Schottisch)', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'sr-RS', name: 'Serbisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'sn-ZW', name: 'Shona', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'si-LK', name: 'Singhalesisch', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'sk-SK', name: 'Slowakisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'sl-SI', name: 'Slowenisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'so-SO', name: 'Somali', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'st-ST', name: 'Sesotho', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'es-ES', name: 'Spanisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'sw-SZ', name: 'Swahili', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'sv-SE', name: 'Schwedisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'tl-PH', name: 'Tagalog', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'tg-TJ', name: 'Tadschikisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'ta-LK', name: 'Tamil', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'te-IN', name: 'Telugu', schrift: 'indisch', qualitaet: 'gruen' },
  { code: 'tet-TL', name: 'Tetum', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'th-TH', name: 'Thailaendisch', schrift: 'thai', qualitaet: 'gruen' },
  { code: 'bo-CN', name: 'Tibetisch', schrift: 'tibetisch', qualitaet: 'gelb' },
  { code: 'ti-TI', name: 'Tigrinya', schrift: 'geez', qualitaet: 'gelb' },
  { code: 'tpi-PG', name: 'Tok Pisin', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'tn-BW', name: 'Tswana', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'tr-TR', name: 'Tuerkisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'tk-TM', name: 'Turkmenisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'uk-UA', name: 'Ukrainisch', schrift: 'kyrillisch', qualitaet: 'gruen' },
  { code: 'uz-UZ', name: 'Usbekisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'vi-VN', name: 'Vietnamesisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'cy-GB', name: 'Walisisch', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'wo-SN', name: 'Wolof', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'xh-ZA', name: 'Xhosa', schrift: 'latein', qualitaet: 'gruen' },
  { code: 'yi-YD', name: 'Jiddisch', schrift: 'hebraeisch', qualitaet: 'gelb' },
  { code: 'zu-ZA', name: 'Zulu', schrift: 'latein', qualitaet: 'gruen' },
];

const SCHRIFT_LABEL = {
  latein: 'Lateinische Schrift',
  kyrillisch: 'Kyrillische Schrift (wird automatisch umgeschrieben, DIN 1460/ISO 9)',
  griechisch: 'Griechische Schrift (wird automatisch umgeschrieben, DIN 31634/ISO 843)',
  geez: "Ge'ez-Schrift (vereinfachte automatische Umschrift)",
  arabisch: 'Arabische Schrift (wird automatisch umgeschrieben, DIN 31635/ISO 233)',
  armenisch: 'Armenische Schrift (wird automatisch umgeschrieben, DIN 32706/ISO 9985)',
  georgisch: 'Georgische Schrift (wird automatisch umgeschrieben, DIN 32707/ISO 9984)',
  hebraeisch: 'Hebraeische Schrift (wird automatisch umgeschrieben, DIN 31636/ISO 259)',
  indisch: 'Indischer Schriftenkreis (wird automatisch umgeschrieben, angelehnt an ISO 15919)',
  japanisch: 'Japanische Schrift (Kana wird umgeschrieben, Kanji ueber JMdict-Woerterbuch mit Einzelzeichen-Fallback, siehe data/JAPANISCH_AUSSPRACHE_LIZENZ.md)',
  koreanisch: 'Koreanisches Hangul (wird automatisch umgeschrieben, angelehnt an ISO/TR 11941)',
  thai: 'Thailaendische Schrift (echter Silbenparser statt Zeichenkarte, siehe js/thaiSyllableTransliteration.js; Wortgrenzen ueber Woerterliste, siehe data/THAI_WORTLISTE_LIZENZ.md; bekannte Grenzen: lexikalische Sanskrit-/Pali-Lehnwort-Ausnahmen und mehrdeutige Silbentrennung ohne Woerterbuch, siehe Moduldoku)',
  birmanisch: 'Birmanische Schrift (wird automatisch umgeschrieben, vereinfachte lesbare Naeherung ohne Tonzeichen)',
  dzongkha: 'Tibetische Schrift/Dzongkha (wird nach Roman Dzongkha umgeschrieben, Naeherung - siehe Projektdokumentation zu bekannten Grenzen bei Praefixbuchstaben)',
  khmer: 'Khmer-Schrift (wird automatisch umgeschrieben, serie-abhaengige Vokal-Lesung, Naeherung ohne Woerterbuch bei Silbengrenzen)',
  koptisch: 'Koptische Schrift (wird automatisch umgeschrieben, bohairische Aussprache, inkl. Jenkim und Kontextregeln)',
  laotisch: 'Laotische Schrift (wird automatisch umgeschrieben, LC-Methode/Wiktionary-Algorithmus, silbenweise Zerlegung ohne Tonmarkierung)',
  dhivehi: 'Thaana-Schrift/Dhivehi (wird automatisch umgeschrieben, Vokale immer explizit geschrieben, daher keine Rate-Heuristik noetig)',
  andere: 'Andere Schriftsysteme (keine Umschrift hinterlegt)',
  tibetisch: 'Tibetische Schrift (Wörterbuch fuer bekannte Woerter mit echter Lhasa-Aussprache, algorithmischer Wylie-Fallback fuer alles andere - Schriftumschrift, KEINE Aussprache, siehe data/TIBETISCH_AUSSPRACHE_LIZENZ.md)',
};

export function schriftLabel(schrift) {
  return SCHRIFT_LABEL[schrift] || schrift;
}

/** Anzeigereihenfolge der Qualitätsstufen (für Gruppierung/Sortierung in der UI). */
export const QUALITAET_REIHENFOLGE = ['gruen', 'gelb', 'rot'];

const QUALITAET_LABEL = {
  gruen: '🟢 Präzise Umschrift (oder lateinische Schrift, keine nötig)',
  gelb: '🟡 Brauchbare Umschrift mit Einschränkungen',
  rot: '🔴 Lückenhafte Umschrift, hoher Textverlust möglich',
};

export function qualitaetLabel(qualitaet) {
  return QUALITAET_LABEL[qualitaet] || qualitaet;
}

export function findeSpracheNachCode(code) {
  return SPRACHEN.find((s) => s.code === code);
}

/** Schriftsysteme, für die eine automatische Romanisierung hinterlegt ist. */
export function hatRomanisierungsTabelle(schrift) {
  return [
    'kyrillisch',
    'griechisch',
    'geez',
    'arabisch',
    'armenisch',
    'georgisch',
    'hebraeisch',
    'indisch',
    'japanisch',
    'koreanisch',
    'thai',
    'birmanisch',
    'chinesisch',
    'dzongkha',
    'khmer',
    'koptisch',
    'laotisch',
    'dhivehi',
    'andere',
  ].includes(schrift);
}

/**
 * Ermittelt, ob für einen (ggf. unbekannten/freien) Sprachcode Romanisierung
 * angewendet werden sollte. Unbekannte Codes (z. B. frei eingetragene) werden
 * konservativ als "latein" behandelt (keine Romanisierung, aber der finale
 * ASCII-Sicherheitsnetz-Schritt greift ohnehin immer).
 */
export function romanisierungFuerCode(code) {
  const sprache = findeSpracheNachCode(code);
  if (!sprache) return false;
  return hatRomanisierungsTabelle(sprache.schrift);
}
