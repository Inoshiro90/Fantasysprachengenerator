/**
 * transliterationClient.js
 * Romanisierung (Transliteration) nicht-lateinischer Schriften. Eigene,
 * kleine Mapping-Tabellen statt einer externen Bibliothek (siehe SDLC 4.3)
 * - reduziert Abhängigkeiten und ist gut wartbar. Angelehnt an gängige
 * ISO/DIN-Normen (siehe Kommentare je Schrift), aber als vereinfachte,
 * rein ASCII-basierte Näherung, nicht als wissenschaftlich exakte
 * Transliteration mit Diakritika.
 *
 * Für den indischen Schriftenkreis (Konsonant+inhärenter-Vokal-Logik) und
 * Koreanisch (algorithmische Hangul-Zerlegung) reicht ein einfacher
 * Zeichen-für-Zeichen-Tausch nicht aus; diese werden in eigenen Modulen
 * bzw. Funktionen behandelt (siehe indicTransliteration.js weiter unten
 * importiert, sowie romanizeHangul()).
 */

import { hatIndischesSchema, transliteriereIndischeSchrift } from './indicTransliteration.js';
import { hatBirmanischesSchema, transliteriereBirmanisch } from './myanmarTransliteration.js';
import { hatDzongkhaSchema, transliteriereDzongkha } from './dzongkhaTransliteration.js';
import {
  hatTibetischesSchema,
  transliteriereTibetischMitWoerterbuch,
} from './tibetischTransliteration.js';
import { transliteriereJapanischMitWoerterbuch } from './japanischTransliteration.js';
import { hatKhmerSchema, transliteriereKhmerMitWortliste } from './khmerTransliteration.js';
import { hatKoptischesSchema, transliteriereKoptisch } from './copticTransliteration.js';
import { hatLaotischesSchema, transliteriereLaotisch } from './laoTransliteration.js';
import { hatDhivehiSchema, transliteriereDhivehi } from './dhivehiTransliteration.js';
import { CHINESISCH_PINYIN_MAP } from './chinesePinyin.js';
import { UIGURISCH_MAP, hatUigurischesSchema } from './uigurischTransliteration.js';
import { transliteriereChinesischMitWortliste } from './chineseWordSegmentation.js';
import { transliteriereThaiMitWortliste } from './thaiWordSegmentation.js';
import { transliteriereThailaendischSilbenweise } from './thaiSyllableTransliteration.js';

// --- Griechisch (angelehnt an DIN 31634 / ISO 843) ---
const GRIECHISCH_MAP = {
  'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i',
  'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x',
  'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y',
  'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
  'Α': 'A', 'Β': 'V', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'I',
  'Θ': 'Th', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X',
  'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F',
  'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'O',
  // Betonte Vokale (monotonischer Akzent, siehe Kommentar unten) sowie
  // Trema-Formen (Dialytika, z. B. bei "παϊδάκι"/"προϊόν" - zeigen an,
  // dass KEIN Diphthong vorliegt) - ohne diese Eintraege wuerde JEDES
  // mehrsilbige griechische Wort seinen Akzentvokal verlieren, da dieser
  // im finalen ASCII-Sicherheitsnetz sonst ersatzlos entfernt wird
  // (z. B. "σπίτι" -> "spti" statt "spiti").
  'ά': 'a', 'έ': 'e', 'ή': 'i', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o',
  'ϊ': 'i', 'ϋ': 'y', 'ΐ': 'i', 'ΰ': 'y',
  'Ά': 'A', 'Έ': 'E', 'Ή': 'I', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'Y', 'Ώ': 'O',
  'Ϊ': 'I', 'Ϋ': 'Y',
};

// Griechische Nasal+Verschlusslaut-Digraphe (μπ, ντ, γκ, γγ) sowie die
// Affrikaten τσ/τζ: in der modernen Aussprache steht jede dieser
// Buchstabenfolgen für EINEN zusammenhängenden Laut, nicht für die Summe
// ihrer Einzelbuchstaben. Eine reine Zeichen-für-Zeichen-Umschrift (wie
// bei GRIECHISCH_MAP oben) liefert daher z. B. für "μπαίνω" faelschlich
// "mpaino" statt "baino" (gesprochen /'beno/).
//
// Position im Wort entscheidet über die genaue Lautung:
//  - Wortanfang:  reiner stimmhafter Plosiv (μπ->b, ντ->d, γκ->g)
//  - Wortmitte:   pränasalierter Plosiv (μπ->mb, ντ->nd, γκ->ng)
//  - γγ kommt im Griechischen nie am Wortanfang vor -> immer "ng"
//  - τσ/τζ sind keine Nasal+Plosiv-Verbindungen, sondern Affrikaten -
//    ihre Lautung ist positionsunabhängig (ts/dz)
// Quelle: gängige Digraph-Konvention aus ELOT 743 / BGN-PCGN, ergänzt um
// die pränasalierte Wortmitte-Variante (in rein reversibler DIN-31634-
// Transliteration wird stattdessen "mp"/"nt"/"nk"/"ng" verwendet - hier
// bewusst die aussprachenähere Variante, da Ziel der Umschrift eine
// lesbare lateinische Näherung ist, keine reversible Transliteration).
const GRIECHISCH_DIGRAPHE = [
  { paar: 'μπ', anfang: 'b', mitte: 'mb' },
  { paar: 'ντ', anfang: 'd', mitte: 'nd' },
  { paar: 'γκ', anfang: 'g', mitte: 'ng' },
  { paar: 'γγ', anfang: 'ng', mitte: 'ng' },
  { paar: 'τσ', anfang: 'ts', mitte: 'ts' },
  { paar: 'τζ', anfang: 'dz', mitte: 'dz' },
];

// Griechische Buchstaben (Basisblock + polytonische Erweiterung) - alles
// andere (Leerzeichen, Satzzeichen, Zeilenanfang/-ende) gilt als
// Wortgrenze für die Anfang/Mitte-Entscheidung oben.
function istGriechischerBuchstabe(zeichen) {
  return zeichen !== undefined && /[\u0370-\u03FF\u1F00-\u1FFF]/.test(zeichen);
}

/** 'GROSS' bei ZWEI Grossbuchstaben (ΜΠ), 'Erst' bei nur dem ersten (Μπ), sonst 'klein'. */
function grossBuchstabenMuster(a, b) {
  const aGross = a !== a.toLowerCase() && a === a.toUpperCase();
  const bGross = b !== b.toLowerCase() && b === b.toUpperCase();
  if (aGross && bGross) return 'GROSS';
  if (aGross) return 'Erst';
  return 'klein';
}

function wendeGrossSchreibungAn(lautung, muster) {
  if (muster === 'GROSS') return lautung.toUpperCase();
  if (muster === 'Erst') return lautung.charAt(0).toUpperCase() + lautung.slice(1);
  return lautung;
}

