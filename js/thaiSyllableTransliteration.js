/**
 * thaiSyllableTransliteration.js
 *
 * Silbenbasierte Umschrift fuer Thailaendisch - ersetzt die fruehere reine
 * Zeichen-fuer-Zeichen-Karte (THAI_MAP) samt nachtraeglicher Regex-
 * Vorverarbeitung fuer Einzelfaelle (ว-als-Vokal, fuehrende Vokale) durch
 * einen echten Silbenparser, strukturell analog zu laoTransliteration.js.
 *
 * WARUM: Thailaendisch (wie Lao) schreibt Vokale nicht immer in
 * Lautreihenfolge - fuenf Vokalzeichen (เ,แ,โ,ใ,ไ) stehen VOR dem
 * Konsonanten, werden aber DANACH gesprochen, und koennen sich zusaetzlich
 * mit einem Zeichen am Silbenende zu einer eigenen Vokalkombination
 * verbinden (z. B. เ-ีย, เ-ือ, เ-อ/เ-ิ, เ-า, เ-าะ). Eine reine Zeichenkarte
 * kann weder die Umstellung noch diese Kombinationen abbilden. Ausserdem
 * ist stumme Klassenanhebung (ห/อ vor bestimmten Konsonanten, "Ho Nam")
 * ohne Kontext nicht erkennbar, und Finalkonsonanten haben im Thailaendischen
 * einen ANDEREN, kleineren Lautbestand als Anlaut-Konsonanten (z. B. ส als
 * Auslaut klingt "t", nicht "s").
 *
 * ARCHITEKTUR: parseNaechsteThaiSilbe() liest ab einer Position GENAU EINE
 * Silbe (fuehrender Vokal? -> Anlaut(-Cluster)? -> Vokal(-Kombination)? ->
 * Finalkonsonant?) und gibt Umschrift + Anzahl konsumierter Zeichen zurueck.
 * transliteriereThailaendischSilbenweise() treibt diese Funktion ueber den
 * gesamten (bereits von thaiWordSegmentation.js mit Wortgrenzen-Leerzeichen
 * angereicherten) Text; nicht-thailaendische Zeichen (Leerraum, lateinische
 * Interpunktion, thailaendische Satzzeichen/Ziffern) werden dabei einzeln
 * durchgereicht bzw. ueber PUNKT_UND_ZIFFERN aufgeloest.
 *
 * BEKANNTE GRENZEN (dokumentierte Naeherung, siehe auch einzelne Kommentare
 * unten):
 *  - Die Mehrdeutigkeit "gehoert ein Konsonant nach einem OFFENEN langen
 *    Vokal noch zu dieser Silbe (Finalkonsonant) oder schon zur naechsten
 *    (neuer Anlaut)?" wird nur heuristisch aufgeloest (siehe
 *    brauchtEigenenVokal() unten) - keine echte woerterbuchgestuetzte
 *    Silbentrennung wie bei Lao/Khmer.
 *  - Lexikalische Sonderfaelle wie stumme Endkonsonanten ohne Thanthakhat-
 *    Markierung (z. B. das stumme ย in ไทย) oder implizite verkuerzte
 *    Vokale in Sanskrit-/Pali-Lehnwoertern (z. B. ผล "phon", nicht aus der
 *    Schreibung ableitbar) werden nicht erkannt.
 *  - ฤ/ฦ bleiben wie zuvor eine RTGS-Naeherung ("rue"/"lue") ohne
 *    kontextabhaengige rue/ri/roe-Unterscheidung.
 */

// --- Anlaut (Konsonant in Erstposition) ---
const THAI_ANLAUT = {
  'ก': 'k', 'ข': 'kh', 'ฃ': 'kh', 'ค': 'kh', 'ฅ': 'kh', 'ฆ': 'kh', 'ง': 'ng',
  'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch', 'ญ': 'y',
  'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th', 'ณ': 'n',
  'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th', 'น': 'n',
  'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph',
  'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
  'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l', 'อ': '', 'ฮ': 'h',
};

