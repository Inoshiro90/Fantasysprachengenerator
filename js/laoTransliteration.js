/**
 * laoTransliteration.js
 * Umschrift von Laotisch nach lateinischer Näherung (LC-Methode, Library
 * of Congress), wie sie auch das englische Wiktionary verwendet.
 *
 * HERKUNFT UND LIZENZ: Dieses Modul ist eine sorgfältige Portierung von
 * Wiktionarys "Module:lo-translit"
 * (https://en.wiktionary.org/wiki/Module:lo-translit), von Lua nach
 * JavaScript. Anders als die zuletzt geprüften Repos (Dzongkha, Khmer-
 * Tastatur, koptischer Transliterator) trägt dieser Quellcode eine klare,
 * bekannte Lizenz: Wikimedia-Projekte inkl. Wiktionary stehen standard-
 * mäßig unter CC BY-SA 4.0 (Namensnennung + Weitergabe unter gleichen
 * Bedingungen). Diese Datei ist daher als Bearbeitung im Sinne von CC
 * BY-SA zu verstehen:
 *   - Namensnennung: Ursprungsautor:innen von Wiktionary "Module:lo-
 *     translit" (siehe Versionsgeschichte der verlinkten Seite).
 *   - Weitergabe unter gleichen Bedingungen: Wird DIESE Datei
 *     weiterverbreitet, sollte sie ebenfalls unter CC BY-SA 4.0 (oder
 *     einer kompatiblen Lizenz) stehen.
 *
 * Die Umschriftregeln selbst basieren auf dem LC-System (Library of
 * Congress), das auch das laotische Wiktionary verwendet.
 *
 * WARUM EINE PORTIERUNG (statt Neuentwicklung wie bei Dzongkha/Khmer/
 * Koptisch)? Weil hier - anders als dort - eine tatsächliche
 * Nutzungserlaubnis vorliegt (CC BY-SA statt "keine Lizenz gefunden").
 * Die Portierung lohnt sich zudem inhaltlich: Der Algorithmus löst über
 * eine echte silbenweise Zerlegung mit Vorschau auf Nachbarzeichen genau
 * das Problem, an dem die Umschrift für Khmer/Dzongkha in diesem Projekt
 * nur näherungsweise arbeiten konnte (ob ein mehrdeutiger Buchstabe
 * Endkonsonant der aktuellen oder Anlaut der nächsten Silbe ist).
 *
 * HINWEIS ZU TÖNEN: Laotisch ist tonal, aber wie im Original-Modul (und
 * wie im gesamten Wiktionary-Sprachgebrauch für Laotisch üblich, siehe
 * Diskussion auf der zugehörigen Modul-Diskussionsseite) werden Töne
 * NICHT in der Umschrift markiert - die Konsonantenklassen-Tabelle
 * (cons_class) ist zwar vorhanden (Konsonanten sind je nach Klasse
 * relevant für die Tonbestimmung), wird aber - identisch zum Original -
 * für die Ausgabe nicht verwendet.
 */

// --- Zeichentabellen (unverändert aus der Quelle übernommen, siehe
// Moduldoku zur Lizenz) ---

// Anlaut-Konsonanten (inkl. ຫ-Digraphen und Konsonant+Gleitlaut-Cluster).
const ANLAUT = {
  'ກ': 'k', 'ຂ': 'kh', 'ຄ': 'kh', 'ງ': 'ng',
  'ຈ': 'ch', 'ສ': 's', 'ຊ': 's', 'ຍ': 'ny',
  'ດ': 'd', 'ຕ': 't', 'ຖ': 'th', 'ທ': 'th', 'ນ': 'n',
  'ບ': 'b', 'ປ': 'p', 'ຜ': 'ph', 'ຝ': 'f', 'ພ': 'ph', 'ຟ': 'f', 'ມ': 'm',
  'ຢ': 'y', 'ຣ': 'r', 'ລ': 'l', 'ວ': 'w',
  'ຫ': 'h', 'ອ': 'ʼ', 'ຮ': 'h',

  'ຫງ': 'ng',
  'ຫຍ': 'ny',
  'ຫນ': 'n', 'ໜ': 'n',
  'ຫມ': 'm', 'ໝ': 'm',
  'ຫຣ': 'r',
  'ຫລ': 'l', 'ຫຼ': 'l',
  'ຫວ': 'w',

  'ກຣ': 'kr', 'ກລ': 'kl',
  'ຂຣ': 'khr', 'ຄຣ': 'khr', 'ຂລ': 'khl', 'ຄລ': 'khl',
  'ປຣ': 'pr', 'ປລ': 'pl',
  'ພຣ': 'phr', 'ຟຣ': 'fr', 'ພລ': 'phl', 'ຟລ': 'fl',
  'ດຣ': 'dr', 'ຕຣ': 'tr',
};