/**
 * Transliteriert Griechisch und behandelt dabei VOR der zeichenweisen
 * Umschrift (GRIECHISCH_MAP) die oben dokumentierten Digraphe
 * positionsabhängig, inkl. Erhalt von Groß-/Kleinschreibung.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereGriechisch(text) {
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const naechstes = zeichen[i + 1];
    const zweiKlein = naechstes ? (zeichen[i] + naechstes).toLowerCase() : null;
    const digraph = zweiKlein ? GRIECHISCH_DIGRAPHE.find((d) => d.paar === zweiKlein) : null;

    if (digraph) {
      const amWortanfang = !istGriechischerBuchstabe(zeichen[i - 1]);
      const lautungKlein = amWortanfang && digraph.paar !== 'γγ' ? digraph.anfang : digraph.mitte;
      const muster = grossBuchstabenMuster(zeichen[i], naechstes);
      ergebnis += wendeGrossSchreibungAn(lautungKlein, muster);
      i += 2;
      continue;
    }

    const einzelzeichen = zeichen[i];
    ergebnis += Object.prototype.hasOwnProperty.call(GRIECHISCH_MAP, einzelzeichen)
      ? GRIECHISCH_MAP[einzelzeichen]
      : einzelzeichen;
    i += 1;
  }

  return ergebnis;
}

// --- Kyrillisch (angelehnt an DIN 1460 / ISO 9) ---
// Deckt Russisch, Ukrainisch, Bulgarisch, Mazedonisch, Belarussisch,
// Serbisch, Mongolisch, Kirgisisch, Tadschikisch, Kasachisch ab; enthält
// zusätzlich serbisch-/mongolisch-spezifische Buchstaben wie ђ, ј, љ, њ,
// ћ, џ, ө, ү.
const KYRILLISCH_MAP = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'jo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'ju', 'я': 'ja',
  'ђ': 'dj', 'ј': 'j', 'љ': 'lj', 'њ': 'nj', 'ћ': 'c', 'џ': 'dz',
  'ө': 'o', 'ү': 'u',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Jo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sht',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Ju', 'Я': 'Ja',
  'Ђ': 'Dj', 'Ј': 'J', 'Љ': 'Lj', 'Њ': 'Nj', 'Ћ': 'C', 'Џ': 'Dz',
  'Ө': 'O', 'Ү': 'U',
};

// --- Baschkirisch, Tatarisch, Tschuwaschisch: Kyrillisch-Zusatzbuchstaben ---
// Alle drei nutzen das russische Alphabet als Basis (siehe KYRILLISCH_MAP
// oben), erweitert um turk- bzw. wolgafinnisch-spezifische Buchstaben.
// Quelle: ALA-LC "Non-Slavic Languages in Cyrillic Script"-Tabelle. Deren
// Diakritika (z. B. Ә->Ă, Һ->Ḣ) werden hier - wie im Projekt ueblich (siehe
// ө/ү oben, dort schon auf "o"/"u" vereinfacht statt "ö"/"ü") - auf reine
// ASCII-Naeherungen reduziert statt wissenschaftlich exakt uebernommen.
//
// Eigene Tabellen statt gemeinsamer Erweiterung der KYRILLISCH_MAP, weil
// derselbe Buchstabe 'ҫ' (U+04AB) in beiden Sprachen vorkommt, aber
// unterschiedlich klingt: Baschkirisch /θ/ (wie engl. "th" in "think") vs.
// Tschuwaschisch /ɕ/ (weiches "sch") - eine gemeinsame Tabelle koennte nur
// einen der beiden Werte abbilden.
const BASCHKIRISCH_MAP = {
  ...KYRILLISCH_MAP,
  'ә': 'a', 'Ә': 'A',
  'ғ': 'gh', 'Ғ': 'Gh',
  'ҙ': 'dh', 'Ҙ': 'Dh',
  'ҡ': 'q', 'Ҡ': 'Q',
  'ң': 'ng', 'Ң': 'Ng',
  'ҫ': 'th', 'Ҫ': 'Th',
  'һ': 'h', 'Һ': 'H',
};

const TATARISCH_MAP = {
  ...KYRILLISCH_MAP,
  'ә': 'a', 'Ә': 'A',
  'җ': 'j', 'Җ': 'J',
  'ң': 'ng', 'Ң': 'Ng',
  'һ': 'h', 'Һ': 'H',
};

const TSCHUWASCHISCH_MAP = {
  ...KYRILLISCH_MAP,
  'ӑ': 'a', 'Ӑ': 'A',
  'ӗ': 'e', 'Ӗ': 'E',
  'ҫ': 'sh', 'Ҫ': 'Sh',
  'ӳ': 'u', 'Ӳ': 'U',
  'ӱ': 'u', 'Ӱ': 'U',
};

// --- Amharisch / Tigrinya (Ge'ez-Schrift) ---
// Kein ISO/DIN-Standard in der Liste des Nutzers, daher eine vereinfachte
// Näherung - aber, anders als frueher, ueber die VOLLSTAENDIGEN 7
// "Ordnungen" (Vokalformen) jedes Konsonanten, nicht nur die 1. Ordnung.
//
// Ge'ez ist eine Abugida: jedes der ~33 Basiszeichen unten hat sechs
// weitere Formen fuer die Vokale u/i/a/e/(reduziertes i)/o - im Unicode-
// Block liegen diese sechs Formen IMMER als die 6 direkt folgenden
// Codepoints nach dem Basiszeichen (Ordnung 1), z. B. ለ (la, U+1208) ->
// ሉ,ሊ,ላ,ሌ,ል,ሎ (U+1209..U+120E). Das ist kein Zufall, sondern die
// durchgaengige Unicode-Kodierungsordnung des gesamten Ethiopic-Blocks
// (verifiziert fuer alle 33 Familien unten) - die Tabelle wird daher NICHT
// von Hand fuer jedes einzelne Zeichen gepflegt, sondern algorithmisch aus
// den 33 Konsonanten-Basiswerten abgeleitet (Konsonant + Vokal-Suffix pro
// Ordnung: 2.=u, 3.=i, 4.=a, 5.=ee [langes e, per Doppelvokal von der 1.
// Ordnung unterschieden], 6.=i [reduzierter/"6.-Ordnung"-Vokal ɨ, ohne
// eigenen ASCII-Buchstaben - kollidiert dadurch mit der 3. Ordnung, siehe
// unten], 7.=o). Bei አ/ዐ (reiner Vokaltraeger ohne Konsonant) ist der
// "Konsonant"-Teil leer, es bleibt nur der Vokal je Ordnung.
//
// Bekannte, bewusst in Kauf genommene Näherungen (halten diese Sprache auf
// 'gelb' statt 'gruen', siehe languages.js):
//  - 6. Ordnung (reduziertes ɨ) wird als "i" ausgegeben und ist daher
//    vom ASCII-Ergebnis nicht von der 3. Ordnung (volles i) unterscheidbar
//    (z. B. ም "mi" [6. Ordnung] vs. ሚ "mi" [3. Ordnung]) - beides ist
//    aber besser als der vorherige Zustand, in dem die 6. Ordnung
//    komplett fehlte und stattdessen vom ASCII-Sicherheitsnetz
//    (asciiSanitizer.js) verschluckt wurde. Ohne einen weiteren
//    ASCII-Buchstaben (das Projekt nutzt bewusst keine Grossbuchstaben-
//    oder Diakritika-Kodierung) ist diese Kollision nicht auflösbar.
//  - Historisch unterschiedene, in der modernen Aussprache aber
//    zusammengefallene Konsonanten (ሀ/ሐ/ኀ/ኸ ≈ h; ሠ/ሰ ≈ s; አ/ዐ ≈ Knacklaut;
//    ጸ/ፀ ≈ ts) werden - wie schon vor diesem Fix - auf dieselbe oder eine
//    sehr aehnliche lateinische Lesung abgebildet.
//  - Im modernen Amharisch fuer Lehnwoerter ergaenzte Zeichen wie ቨ (va,
//    fuer Fremdwoerter mit V-Laut) sind nicht Teil dieser Tabelle.
//  - Weitere Tigrinya-spezifische Zusatzfamilien (z. B. ejektive
//    Konsonanten ausserhalb der unten ergaenzten ቐ-Familie) sind nicht
//    abgedeckt - fuer den haeufigsten Fall wurde jedoch nachgebessert.
const AMHARISCH_MAP = {
  'ሀ': 'ha', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'hee', 'ህ': 'hi', 'ሆ': 'ho',
  'ለ': 'le', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'lee', 'ል': 'li', 'ሎ': 'lo',
  'ሐ': 'he', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'hee', 'ሕ': 'hi', 'ሖ': 'ho',
  'መ': 'me', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'mee', 'ም': 'mi', 'ሞ': 'mo',
  'ሠ': 'se', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa', 'ሤ': 'see', 'ሥ': 'si', 'ሦ': 'so',
  'ረ': 're', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 'ree', 'ር': 'ri', 'ሮ': 'ro',
  'ሰ': 'se', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'see', 'ስ': 'si', 'ሶ': 'so',
  'ሸ': 'she', 'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'shee', 'ሽ': 'shi', 'ሾ': 'sho',
  'ቀ': 'qe', 'ቁ': 'qu', 'ቂ': 'qi', 'ቃ': 'qa', 'ቄ': 'qee', 'ቅ': 'qi', 'ቆ': 'qo',
  'በ': 'be', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'bee', 'ብ': 'bi', 'ቦ': 'bo',
  'ተ': 'te', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'tee', 'ት': 'ti', 'ቶ': 'to',
  'ቸ': 'che', 'ቹ': 'chu', 'ቺ': 'chi', 'ቻ': 'cha', 'ቼ': 'chee', 'ች': 'chi', 'ቾ': 'cho',
  'ኀ': 'khe', 'ኁ': 'khu', 'ኂ': 'khi', 'ኃ': 'kha', 'ኄ': 'khee', 'ኅ': 'khi', 'ኆ': 'kho',
  'ነ': 'ne', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'nee', 'ን': 'ni', 'ኖ': 'no',
  'ኘ': 'nye', 'ኙ': 'nyu', 'ኚ': 'nyi', 'ኛ': 'nya', 'ኜ': 'nyee', 'ኝ': 'nyi', 'ኞ': 'nyo',
  'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'ee', 'እ': 'i', 'ኦ': 'o',
  'ከ': 'ke', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'kee', 'ክ': 'ki', 'ኮ': 'ko',
  'ኸ': 'khe', 'ኹ': 'khu', 'ኺ': 'khi', 'ኻ': 'kha', 'ኼ': 'khee', 'ኽ': 'khi', 'ኾ': 'kho',
  'ወ': 'we', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'wee', 'ው': 'wi', 'ዎ': 'wo',
  'ዐ': 'a', 'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'ee', 'ዕ': 'i', 'ዖ': 'o',
  'ዘ': 'ze', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'zee', 'ዝ': 'zi', 'ዞ': 'zo',
  'ዠ': 'zhe', 'ዡ': 'zhu', 'ዢ': 'zhi', 'ዣ': 'zha', 'ዤ': 'zhee', 'ዥ': 'zhi', 'ዦ': 'zho',
  'የ': 'ye', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'yee', 'ይ': 'yi', 'ዮ': 'yo',
  'ደ': 'de', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'dee', 'ድ': 'di', 'ዶ': 'do',
  'ጀ': 'je', 'ጁ': 'ju', 'ጂ': 'ji', 'ጃ': 'ja', 'ጄ': 'jee', 'ጅ': 'ji', 'ጆ': 'jo',
  'ገ': 'ge', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'gee', 'ግ': 'gi', 'ጎ': 'go',
  'ጠ': 'te', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'tee', 'ጥ': 'ti', 'ጦ': 'to',
  'ጨ': 'che', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha', 'ጬ': 'chee', 'ጭ': 'chi', 'ጮ': 'cho',
  'ጰ': 'pe', 'ጱ': 'pu', 'ጲ': 'pi', 'ጳ': 'pa', 'ጴ': 'pee', 'ጵ': 'pi', 'ጶ': 'po',
  'ጸ': 'tse', 'ጹ': 'tsu', 'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tsee', 'ጽ': 'tsi', 'ጾ': 'tso',
  'ፀ': 'tse', 'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tsee', 'ፅ': 'tsi', 'ፆ': 'tso',
  'ፈ': 'fe', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fee', 'ፍ': 'fi', 'ፎ': 'fo',
  'ፐ': 'pe', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pee', 'ፕ': 'pi', 'ፖ': 'po',

  // 8. ("labialisierte") Zusatzform: liegt bei 31 der 33 Familien exakt
  // 7 Codepoints hinter der jeweiligen Basisform (verifiziert; nur ኸ und
  // ዐ haben dort keinen zugewiesenen Codepoint und bleiben daher aus).
  // Phonetisch ein gerundeter/labialisierter Konsonant ("Cʷa"), hier wie
  // im Fliesstext ueblich als Konsonant+"wa" umschrieben.
  'ሇ': 'hwa', 'ሏ': 'lwa', 'ሗ': 'hwa', 'ሟ': 'mwa', 'ሧ': 'swa', 'ሯ': 'rwa',
  'ሷ': 'swa', 'ሿ': 'shwa', 'ቇ': 'qwa', 'ቧ': 'bwa', 'ቷ': 'twa', 'ቿ': 'chwa',
  'ኇ': 'khwa', 'ኗ': 'nwa', 'ኟ': 'nywa', 'ኧ': 'wa', 'ኯ': 'kwa', 'ዏ': 'wwa',
  'ዟ': 'zwa', 'ዧ': 'zhwa', 'ዯ': 'ywa', 'ዷ': 'dwa', 'ጇ': 'jwa', 'ጏ': 'gwa',
  'ጧ': 'twa', 'ጯ': 'chwa', 'ጷ': 'pwa', 'ጿ': 'tswa', 'ፇ': 'tswa', 'ፏ': 'fwa',
  'ፗ': 'pwa',

  // Tigrinya-spezifische Zusatzfamilie: ቐ (qha, ejektiver Knacklaut,
  // im Amharischen mit ቀ zusammengefallen, im Tigrinya aber als eigener
  // Laut erhalten) - gleiches 7-Ordnungs-Schema, algorithmisch abgeleitet
  // wie oben. Deckt einen der haeufigsten Tigrinya-spezifischen Buchstaben
  // ab, der zuvor komplett fehlte (siehe Analyse zu verbleibenden gelben
  // Sprachen).
  'ቐ': 'qhe', 'ቑ': 'qhu', 'ቒ': 'qhi', 'ቓ': 'qha', 'ቔ': 'qhee', 'ቕ': 'qhi', 'ቖ': 'qho',
  // Achtung: die einzelne labialisierte Zusatzform liegt bei dieser
  // Familie AUSNAHMSWEISE nicht bei Offset +7 (0x1257 ist nicht vergeben),
  // sondern bei +8 (0x1258) - von Hand nachgeschlagen statt algorithmisch
  // abgeleitet, da diese Familie nicht dem sonst durchgaengigen Muster folgt.
  'ቘ': 'qhwa',

  // Separate, vollstaendigere labialisierte Fuenf-Formen-Unterreihe
  // (wa/wi/waa/wee/we - "wu" und "wo" existieren hier nicht, da doppelte
  // Rundung phonetisch ausfaellt) fuer die vier "velaren" Familien
  // ka/qa/ga/qha, jeweils DIREKT im Anschluss an die eigene 8-Zeichen-
  // Familie codiert (z. B. ga: 0x1308-0x130F Grundfamilie, 0x1310-0x1317
  // gwa-Unterreihe) - haeufiger in echtem Text als die einzelne 8.
  // Zusatzform oben und daher separat ergaenzt, nicht nur die Einzelform.
  'ኰ': 'kwa', 'ኲ': 'kwi', 'ኳ': 'kwaa', 'ኴ': 'kwee', 'ኵ': 'kwe',
  'ቈ': 'qwa', 'ቊ': 'qwi', 'ቋ': 'qwaa', 'ቌ': 'qwee', 'ቍ': 'qwe',
  'ጐ': 'gwa', 'ጒ': 'gwi', 'ጓ': 'gwaa', 'ጔ': 'gwee', 'ጕ': 'gwe',
  'ቚ': 'qhwi', 'ቛ': 'qhwaa', 'ቜ': 'qhwee', 'ቝ': 'qhwe',
};

// --- Arabisch (angelehnt an DIN 31635 / ISO 233) ---
// Deckt zusätzlich die um Persisch/Urdu/Paschtu/Kurdisch-Sorani
// erweiterten Buchstaben ab (پ, چ, ژ, گ, ٹ, ڈ, ڑ, ں, ے, ہ, ھ, ې, ړ, ږ,
// ښ, ڼ, ۍ, ۆ, ێ, ە), da diese Schriften auf dem arabischen Alphabet
// aufbauen.
//
// WICHTIG: Arabisch ist (anders als Griechisch/Kyrillisch/Armenisch/...)
// ein Abdschad - Kurzvokale (Fatha/Kasra/Damma, die "Harakat") werden im
// normalen Schriftbild so gut wie nie geschrieben, auch nicht im Output
// von Übersetzungs-APIs. Eine reine Zeichen-für-Zeichen-Tabelle wie bei
// den anderen Schriften würde daher fast nur Konsonanten liefern
// ("ktb" statt "kataba"). Deshalb kommt hier - analog zur
// Konsonant+Vokal-Logik in indicTransliteration.js, nur mit anderen
// Regeln - ein kleiner Algorithmus zum Einsatz (siehe
// transliteriereArabisch() weiter unten):
//  - Sind Harakat/Sukun im Text vorhanden, werden sie wie bisher exakt
//    übernommen.
//  - و/ي werden kontextabhängig als Konsonant (w/y) oder als
//    Langvokal-Buchstabe (uu/ii) gelesen, statt immer als Konsonant.
//  - Shadda verdoppelt den betroffenen Konsonanten, statt verworfen zu
//    werden.
//  - Fehlt jede Kurzvokal-Information (der Normalfall), wird nach jedem
//    Konsonanten ein Standardvokal ("a", der häufigste arabische
//    Kurzvokal) ergänzt. Das ist linguistisch geraten, liefert aber eine
//    aussprechbare, vokalreiche Näherung statt eines reinen
//    Konsonantenskeletts - passend zum Anspruch dieser Datei als
//    "lesbare Näherung, keine wissenschaftlich exakte Transliteration".

// "Echte" Konsonanten, die eine Vokal-Ergänzung brauchen (alles außer den
// Langvokal-Buchstaben ا/ى/ة und den Hamza-Trägerformen, die bereits
// einen Vokal/Knacklaut kodieren).
const ARABISCH_KONSONANTEN = {
  'ء': "'", 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'ه': 'h',
  // Persisch/Urdu/Paschtu/Kurdisch-Sorani-Erweiterungen (Konsonanten)
  'پ': 'p', 'چ': 'ch', 'ژ': 'zh', 'گ': 'g',
  'ٹ': 't', 'ڈ': 'd', 'ڑ': 'r', 'ں': 'n', 'ہ': 'h', 'ھ': 'h',
  'ړ': 'r', 'ږ': 'zh', 'ښ': 'kh', 'ڼ': 'n',
  // Persisch/Urdu verwenden eigene Glyphvarianten statt der arabischen
  // ك/ي: ک (Farsi Keheh, U+06A9) statt ك, siehe ARABISCH_HALBVOKALE für ی.
  'ک': 'k',
  // Sindhi-Erweiterungen (implosive/aspirierte Zusatzbuchstaben, siehe
  // ALA-LC "Sindhi in Arabic script"-Tabelle). Anders als bei den oben
  // schon vorhandenen Persisch/Urdu/Paschtu-Erweiterungen gibt es fuer
  // Sindhi (Stand jetzt) KEIN Aussprache-Woerterbuch in diesem Projekt -
  // die Kurzvokale werden daher ausschliesslich ueber die allgemeine
  // Standardvokal-Heuristik geraten (siehe transliteriereArabisch()
  // unten), nicht ueber echte IPA-Ausspracheangaben wie bei Urdu/Paschtu/
  // Farsi/Sorani. Deshalb ist Sindhi in languages.js auf 'gelb' statt
  // 'gruen' eingestuft. Mehrere historisch/phonetisch unterschiedene
  // Implosiv-/Aspirations-Varianten werden bewusst auf dieselbe oder eine
  // sehr aehnliche lateinische Lesung abgebildet (gleiche Art
  // Vereinfachung wie bei den Ge'ez-Konsonanten in AMHARISCH_MAP oben).
  'ٻ': 'b', 'ڀ': 'bh', 'ٺ': 'th', 'ٿ': 'th', 'ڦ': 'ph',
  'ڄ': 'j', 'ڃ': 'ny', 'ڇ': 'chh',
  'ډ': 'd', 'ڊ': 'd', 'ڌ': 'dh', 'ڏ': 'd', 'ڍ': 'dh',
  'ڳ': 'g', 'ڱ': 'ng', 'ڪ': 'k', 'ڻ': 'n',
};

// و und ي (bzw. deren persisch/urdu-Variante ی, Farsi Yeh U+06CC):
// Doppelfunktion. Als Konsonant (Halbvokal) w/y, siehe
// ARABISCH_LANGVOKAL_FUELLUNG für ihre alternative Rolle als Langvokal.
const ARABISCH_HALBVOKALE = { 'و': 'w', 'ي': 'y', 'ی': 'y' };

// Werte, falls و/ي/ی als Langvokal (nicht als Konsonant) gelesen werden.
const ARABISCH_LANGVOKAL_FUELLUNG = { 'و': 'uu', 'ي': 'ii', 'ی': 'ii' };

// Reine Langvokal-/Vokalbuchstaben ohne Konsonantfunktion.
const ARABISCH_LANGVOKALE = {
  'ا': 'a', 'ى': 'aa', 'ة': 'a',
  // Hochgestelltes Alif (U+0670, "Dagger Alif") - seltene, aber feste
  // Rechtschreibkonvention für ein langes /aː/, das nicht mit einem
  // regulären ا geschrieben wird (bekanntestes Beispiel: اللّٰه, "Allah").
  // Kommt in den BAMA-Morphologiedaten vor (siehe arabischStaemmeVoll.json).
  '\u0670': 'a',
  // Persisch/Urdu/Paschtu/Kurdisch-Sorani-Erweiterungen (Vokalbuchstaben)
  'ے': 'e', 'ې': 'e', 'ۍ': 'ey', 'ۆ': 'o', 'ێ': 'e', 'ە': 'e',
};

// Hamza-Trägerformen, die bereits einen Vokal bzw. Knacklaut kodieren.
const ARABISCH_HAMZA_VOKALE = {
  'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ئ': "'", 'ؤ': "'",
};

// Kurze Vokalzeichen (Harakat) - werden übernommen, sofern vorhanden.
const ARABISCH_HARAKAT = {
  '\u064E': 'a', '\u0650': 'i', '\u064F': 'u',
  '\u064B': 'an', '\u064D': 'in', '\u064C': 'un',
};
const ARABISCH_SUKUN = '\u0652'; // Vokal-Unterdrückung (kein Vokal)
const ARABISCH_SHADDA = '\u0651'; // Gemination (Konsonant verdoppeln)
const ARABISCH_TATWEEL = '\u0640'; // Streckzeichen, rein optisch, kein Laut
const ARABISCH_STANDARDVOKAL = 'a'; // Lückenfüller ohne Diakritika

// Arabisch-indische Ziffern
const ARABISCH_ZIFFERN = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

const ARABISCH_SPRACHCODES = new Set(['ar-SA', 'fa-IR', 'ur-PK', 'ps-PK', 'ckb-IQ', 'sd-PK']);

/** Ob für einen Sprachcode die arabische Schrift-Umschrift zuständig ist. */
export function hatArabischesSchema(code) {
  return ARABISCH_SPRACHCODES.has(code);
}