// --- Auslaut (Finalkonsonant) - im Thailaendischen ein DEUTLICH kleinerer
// Lautbestand als im Anlaut: viele verschiedene Konsonantenbuchstaben
// (historisch/etymologisch bedingt) klingen als Auslaut alle gleich, z. B.
// ส/ศ/ษ/จ/ช/ซ/ฌ/ฎ/ฏ/ฐ/ฑ/ฒ/ด/ต/ถ/ท/ธ klingen als Auslaut alle "t", nicht wie
// in Anlautposition. Eine reine Wiederverwendung von THAI_ANLAUT wuerde
// hier systematisch falsche Laute erzeugen (deshalb eigene Tabelle).
const THAI_AUSLAUT = {
  'ก': 'k', 'ข': 'k', 'ค': 'k', 'ฆ': 'k',
  'ง': 'ng',
  'จ': 't', 'ช': 't', 'ซ': 't', 'ฌ': 't', 'ฎ': 't', 'ฏ': 't', 'ฐ': 't',
  'ฑ': 't', 'ฒ': 't', 'ด': 't', 'ต': 't', 'ถ': 't', 'ท': 't', 'ธ': 't',
  'ศ': 't', 'ษ': 't', 'ส': 't',
  'ญ': 'n', 'ณ': 'n', 'น': 'n', 'ร': 'n', 'ล': 'n', 'ฬ': 'n',
  'บ': 'p', 'ป': 'p', 'พ': 'p', 'ฟ': 'p', 'ภ': 'p',
  'ม': 'm',
  'ย': 'y',
  'ว': 'w',
};

// Nicht-lautliche Zeichen (Satzzeichen, Ziffern, Waehrungssymbol) - siehe
// Herleitung/Belege im vorherigen THAI_MAP-Kommentar (Bugreports zu ็, ฯ,
// ฤ/ฦ, ๆ, ฿ etc.), hier unveraendert uebernommen.
const PUNKT_UND_ZIFFERN = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
  '฿': 'baht',
  '่': '', '้': '', '๊': '', '๋': '', '์': '', '็': '', 'ฺ': '', '๎': '',
  'ฯ': '', '๏': '', '๚': '', '๛': '',
};

const THAI_FUEHRENDE_VOKALE = new Set(['เ', 'แ', 'โ', 'ใ', 'ไ']);
const THAI_TONZEICHEN = new Set(['่', '้', '๊', '๋']);

// Fuer die Koda-Mehrdeutigkeits-Heuristik (siehe brauchtEigenenVokal()
// unten): alle Zeichen, die anzeigen, dass der VORANGEHENDE Konsonant
// eigentlich der Anlaut einer NEUEN Silbe ist (weil er selbst gleich ein
// eigenes Vokalzeichen bekommt), statt Finalkonsonant der aktuellen Silbe.
const THAI_VOKALZEICHEN_NACH_KONSONANT = new Set([
  'ะ', 'า', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'ำ', 'ั', 'อ', 'ๅ',
]);

const THAI_HONAM_PARTNER = new Set(['ง', 'ญ', 'น', 'ม', 'ย', 'ร', 'ล', 'ว']);
// Gueltige Anlaut-Cluster sind KEIN freies Kreuzprodukt: ร/ล kombinieren
// sich mit einer groesseren Konsonantenmenge, ว dagegen NUR mit ก/ข/ค
// (กว/ขว/คว). ป/ต/ผ/พ/ฟ + ว existiert in echten Thai-Woertern nicht - das
// waere sonst faelschlich als Cluster gelesen worden, obwohl es sich in
// Woertern wie ปวด ("puat") um das ว-als-Vokal-Muster (siehe unten)
// handelt, keinen Anlaut-Cluster (Bugreport: "pwat" statt "puat").
const THAI_CLUSTER_RL_ERSTKONSONANTEN = new Set(['ก', 'ข', 'ค', 'ต', 'ป', 'ผ', 'พ', 'ฟ']);
const THAI_CLUSTER_ZWEITKONSONANTEN_RL = new Set(['ร', 'ล']);
const THAI_CLUSTER_W_ERSTKONSONANTEN = new Set(['ก', 'ข', 'ค']);

function istThaiKonsonant(z) {
  return z !== undefined && Object.prototype.hasOwnProperty.call(THAI_ANLAUT, z);
}

/** Ueberspringt ein direkt an dieser Position stehendes Tonzeichen (kann
 * je nach Wort vor ODER nach den eigentlichen Vokalzeichen kodiert sein)
 * und liefert die neue Position. Tonzeichen werden - wie ueberall sonst
 * im Projekt - nicht in der ASCII-Ausgabe dargestellt. */
function ueberspringeTon(zeichen, i) {
  return THAI_TONZEICHEN.has(zeichen[i]) ? i + 1 : i;
}

/** Heuristik fuer die Koda-Mehrdeutigkeit: ein Konsonant nach einem
 * abgeschlossenen (offenen, langen) Vokal ist nur dann Finalkonsonant DIESER
 * Silbe, wenn er nicht seinerseits gleich ein eigenes Vokalzeichen bekommt -
 * bekommt er eines, ist er stattdessen der Anlaut der NAECHSTEN Silbe.
 * Analog zur echten Wortlisten-Silbentrennung bei Lao/Khmer, aber ohne
 * Woerterbuch nur eine Naeherung (siehe Moduldoku). */
