/**
 * indicTransliteration.js
 * Vereinfachte, an ISO 15919 angelehnte Umschrift für den indischen
 * Schriftenkreis (Devanagari, Bengali, Gujarati, Gurmukhi, Kannada, Tamil,
 * Telugu, Sinhala).
 *
 * Diese Schriften sind Abugidas: ein Konsonantenzeichen trägt einen
 * inhärenten Vokal (meist "a"), sofern ihm nicht ein Vokalzeichen (Matra)
 * oder ein Virama (Vokal-Unterdrückungszeichen) folgt. Eine reine
 * Zeichen-für-Zeichen-Tabelle wie bei Kyrillisch/Griechisch würde hier
 * falsche Ergebnisse liefern (z. B. "नमस्ते" -> "naamaasstae" statt
 * "namaste"). Daher wird hier ein kleiner Algorithmus verwendet, der pro
 * Schrift dieselbe Logik mit unterschiedlichen Zeichentabellen anwendet.
 *
 * Einschränkung: Konjunkte, Nukta-Varianten und einige Sonderzeichen werden
 * vereinfacht behandelt; das Ergebnis ist eine lesbare Näherung, keine
 * wissenschaftlich exakte Transliteration.
 */

function baueSchema({ konsonanten, matras, unabhaengigeVokale, virama, sonstige = {} }) {
  return { konsonanten, matras, unabhaengigeVokale, virama, sonstige };
}