// Gleitlaut.
const GLEITLAUT = { 'ຼ': 'r' };

// Vokalkombinationen.
const VOKAL = {
  'ະ': 'a', 'ັ': 'a',
  'ິ': 'i',
  'ຶ': 'ư', 'ຸ': 'u', 'ຸຍ': 'ui',
  'ເະ': 'e', 'ເັ': 'e',
  'ແະ': 'æ', 'ແັ': 'æ',
  'ໂະ': 'o', 'ົ': 'o',
  'ເາະ': 'ǫ', 'ັອ': 'ǫ',
  'ເິ': 'œ',
  'ເັຍ': 'ia', 'ັຽ': 'ia',
  'ເຶອ': 'ưa',
  'ົວະ': 'ua', 'ັວ': 'ua', 'ວັ': 'ua',
  'ໄ': 'ai', 'ໃ': 'ai', 'ັຍ': 'ai',
  'ເົາ': 'ao',
  'ົາວ': 'uau',
  'ຳ': 'am', 'ໍາ': 'am',
  'ວຳ': 'uam',

  'າ': 'ā',
  'າວ': 'āo',
  'ີ': 'ī',
  'ື': 'ư̄',
  'ູ': 'ū',
  'ເ': 'ē',
  'ແ': 'ǣ',
  'ໂ': 'ō',
  'ໂຍ': 'ōi', 'ໂຽ': 'ōi',
  'ໍ': 'ǭ', 'ອ': 'ǭ',
  'ອຍ': 'ǭi', 'ອຽ': 'ǭi',
  'ເີ': 'œ̄',
  'ເີຽ': 'œ̄i', 'ເີຍ': 'œ̄i',
  'ເຍ': 'īa', 'ເັຽ': 'īa', 'ຽ': 'īa',
  'ເືອ': 'ư̄a', 'ເືອຍ': 'ư̄ai',
  'ົວ': 'ūa', 'ວ': 'ūa',
  'ວຍ': 'uāi', 'ວຽ': 'uāi',
  'າຍ': 'āi', 'າຽ': 'āi',
  'ວາ': 'uā',
  'ວາຍ': 'uāi', 'ວາຽ': 'uāi',
  'ແວ': 'ǣu',
  'ີວ': 'īu', 'ິວ': 'iu',
  'ຽວ': 'iāu',
  'ວີວ': 'uīu',
};

// Endkonsonanten (Koda).
const KODA = {
  'ກ': 'k', 'ຂ': 'k', 'ຄ': 'k',
  'ງ': 'ng',
  'ຈ': 't', 'ຊ': 't',
  'ດ': 't', 'ຕ': 't', 'ຖ': 't', 'ທ': 't',
  'ສ': 's',
  'ນ': 'n',
  'ບ': 'p', 'ປ': 'p', 'ພ': 'p', 'ຟ': 'p',
  'ມ': 'm',
  'ຢ': 'y',
  'ຣ': 'n', 'ລ': 'n',
  'ວ': 'w',
  '': '',
};

// Sonderzeichen (Iteration/Streichung/Ziffern).
const SONDERZEICHEN = {
  'ຯ': '〃', 'ໆ': '〃',
  '໌': '',
  '໐': '0', '໑': '1', '໒': '2', '໓': '3', '໔': '4',
  '໕': '5', '໖': '6', '໗': '7', '໘': '8', '໙': '9',
};