function brauchtEigenenVokal(zeichen, i) {
  let j = i + 1;
  if (THAI_TONZEICHEN.has(zeichen[j])) j += 1;
  const danach = zeichen[j];
  // WICHTIG: fuehrende Vokale (เ/แ/โ/ใ/ไ) zaehlen hier bewusst NICHT als
  // Signal - ein fuehrender Vokal beginnt so oder so eine eigene neue
  // Silbe (er startet ja gerade erst), das sagt nichts darueber aus, ob
  // der AKTUELLE Konsonant noch als Finalkonsonant DIESER Silbe gehoert.
  // Bugreport: ดอกไม้ (Blume) - ก ist der echte Finalkonsonant von ดอก
  // ("dok"), das folgende ไ startet ganz regulaer die naechste Silbe ไม้
  // ("mai"). Mit ไ als Trigger wurde ก faelschlich NICHT als Finalkonsonant
  // erkannt, wodurch eine zusaetzliche falsche Silbe "ka" entstand
  // ("dokamai" statt "dokmai").
  return danach !== undefined && THAI_VOKALZEICHEN_NACH_KONSONANT.has(danach);
}

/**
 * Liest ab Position i genau eine thailaendische Silbe und liefert deren
 * Umschrift plus Anzahl konsumierter Zeichen. Gibt null zurueck, wenn an
 * dieser Position keine gueltige Silbe beginnt (kein Thai-Konsonant, kein
 * fuehrendes Vokalzeichen).
 * @param {string[]} zeichen
 * @param {number} start
 * @returns {{text: string, consumed: number} | null}
 */