// --- Morphologische Segmentierung (Phase 2, aus BAMA 1.0 / LDC2002L49,
// GPLv2, per tools/generate-arabic-morphology.mjs offline erzeugt) ---
//
// Phase 1 (siehe Git-Historie / generate-arabic-stem-dictionary.mjs) prüfte
// nur, ob ein ganzes Wort direkt ein BAMA-Stamm ist, plus eine feste,
// selbst erfundene Liste gängiger Klitika-Präfixe. Phase 2 ersetzt das
// durch eine ECHTE Präfix+Stamm+Suffix-Segmentierung mit den originalen
// BAMA-Lexika UND den drei Kompatibilitätstabellen (welche Präfix-
// Kategorie zu welcher Stamm-Kategorie passt usw.) - das deckt beliebige
// (bekannte) Flexionsformen ab, nicht nur eine Handvoll Konjunktionen/
// Präpositionen, und vermeidet unsinnige Kombinationen (z. B. ein
// Verbal-Suffix an einem Nomen-Stamm).
//
// Bewusst NICHT vorab kombiniert (siehe ausführliche Begründung in
// tools/generate-arabic-morphology.mjs) - die vier JSON-Dateien enthalten
// nur die Lexika + Kompatibilitätstabellen, die eigentliche Segmentierung
// eines konkreten Eingabewortes läuft hier zur Laufzeit (reine
// Objekt-Lookups, siehe segmentiereUndVokalisiere()).
const ARABISCHE_MORPHOLOGIE_URLS = {
  praefixe: new URL('../data/arabischPraefixe.json', import.meta.url).href,
  suffixe: new URL('../data/arabischSuffixe.json', import.meta.url).href,
  staemme: new URL('../data/arabischStaemmeVoll.json', import.meta.url).href,
  kompatibilitaet: new URL('../data/arabischKompatibilitaet.json', import.meta.url).href,
};

let arabischeMorphologiePromise = null;

async function ladeJson(url) {
  const antwort = await fetch(url);
  if (!antwort.ok) {
    throw new Error(`HTTP ${antwort.status} bei ${url}`);
  }
  return antwort.json();
}

/**
 * Lädt (einmalig, gecached) die vier BAMA-Morphologie-Dateien parallel und
 * bereitet sie für die Segmentierung auf (Kompatibilitätstabellen als
 * Sets für O(1)-Prüfung, längste Präfix-/Suffix-Schlüssellänge zur
 * Suchraum-Eingrenzung). Schlägt das Laden fehl (offline, Datei fehlt),
 * wird `null` geliefert - die Transliteration fällt dann transparent auf
 * die Standardvokal-Heuristik zurück (siehe Moduldoku oben).
 * @returns {Promise<object | null>}
 */
function ladeArabischeMorphologie() {
  if (!arabischeMorphologiePromise) {
    arabischeMorphologiePromise = Promise.all([
      ladeJson(ARABISCHE_MORPHOLOGIE_URLS.praefixe),
      ladeJson(ARABISCHE_MORPHOLOGIE_URLS.suffixe),
      ladeJson(ARABISCHE_MORPHOLOGIE_URLS.staemme),
      ladeJson(ARABISCHE_MORPHOLOGIE_URLS.kompatibilitaet),
    ])
      .then(([praefixeDaten, suffixeDaten, staemmeDaten, kompatDaten]) => {
        const praefixe = praefixeDaten.eintraege ?? {};
        const suffixe = suffixeDaten.eintraege ?? {};

        const maxPraefixLaenge = Object.keys(praefixe).reduce(
          (max, schluessel) => Math.max(max, schluessel.length),
          0,
        );
        const maxSuffixLaenge = Object.keys(suffixe).reduce(
          (max, schluessel) => Math.max(max, schluessel.length),
          0,
        );

        return {
          praefixe,
          suffixe,
          staemme: staemmeDaten.eintraege ?? {},
          ab: new Set(kompatDaten.ab ?? []),
          bc: new Set(kompatDaten.bc ?? []),
          ac: new Set(kompatDaten.ac ?? []),
          maxPraefixLaenge,
          maxSuffixLaenge,
        };
      })
      .catch((fehler) => {
        console.warn(
          'Arabische Morphologiedaten konnten nicht geladen werden, ' +
            'nutze nur die Standardvokal-Heuristik:',
          fehler,
        );
        return null;
      });
  }
  return arabischeMorphologiePromise;
}

/**
 * Zerlegt ein arabisches Wort in Präfix+Stamm+Suffix nach dem
 * BAMA-1.0-Verfahren: probiert alle Schnittpunkte durch, prüft für jede
 * Kombination gefundener Lexikoneinträge die drei Kompatibilitätstabellen
 * (Präfix-Stamm, Stamm-Suffix, Präfix-Suffix) und gibt bei Erfolg die
 * vokalisierte Form zurück (reines Arabisch inkl. Harakat, NICHT
 * transliteriert - das übernimmt transliteriereArabisch() im Anschluss).
 *
 * Disambiguierung bei mehreren gültigen Lesarten (kurze Wörter ohne
 * Kontext sind grundsätzlich mehrdeutig, siehe Erläuterung ganz oben in
 * dieser Datei): die Lesart mit der geringsten Gesamt-Affixlänge gewinnt
 * (bevorzugt also den reinen Stamm ohne Präfix/Suffix, falls gültig, vor
 * unnötig komplexen Zerlegungen) - keine echte statistische/syntaktische
 * Disambiguierung wie im vollen Mishkal/BAMA-Werkzeug.
 * @returns {string | null}
 */
function segmentiereUndVokalisiere(wort, morphologie) {
  let besteLoesung = null;
  let besteAffixLaenge = Infinity;

  const maxI = Math.min(wort.length, morphologie.maxPraefixLaenge);

  for (let i = 0; i <= maxI; i += 1) {
    const praefixEintraege = morphologie.praefixe[wort.slice(0, i)];
    if (!praefixEintraege) continue;

    const maxJ = Math.min(wort.length - i, morphologie.maxSuffixLaenge);

    for (let j = 0; j <= maxJ; j += 1) {
      const stammLaenge = wort.length - i - j;
      if (stammLaenge < 1) continue;

      const stammSchluessel = wort.slice(i, i + stammLaenge);
      const stammEintraege = morphologie.staemme[stammSchluessel];
      if (!stammEintraege) continue;

      const suffixSchluessel = wort.slice(i + stammLaenge);
      const suffixEintraege = morphologie.suffixe[suffixSchluessel];
      if (!suffixEintraege) continue;

      // Affixlänge dieses Schnittpunkts ist bereits schlechter als die
      // aktuell beste Lösung -> Kombinationsprüfung kann sich sparen.
      if (i + j >= besteAffixLaenge) continue;

      fuerJedeKombination: for (const p of praefixEintraege) {
        for (const s of stammEintraege) {
          if (!morphologie.ab.has(`${p.c}|${s.c}`)) continue;
          for (const suf of suffixEintraege) {
            if (!morphologie.bc.has(`${s.c}|${suf.c}`)) continue;
            if (!morphologie.ac.has(`${p.c}|${suf.c}`)) continue;

            besteLoesung = p.v + s.v + suf.v;
            besteAffixLaenge = i + j;
            continue fuerJedeKombination;
          }
        }
      }
    }
  }

  return besteLoesung;
}

// Tokenisierung: zusammenhängende arabische Schriftzeichen als "Wort"
// erkennen. WICHTIG: \p{Script=Arabic} allein reicht nicht - Harakat/
// Shadda/Sukun (U+064B-U+0652) und das hochgestellte Alif (U+0670) haben
// die Unicode-Skripteigenschaft "Common"/"Inherited", nicht "Arabic", und
// würden das Wort an jedem Diakritikum fälschlich in Einzelbuchstaben
// zerreißen (z. B. "كَتَبَ" -> "ك","ت","ب" statt einem Wort). Deshalb wird
// dieser Bereich explizit mit aufgenommen.
const ARABISCHES_WORT_REGEX = /[\p{Script=Arabic}\u064B-\u0670]+/gu;

