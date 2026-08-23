#!/usr/bin/env node
/**
 * generate-arabic-morphology.mjs
 *
 * Offline-Werkzeug (Phase 2, läuft NICHT im Browser, nur einmalig lokal
 * per `node tools/generate-arabic-morphology.mjs`): liest die drei
 * Lexikondateien (dictPrefixes, dictSuffixes, dictStems) UND die drei
 * Kompatibilitätstabellen (tableAB, tableBC, tableAC) des Buckwalter
 * Arabic Morphological Analyzer 1.0 (LDC2002L49, GPLv2) ein und erzeugt
 * daraus ein vollständiges JSON-Datenpaket, mit dem
 * transliterationClient.js eine echte Präfix+Stamm+Suffix-Segmentierung
 * durchführen kann (siehe segmentiereUndVokalisiere() dort) - im
 * Gegensatz zu Phase 1 (generate-arabic-stem-dictionary.mjs), die nur
 * unflektierte Stämme abdeckte.
 *
 * WARUM NICHT VORAB ALLE KOMBINATIONEN AUSMULTIPLIZIEREN?
 * 82.158 Stämme x bis zu 299 Präfixe x bis zu 618 Suffixe wäre (selbst
 * unter Berücksichtigung der Kompatibilitätstabellen) eine Kombinations-
 * explosion im zweistelligen Millionenbereich - deutlich zu groß für eine
 * statische JSON-Datei. Stattdessen werden nur die drei (kleinen)
 * Lexika + die drei (kleinen) Kompatibilitätstabellen exportiert; die
 * eigentliche Kombination von Präfix+Stamm+Suffix für ein KONKRETES
 * Eingabewort übernimmt transliterationClient.js zur Laufzeit im Browser
 * (reine Objekt-Lookups, kein Perl/Java nötig, siehe dortige Doku).
 *
 * Quelle/Lizenz: siehe data/ARABISCH_WOERTERBUCH_LIZENZ.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ZIEL_VERZEICHNIS = path.join(HIER, '..', 'data');

// Buckwalter-Transliterationstabelle, siehe generate-arabic-stem-dictionary.mjs
// für Quellenangabe (BAMA-1.0-Readme, Appendix "BUCKWALTER TRANSLITERATION").
const BUCKWALTER_NACH_ARABISCH = {
  "'": '\u0621', '|': '\u0622', '>': '\u0623', '&': '\u0624', '<': '\u0625',
  '}': '\u0626', 'A': '\u0627', 'b': '\u0628', 'p': '\u0629', 't': '\u062A',
  'v': '\u062B', 'j': '\u062C', 'H': '\u062D', 'x': '\u062E', 'd': '\u062F',
  '*': '\u0630', 'r': '\u0631', 'z': '\u0632', 's': '\u0633', '$': '\u0634',
  'S': '\u0635', 'D': '\u0636', 'T': '\u0637', 'Z': '\u0638', 'E': '\u0639',
  'g': '\u063A', '_': '\u0640', 'f': '\u0641', 'q': '\u0642', 'k': '\u0643',
  'l': '\u0644', 'm': '\u0645', 'n': '\u0646', 'h': '\u0647', 'w': '\u0648',
  'Y': '\u0649', 'y': '\u064A',
  'F': '\u064B', 'N': '\u064C', 'K': '\u064D', 'a': '\u064E', 'u': '\u064F',
  'i': '\u0650', '~': '\u0651', 'o': '\u0652',
  '`': '\u0670', '{': '\u0671', 'P': '\u067E', 'J': '\u0686', 'V': '\u06A4',
  'G': '\u06AF',
};

function buckwalterNachArabisch(text) {
  let ergebnis = '';
  for (const zeichen of text) {
    ergebnis += BUCKWALTER_NACH_ARABISCH[zeichen] ?? zeichen;
  }
  return ergebnis;
}

/**
 * Parst eine Lexikondatei (dictPrefixes/dictSuffixes/dictStems), die alle
 * demselben Format folgen: Kommentarzeilen mit ";", sonst tab-getrennt
 * [Schlüssel(Buckwalter)] [vokalisierte Form(Buckwalter)] [Kategorie] [Glosse].
 * Schlüssel und vokalisierte Form dürfen (bei Präfixen/Suffixen bewusst,
 * für den "kein Präfix"/"kein Suffix"-Fall) leer sein - anders als in
 * Phase 1 werden solche Zeilen hier NICHT übersprungen.
 * @returns {Map<string, Array<{v: string, c: string}>>}
 */