// Zeichentyp-Klassifikation (steuert die Silbentrennung).
const ZEICHENTYP = {
  'ກ': 'koda', 'ຂ': 'koda', 'ຄ': 'koda', 'ງ': 'koda',
  'ຈ': 'koda', 'ຊ': 'koda', 'ຍ': 'mehrdeutig',
  'ດ': 'koda', 'ຕ': 'koda', 'ຖ': 'koda', 'ທ': 'koda', 'ນ': 'koda',
  'ບ': 'koda', 'ປ': 'koda', 'ຜ': 'konsonant', 'ຝ': 'konsonant', 'ພ': 'koda', 'ຟ': 'koda', 'ມ': 'koda',
  'ຢ': 'koda', 'ຣ': 'koda', 'ລ': 'koda', 'ວ': 'mehrdeutig',
  'ສ': 'koda', 'ຫ': 'konsonant', 'ອ': 'mehrdeutig', 'ຮ': 'konsonant',
  'ໜ': 'konsonant', 'ໝ': 'konsonant',
  'ຯ': 'iterationszeichen',
  'ະ': 'vokalbuchstabe', 'ັ': 'suffixvokal', 'າ': 'vokalbuchstabe', 'ຳ': 'suffixvokal',
  'ິ': 'suffixvokal', 'ີ': 'suffixvokal', 'ຶ': 'suffixvokal', 'ື': 'suffixvokal',
  'ຸ': 'suffixvokal', 'ູ': 'suffixvokal', 'ົ': 'suffixvokal',
  'ຼ': 'gleitlaut',
  'ຽ': 'vokalbuchstabe',
  'ເ': 'praefixvokal', 'ແ': 'praefixvokal',
  'ໂ': 'praefixvokal', 'ໃ': 'praefixvokal', 'ໄ': 'praefixvokal',
  'ໆ': 'iterationszeichen',
  '່': 'ton', '້': 'ton', '໊': 'ton', '໋': 'ton',
  '໌': 'streichungszeichen', 'ໍ': 'suffixvokal',
  '໐': 'ziffer', '໑': 'ziffer', '໒': 'ziffer', '໓': 'ziffer', '໔': 'ziffer',
  '໕': 'ziffer', '໖': 'ziffer', '໗': 'ziffer', '໘': 'ziffer', '໙': 'ziffer',
};

const LAOTISCH_SPRACHCODES = new Set(['lo-LA']);

/** Ob für einen Sprachcode die laotische Umschrift zuständig ist. */
export function hatLaotischesSchema(code) {
  return LAOTISCH_SPRACHCODES.has(code);
}

// Das LC-System nutzt Sonderbuchstaben (Länge per Makron, ư/œ/æ/ǫ als
// eigene Vokalqualitäten), die vom asciiSanitizer.js-Schritt nach der
// Umschrift entfernt würden - teils sogar ersatzlos, da z. B. "œ" keine
// zerlegbare Unicode-Normalform hat und nicht wie ein akzentuierter
// Buchstabe auf seine Basis zurückfallen würde, sondern komplett
// verschwände. Deshalb werden diese Zeichen hier auf ASCII-sichere
// Ersatzschreibweisen abgebildet - Länge weiterhin per Verdopplung
// (konsistent mit den anderen Modulen dieses Projekts), eigene
// Vokalqualitäten mit einer festen zweibuchstabigen Ersatzschreibweise.
// Längere/kombinierte Sequenzen zuerst, damit z. B. "œ̄" nicht erst als
// "œ" (ohne Makron) fehlinterpretiert wird.
const ASCII_ERSATZ = [
  ['œ̄', 'eeu'], ['ư̄', 'uue'],
  ['ǣ', 'aae'], ['ǭ', 'oor'],
  ['ā', 'aa'], ['ī', 'ii'], ['ū', 'uu'], ['ē', 'ee'], ['ō', 'oo'],
  ['ư', 'ue'], ['ǫ', 'or'], ['œ', 'eu'], ['æ', 'ae'],
  ['ʼ', "'"], // Glottalverschluss (ອ) als ASCII-Apostroph statt Modifikatorbuchstabe
];

function ersetzeDurchAsciiSicher(text) {
  let ergebnis = text;
  for (const [von, nach] of ASCII_ERSATZ) {
    ergebnis = ergebnis.split(von).join(nach);
  }
  return ergebnis;
}

function neueSilbe() {
  return { ganz: [], anlaut: [], gleitlaut: [], vokal: [], ton: [], koda: [], sonder: [] };
}