/**
 * Transliteriert arabische Schrift und nutzt dafür VOR der
 * Standardvokal-Heuristik die BAMA-1.0-Morphologiedaten (siehe
 * ladeArabischeMorphologie()): Wörter, die sich dort in Präfix+Stamm+
 * Suffix zerlegen lassen (segmentiereUndVokalisiere()), bekommen ihre
 * echte lexikalische Vokalisierung statt der geratenen Standardvokal-
 * Näherung. Fällt bei fehlendem Treffer oder falls die Morphologiedaten
 * nicht geladen werden konnten transparent auf transliteriereArabisch()
 * zurück.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereArabischMitWoerterbuch(text) {
  const morphologie = await ladeArabischeMorphologie();

  const angereichertesText = morphologie
    ? text.replace(ARABISCHES_WORT_REGEX, (wort) => segmentiereUndVokalisiere(wort, morphologie) ?? wort)
    : text;

  return transliteriereArabisch(angereichertesText);
}

// --- Farsi: Aussprache-Wörterbuch (siehe data/FARSI_AUSSPRACHE_LIZENZ.md) ---
// Anders als bei Arabisch (BAMA liefert eine VOKALISIERTE arabische
// Zwischenform) liefert diese aus WikiPron/Wiktionary gewonnene Liste
// direkt die fertige LATEINISCHE Lesung pro Wort (aus echten IPA-
// Ausspracheangaben, nicht geraten) - sinnvoll, weil das Neupersische so
// gut wie nie Kurzvokalzeichen schreibt und ein Vokalisierungs-
// Wörterbuch nach Hebräisch-Vorbild hier mangels vokalisierter
// Quelltexte nicht funktionieren würde (siehe Lizenzdatei).
const FARSI_AUSSPRACHE_URL = new URL('../data/farsiAussprache.json', import.meta.url).href;
let farsiAusspracheePromise = null;

// Längste im Wörterbuch vorkommende Mehrwort-Phrase (siehe
// data/farsiAussprache.json, Stand: 6 Wörter) - begrenzt die Suchtiefe in
// transliteriereFarsiMitAussprache() unten.
const FARSI_PHRASE_MAX_WOERTER = 6;

function ladeFarsiAussprache() {
  if (!farsiAusspracheePromise) {
    farsiAusspracheePromise = fetch(FARSI_AUSSPRACHE_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => new Map(Object.entries(daten.woerter ?? {})))
      .catch((fehler) => {
        console.warn(
          'Farsi-Aussprachewörterbuch konnte nicht geladen werden, nutze nur ' +
            'die allgemeine arabische Standardvokal-Heuristik:',
          fehler,
        );
        return null;
      });
  }
  return farsiAusspracheePromise;
}

/**
 * Ersetzt vor der eigentlichen Umschrift jedes im Farsi-
 * Aussprachewörterbuch gefundene Wort ODER MEHRWORT-PHRASE (z. B.
 * "ایالات متحده" für "Vereinigte Staaten", per Leerzeichen getrennt) durch
 * die dort bereits fertige lateinische Lesung. Geprüft wird von der
 * längsten möglichen Wortfolge (siehe FARSI_PHRASE_MAX_WOERTER) absteigend
 * bis zum Einzelwort - ohne diese Mehrwort-Suche wären ca. 18 % der
 * Wörterbucheinträge (reine Phrasen ohne Einzelwort-Eintrag) nie
 * erreichbar, da eine einfache Wort-für-Wort-Ersetzung an den
 * Leerzeichen innerhalb der Phrase aufsplittet.
 * Die dabei eingesetzten lateinischen Buchstaben werden von
 * transliteriereArabisch() unten unverändert durchgereicht (sie passen zu
 * keiner der dort geprüften arabischen Zeichen-Kategorien), landen also
 * 1:1 im Ergebnis. Wörter/Phrasen ohne Treffer durchlaufen wie bisher
 * transliteriereArabischMitWoerterbuch() (BAMA-Arabisch-Fallback, dann
 * Standardvokal-Heuristik) - reine Verbesserung, keine Regression.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereFarsiMitAussprache(text) {
  const woerterbuch = await ladeFarsiAussprache();
  if (!woerterbuch) {
    return transliteriereArabischMitWoerterbuch(text);
  }

  // Alle arabischschriftlichen Wort-Vorkommen mit Position sammeln.
  const treffer = [...text.matchAll(ARABISCHES_WORT_REGEX)];

  let angereicherterText = '';
  let textPosition = 0;
  let i = 0;
  while (i < treffer.length) {
    // Von der längsten moeglichen Wortfolge (ab aktueller Position)
    // absteigend die längste Phrase suchen, bei der aufeinanderfolgende
    // Wort-Treffer jeweils durch GENAU EIN Leerzeichen getrennt sind
    // (nur dann bilden sie im Originaltext eine zusammenhaengende Phrase).
    let phrasenLaenge = 1;
    for (let versuch = Math.min(FARSI_PHRASE_MAX_WOERTER, treffer.length - i); versuch >= 1; versuch -= 1) {
      let zusammenhaengend = true;
      for (let j = 0; j < versuch - 1; j += 1) {
        const luecke = text.slice(treffer[i + j].index + treffer[i + j][0].length, treffer[i + j + 1].index);
        if (luecke !== ' ') {
          zusammenhaengend = false;
          break;
        }
      }
      if (!zusammenhaengend) continue;
      const phrase = treffer
        .slice(i, i + versuch)
        .map((t) => t[0])
        .join(' ');
      if (woerterbuch.has(phrase)) {
        phrasenLaenge = versuch;
        angereicherterText += text.slice(textPosition, treffer[i].index) + woerterbuch.get(phrase);
        textPosition = treffer[i + versuch - 1].index + treffer[i + versuch - 1][0].length;
        break;
      }
      phrasenLaenge = 1;
    }
    if (phrasenLaenge === 1 && textPosition <= treffer[i].index) {
      // Kein Mehrwort-Treffer: einzelnes Wort pruefen, sonst unveraendert
      // lassen (greift spaeter die allgemeine Arabisch-Heuristik).
      const wort = treffer[i][0];
      angereicherterText += text.slice(textPosition, treffer[i].index) + (woerterbuch.get(wort) ?? wort);
      textPosition = treffer[i].index + wort.length;
    }
    i += phrasenLaenge;
  }
  angereicherterText += text.slice(textPosition);

  return transliteriereArabischMitWoerterbuch(angereicherterText);
}


// --- Urdu: Aussprache-Wörterbuch (siehe data/URDU_AUSSPRACHE_LIZENZ.md) ---
// Gleicher Ansatz wie beim Farsi-Aussprachewörterbuch oben (siehe
// Kommentar dort) - liefert direkt die fertige lateinische Lesung pro
// Wort aus echten IPA-Ausspracheangaben (WikiPron/Wiktionary), statt sie
// über die allgemeine arabische Kurzvokal-Heuristik zu erraten.
const URDU_AUSSPRACHE_URL = new URL('../data/urduAussprache.json', import.meta.url).href;
let urduAusspracheePromise = null;

function ladeUrduAussprache() {
  if (!urduAusspracheePromise) {
    urduAusspracheePromise = fetch(URDU_AUSSPRACHE_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => new Map(Object.entries(daten.woerter ?? {})))
      .catch((fehler) => {
        console.warn(
          'Urdu-Aussprachewörterbuch konnte nicht geladen werden, nutze nur ' +
            'die allgemeine arabische Standardvokal-Heuristik:',
          fehler,
        );
        return null;
      });
  }
  return urduAusspracheePromise;
}

/**
 * Ersetzt vor der eigentlichen Umschrift jedes im Urdu-Aussprachewörterbuch
 * gefundene Wort durch die dort bereits fertige lateinische Lesung (siehe
 * transliteriereFarsiMitAussprache() oben für die identische Farsi-Logik).
 * Das Urdu-Wörterbuch enthält (Stand Erstellung) keine Mehrwort-Phrasen,
 * daher reicht hier - anders als bei Farsi - eine einfache
 * Einzelwort-Ersetzung ohne Phrasensuche.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereUrduMitAussprache(text) {
  const woerterbuch = await ladeUrduAussprache();
  if (!woerterbuch) {
    return transliteriereArabischMitWoerterbuch(text);
  }

  const angereichertesText = text.replace(
    ARABISCHES_WORT_REGEX,
    (wort) => woerterbuch.get(wort) ?? wort,
  );

  return transliteriereArabischMitWoerterbuch(angereichertesText);
}

// --- Paschtu: Aussprache-Wörterbuch (siehe data/PASHTO_AUSSPRACHE_LIZENZ.md) ---
// Gleicher Ansatz wie beim Urdu-Aussprachewörterbuch oben (siehe Kommentar
// dort) - liefert direkt die fertige lateinische Lesung pro Wort.
const PASHTO_AUSSPRACHE_URL = new URL('../data/pashtoAussprache.json', import.meta.url).href;
let pashtoAusspracheePromise = null;

function ladePashtoAussprache() {
  if (!pashtoAusspracheePromise) {
    pashtoAusspracheePromise = fetch(PASHTO_AUSSPRACHE_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => new Map(Object.entries(daten.woerter ?? {})))
      .catch((fehler) => {
        console.warn(
          'Paschtu-Aussprachewörterbuch konnte nicht geladen werden, nutze ' +
            'nur die allgemeine arabische Standardvokal-Heuristik:',
          fehler,
        );
        return null;
      });
  }
  return pashtoAusspracheePromise;
}

/**
 * Ersetzt vor der eigentlichen Umschrift jedes im Paschtu-Aussprache-
 * wörterbuch gefundene Wort durch die dort bereits fertige lateinische
 * Lesung (siehe transliteriereUrduMitAussprache() oben für die identische
 * Logik). Auch hier: keine Mehrwort-Phrasen in den Rohdaten, daher reicht
 * eine einfache Einzelwort-Ersetzung.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereParschtuMitAussprache(text) {
  const woerterbuch = await ladePashtoAussprache();
  if (!woerterbuch) {
    return transliteriereArabischMitWoerterbuch(text);
  }

  const angereichertesText = text.replace(
    ARABISCHES_WORT_REGEX,
    (wort) => woerterbuch.get(wort) ?? wort,
  );

  return transliteriereArabischMitWoerterbuch(angereichertesText);
}

// --- Kurdisch/Sorani: Aussprache-Wörterbuch (siehe data/KURDISCH_SORANI_AUSSPRACHE_LIZENZ.md) ---
// Gleicher Ansatz wie bei Urdu/Paschtu oben (siehe Kommentare dort).
const KURDISCH_SORANI_AUSSPRACHE_URL = new URL('../data/kurdischSoraniAussprache.json', import.meta.url).href;
let kurdischSoraniAusspracheePromise = null;

function ladeKurdischSoraniAussprache() {
  if (!kurdischSoraniAusspracheePromise) {
    kurdischSoraniAusspracheePromise = fetch(KURDISCH_SORANI_AUSSPRACHE_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => new Map(Object.entries(daten.woerter ?? {})))
      .catch((fehler) => {
        console.warn(
          'Kurdisch-Sorani-Aussprachewörterbuch konnte nicht geladen werden, ' +
            'nutze nur die allgemeine arabische Standardvokal-Heuristik:',
          fehler,
        );
        return null;
      });
  }
  return kurdischSoraniAusspracheePromise;
}

/**
 * Ersetzt vor der eigentlichen Umschrift jedes im Kurdisch-Sorani-
 * Aussprachewörterbuch gefundene Wort durch die dort bereits fertige
 * lateinische Lesung (siehe transliteriereUrduMitAussprache() oben für die
 * identische Logik). Keine Mehrwort-Phrasen in den Rohdaten, daher reicht
 * eine einfache Einzelwort-Ersetzung.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function transliteriereSoraniMitAussprache(text) {
  const woerterbuch = await ladeKurdischSoraniAussprache();
  if (!woerterbuch) {
    return transliteriereArabischMitWoerterbuch(text);
  }

  const angereichertesText = text.replace(
    ARABISCHES_WORT_REGEX,
    (wort) => woerterbuch.get(wort) ?? wort,
  );

  return transliteriereArabischMitWoerterbuch(angereichertesText);
}

// Welcher Langvokal-Buchstabe zu welchem Kurzvokal passt, wenn er direkt
// danach folgt (Mater lectionis: Fatha+ا=ā, Damma+و=ū, Kasra+ي=ī). Wird
// genutzt, um z. B. aus explizit vokalisiertem "مَكْتُوب" (aus dem
// BAMA-Wörterbuch) korrekt "maktuub" statt "maktuwaba" zu machen - ohne
// diese Zusammenziehung würde das و nach der Damma als eigenständiger,
// neuer Konsonant mit eigenem (geratenem) Vokal missverstanden.
const ARABISCH_PASSENDER_LANGVOKAL_ZU_HARAKAT = { a: 'ا', u: 'و', i: 'ي' };

/**
 * Ermittelt, ob an einer Position ein Langvokal einen vorangehenden
 * Konsonanten "füllt" (dessen Kurzvokal-Slot übernimmt), statt selbst als
 * eigenständiger Konsonant mit eigenem Vokal zu fungieren. Reine
 * Vokalbuchstaben (ا/ى/ة/...) sind nie mehrdeutig. و/ي gelten nur dann als
 * Langvokal-Füllung, wenn direkt danach kein Harakat und keine Shadda
 * folgt (dann würden sie selbst einen Vokal tragen, also Konsonant sein).
 * @returns {{wert: string, laenge: number} | null}
 */