function parseLexikon(pfad) {
  const inhalt = readFileSync(pfad, 'utf8');
  const zeilen = inhalt.split('\n');
  const lexikon = new Map();

  for (const zeile of zeilen) {
    if (zeile.startsWith(';')) continue;
    if (zeile.trim() === '' && !zeile.includes('\t')) continue;

    const felder = zeile.split('\t');
    if (felder.length < 3) continue;

    const [schluesselBW, vokalisiertBW, kategorie] = felder;
    if (kategorie === undefined || kategorie === '') continue;

    const schluessel = buckwalterNachArabisch(schluesselBW ?? '');
    const vokalisiert = buckwalterNachArabisch(vokalisiertBW ?? '');

    if (!lexikon.has(schluessel)) {
      lexikon.set(schluessel, []);
    }
    const eintraege = lexikon.get(schluessel);
    // Duplikate (gleicher Schlüssel + gleiche vokalisierte Form + gleiche
    // Kategorie kommen im Lexikon mehrfach vor) vermeiden.
    if (!eintraege.some((e) => e.v === vokalisiert && e.c === kategorie)) {
      eintraege.push({ v: vokalisiert, c: kategorie });
    }
  }

  return lexikon;
}

/** Parst eine Kompatibilitätstabelle (Zeilen "KategorieA KategorieB"). */
function parseKompatibilitaetstabelle(pfad) {
  const inhalt = readFileSync(pfad, 'utf8');
  const zeilen = inhalt.split('\n');
  const paare = [];

  for (const zeile of zeilen) {
    if (zeile.startsWith(';')) continue;
    const getrimmt = zeile.trim();
    if (getrimmt === '') continue;
    const teile = getrimmt.split(/\s+/);
    if (teile.length !== 2) continue;
    paare.push(`${teile[0]}|${teile[1]}`);
  }

  return paare;
}

function mapZuObjekt(map) {
  const objekt = {};
  for (const [schluessel, eintraege] of map) {
    objekt[schluessel] = eintraege;
  }
  return objekt;
}

function main() {
  const praefixe = parseLexikon(path.join(HIER, 'bama-dictPrefixes.txt'));
  const suffixe = parseLexikon(path.join(HIER, 'bama-dictSuffixes.txt'));
  const staemme = parseLexikon(path.join(HIER, 'bama-dictStems.txt'));

  const tabelleAB = parseKompatibilitaetstabelle(path.join(HIER, 'bama-tableAB.txt'));
  const tabelleBC = parseKompatibilitaetstabelle(path.join(HIER, 'bama-tableBC.txt'));
  const tabelleAC = parseKompatibilitaetstabelle(path.join(HIER, 'bama-tableAC.txt'));

  const hinweis =
    'Automatisch generiert aus BAMA 1.0 (LDC2002L49, GPLv2). ' +
    '(c) 2002 QAMUS LLC (www.qamus.org), (c) 2002 Trustees of the ' +
    'University of Pennsylvania. Quelle: AraMorph-Java-Port von ' +
    'Pierrick Brihaye. Siehe data/ARABISCH_WOERTERBUCH_LIZENZ.md. ' +
    'Format je Schlüssel: Array aus {v: vokalisierte Form, c: ' +
    'morphologische Kategorie}. Details zur Nutzung (Segmentierung mit ' +
    'den Kompatibilitätstabellen) siehe tools/generate-arabic-morphology.mjs ' +
    'und js/transliterationClient.js.';

  const praefixeAusgabe = { _hinweis: hinweis, eintraege: mapZuObjekt(praefixe) };
  const suffixeAusgabe = { _hinweis: hinweis, eintraege: mapZuObjekt(suffixe) };
  const staemmeAusgabe = { _hinweis: hinweis, eintraege: mapZuObjekt(staemme) };
  const kompatibilitaetAusgabe = {
    _hinweis: hinweis + ' ab=Präfix-Stamm, bc=Stamm-Suffix, ac=Präfix-Suffix.',
    ab: tabelleAB,
    bc: tabelleBC,
    ac: tabelleAC,
  };

  writeFileSync(
    path.join(ZIEL_VERZEICHNIS, 'arabischPraefixe.json'),
    JSON.stringify(praefixeAusgabe),
  );
  writeFileSync(
    path.join(ZIEL_VERZEICHNIS, 'arabischSuffixe.json'),
    JSON.stringify(suffixeAusgabe),
  );
  writeFileSync(
    path.join(ZIEL_VERZEICHNIS, 'arabischStaemmeVoll.json'),
    JSON.stringify(staemmeAusgabe),
  );
  writeFileSync(
    path.join(ZIEL_VERZEICHNIS, 'arabischKompatibilitaet.json'),
    JSON.stringify(kompatibilitaetAusgabe),
  );

  console.log(`Präfixe: ${praefixe.size} eindeutige Schlüssel`);
  console.log(`Suffixe: ${suffixe.size} eindeutige Schlüssel`);
  console.log(`Stämme: ${staemme.size} eindeutige Schlüssel`);
  console.log(`Kompatibilität AB/BC/AC: ${tabelleAB.length}/${tabelleBC.length}/${tabelleAC.length} Paare`);
  console.log(`Geschrieben nach: ${ZIEL_VERZEICHNIS}`);
}

main();