// --- Devanagari (Hindi, Nepali) ---
const DEVANAGARI = baueSchema({
  konsonanten: {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l',
    'ड़': 'r', 'ढ़': 'rh',
  },
  matras: {
    '\u093E': 'aa', '\u093F': 'i', '\u0940': 'ii', '\u0941': 'u', '\u0942': 'uu',
    '\u0943': 'ri', '\u0947': 'e', '\u0948': 'ai', '\u094B': 'o', '\u094C': 'au',
  },
  unabhaengigeVokale: {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ii', 'उ': 'u', 'ऊ': 'uu',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  },
  virama: '\u094D',
  sonstige: {
    '\u0902': 'n', '\u0903': 'h', '\u0901': 'n',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  },
});

// --- Bengali ---
const BENGALI = baueSchema({
  konsonanten: {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'y', 'র': 'r', 'ল': 'l',
    'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't',
  },
  matras: {
    '\u09BE': 'aa', '\u09BF': 'i', '\u09C0': 'ii', '\u09C1': 'u', '\u09C2': 'uu',
    '\u09C3': 'ri', '\u09C7': 'e', '\u09C8': 'oi', '\u09CB': 'o', '\u09CC': 'ou',
  },
  unabhaengigeVokale: {
    'অ': 'a', 'আ': 'aa', 'ই': 'i', 'ঈ': 'ii', 'উ': 'u', 'ঊ': 'uu',
    'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  },
  virama: '\u09CD',
  sonstige: {
    '\u0982': 'ng', '\u0983': 'h', '\u0981': 'n',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  },
});

// --- Gujarati ---
const GUJARATI = baueSchema({
  konsonanten: {
    'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ઙ': 'ng',
    'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'jh', 'ઞ': 'ny',
    'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n',
    'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n',
    'પ': 'p', 'ફ': 'ph', 'બ': 'b', 'ભ': 'bh', 'મ': 'm',
    'ય': 'y', 'ર': 'r', 'લ': 'l', 'વ': 'v',
    'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h', 'ળ': 'l',
  },
  matras: {
    '\u0ABE': 'aa', '\u0ABF': 'i', '\u0AC0': 'ii', '\u0AC1': 'u', '\u0AC2': 'uu',
    '\u0AC3': 'ri', '\u0AC7': 'e', '\u0AC8': 'ai', '\u0ACB': 'o', '\u0ACC': 'au',
  },
  unabhaengigeVokale: {
    'અ': 'a', 'આ': 'aa', 'ઇ': 'i', 'ઈ': 'ii', 'ઉ': 'u', 'ઊ': 'uu',
    'ઋ': 'ri', 'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au',
  },
  virama: '\u0ACD',
  sonstige: {
    '\u0A82': 'n', '\u0A83': 'h',
    '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
    '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  },
});

// --- Gurmukhi (Punjabi) ---
const GURMUKHI = baueSchema({
  konsonanten: {
    'ਕ': 'k', 'ਖ': 'kh', 'ਗ': 'g', 'ਘ': 'gh', 'ਙ': 'ng',
    'ਚ': 'ch', 'ਛ': 'chh', 'ਜ': 'j', 'ਝ': 'jh', 'ਞ': 'ny',
    'ਟ': 't', 'ਠ': 'th', 'ਡ': 'd', 'ਢ': 'dh', 'ਣ': 'n',
    'ਤ': 't', 'ਥ': 'th', 'ਦ': 'd', 'ਧ': 'dh', 'ਨ': 'n',
    'ਪ': 'p', 'ਫ': 'ph', 'ਬ': 'b', 'ਭ': 'bh', 'ਮ': 'm',
    'ਯ': 'y', 'ਰ': 'r', 'ਲ': 'l', 'ਵ': 'v',
    'ਸ': 's', 'ਹ': 'h', 'ਲ਼': 'l', 'ਸ਼': 'sh', 'ਜ਼': 'z', 'ਫ਼': 'f',
  },
  matras: {
    '\u0A3E': 'aa', '\u0A3F': 'i', '\u0A40': 'ii', '\u0A41': 'u', '\u0A42': 'uu',
    '\u0A47': 'e', '\u0A48': 'ai', '\u0A4B': 'o', '\u0A4C': 'au',
  },
  unabhaengigeVokale: {
    'ਅ': 'a', 'ਆ': 'aa', 'ਇ': 'i', 'ਈ': 'ii', 'ਉ': 'u', 'ਊ': 'uu',
    'ਏ': 'e', 'ਐ': 'ai', 'ਓ': 'o', 'ਔ': 'au',
  },
  virama: '\u0A4D',
  sonstige: {
    '\u0A02': 'n',
    '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4',
    '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',
  },
});

// --- Kannada ---
const KANNADA = baueSchema({
  konsonanten: {
    'ಕ': 'k', 'ಖ': 'kh', 'ಗ': 'g', 'ಘ': 'gh', 'ಙ': 'ng',
    'ಚ': 'ch', 'ಛ': 'chh', 'ಜ': 'j', 'ಝ': 'jh', 'ಞ': 'ny',
    'ಟ': 't', 'ಠ': 'th', 'ಡ': 'd', 'ಢ': 'dh', 'ಣ': 'n',
    'ತ': 't', 'ಥ': 'th', 'ದ': 'd', 'ಧ': 'dh', 'ನ': 'n',
    'ಪ': 'p', 'ಫ': 'ph', 'ಬ': 'b', 'ಭ': 'bh', 'ಮ': 'm',
    'ಯ': 'y', 'ರ': 'r', 'ಲ': 'l', 'ವ': 'v',
    'ಶ': 'sh', 'ಷ': 'sh', 'ಸ': 's', 'ಹ': 'h', 'ಳ': 'l',
  },
  matras: {
    '\u0CBE': 'aa', '\u0CBF': 'i', '\u0CC0': 'ii', '\u0CC1': 'u', '\u0CC2': 'uu',
    '\u0CC3': 'ri', '\u0CC6': 'e', '\u0CC7': 'ee', '\u0CC8': 'ai', '\u0CCA': 'o',
    '\u0CCB': 'oo', '\u0CCC': 'au',
  },
  unabhaengigeVokale: {
    'ಅ': 'a', 'ಆ': 'aa', 'ಇ': 'i', 'ಈ': 'ii', 'ಉ': 'u', 'ಊ': 'uu',
    'ಋ': 'ri', 'ಎ': 'e', 'ಏ': 'ee', 'ಐ': 'ai', 'ಒ': 'o', 'ಓ': 'oo', 'ಔ': 'au',
  },
  virama: '\u0CCD',
  sonstige: {
    '\u0C82': 'n', '\u0C83': 'h',
    '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
    '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
  },
});

// --- Tamil ---
const TAMIL = baueSchema({
  konsonanten: {
    'க': 'k', 'ங': 'ng', 'ச': 'ch', 'ஞ': 'ny', 'ட': 't', 'ண': 'n',
    'த': 't', 'ந': 'n', 'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r',
    'ல': 'l', 'வ': 'v', 'ழ': 'zh', 'ள': 'l', 'ற': 'r', 'ன': 'n',
    'ஜ': 'j', 'ஶ': 'sh', 'ஷ': 'sh', 'ஸ': 's', 'ஹ': 'h',
  },
  matras: {
    '\u0BBE': 'aa', '\u0BBF': 'i', '\u0BC0': 'ii', '\u0BC1': 'u', '\u0BC2': 'uu',
    '\u0BC6': 'e', '\u0BC7': 'ee', '\u0BC8': 'ai', '\u0BCA': 'o', '\u0BCB': 'oo', '\u0BCC': 'au',
  },
  unabhaengigeVokale: {
    'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ii', 'உ': 'u', 'ஊ': 'uu',
    'எ': 'e', 'ஏ': 'ee', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oo', 'ஔ': 'au',
  },
  virama: '\u0BCD',
  sonstige: {
    'ஃ': 'h',
    '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
    '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
  },
});

// --- Telugu ---
const TELUGU = baueSchema({
  konsonanten: {
    'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
    'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
    'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
    'త': 't', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
    'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
    'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v',
    'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h', 'ళ': 'l',
  },
  matras: {
    '\u0C3E': 'aa', '\u0C3F': 'i', '\u0C40': 'ii', '\u0C41': 'u', '\u0C42': 'uu',
    '\u0C43': 'ri', '\u0C46': 'e', '\u0C47': 'ee', '\u0C48': 'ai', '\u0C4A': 'o',
    '\u0C4B': 'oo', '\u0C4C': 'au',
  },
  unabhaengigeVokale: {
    'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ii', 'ఉ': 'u', 'ఊ': 'uu',
    'ఋ': 'ri', 'ఎ': 'e', 'ఏ': 'ee', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'oo', 'ఔ': 'au',
  },
  virama: '\u0C4D',
  sonstige: {
    '\u0C02': 'n', '\u0C03': 'h',
    '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
    '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
  },
});

// --- Sinhala ---
const SINHALA = baueSchema({
  konsonanten: {
    'ක': 'k', 'ඛ': 'kh', 'ග': 'g', 'ඝ': 'gh', 'ඞ': 'ng',
    'ච': 'ch', 'ඡ': 'chh', 'ජ': 'j', 'ඣ': 'jh', 'ඤ': 'ny',
    'ට': 't', 'ඨ': 'th', 'ඩ': 'd', 'ඪ': 'dh', 'ණ': 'n',
    'ත': 't', 'ථ': 'th', 'ද': 'd', 'ධ': 'dh', 'න': 'n',
    'ප': 'p', 'ඵ': 'ph', 'බ': 'b', 'භ': 'bh', 'ම': 'm',
    'ය': 'y', 'ර': 'r', 'ල': 'l', 'ව': 'v',
    'ශ': 'sh', 'ෂ': 'sh', 'ස': 's', 'හ': 'h', 'ළ': 'l', 'ෆ': 'f',
  },
  matras: {
    '\u0DCF': 'aa', '\u0DD2': 'i', '\u0DD3': 'ii', '\u0DD4': 'u', '\u0DD6': 'uu',
    '\u0DD8': 'ri', '\u0DD9': 'e', '\u0DDA': 'ee', '\u0DDB': 'ai', '\u0DDC': 'o',
    '\u0DDD': 'oo', '\u0DDE': 'au',
  },
  unabhaengigeVokale: {
    'අ': 'a', 'ආ': 'aa', 'ඇ': 'ae', 'ඈ': 'aae', 'ඉ': 'i', 'ඊ': 'ii',
    'උ': 'u', 'ඌ': 'uu', 'ඍ': 'ri', 'එ': 'e', 'ඒ': 'ee', 'ඓ': 'ai',
    'ඔ': 'o', 'ඕ': 'oo', 'ඖ': 'au',
  },
  virama: '\u0DCA',
  sonstige: {
    '\u0D82': 'n',
  },
});

const SCHEMA_NACH_SPRACHCODE = {
  'hi-IN': DEVANAGARI,
  'ne-NP': DEVANAGARI,
  'bn-IN': BENGALI,
  'gu-IN': GUJARATI,
  'pa-IN': GURMUKHI,
  'kn-IN': KANNADA,
  'ta-LK': TAMIL,
  'te-IN': TELUGU,
  'si-LK': SINHALA,
};

/** Ob für einen Sprachcode ein indisches Umschrift-Schema hinterlegt ist. */
export function hatIndischesSchema(code) {
  return Object.prototype.hasOwnProperty.call(SCHEMA_NACH_SPRACHCODE, code);
}

/**
 * Transliteriert einen Text aus einer der abgedeckten indischen Schriften
 * gemäß der Konsonant+Matra/Virama-Logik der jeweiligen Schrift.
 * @param {string} text
 * @param {string} code - Sprachcode, z. B. "hi-IN"
 * @returns {string}
 */
export function transliteriereIndischeSchrift(text, code) {
  const schema = SCHEMA_NACH_SPRACHCODE[code];
  if (!schema) return text;

  const { konsonanten, matras, unabhaengigeVokale, virama, sonstige } = schema;
  const zeichen = Array.from(text);
  let ergebnis = '';
  let i = 0;

  while (i < zeichen.length) {
    const aktuelles = zeichen[i];

    if (Object.prototype.hasOwnProperty.call(konsonanten, aktuelles)) {
      const naechstes = zeichen[i + 1];
      if (naechstes === virama) {
        ergebnis += konsonanten[aktuelles];
        i += 2;
        continue;
      }
      if (naechstes && Object.prototype.hasOwnProperty.call(matras, naechstes)) {
        ergebnis += konsonanten[aktuelles] + matras[naechstes];
        i += 2;
        continue;
      }
      ergebnis += konsonanten[aktuelles] + 'a';
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(unabhaengigeVokale, aktuelles)) {
      ergebnis += unabhaengigeVokale[aktuelles];
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(sonstige, aktuelles)) {
      ergebnis += sonstige[aktuelles];
      i += 1;
      continue;
    }

    // Unbekanntes Zeichen (Satzzeichen, Ziffern, Leerzeichen, seltene
    // Konjunkte) unverändert durchreichen; der finale ASCII-Sicherheitsnetz-
    // Schritt in asciiSanitizer.js entfernt am Ende alles Nicht-ASCII.
    ergebnis += aktuelles;
    i += 1;
  }

  return ergebnis;
}