function ermittleLangvokalFuellung(zeichen, position) {
  const aktuelles = zeichen[position];
  if (aktuelles === undefined) return null;

  if (Object.prototype.hasOwnProperty.call(ARABISCH_LANGVOKALE, aktuelles)) {
    return { wert: ARABISCH_LANGVOKALE[aktuelles], laenge: 1 };
  }

  if (Object.prototype.hasOwnProperty.call(ARABISCH_LANGVOKAL_FUELLUNG, aktuelles)) {
    const danach = zeichen[position + 1];
    const traegtEigenenVokal =
      danach === ARABISCH_SHADDA ||
      Object.prototype.hasOwnProperty.call(ARABISCH_HARAKAT, danach);
    if (!traegtEigenenVokal) {
      return { wert: ARABISCH_LANGVOKAL_FUELLUNG[aktuelles], laenge: 1 };
    }
  }

  return null;
}

/**
 * Transliteriert arabische Schrift (inkl. der um Persisch/Urdu/Paschtu/
 * Kurdisch-Sorani erweiterten Buchstaben) unter Berücksichtigung der
 * fehlenden Kurzvokale - siehe Erläuterung oberhalb der Konstanten.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereArabisch(text) {
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];

    // Streckzeichen: rein optisch, wird verworfen.
    if (aktuelles === ARABISCH_TATWEEL) {
      i += 1;
      continue;
    }

    // Verwaiste Diakritika ohne vorangehenden Konsonanten (Randfall,
    // z. B. am Wortanfang) - werden ignoriert statt einen Fehler zu werfen.
    if (
      aktuelles === ARABISCH_SUKUN ||
      aktuelles === ARABISCH_SHADDA ||
      Object.prototype.hasOwnProperty.call(ARABISCH_HARAKAT, aktuelles)
    ) {
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(ARABISCH_HAMZA_VOKALE, aktuelles)) {
      ergebnis += ARABISCH_HAMZA_VOKALE[aktuelles];
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(ARABISCH_ZIFFERN, aktuelles)) {
      ergebnis += ARABISCH_ZIFFERN[aktuelles];
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(ARABISCH_LANGVOKALE, aktuelles)) {
      ergebnis += ARABISCH_LANGVOKALE[aktuelles];
      i += 1;
      continue;
    }

    const istHalbvokal = Object.prototype.hasOwnProperty.call(ARABISCH_HALBVOKALE, aktuelles);
    const istKonsonant = Object.prototype.hasOwnProperty.call(ARABISCH_KONSONANTEN, aktuelles);

    if (istHalbvokal || istKonsonant) {
      const basis = istHalbvokal ? ARABISCH_HALBVOKALE[aktuelles] : ARABISCH_KONSONANTEN[aktuelles];
      let konsonantenLaut = basis;
      let vokalPosition = i + 1;

      // Shadda: Konsonant verdoppeln, Vokal-Suche hinter der Shadda fortsetzen.
      if (zeichen[vokalPosition] === ARABISCH_SHADDA) {
        konsonantenLaut += basis;
        vokalPosition += 1;
      }

      const vokalZeichen = zeichen[vokalPosition];

      if (
        vokalZeichen !== undefined &&
        Object.prototype.hasOwnProperty.call(ARABISCH_HARAKAT, vokalZeichen)
      ) {
        // Kurzvokalzeichen vorhanden -> exakt übernehmen. Zusätzlich
        // prüfen, ob direkt danach der passende Langvokal-Buchstabe folgt
        // (Mater lectionis, z. B. Damma+و) - dann zu einem echten
        // Langvokal zusammenziehen statt das و separat als neuen
        // Konsonanten zu werten (siehe Kommentar an
        // ARABISCH_PASSENDER_LANGVOKAL_ZU_HARAKAT).
        const harakatWert = ARABISCH_HARAKAT[vokalZeichen];
        let vokalAusgabe = harakatWert;
        let naechstePosition = vokalPosition + 1;

        const erwarteterLangvokalBuchstabe = ARABISCH_PASSENDER_LANGVOKAL_ZU_HARAKAT[harakatWert];
        if (erwarteterLangvokalBuchstabe && zeichen[naechstePosition] === erwarteterLangvokalBuchstabe) {
          const danach = zeichen[naechstePosition + 1];
          const traegtEigenenVokal =
            danach === ARABISCH_SHADDA ||
            Object.prototype.hasOwnProperty.call(ARABISCH_HARAKAT, danach);
          if (!traegtEigenenVokal) {
            vokalAusgabe = harakatWert + harakatWert;
            naechstePosition += 1;
          }
        }

        ergebnis += konsonantenLaut + vokalAusgabe;
        i = naechstePosition;
      } else if (vokalZeichen === ARABISCH_SUKUN) {
        // Vokal-Unterdrückung -> kein Vokal ergänzen.
        ergebnis += konsonantenLaut;
        i = vokalPosition + 1;
      } else {
        const fuellung = ermittleLangvokalFuellung(zeichen, vokalPosition);
        if (fuellung) {
          // Nachfolgender Langvokal-Buchstabe füllt den Vokal-Slot.
          ergebnis += konsonantenLaut + fuellung.wert;
          i = vokalPosition + fuellung.laenge;
        } else {
          // Keine Diakritika, kein Langvokal-Buchstabe -> Standardvokal
          // ergänzen (siehe Erläuterung oberhalb der Konstanten).
          ergebnis += konsonantenLaut + ARABISCH_STANDARDVOKAL;
          i = vokalPosition;
        }
      }
      continue;
    }

    // Unbekanntes Zeichen (Leerzeichen, Satzzeichen, ...) unverändert
    // übernehmen.
    ergebnis += aktuelles;
    i += 1;
  }

  return ergebnis;
}

// --- Armenisch (angelehnt an DIN 32706 / ISO 9985) ---
const ARMENISCH_MAP = {
  'ա': 'a', 'բ': 'b', 'գ': 'g', 'դ': 'd', 'ե': 'e', 'զ': 'z', 'է': 'e',
  'ը': 'y', 'թ': 'th', 'ժ': 'zh', 'ի': 'i', 'լ': 'l', 'խ': 'kh', 'ծ': 'ts',
  'կ': 'k', 'հ': 'h', 'ձ': 'dz', 'ղ': 'gh', 'ճ': 'ch', 'մ': 'm', 'յ': 'y',
  'ն': 'n', 'շ': 'sh', 'ո': 'o', 'չ': 'ch', 'պ': 'p', 'ջ': 'j', 'ռ': 'rr',
  'ս': 's', 'վ': 'v', 'տ': 't', 'ր': 'r', 'ց': 'ts', 'ւ': 'v', 'փ': 'ph',
  'ք': 'q', 'օ': 'o', 'ֆ': 'f', 'և': 'ev',
  'Ա': 'A', 'Բ': 'B', 'Գ': 'G', 'Դ': 'D', 'Ե': 'E', 'Զ': 'Z', 'Է': 'E',
  'Ը': 'Y', 'Թ': 'Th', 'Ժ': 'Zh', 'Ի': 'I', 'Լ': 'L', 'Խ': 'Kh', 'Ծ': 'Ts',
  'Կ': 'K', 'Հ': 'H', 'Ձ': 'Dz', 'Ղ': 'Gh', 'Ճ': 'Ch', 'Մ': 'M', 'Յ': 'Y',
  'Ն': 'N', 'Շ': 'Sh', 'Ո': 'O', 'Չ': 'Ch', 'Պ': 'P', 'Ջ': 'J', 'Ռ': 'Rr',
  'Ս': 'S', 'Վ': 'V', 'Տ': 'T', 'Ր': 'R', 'Ց': 'Ts', 'Ւ': 'V', 'Փ': 'Ph',
  'Ք': 'Q', 'Օ': 'O', 'Ֆ': 'F',
};

// --- Georgisch (angelehnt an DIN 32707 / ISO 9984) ---
// Georgisches Mkhedruli-Alphabet kennt keine Groß-/Kleinschreibung.
const GEORGISCH_MAP = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'ph',
  'ქ': 'kh', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts',
  'ძ': 'dz', 'წ': 'tz', 'ჭ': 'tch', 'ხ': 'x', 'ჯ': 'j', 'ჰ': 'h',
};

// --- Hebräisch (angelehnt an DIN 31636 / ISO 259) ---
const HEBRAEISCH_MAP = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'kh', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': "'", 'פ': 'p', 'ף': 'p',
  'צ': 'ts', 'ץ': 'ts', 'ק': 'q', 'ר': 'r', 'ש': 'sh', 'ת': 'th',
};

// Fricative statt Plosiv-Lesung für ב/כ/פ, wenn Niqqud explizit OHNE
// Dagesch vorliegt (siehe transliteriereHebraeisch()).
const HEBRAEISCH_FRIKATIV = { 'ב': 'v', 'כ': 'kh', 'ך': 'kh', 'פ': 'f', 'ף': 'f' };
const HEBRAEISCH_PLOSIV = { 'ב': 'b', 'כ': 'k', 'ך': 'k', 'פ': 'p', 'ף': 'p' };

// Niqqud (hebräische Vokalpunkte) -> lateinischer Vokal. In modernem
// Fließtext (v. a. aus Übersetzungs-APIs) so gut wie nie vorhanden -
// kommen aber in Wörterbüchern, Kinderbüchern, liturgischen/religiösen
// Texten und Lehrmaterial vor. Vorher wurden sie vom ASCII-Sicherheitsnetz
// stillschweigend entfernt (kein Mehrwert, selbst wenn im Text
// vorhanden); jetzt werden sie tatsächlich in Vokale übersetzt.
// Schwa (ְ) ist doppeldeutig (vokalisch/"na" vs. stumm/"nach", ohne
// grammatische Analyse nicht unterscheidbar) - wird konservativ als stumm
// behandelt (leerer String), analog zur üblichen vereinfachten Praxis.
const NIQQUD_MAP = {
  '\u05B0': '', // Schwa (Sheva) - vereinfachend als stumm behandelt
  '\u05B1': 'e', // Chataf Segol
  '\u05B2': 'a', // Chataf Patach
  '\u05B3': 'o', // Chataf Kamatz
  '\u05B4': 'i', // Chiriq
  '\u05B5': 'e', // Tzere
  '\u05B6': 'e', // Segol
  '\u05B7': 'a', // Patach
  '\u05B8': 'a', // Kamatz (Kamatz Katan/o seltener - nicht unterscheidbar, Kamatz Gadol/a als haeufigerer Fall)
  '\u05B9': 'o', // Cholam
  '\u05BA': 'o', // Cholam Chaser für Vav
  '\u05BB': 'u', // Kubuz
  '\u05C7': 'o', // Kamatz Katan (explizit)
  '\u05BD': '', // Metheg - reine Betonungsmarkierung, kein eigener Vokal
};
const DAGESCH = '\u05BC'; // Dagesch/Mapiq
const RAFE = '\u05BF'; // Rafe - Gegenstueck zum Dagesch, erzwingt Frikativ
const SHIN_PUNKT = '\u05C1';
const SIN_PUNKT = '\u05C2';

function istNiqqud(zeichen) {
  return zeichen !== undefined && zeichen >= '\u05B0' && zeichen <= '\u05C7';
}

// --- Hebräisch/Jiddisch: Vokalisierungs-Wörterbuch (siehe
// data/HEBRAEISCH_VOKALISIERUNG_LIZENZ.md) ---
// Ordnet unpunktierten Wortformen ihre vokalisierte (Niqqud-)Entsprechung
// zu, sofern in UniMorph Hebrew (aus Wiktionary) vorhanden. Wird VOR der
// eigentlichen Umschrift angewendet (siehe
// transliteriereHebraeischMitVokalisierung() unten) - bei einem Treffer
// nutzt transliteriereHebraeisch() dann automatisch seine bereits
// vorhandene Niqqud-Logik statt der unpunktierten Heuristik.
const HEBRAEISCH_VOKALISIERUNG_URL = new URL('../data/hebraeischVokalisierung.json', import.meta.url).href;
let hebraeischVokalisierungPromise = null;

function ladeHebraeischeVokalisierung() {
  if (!hebraeischVokalisierungPromise) {
    hebraeischVokalisierungPromise = fetch(HEBRAEISCH_VOKALISIERUNG_URL)
      .then((antwort) => {
        if (!antwort.ok) {
          throw new Error(`HTTP ${antwort.status}`);
        }
        return antwort.json();
      })
      .then((daten) => new Map(Object.entries(daten.woerter ?? {})))
      .catch((fehler) => {
        console.warn(
          'Hebräisches Vokalisierungs-Wörterbuch konnte nicht geladen werden, ' +
            'nutze nur die unpunktierte Heuristik:',
          fehler,
        );
        return null;
      });
  }
  return hebraeischVokalisierungPromise;
}

// Hebräische/jiddische Wörter bestehen aus zusammenhängenden Läufen von
// Buchstaben des Basisblocks (U+05D0-U+05EA) - Leerzeichen und
// Satzzeichen trennen sie ohnehin bereits (anders als bei Chinesisch),
// daher genügt hier ein einfacher Wortlauf-Ersatz ohne Segmentierung.
// Ganzer Wort-Lauf INKLUSIVE evtl. bereits vorhandener Niqqud-Zeichen
// (05B0-05C7, deckt NIQQUD_MAP + Dagesch/Rafe/Schin-/Sin-Punkt ab, siehe
// istNiqqud() oben) - wichtig, damit ein TEILWEISE bereits vokalisiertes
// Wort (z. B. aus MyMemory-Uebersetzungen, die haeufig zumindest Patach/
// Kamatz fuer אַ/אָ mitliefern) als EIN zusammenhaengendes Wort erkannt
// wird. Eine reine Buchstaben-nur-Regex wuerde an jedem eingebetteten
// Niqqud-Zeichen faelschlich in Fragmente zerbrechen (z. B. "אַליין" ->
// "א" + "ליין"), die dann je fuer sich im Woerterbuch nachgeschlagen
// werden - "ליין" existiert dort zufaellig als eigenstaendiges Wort
// ("Wein") und wuerde das falsch eingesetzte Fragment fehlerhaft ersetzen.
const HEBRAEISCH_WORTLAUF_REGEX = /[\u05D0-\u05EA][\u05D0-\u05EA\u05B0-\u05C7]*/gu;