/** Zerlegt zusammenhängenden laotischen Text in Silben (Portierung von
 * split_syll() aus Module:lo-translit).
 *
 * FIX (gegenüber dem ursprünglich portierten Stand): Die drei Zweige, die
 * einen weiteren Konsonanten zu einem bestehenden Digraph-Anlaut hinzufügen
 * können (z. B. ຫ+ລ -> "ຫລ" = l), prüften ursprünglich nicht, ob die
 * aktuelle Silbe bereits ein Tonzeichen hat. Ein Tonzeichen schließt die
 * Anlautbildung der aktuellen Silbe aber immer ab (es kommt im
 * geschriebenen Laotisch nach dem vollständigen Anlaut) - ohne diese
 * Prüfung wurde faelschlich der Anlaut eines bereits abgeschlossenen
 * Silbe um den Anlautkonsonanten der NÄCHSTEN Silbe erweitert (z. B.
 * "ໃຫ້" + "ລາວ" -> fälschlich EINE Silbe mit Anlaut "ຫລ" statt zwei
 * getrennte Silben "hai" + "laao"). Das fuehrte u. a. zu Silben, deren
 * Vokal beim Zusammenbau nicht mehr zur (falsch erweiterten) Anlaut-/
 * Vokal-Kombination passte und daher als nackter Konsonant ohne Vokal in
 * der Ausgabe landete (z. B. "t", "l") - im Laotischen unmöglich, da jede
 * Silbe einen Vokal braucht. Als zusätzliches Sicherheitsnetz gegen genau
 * dieses Symptom nimmt silbenZuText() unten ausserdem einen impliziten
 * Vokal "a" an, falls trotz vorhandenem Anlaut/Koda gar kein Vokal
 * zugeordnet werden konnte. */