function parseNaechsteThaiSilbe(zeichen, start) {
  let i = start;

  // ฤ/ฦ sind eigenstaendige Silbenkerne (Konsonant+Vokal in einem
  // Zeichen, aus dem Sanskrit/Pali entlehnt) - brauchen KEINEN
  // vorangehenden Anlaut-Konsonanten, anders als alle anderen Vokalzeichen
  // unten. Muessen daher VOR der Anlaut-Erkennung geprueft werden, sonst
  // haelt istThaiKonsonant() sie faelschlich fuer "keine gueltige Silbe"
  // und sie wuerden roh durchgereicht (Bugreport: "ฤduu" statt "rueduu").
  if (zeichen[i] === 'ฤ' || zeichen[i] === 'ฦ') {
    return { text: zeichen[i] === 'ฤ' ? 'rue' : 'lue', consumed: 1 };
  }

  let fuehrenderVokal = null;
  if (THAI_FUEHRENDE_VOKALE.has(zeichen[i])) {
    fuehrenderVokal = zeichen[i];
    i += 1;
  }

  // Anlaut: stumme Klassenanhebung ("Ho Nam", ห vor Sonoranten) hat
  // Vorrang vor der generischen Cluster-Erkennung - ห traegt hier KEINEN
  // eigenen Laut, nur der Sonorant danach zaehlt (z. B. หนู "nuu", NICHT
  // "hnuu"). AUSNAHME: ห+ว, wenn direkt danach ein weiterer Konsonant
  // (statt eines Vokalzeichens) folgt - dann ist NICHT ห stumm+ว der
  // Anlaut, sondern ห behaelt seinen eigenen /h/-Laut und ว ist das
  // ว-als-Vokal-Muster (siehe unten), z. B. หวด "huat" (peitschen), NICHT
  // "wat" - im Unterschied zu หวาน "waan" (suess), wo nach ว ein echtes
  // Vokalzeichen (า) folgt und ห dort tatsaechlich stumm ist.
  const istHoNamWvAusnahme = zeichen[i + 1] === 'ว' && istThaiKonsonant(zeichen[i + 2]);
  let anlaut;
  if (zeichen[i] === 'ห' && THAI_HONAM_PARTNER.has(zeichen[i + 1]) && !istHoNamWvAusnahme) {
    anlaut = THAI_ANLAUT[zeichen[i + 1]];
    i += 2;
  } else if (
    THAI_CLUSTER_ZWEITKONSONANTEN_RL.has(zeichen[i + 1]) &&
    THAI_CLUSTER_RL_ERSTKONSONANTEN.has(zeichen[i])
  ) {
    anlaut = THAI_ANLAUT[zeichen[i]] + THAI_ANLAUT[zeichen[i + 1]];
    i += 2;
  } else if (zeichen[i + 1] === 'ว' && THAI_CLUSTER_W_ERSTKONSONANTEN.has(zeichen[i])) {
    anlaut = THAI_ANLAUT[zeichen[i]] + THAI_ANLAUT[zeichen[i + 1]];
    i += 2;
  } else if (istThaiKonsonant(zeichen[i])) {
    anlaut = THAI_ANLAUT[zeichen[i]];
    i += 1;
  } else {
    return null;
  }

  i = ueberspringeTon(zeichen, i);

  let vokal;
  let mitFinal = true;

  // Mai Taikhu (็): reines Vokalkuerzungszeichen, das im modernen
  // Thailaendisch fast ausschliesslich zusammen mit einem fuehrenden
  // Vokal (เ/แ/โ) VOR einem Finalkonsonanten steht - Ersatzschreibung fuer
  // "eigentlich -ะ, aber vor einem Finalkonsonanten schreibt man kein ะ"
  // (z. B. เด็ก "dek", NICHT "deek"). Muss VOR den fuehrender-Vokal-
  // spezifischen Verzweigungen unten geprueft werden, sonst blieb ็ als
  // unbekanntes Zeichen liegen: die Silbe wurde mit falscher (langer)
  // Vokallaenge abgeschlossen UND der eigentliche Finalkonsonant landete
  // faelschlich in einer eigenen neuen Silbe (Bugreport: "deeka" statt
  // "dek" fuer เด็ก).
  if (zeichen[i] === '็' && fuehrenderVokal !== null) {
    vokal = { 'เ': 'e', 'แ': 'ae', 'โ': 'o' }[fuehrenderVokal] ?? 'a';
    i += 1;
  } else if (fuehrenderVokal === 'เ') {
    if (zeichen[i] === 'ี' && zeichen[i + 1] === 'ย') {
      i += 2;
      i = ueberspringeTon(zeichen, i);
      if (zeichen[i] === 'ะ') { vokal = 'ia'; i += 1; mitFinal = false; } else { vokal = 'iia'; }
    } else if (zeichen[i] === 'ื' && (zeichen[i + 1] === 'อ' || (THAI_TONZEICHEN.has(zeichen[i + 1]) && zeichen[i + 2] === 'อ'))) {
      // Tonzeichen kann zwischen ื und อ stehen (z. B. เนื้อ - Ton auf ื,
      // อ folgt danach), daher hier zusaetzlich zum direkten Fall geprueft.
      i += THAI_TONZEICHEN.has(zeichen[i + 1]) ? 3 : 2;
      i = ueberspringeTon(zeichen, i);
      if (zeichen[i] === 'ะ') { vokal = 'uea'; i += 1; mitFinal = false; } else { vokal = 'uuea'; }
    } else if (zeichen[i] === 'อ') {
      i += 1;
      i = ueberspringeTon(zeichen, i);
      if (zeichen[i] === 'ะ') { vokal = 'oe'; i += 1; mitFinal = false; } else { vokal = 'ooe'; }
    } else if (zeichen[i] === 'ิ') {
      // Geschlossene Form von เ-อ (erwartet Finalkonsonant), z. B. เดิน.
      i += 1;
      vokal = 'oe';
    } else if (zeichen[i] === 'า') {
      i += 1;
      i = ueberspringeTon(zeichen, i);
      if (zeichen[i] === 'ะ') { vokal = 'o'; i += 1; mitFinal = false; } else { vokal = 'ao'; mitFinal = false; }
    } else if (zeichen[i] === 'ะ') {
      vokal = 'e'; i += 1; mitFinal = false;
    } else {
      vokal = 'ee';
    }
  } else if (fuehrenderVokal === 'แ') {
    if (zeichen[i] === 'ะ') { vokal = 'ae'; i += 1; mitFinal = false; } else { vokal = 'aae'; }
  } else if (fuehrenderVokal === 'โ') {
    if (zeichen[i] === 'ะ') { vokal = 'o'; i += 1; mitFinal = false; } else { vokal = 'oo'; }
  } else if (fuehrenderVokal === 'ใ' || fuehrenderVokal === 'ไ') {
    vokal = 'ai'; mitFinal = false;
    // ไ-ย ist eine anerkannte, seltene Alternativschreibung desselben
    // ai-Diphthongs (v. a. im sehr haeufigen Wort ไทย) - das ย traegt
    // dabei KEINEN eigenen Laut. Ohne diese Sonderregel wuerde das
    // uebrig bleibende ย eine eigene (falsche) Silbe "ya" bilden
    // (Bugreport: "thaiya" statt "thai").
    if (zeichen[i] === 'ย' && !brauchtEigenenVokal(zeichen, i)) {
      i += 1;
    }
  } else if (zeichen[i] === 'ั' && zeichen[i + 1] === 'ว') {
    i += 2;
    i = ueberspringeTon(zeichen, i);
    if (zeichen[i] === 'ะ') { vokal = 'ua'; i += 1; mitFinal = false; } else { vokal = 'uua'; mitFinal = false; }
  } else if (zeichen[i] === 'ว' && istThaiKonsonant(zeichen[i + 1])) {
    // ว-als-Vokal (Konsonant-ว-Konsonant ohne anderes Vokalzeichen = "ua",
    // geschlossene Silbe, siehe fruehere Bugreports zu "pwd" statt "puad").
    i += 1;
    vokal = 'ua';
  } else if (zeichen[i] === 'ะ') {
    vokal = 'a'; i += 1; mitFinal = false;
  } else if (zeichen[i] === 'ำ') {
    vokal = 'am'; i += 1; mitFinal = false;
  } else if (zeichen[i] === 'า') {
    vokal = 'aa'; i += 1;
  } else if (zeichen[i] === 'ิ') {
    vokal = 'i'; i += 1;
  } else if (zeichen[i] === 'ี') {
    vokal = 'ii'; i += 1;
  } else if (zeichen[i] === 'ึ') {
    vokal = 'ue'; i += 1;
  } else if (zeichen[i] === 'ื') {
    i += 1;
    vokal = 'uue';
    if (zeichen[i] === 'อ') i += 1; // ื steht praktisch immer zusammen mit อ (เธอ-Muster ausgenommen, oben behandelt).
  } else if (zeichen[i] === 'ุ') {
    vokal = 'u'; i += 1;
  } else if (zeichen[i] === 'ู') {
    vokal = 'uu'; i += 1;
  } else if (zeichen[i] === 'ั') {
    vokal = 'a'; i += 1; // Mai Han Akat - immer geschlossene Silbe.
  } else if (zeichen[i] === 'อ') {
    // "Langes O" NACH einem echten Anlaut (z. B. รอ "roo", aber auch mit
    // Finalkonsonant wie ขอบ "khop" - mitFinal bleibt daher true, anders
    // als bei den fuehrenden Vokal-Endformen oben, die stets offene
    // Silben sind).
    vokal = 'o'; i += 1;
  } else if (zeichen[i] === 'ๅ') {
    vokal = 'aa'; i += 1;
  } else {
    // Sicherheitsnetz: kein erkanntes Vokalzeichen gefunden - nie einen
    // nackten Konsonanten ausgeben (Projektprinzip, siehe Lao-Fixes).
    vokal = 'a';
  }

  i = ueberspringeTon(zeichen, i);

  let auslaut = '';
  if (mitFinal && Object.prototype.hasOwnProperty.call(THAI_AUSLAUT, zeichen[i]) && !brauchtEigenenVokal(zeichen, i)) {
    auslaut = THAI_AUSLAUT[zeichen[i]];
    i += 1;
    i = ueberspringeTon(zeichen, i);
  }

  let text = anlaut + vokal + auslaut;

  // Thanthakhat (์): das direkt davorstehende Zeichen der Umschrift gilt
  // als stumm - wie beim analogen Streichungszeichen in laoTransliteration.js
  // wird es fuer reinen ASCII-Text einfach weggelassen statt nur markiert.
  if (zeichen[i] === '์') {
    i += 1;
    text = text.slice(0, -1);
  }

  return { text, consumed: i - start };
}

/**
 * Transliteriert einen (bereits mit Wortgrenzen-Leerzeichen angereicherten,
 * siehe thaiWordSegmentation.js) Thai-Text silbenweise. Nicht-thailaendische
 * Zeichen werden ueber PUNKT_UND_ZIFFERN aufgeloest bzw. unveraendert
 * durchgereicht.
 * @param {string} text
 * @returns {string}
 */
export function transliteriereThailaendischSilbenweise(text) {
  const zeichen = Array.from(text);
  const n = zeichen.length;
  let ergebnis = '';
  let i = 0;

  while (i < n) {
    const silbe = parseNaechsteThaiSilbe(zeichen, i);
    if (silbe) {
      ergebnis += silbe.text;
      i += silbe.consumed;
      continue;
    }
    const z = zeichen[i];
    ergebnis += Object.prototype.hasOwnProperty.call(PUNKT_UND_ZIFFERN, z) ? PUNKT_UND_ZIFFERN[z] : z;
    i += 1;
  }

  return ergebnis;
}