/**
 * Ersetzt vor der eigentlichen Umschrift jedes im Vokalisierungs-
 * Wörterbuch gefundene unpunktierte Wort durch seine vokalisierte
 * (Niqqud-)Entsprechung und delegiert dann an transliteriereHebraeisch().
 * Wörter ohne Treffer bleiben unverändert und durchlaufen wie bisher die
 * unpunktierte Heuristik dort - reine Verbesserung, keine Regression.
 * @param {string} text
 * @param {'he-IL' | 'yi-YD'} [sprache] steuert jiddisch-spezifische
 *   Lesungen in transliteriereHebraeisch() (siehe dort), Standard: he-IL.
 * @returns {Promise<string>}
 */
export async function transliteriereHebraeischMitVokalisierung(text, sprache = 'he-IL') {
  const woerterbuch = await ladeHebraeischeVokalisierung();
  if (!woerterbuch) {
    return transliteriereHebraeisch(text, sprache);
  }
  const angereicherterText = text.replace(HEBRAEISCH_WORTLAUF_REGEX, (wort) => {
    // Nur VOLLSTAENDIG unpunktierte Woerter nachschlagen (Woerterbuch-
    // Schluessel sind unpunktiert) - ein bereits teilweise vokalisiertes
    // Wort (z. B. "אַליין" mit Patach) NICHT anfassen, sonst wuerde es an
    // seinem Niqqud-Zeichen faelschlich fragmentiert und ein Fragment
    // eventuell mit einem unverwandten Woerterbucheintrag ersetzt (siehe
    // Kommentar bei HEBRAEISCH_WORTLAUF_REGEX oben).
    if (Array.from(wort).some((z) => istNiqqud(z))) {
      return wort;
    }
    return woerterbuch.get(wort) ?? wort;
  });
  return transliteriereHebraeisch(angereicherterText, sprache);
}

/**
 * Transliteriert Hebräisch (und darüber auch Jiddisch, das dieselbe
 * Schrift nutzt). Zwei Verbesserungen gegenüber einer reinen
 * Zeichentabelle:
 *
 * 1. Niqqud (Vokalpunkte) werden, wenn vorhanden, tatsächlich als Vokale
 *    ausgegeben statt ignoriert (siehe NIQQUD_MAP). Dabei wird pro
 *    Buchstabe der GESAMTE direkt folgende Cluster an Diakritika
 *    eingesammelt (nicht nur das nächste Zeichen) - in echtem Unicode-Text
 *    steht z. B. bei "בַּ" der Vokalpunkt (Patach) VOR dem Dagesch, nicht
 *    danach. Ein folgender Dagesch/Rafe bei ב/כ/פ steuert außerdem, ob
 *    die Plosiv- (b/k/p) oder Frikativ-Lesung (v/kh/f) verwendet wird,
 *    und Schin-/Sin-Punkt bei ש zwischen "sh" und "s". Die Kombinationen
 *    Vav+Cholam ("וֹ") und Vav+Dagesch ("וּ", Schuruk) sind im Hebräischen
 *    eigenständige VOKALE (o bzw. u) - das Vav wird dort NICHT zusätzlich
 *    als Konsonant "v" mitgesprochen. Text aus dem Vokalisierungs-
 *    Wörterbuch oben (siehe transliteriereHebraeischMitVokalisierung())
 *    landet über genau diesen Pfad.
 *    KEIN DOPPELTER VOKAL: א (Alef) und ע (Ajin) haben im Hebräischen
 *    keinen eigenen Lautwert - ihre Basislesung in HEBRAEISCH_MAP ('a'
 *    bzw. "'") ist nur der Standardwert für UNPUNKTIERTEN Text (siehe
 *    Punkt 2). Liegt ein echtes Niqqud-Vokalzeichen vor, ersetzt dessen
 *    Lesung die Basislesung komplett, statt sich mit ihr zu addieren -
 *    sonst entstünde z. B. aus אַ (Alef+Patach) faelschlich "aa" statt "a".
 * 2. Für UNPUNKTIERTEN Text (Wörter ohne Wörterbuchtreffer) wird die im
 *    modernen Hebräisch/Jiddisch übliche Konvention der "Matres
 *    lectionis" (Buchstaben, die ohne Niqqud als Vokal-Platzhalter
 *    dienen) in den zwei eindeutigsten, am besten dokumentierten Fällen
 *    angewendet: ein verdoppeltes ו ("וו") steht für den Konsonanten v,
 *    ein einzelnes ו am Wortanfang ist praktisch immer das Präfix ו
 *    ("und", Konsonant v) - ein einzelnes ו an anderer Stelle im Wort
 *    wird dagegen als Vokal (u) gelesen. Das ist eine Heuristik, keine
 *    echte morphologische Analyse (anders als beim arabischen Modul mit
 *    BAMA-Wörterbuch) - bei י wird bewusst NICHT eingegriffen, da dort
 *    die Konsonant/Vokal-Entscheidung ohne Wörterbuch zu unzuverlässig
 *    wäre und eher neue Fehler einführen würde als bestehende zu beheben.
 *
 * JIDDISCH-BESONDERHEIT (sprache === 'yi-YD'): Anders als im Hebräischen
 * ist ע im jiddischen YIVO-Standard KEIN Konsonant (Glottisverschlusslaut),
 * sondern der mit Abstand häufigste VOKAL-Buchstabe (Lautwert "e", z. B.
 * וועלכע "velkhe" = "welche"). Die Hebräisch-Lesung ("'"/Apostroph) würde
 * hier praktisch jeden Vokal aus dem Wort entfernen (siehe Bugreport:
 * "v'lk'" statt "velkhe" - fünf Konsonanten/Apostrophe, kein einziger
 * Vokal). Für Jiddisch wird daher ohne anderslautendes Niqqud "e"
 * gelesen. Ebenso ist אָ (Alef+Kamatz) im YIVO-Standard IMMER "o"
 * ("Komets Alef", z. B. וואָס "vos" = "was") - anders als im Hebräischen,
 * wo Kamatz mangels Kontext als Näherung auf "a" defaultet (siehe
 * NIQQUD_MAP-Kommentar dort). Alle anderen Buchstaben/Diakritika werden
 * für Jiddisch identisch zum Hebräischen gelesen.
 *
 * Für Jiddisch (sprache === 'yi-YD') werden zusätzlich drei Digraphe
 * aufgelöst, die im YIVO-Standard eigene Diphthong-Vokale sind, in der
 * Hebräisch-Lesung aber als Konsonantenfolgen missverstanden würden:
 *  - יי (Zwej-Jud, zwei plaine י ohne Diakritika) -> "ey"; folgt direkt
 *    ein Patach ("ײַ"-Äquivalent ohne Ligatur) -> "ay" (Pasekh-Zwej-Jud).
 *  - ײ (U+05F2, YIDDISH DOUBLE YOD LIGATURE) -> "ey"; mit folgendem
 *    Patach (ײַ) -> "ay". Reiner Schreibvarianten-Unterschied zu "יי" -
 *    manche Schriftarten/Quellen nutzen die Ligatur, andere zwei
 *    getrennte Jud-Zeichen, phonetisch identisch.
 *  - וי (Wow+Jud) -> "oy". Steht direkt davor ein unpunktiertes א (reiner
 *    stummer Vokaltraeger am Wortanfang, z. B. אויך "oykh" = "auch"),
 *    wird dieses א NICHT zusaetzlich als "a" gelesen (sonst faelschlich
 *    "aoykh" statt "oykh").
 * @param {string} text
 * @param {'he-IL' | 'yi-YD'} [sprache] Standard: he-IL (reines Hebräisch).
 * @returns {string}
 */