function zerlegeInSilben(text) {
  const silben = [];
  let aktuelleSilbe = neueSilbe();

  const speichernUndZuruecksetzen = () => {
    silben.push(aktuelleSilbe);
    aktuelleSilbe = neueSilbe();
  };

  for (const lauftext of text.match(/[\u0E81-\u0EDD]+/gu) ?? []) {
    const c = Array.from(lauftext);
    const typen = c.map((zeichen) => ZEICHENTYP[zeichen]);

    for (let i = 0; i <= c.length; i += 1) {
      const typAktuell = typen[i];
      const typNaechstes = typen[i + 1];
      const vokalGesamt = aktuelleSilbe.vokal.join('');

      if (i === c.length) {
        // Ende des zusammenhängenden Textlaufs: nur noch abschließen.
        if (aktuelleSilbe.ganz.length !== 0) {
          speichernUndZuruecksetzen();
        }
        continue;
      }

      if (typAktuell === 'praefixvokal') {
        if (aktuelleSilbe.ganz.length !== 0) {
          speichernUndZuruecksetzen();
        }
        aktuelleSilbe.vokal.push(c[i]);
        aktuelleSilbe.ganz.push(c[i]);
      } else if (typAktuell === 'gleitlaut') {
        aktuelleSilbe.gleitlaut.push(c[i]);
        aktuelleSilbe.ganz.push(c[i]);
      } else if (typAktuell === 'suffixvokal' || typAktuell === 'vokalbuchstabe') {
        aktuelleSilbe.vokal.push(c[i]);
        aktuelleSilbe.ganz.push(c[i]);
      } else if (typAktuell === 'ton') {
        aktuelleSilbe.ton.push(c[i]);
        aktuelleSilbe.ganz.push(c[i]);
      } else if (typAktuell === 'koda') {
        const bisherigerAnlaut = aktuelleSilbe.anlaut.join('');
        if (
          aktuelleSilbe.koda.length === 0 &&
          aktuelleSilbe.ton.length === 0 &&
          Object.prototype.hasOwnProperty.call(ANLAUT, bisherigerAnlaut + c[i]) &&
          (aktuelleSilbe.vokal.length === 0 || ZEICHENTYP[vokalGesamt] === 'praefixvokal')
        ) {
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else if (
          aktuelleSilbe.koda.length === 0 &&
          aktuelleSilbe.anlaut.length !== 0 &&
          typNaechstes !== 'gleitlaut' && typNaechstes !== 'suffixvokal' &&
          typNaechstes !== 'vokalbuchstabe' && typNaechstes !== 'ton' &&
          !(typNaechstes === 'mehrdeutig' && (typen[i + 2] === 'koda' || typen[i + 2] === 'konsonant')) &&
          !(
            typen[i - 1] !== 'ton' && typen[i - 1] !== 'suffixvokal' && c[i - 1] !== 'ອ' &&
            typNaechstes === 'mehrdeutig' && (c[i + 2] === 'ຍ' || c[i + 2] === 'າ')
          )
        ) {
          aktuelleSilbe.koda.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else {
          speichernUndZuruecksetzen();
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        }
      } else if (typAktuell === 'konsonant') {
        const bisherigerAnlaut = aktuelleSilbe.anlaut.join('');
        if (
          aktuelleSilbe.koda.length === 0 &&
          aktuelleSilbe.ton.length === 0 &&
          Object.prototype.hasOwnProperty.call(ANLAUT, bisherigerAnlaut + c[i]) &&
          (aktuelleSilbe.vokal.length === 0 || ZEICHENTYP[vokalGesamt] === 'praefixvokal')
        ) {
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else {
          speichernUndZuruecksetzen();
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        }
      } else if (typAktuell === 'mehrdeutig') {
        if (aktuelleSilbe.ganz.length > 0 && c[i] === 'ອ' && typNaechstes === 'suffixvokal') {
          speichernUndZuruecksetzen();
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else if (
          (aktuelleSilbe.anlaut.length === 0 || ZEICHENTYP[vokalGesamt] === 'praefixvokal') &&
          aktuelleSilbe.ton.length === 0 &&
          aktuelleSilbe.koda.length === 0
        ) {
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else if (c[i] === 'ຍ' && c[i - 1] === 'າ') {
          aktuelleSilbe.vokal.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else if (c[i] === 'ຍ' && c[i - 1] !== 'ຫ' && vokalGesamt.length === 0) {
          speichernUndZuruecksetzen();
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else if (
          aktuelleSilbe.anlaut.length !== 0 &&
          (vokalGesamt.length === 0 ||
            (Object.prototype.hasOwnProperty.call(VOKAL, vokalGesamt + c[i]) &&
              typNaechstes !== 'gleitlaut' && typNaechstes !== 'suffixvokal' &&
              typNaechstes !== 'vokalbuchstabe' && typNaechstes !== 'ton'))
        ) {
          aktuelleSilbe.vokal.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        } else {
          speichernUndZuruecksetzen();
          aktuelleSilbe.anlaut.push(c[i]);
          aktuelleSilbe.ganz.push(c[i]);
        }
      } else if (typAktuell === 'iterationszeichen' || typAktuell === 'streichungszeichen') {
        aktuelleSilbe.ganz.push(c[i]);
        aktuelleSilbe.sonder.push(c[i]);
      } else if (typAktuell === 'ziffer') {
        if (
          aktuelleSilbe.anlaut.length !== 0 || aktuelleSilbe.gleitlaut.length !== 0 ||
          aktuelleSilbe.vokal.length !== 0 || aktuelleSilbe.ton.length !== 0 ||
          aktuelleSilbe.koda.length !== 0
        ) {
          speichernUndZuruecksetzen();
        }
        aktuelleSilbe.ganz.push(c[i]);
        aktuelleSilbe.sonder.push(c[i]);
      }
    }
  }

  return silben;
}

/**
 * Transliteriert laotische Schrift nach lateinischer Näherung. Text
 * außerhalb des laotischen Schriftbereichs (Leerzeichen, Ziffern,
 * bereits lateinischer Text, Satzzeichen) bleibt unverändert erhalten -
 * anders als im Wiktionary-Original, das nur auf reinen Lao-Textabschnitten
 * arbeitet, muss dieses Modul hier auch mit gemischtem Text umgehen
 * können (siehe Aufrufer in transliterationClient.js).
 * @param {string} text
 * @returns {string}
 */
export function transliteriereLaotisch(text) {
  return text.replace(/[\u0E81-\u0EDD]+/gu, (lauftext) => {
    const silben = zerlegeInSilben(lauftext);
    return ersetzeDurchAsciiSicher(silbenZuText(silben));
  });
}

/** Setzt die vorbereiteten Silben (siehe zerlegeInSilben()) zu einem
 * lateinischen Text zusammen (Portierung des Rests von tr() aus
 * Module:lo-translit). */
function silbenZuText(silben) {
  const teile = [];

  for (const silbe of silben) {
    // ຫຼ-Sonderfall: als zusammengehöriger Anlaut behandeln.
    if (silbe.anlaut.join('') === 'ຫ' && silbe.gleitlaut.join('') === 'ຼ') {
      silbe.anlaut = ['ຫ', 'ຼ'];
      silbe.gleitlaut = [];
    }
    // Kein Vokalzeichen bei vorhandenem Anlaut -> impliziter Vokal "ະ".
    if (silbe.anlaut.join('') !== '' && silbe.vokal.join('') === '') {
      silbe.vokal = ['ະ'];
    }

    // ວ/ຍ am Ende des (mehrdeutigen) Anlauts gehören eigentlich zum Vokal -
    // AUSSER die Kombination ist selbst ein gültiger Digraph-Anlaut (z. B.
    // "ຫຍ"/"ຫວ", siehe ANLAUT-Tabelle oben). Ohne diese Prüfung wurde ein
    // korrekt gebildeter Digraph wie "ຫຍ" (aus ໃຫຍ່ "groß") hier wieder
    // auseinandergerissen: ຍ landete faelschlich im Vokal, wo es mit dem
    // vorangestellten ໃ keine gueltige Vokalkombination mehr ergab - Folge
    // war ein durch das Sicherheitsnetz oben verdeckter Bedeutungsverlust
    // (anlaut='h'+impliziter Vokal 'a' = "ha" statt korrekt "nyai").
    if (
      silbe.anlaut.length > 1 &&
      silbe.anlaut[silbe.anlaut.length - 1] === 'ວ' &&
      !Object.prototype.hasOwnProperty.call(ANLAUT, silbe.anlaut.join(''))
    ) {
      silbe.anlaut.pop();
      silbe.vokal.push('ວ');
    }
    if (
      silbe.anlaut.length > 1 &&
      silbe.anlaut[silbe.anlaut.length - 1] === 'ຍ' &&
      !Object.prototype.hasOwnProperty.call(ANLAUT, silbe.anlaut.join(''))
    ) {
      silbe.anlaut.pop();
      silbe.vokal.push('ຍ');
    }
    // ຍ nach ຫ gehört eigentlich zum Anlaut, nicht zum Vokal.
    if (silbe.vokal.length > 1 && silbe.vokal[0] === 'ຍ' && silbe.anlaut[0] === 'ຫ') {
      silbe.vokal.shift();
      silbe.anlaut.push('ຍ');
    }

    const anlautStr = silbe.anlaut.join('');
    const vokalStr = silbe.vokal.join('');
    const kodaStr = silbe.koda.join('');

    const anlaut = ANLAUT[anlautStr] ?? '';
    const gleitlaut = GLEITLAUT[silbe.gleitlaut.join('')] ?? '';
    let vokal = VOKAL[vokalStr] ?? '';
    const koda = KODA[kodaStr] ?? '';
    let sonder = '';
    for (const zeichen of silbe.ganz.join('')) {
      sonder += SONDERZEICHEN[zeichen] ?? '';
    }

    // Kontextabhängige Sonderfälle bei bestimmten Vokal+Anlaut/Koda-Kombinationen.
    if (/[ກຂຄງຈສຊຖທລອຮ]/.test(anlautStr) && vokalStr === 'ແວ' && koda !== '') {
      vokal = 'uǣ';
    }
    if (anlautStr === 'ຫ' && vokalStr === 'ວຍ') {
      vokal = 'ūai';
    }
    if (kodaStr === 'ນ' && vokalStr === 'ວຽ') {
      vokal = 'uīa';
    }

    // Sicherheitsnetz: Sollte trotz obiger Regeln (z. B. durch eine noch
    // unbekannte Vokalkombination, die nicht in der VOKAL-Tabelle steht)
    // ein Silbenrest ohne jeden Vokal übrig bleiben, obwohl ein Anlaut
    // oder eine Koda vorhanden ist, wird ersatzweise der implizite Vokal
    // "a" (wie bei fehlendem Vokalzeichen, siehe oben "ະ") angenommen.
    // Ein Konsonant ganz ohne Vokal ist im Laotischen nicht aussprechbar
    // und soll daher nie in der Ausgabe auftauchen.
    if (vokal === '' && (anlaut !== '' || koda !== '')) {
      vokal = 'a';
    }

    let silbenText = anlaut + gleitlaut + vokal + koda + sonder;

    const sonderZeichenText = silbe.sonder.join('');
    if (sonderZeichenText.includes('\u0ecc')) {
      // Streichungszeichen (໌, markiert einen stummen Buchstaben in
      // Pali-/Sanskrit-Lehnwörtern, meist am Silbenende): letztes Zeichen
      // der Umschrift weglassen statt (wie im Wiktionary-Original) nur
      // optisch als "gestrichen" darzustellen - für reinen Text ohne
      // HTML-Rendering ist das Weglassen die passende Entsprechung.
      silbenText = silbenText.slice(0, -1);
    }

    if (/[ຯໆ]/.test(sonderZeichenText) && (anlaut !== '' || gleitlaut !== '' || vokal !== '' || koda !== '')) {
      // Iterationszeichen (ຯ/ໆ, "wiederhole die vorige Silbe/das vorige
      // Wort"): Silbe im Klartext wiederholen statt (wie im Original) nur
      // optisch unterstrichen darzustellen.
      const bereinigt = silbenText.replace('〃', '');
      teile.push(bereinigt);
      teile.push(bereinigt);
    } else {
      teile.push(silbenText);
    }
  }

  return teile.join(' ');
}