export function transliteriereHebraeisch(text, sprache = 'he-IL') {
  const istJiddisch = sprache === 'yi-YD';
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  const istHebraeischerBuchstabe = (z) => z !== undefined && Object.prototype.hasOwnProperty.call(HEBRAEISCH_MAP, z);
  const istDiakritikum = (z) => z !== undefined && (istNiqqud(z) || z === DAGESCH || z === RAFE || z === SHIN_PUNKT || z === SIN_PUNKT);

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];

    // Jiddische Diphthong-Digraphe (siehe Moduldoku oben) - muessen VOR
    // der allgemeinen Buchstaben-Verarbeitung geprueft werden, da sie
    // mehrere Zeichen auf einmal verbrauchen.
    if (istJiddisch) {
      // אוי (stummes א + Wow-Jud "oy") - das א traegt hier keinen eigenen
      // Laut, sonst faelschlich "a"+"oy".
      if (aktuelles === 'א' && zeichen[i + 1] === 'ו' && zeichen[i + 2] === 'י') {
        i += 1;
        continue;
      }
      // וי (Wow+Jud) -> "oy".
      if (aktuelles === 'ו' && zeichen[i + 1] === 'י') {
        ergebnis += 'oy';
        i += 2;
        continue;
      }
      // ײ-Ligatur (U+05F2) bzw. יי (zwei getrennte Jud) -> "ey", mit
      // folgendem Patach -> "ay" (Pasekh-Zwej-Jud).
      const istLigatur = aktuelles === '\u05F2';
      const istGetrenntesDoppelYod = aktuelles === 'י' && zeichen[i + 1] === 'י';
      if (istLigatur || istGetrenntesDoppelYod) {
        const naechsterIndex = i + (istLigatur ? 1 : 2);
        if (zeichen[naechsterIndex] === '\u05B7') {
          ergebnis += 'ay';
          i = naechsterIndex + 1;
        } else {
          ergebnis += 'ey';
          i = naechsterIndex;
        }
        continue;
      }
    }

    if (!istHebraeischerBuchstabe(aktuelles)) {
      // Verwaistes Diakritikum ohne Basisbuchstabe (sollte normalerweise
      // nicht vorkommen) - hat keinen eigenen Lautwert, wird ignoriert.
      if (istDiakritikum(aktuelles)) {
        i += 1;
        continue;
      }
      ergebnis += aktuelles;
      i += 1;
      continue;
    }

    // Verdoppeltes Vav ("וו") - im modernen Ktiv Male wie im Jiddischen
    // eindeutig der Konsonant v (z. B. in Lehnwoertern/Transliterationen).
    if (aktuelles === 'ו' && zeichen[i + 1] === 'ו') {
      ergebnis += 'v';
      i += 2;
      continue;
    }

    // Gesamten Diakritika-Cluster direkt nach dem Buchstaben einsammeln -
    // Reihenfolge in echtem Text ist nicht garantiert (siehe Docstring).
    let j = i + 1;
    let hatDagesch = false;
    let hatRafe = false;
    let hatSchinPunkt = false;
    let hatSinPunkt = false;
    let vokalNiqqud = null;
    while (j < zeichen.length && istDiakritikum(zeichen[j])) {
      const z = zeichen[j];
      if (z === DAGESCH) hatDagesch = true;
      else if (z === RAFE) hatRafe = true;
      else if (z === SHIN_PUNKT) hatSchinPunkt = true;
      else if (z === SIN_PUNKT) hatSinPunkt = true;
      else if (vokalNiqqud === null) vokalNiqqud = z;
      j += 1;
    }
    const hatNiqqud = j > i + 1;
    let vokalAusgabe = vokalNiqqud !== null ? NIQQUD_MAP[vokalNiqqud] : '';

    // Jiddisch, Komets Alef ("אָ", Alef+Kamatz): im YIVO-Standard immer
    // "o", nicht die Hebräisch-Näherung "a" (siehe Moduldoku oben).
    if (istJiddisch && aktuelles === 'א' && vokalNiqqud === '\u05B8') {
      vokalAusgabe = 'o';
    }

    // Vav+Cholam ("וֹ") bzw. Vav+Dagesch/Schuruk ("וּ") -> reiner Vokal,
    // das Vav selbst wird hier NICHT als Konsonant "v" mitgesprochen.
    if (aktuelles === 'ו' && (vokalNiqqud === '\u05B9' || vokalNiqqud === '\u05BA')) {
      ergebnis += 'o';
      i = j;
      continue;
    }
    if (aktuelles === 'ו' && hatDagesch && vokalNiqqud === null) {
      ergebnis += 'u';
      i = j;
      continue;
    }

    // Schin-/Sin-Punkt: praezisiert die sonst feste "sh"-Lesung von ש.
    if (aktuelles === 'ש' && hatSinPunkt) {
      ergebnis += 's' + vokalAusgabe;
      i = j;
      continue;
    }
    if (aktuelles === 'ש' && hatSchinPunkt) {
      ergebnis += 'sh' + vokalAusgabe;
      i = j;
      continue;
    }

    // Einzelnes Vav ohne jegliches Diakritikum, nicht am Wortanfang ->
    // Matres-lectionis-Vokal "u" (siehe Docstring, Punkt 2).
    const amWortanfang = !istHebraeischerBuchstabe(zeichen[i - 1]);
    if (aktuelles === 'ו' && !amWortanfang && !hatNiqqud) {
      ergebnis += 'u';
      i = j;
      continue;
    }

    // א/ע haben keinen eigenen Konsonantenlautwert (siehe Moduldoku oben):
    // liegt echtes Niqqud vor, zaehlt NUR dessen Vokal, nicht zusaetzlich
    // die Basislesung aus HEBRAEISCH_MAP (verhindert "aa" statt "a").
    if ((aktuelles === 'א' || aktuelles === 'ע') && vokalNiqqud !== null) {
      ergebnis += vokalAusgabe;
      i = j;
      continue;
    }

    // Jiddisch, ע (Ajin) ohne Niqqud: YIVO-Standard-Vokal "e" statt der
    // hebräischen Konsonanten-Lesung "'" (siehe Bugreport + Moduldoku).
    if (istJiddisch && aktuelles === 'ע' && vokalNiqqud === null) {
      ergebnis += 'e';
      i = j;
      continue;
    }

    // Basis-Lesung, inkl. Plosiv-/Frikativ-Entscheidung bei ב/כ/פ: NUR
    // wenn ueberhaupt ein Diakritikum an dieser Stelle vorhanden ist -
    // bei komplett unpunktiertem Text bleibt die bisherige Standard-Lesung
    // (Plosiv b/k/p) unveraendert, um keine Regression einzufuehren.
    let basis = HEBRAEISCH_MAP[aktuelles];
    if (Object.prototype.hasOwnProperty.call(HEBRAEISCH_PLOSIV, aktuelles)) {
      if (hatDagesch) {
        basis = HEBRAEISCH_PLOSIV[aktuelles];
      } else if (hatRafe || hatNiqqud) {
        basis = HEBRAEISCH_FRIKATIV[aktuelles];
      }
    }

    ergebnis += basis + vokalAusgabe;
    i = j;
  }

  return ergebnis;
}

// --- Japanisch: Kana (aus Wikipedia-Tabelle, siehe data/JAPANISCH_AUSSPRACHE_LIZENZ.md) ---
// Deckt Hiragana, Katakana UND die erweiterte Katakana-Tabelle fuer
// Fremdwort-Laute (z. B. ファ, ティ, ヴィェ) als Mehrzeichen-Digraphe ab -
// wird per Laengster-Treffer-Suche in japanischTransliteration.js verwendet,
// nicht als einfache MAPS_NACH_SPRACHE-Tabelle (siehe dort fuer die
// Sonderbehandlung von Verdopplungspunkt っ/ッ und Laengungszeichen ー).
// Kanji (chinesisch-stämmige Schriftzeichen) werden NICHT hier, sondern
// wörterbuchgestützt in japanischTransliteration.js behandelt (JMdict +
// Wikipedia-Einzelzeichen-Fallback).
export const JAPANISCH_KANA_MAP = {
  'ぁ': 'a', 'あ': 'a', 'ぃ': 'i', 'い': 'i', 'ぅ': 'u', 'う': 'u',
  'ぇ': 'e', 'え': 'e', 'ぉ': 'o', 'お': 'o', 'か': 'ka', 'が': 'ga',
  'き': 'ki', 'ぎ': 'gi', 'く': 'ku', 'ぐ': 'gu', 'け': 'ke', 'げ': 'ge',
  'こ': 'ko', 'ご': 'go', 'さ': 'sa', 'ざ': 'za', 'し': 'shi', 'じ': 'ji',
  'す': 'su', 'ず': 'zu', 'せ': 'se', 'ぜ': 'ze', 'そ': 'so', 'ぞ': 'zo',
  'た': 'ta', 'だ': 'da', 'ち': 'chi', 'ぢ': 'dji', 'つ': 'tsu', 'づ': 'dzu',
  'て': 'te', 'で': 'de', 'と': 'to', 'ど': 'do', 'な': 'na', 'に': 'ni',
  'ぬ': 'nu', 'ね': 'ne', 'の': 'no', 'は': 'ha', 'ば': 'ba', 'ぱ': 'pa',
  'ひ': 'hi', 'び': 'bi', 'ぴ': 'pi', 'ふ': 'fu', 'ぶ': 'bu', 'ぷ': 'pu',
  'へ': 'he', 'べ': 'be', 'ぺ': 'pe', 'ほ': 'ho', 'ぼ': 'bo', 'ぽ': 'po',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo', 'ゃ': 'ya',
  'や': 'ya', 'ゅ': 'yu', 'ゆ': 'yu', 'ょ': 'yo', 'よ': 'yo', 'ら': 'ra',
  'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro', 'わ': 'wa', 'ゐ': 'wi',
  'ゑ': 'we', 'を': 'wo', 'ん': 'n', 'ゔ': 'vu', 'ァ': 'a', 'ア': 'a',
  'ィ': 'i', 'イ': 'i', 'ゥ': 'u', 'ウ': 'u', 'ェ': 'e', 'エ': 'e',
  'ォ': 'o', 'オ': 'o', 'カ': 'ka', 'ガ': 'ga', 'キ': 'ki', 'ギ': 'gi',
  'ク': 'ku', 'グ': 'gu', 'ケ': 'ke', 'ゲ': 'ge', 'コ': 'ko', 'ゴ': 'go',
  'サ': 'sa', 'ザ': 'za', 'シ': 'shi', 'ジ': 'ji', 'ス': 'su', 'ズ': 'zu',
  'セ': 'se', 'ゼ': 'ze', 'ソ': 'so', 'ゾ': 'zo', 'タ': 'ta', 'ダ': 'da',
  'チ': 'chi', 'ヂ': 'dji', 'ツ': 'tsu', 'ヅ': 'dzu', 'テ': 'te', 'デ': 'de',
  'ト': 'to', 'ド': 'do', 'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne',
  'ノ': 'no', 'ハ': 'ha', 'バ': 'ba', 'パ': 'pa', 'ヒ': 'hi', 'ビ': 'bi',
  'ピ': 'pi', 'フ': 'fu', 'ブ': 'bu', 'プ': 'pu', 'ヘ': 'he', 'ベ': 'be',
  'ペ': 'pe', 'ホ': 'ho', 'ボ': 'bo', 'ポ': 'po', 'マ': 'ma', 'ミ': 'mi',
  'ム': 'mu', 'メ': 'me', 'モ': 'mo', 'ャ': 'ya', 'ヤ': 'ya', 'ュ': 'yu',
  'ユ': 'yu', 'ョ': 'yo', 'ヨ': 'yo', 'ラ': 'ra', 'リ': 'ri', 'ル': 'ru',
  'レ': 're', 'ロ': 'ro', 'ワ': 'wa', 'ヰ': 'wi', 'ヱ': 'we', 'ヲ': 'wo',
  'ン': 'n', 'ヴ': 'vu', 'ヷ': 'va', 'ヸ': 'vi', 'ヹ': 've', 'ヺ': 'vo',
  '・': ' ', 'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo', 'ぎゃ': 'gya', 'ぎゅ': 'gyu',
  'ぎょ': 'gyo', 'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho', 'じゃ': 'ja', 'じゅ': 'ju',
  'じょ': 'jo', 'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho', 'ぢゃ': 'dja', 'ぢゅ': 'dju',
  'ぢょ': 'djo', 'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo', 'ひゃ': 'hya', 'ひゅ': 'hyu',
  'ひょ': 'hyo', 'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo', 'ぴゃ': 'pya', 'ぴゅ': 'pyu',
  'ぴょ': 'pyo', 'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo', 'りゃ': 'rya', 'りゅ': 'ryu',
  'りょ': 'ryo', 'イァ': 'ya', 'イィ': 'yi', 'イゥ': 'yu', 'イェ': 'ye', 'イォ': 'yo',
  'ウァ': 'wa', 'ウィ': 'wi', 'ウゥ': 'wu', 'ウェ': 'we', 'ウォ': 'wo', 'ウャ': 'wya',
  'ウュ': 'wyu', 'ウョ': 'wyo', 'カ゚': 'nga', 'キ゚': 'ngi', 'キィ': 'kyi', 'キェ': 'kye',
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo', 'ギィ': 'gyi', 'ギェ': 'gye', 'ギャ': 'gya',
  'ギュ': 'gyu', 'ギョ': 'gyo', 'ク゚': 'ngu', 'クァ': 'kwa', 'クゥ': 'kwu', 'クェ': 'kwe',
  'クォ': 'kwo', 'クヮ': 'kwa', 'グァ': 'gwa', 'グゥ': 'gwu', 'グェ': 'gwe', 'グォ': 'gwo',
  'グヮ': 'gwa', 'ケ゚': 'nge', 'コ゚': 'ngo', 'シィ': 'shi', 'シェ': 'she', 'シャ': 'sha',
  'シュ': 'shu', 'ショ': 'sho', 'ジィ': 'ji', 'ジェ': 'je', 'ジャ': 'ja', 'ジュ': 'ju',
  'ジョ': 'jo', 'スァ': 'swa', 'スィ': 'swi', 'スゥ': 'swu', 'スェ': 'swe', 'スォ': 'swo',
  'スャ': 'sya', 'スュ': 'syu', 'スョ': 'syo', 'ズァ': 'zwa', 'ズィ': 'zwi', 'ズゥ': 'zwu',
  'ズェ': 'zwe', 'ズォ': 'zwo', 'ズャ': 'zya', 'ズュ': 'zyu', 'ズョ': 'zyo', 'セィ': 'si',
  'ゼィ': 'zi', 'チィ': 'chi', 'チェ': 'che', 'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ヂィ': 'dji', 'ヂェ': 'dje', 'ヂャ': 'dja', 'ヂュ': 'dju', 'ヂョ': 'djo', 'ツァ': 'tsa',
  'ツィ': 'tsi', 'ツゥ': 'tsu', 'ツェ': 'tse', 'ツォ': 'tso', 'ツャ': 'tsya', 'ツュ': 'tsyu',
  'ツョ': 'tsyo', 'ヅァ': 'dza', 'ヅィ': 'dzi', 'ヅゥ': 'dzu', 'ヅェ': 'dze', 'ヅォ': 'dzo',
  'ヅャ': 'dzya', 'ヅュ': 'dzyu', 'ヅョ': 'dzyo', 'テァ': 'tha', 'ティ': 'ti', 'テゥ': 'thu',
  'テェ': 'tye', 'テォ': 'tho', 'テャ': 'tya', 'テュ': 'tyu', 'テョ': 'tyo', 'デァ': 'dha',
  'ディ': 'di', 'デゥ': 'dhu', 'デェ': 'dye', 'デォ': 'dho', 'デャ': 'dya', 'デュ': 'dyu',
  'デョ': 'dyo', 'トァ': 'twa', 'トゥ': 'tu', 'トェ': 'twe', 'トォ': 'two', 'ドァ': 'dwa',
  'ドゥ': 'du ', 'ドェ': 'dwe', 'ドォ': 'dwo', 'ニィ': 'nyi', 'ニェ': 'nye', 'ニャ': 'nya',
  'ニュ': 'nyu', 'ニョ': 'nyo', 'ヌァ': 'nwa', 'ヌゥ': 'nwu', 'ヌェ': 'nwe', 'ヌォ': 'nwo',
  'ヒィ': 'hyi', 'ヒェ': 'hye', 'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo', 'ビィ': 'byi',
  'ビェ': 'bye', 'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo', 'ピィ': 'pyi', 'ピェ': 'pye',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo', 'ファ': 'fa', 'フィ': 'fi', 'フゥ': 'fu',
  'フェ': 'fe', 'フォ': 'fo', 'フャ': 'fya', 'フュ': 'fyu', 'フョ': 'fyo', 'ブァ': 'bwa',
  'ブゥ': 'bwu', 'ブェ': 'bwe', 'ブォ': 'pwo', 'プァ': 'pwa', 'プゥ': 'pwu', 'プェ': 'pwe',
  'プォ': 'pwo', 'ホゥ': 'hu', 'ミィ': 'myi', 'ミェ': 'mye', 'ミャ': 'mya', 'ミュ': 'myu',
  'ミョ': 'myo', 'ムァ': 'mwa', 'ムゥ': 'mwu', 'ムェ': 'mwe', 'ムォ': 'mwo', 'ユェ': 'ye',
  'ラ゚': 'la', 'リ゚': 'li', 'リィ': 'ryi', 'リェ': 'rye', 'リャ': 'rya', 'リュ': 'ryu',
  'リョ': 'ryo', 'ル゚': 'lu', 'ルァ': 'rwa', 'ルゥ': 'rwu', 'ルェ': 'rwe', 'ルォ': 'rwo',
  'レ゚': 'le', 'ロ゚': 'lo', 'ヰャ': 'wya', 'ヰュ': 'wyu', 'ヰョ': 'wyo', 'ヴァ': 'va',
  'ヴィ': 'vi', 'ヴェ': 've', 'ヴォ': 'vo', 'ヴャ': 'vya', 'ヴュ': 'vyu', 'ヴョ': 'vyo',
  'キ゚ャ': 'ngya', 'キ゚ュ': 'ngyu', 'キ゚ョ': 'ngyo', 'スゥァ': 'swa', 'スゥゥ': 'swu', 'スゥェ': 'swe',
  'スゥォ': 'swo', 'ズゥァ': 'zwa', 'ズゥゥ': 'zwu', 'ズゥェ': 'zwe', 'ズゥォ': 'zwo', 'ツゥァ': 'tswa',
  'ツゥゥ': 'tswu', 'ツゥェ': 'tswe', 'ツゥォ': 'tswo', 'ヅゥァ': 'dzwa', 'ヅゥゥ': 'dzwu', 'ヅゥェ': 'dzwe',
  'ヅゥォ': 'dzwo', 'ティァ': 'thya', 'ティゥ': 'thyu', 'ティェ': 'tye', 'ティォ': 'thyo', 'ディァ': 'dhya',
  'ディゥ': 'dhyu', 'ディェ': 'dye', 'ディォ': 'dhyo', 'トゥァ': 'twa', 'トゥゥ': 'twu', 'トゥェ': 'twe',
  'トゥォ': 'two', 'ドゥァ': 'dwa', 'ドゥゥ': 'dwu', 'ドゥェ': 'dwe', 'ドゥォ': 'dwo', 'フィェ': 'fye',
  'フゥァ': 'fwa', 'フゥゥ': 'fwu', 'フゥェ': 'fwe', 'フゥォ': 'fwo', 'ホゥァ': 'hwa', 'ホゥゥ': 'hwu',
  'ホゥェ': 'hwe', 'ホゥォ': 'hwo', 'リ゚ャ': 'lya', 'リ゚ュ': 'lyu', 'リ゚ョ': 'lyo', 'ヴィェ': 'vye',
  'ヴゥァ': 'vwa', 'ヴゥゥ': 'vwu', 'ヴゥェ': 'vwe', 'ヴゥォ': 'vwo',
};

// Thai wird NICHT ueber eine flache Zeichenkarte transliteriert, sondern
// silbenweise ueber thaiSyllableTransliteration.js (siehe romanize() unten,
// th-TH-Zweig) - siehe dort fuer Begruendung und Details.

// Einfache (flache) Zeichen-für-Zeichen-Tabellen. Für den indischen
// Schriftenkreis und Koreanisch braucht es eigene Logik (siehe unten).
const MAPS_NACH_SPRACHE = {
  // el-GR/grc-GR laufen NICHT über diese generische Tabelle, sondern über
  // transliteriereGriechisch() weiter unten (Digraph-Behandlung, siehe dort).
  'am-ET': AMHARISCH_MAP,
  'ti-TI': AMHARISCH_MAP,
  'mn-MN': KYRILLISCH_MAP,
  'sr-RS': KYRILLISCH_MAP,
  'ru-RU': KYRILLISCH_MAP,
  'uk-UA': KYRILLISCH_MAP,
  'bg-BG': KYRILLISCH_MAP,
  'mk-MK': KYRILLISCH_MAP,
  'be-BY': KYRILLISCH_MAP,
  'ky-KG': KYRILLISCH_MAP,
  'tg-TJ': KYRILLISCH_MAP,
  'kk-KZ': KYRILLISCH_MAP,
  'ba-RU': BASCHKIRISCH_MAP,
  'tt-RU': TATARISCH_MAP,
  'cv-RU': TSCHUWASCHISCH_MAP,
  // Arabisch (ar-SA/fa-IR/ur-PK/ps-PK/ckb-IQ) läuft NICHT über diese
  // flache Tabelle, sondern über transliteriereArabisch() weiter oben,
  // da dort eine Kurzvokal-Ergänzungslogik nötig ist (siehe Kommentar
  // dort). Siehe hatArabischesSchema()-Weiche in romanize() unten.
  'hy-AM': ARMENISCH_MAP,
  'ka-GE': GEORGISCH_MAP,
  // he-IL/yi-YD laufen NICHT über diese generische Tabelle, sondern über
  // transliteriereHebraeisch() (Niqqud-/Dagesch-Behandlung, siehe dort).
  // ja-JP läuft NICHT über diese generische Tabelle, sondern über
  // transliteriereJapanischMitWoerterbuch() (japanischTransliteration.js) -
  // Wortgrenzen-/Kanji-Behandlung, siehe dort.
  // th-TH läuft NICHT über diese generische Tabelle, sondern silbenweise
  // über transliteriereThailaendischSilbenweise() (thaiSyllableTransliteration.js),
  // eingebettet in die Wortgrenzen-Erkennung aus thaiWordSegmentation.js -
  // siehe romanize() unten.
};

/**
 * Zerlegt einen Hangul-Silbenblock algorithmisch in Erst-, Mittel- und
 * Endlaut und romanisiert nach dem Schema der (revidierten) Romanisierung
 * des Koreanischen (nahe an ISO/TR 11941). Da sich jeder Hangul-Block aus
 * Unicode-Codepoint - 0xAC00 über Division/Modulo eindeutig zerlegen lässt,
 * ist hier - anders als bei Chinesisch/Kanji - eine korrekte, vollständige
 * Umschrift ohne Wörterbuch möglich.
 */
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const CHOSEONG = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];
const JUNGSEONG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'yi', 'i',
];
const JONGSEONG = [
  '', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg',
  'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's',
  'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h',
];

function romanisiereHangul(text) {
  let ergebnis = '';
  for (const zeichen of text) {
    const code = zeichen.codePointAt(0);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const offset = code - HANGUL_START;
      const choseongIndex = Math.floor(offset / (21 * 28));
      const jungseongIndex = Math.floor((offset % (21 * 28)) / 28);
      const jongseongIndex = offset % 28;
      ergebnis += CHOSEONG[choseongIndex] + JUNGSEONG[jungseongIndex] + JONGSEONG[jongseongIndex];
    } else {
      ergebnis += zeichen;
    }
  }
  return ergebnis;
}

/**
 * Ersetzt Zeichenfolgen gemäß einer Zuordnungstabelle mit Einträgen
 * unterschiedlicher Länge (z. B. chinesische Mehrzeichen-Wörter), wobei an
 * jeder Position zuerst die längste passende Übereinstimmung geprüft wird.
 * Unbekannte Zeichen werden unverändert übernommen.
 */
function ersetzeMitLaengstemTreffer(text, tabelle) {
  const schluessel = Object.keys(tabelle).sort((a, b) => b.length - a.length);
  let ergebnis = '';
  let i = 0;
  while (i < text.length) {
    let getroffen = false;
    for (const eintrag of schluessel) {
      if (text.startsWith(eintrag, i)) {
        ergebnis += tabelle[eintrag];
        i += eintrag.length;
        getroffen = true;
        break;
      }
    }
    if (!getroffen) {
      ergebnis += text[i];
      i += 1;
    }
  }
  return ergebnis;
}

/**
 * Wandelt einen Text aus einer nicht-lateinischen Schrift in eine
 * lateinische Näherungsschreibung um.
 * @param {string} text
 * @param {string} zielsprache - Sprachcode (siehe languages.js)
 * @returns {string}
 */
export async function romanize(text, zielsprache) {
  if (!text) return '';

  if (hatIndischesSchema(zielsprache)) {
    return transliteriereIndischeSchrift(text, zielsprache);
  }

  if (zielsprache === 'fa-IR') {
    return transliteriereFarsiMitAussprache(text);
  }

  if (zielsprache === 'ur-PK') {
    return transliteriereUrduMitAussprache(text);
  }

  if (zielsprache === 'ps-PK') {
    return transliteriereParschtuMitAussprache(text);
  }

  if (zielsprache === 'ckb-IQ') {
    return transliteriereSoraniMitAussprache(text);
  }

  if (hatArabischesSchema(zielsprache)) {
    return transliteriereArabischMitWoerterbuch(text);
  }

  if (hatBirmanischesSchema(zielsprache)) {
    return transliteriereBirmanisch(text);
  }

  if (hatDzongkhaSchema(zielsprache)) {
    return transliteriereDzongkha(text);
  }

  if (hatTibetischesSchema(zielsprache)) {
    return transliteriereTibetischMitWoerterbuch(text);
  }

  if (zielsprache === 'ja-JP') {
    return transliteriereJapanischMitWoerterbuch(text);
  }

  if (hatKhmerSchema(zielsprache)) {
    return transliteriereKhmerMitWortliste(text);
  }

  if (hatKoptischesSchema(zielsprache)) {
    return transliteriereKoptisch(text);
  }

  if (hatLaotischesSchema(zielsprache)) {
    return transliteriereLaotisch(text);
  }

  if (hatDhivehiSchema(zielsprache)) {
    return transliteriereDhivehi(text);
  }

  if (zielsprache === 'ko-KR') {
    return romanisiereHangul(text);
  }

  if (zielsprache === 'el-GR' || zielsprache === 'grc-GR') {
    return transliteriereGriechisch(text);
  }

  if (zielsprache === 'he-IL' || zielsprache === 'yi-YD') {
    return transliteriereHebraeischMitVokalisierung(text, zielsprache);
  }

  if (zielsprache === 'zh-CN' || zielsprache === 'zh-TW') {
    return transliteriereChinesischMitWortliste(text, zielsprache, (t) => ersetzeMitLaengstemTreffer(t, CHINESISCH_PINYIN_MAP));
  }

  if (hatUigurischesSchema(zielsprache)) {
    return ersetzeMitLaengstemTreffer(text, UIGURISCH_MAP);
  }

  if (zielsprache === 'th-TH') {
    // Wortgrenzen-Erkennung (thaiWordSegmentation.js) fuegt zuerst
    // Leerzeichen an erkannten Wortgrenzen ein (arbeitet auf der
    // Original-Schreibweise, braucht sie unveraendert fuer den
    // Wortlisten-Abgleich). Die eigentliche Lautumschrift je Silbe
    // uebernimmt danach thaiSyllableTransliteration.js (siehe dort fuer
    // Details zu fuehrenden Vokalen, Konsonanten-Clustern, Ho-Nam-Digraphen
    // und Finalkonsonanten-Lauten).
    return transliteriereThaiMitWortliste(text, (t) => transliteriereThailaendischSilbenweise(t));
  }

  const map = MAPS_NACH_SPRACHE[zielsprache];
  if (!map) {
    // Keine Tabelle hinterlegt -> Text unverändert zurückgeben statt eines
    // Fehlers. Der finale ASCII-Sicherheitsnetz-Schritt entfernt danach
    // trotzdem alles Nicht-ASCII.
    return text;
  }

  let ergebnis = '';
  for (const zeichen of text) {
    ergebnis += Object.prototype.hasOwnProperty.call(map, zeichen)
      ? map[zeichen]
      : zeichen;
  }
  return ergebnis;
}
