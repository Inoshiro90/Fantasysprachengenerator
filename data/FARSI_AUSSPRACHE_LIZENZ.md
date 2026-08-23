# Herkunft und Lizenz: farsiAussprache.json

Diese Datei kombiniert zwei Quellen. Bei Überschneidungen (dasselbe Wort
in beiden Quellen) hat **WikiPron/Wiktionary stets Vorrang** - Quelle 2
ergänzt nur zusätzliche, dort nicht vorhandene Wörter.

## Quelle 1: WikiPron (Wiktionary)

**Quelle:** [WikiPron](https://github.com/CUNY-CL/wikipron) (CUNY-CL),
ein Werkzeug/Datensatz-Projekt, das Ausspracheangaben (IPA) massenhaft aus
Wiktionary extrahiert (siehe Lee et al. 2020, "Massively Multilingual
Pronunciation Mining with WikiPron"). Verwendete Rohdatei:
`data/scrape/tsv/fas_arab_broad.tsv` (breite/phonemische IPA-Transkription
für Persisch in arabischer Schrift, 10.312 Zeilen / 9.283 eindeutige
Wörter).

**Lizenz:** Der WikiPron-CODE steht unter Apache 2.0, die im `data/`-
Verzeichnis gesammelten Ausspracheangaben selbst unterliegen laut
WikiPron-README ausdrücklich weiterhin den Lizenzbedingungen von
Wiktionary (https://en.wiktionary.org/wiki/Wiktionary:Copyrights), also
CC BY-SA 4.0 (bzw. zusätzlich GFDL).

## Quelle 2: ipa-dict / open-dict-data (ergänzend, vom Nutzer bereitgestellt)

**Quelle:** [open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict),
konkret die Datei `fa.txt` (bereitgestellt als `fa_ipa_dsl.txt` im
DSL-Format des Ableger-Projekts
[open-dsl-dict/ipa-dict-dsl](https://github.com/open-dsl-dict/ipa-dict-dsl),
inhaltlich identisch). Laut Projekt-README ausdrücklich als experimentell
gekennzeichnet: *"Persian vowelled texts are extremely difficult to
find... The Persian IPA data here has been pieced together from
Wiktionary, the PersPred project, and a great deal of guesswork."*

**Lizenz:** [MIT](https://github.com/open-dict-data/ipa-dict/blob/master/LICENSE)
(gesamtes Repository, sofern nicht anders angegeben; für Persisch ist in
den Credits keine abweichende Lizenz vermerkt).

**Qualitätsprüfung vor der Übernahme:** Trotz der Selbsteinschätzung als
"experimentell" ergab eine Stichprobenprüfung nur 4 von 8.088 Einträgen
(0,05 %) mit tatsächlich fehlerhaftem Inhalt (vertauschte Felder, z. B.
eine Wortbedeutung statt einer Lautschrift) - diese wurden beim Import
übersprungen. Zusätzlich verwendet ein kleiner Teil der Einträge (89 von
8.088) eine uneinheitliche, an Esperanto-Diakritika angelehnte Notation
(ŝ, ĝ, ă, ü, ô, ē u. Ä. statt der sonst üblichen IPA-Zeichen, vermutlich
ein Überbleibsel der PersPred-Herkunft) - diese wurden in der
Zuordnungstabelle mit abgedeckt statt verworfen.

**Ergebnis:** 7.693 nutzbare Wortformen, davon 4.640 zusätzlich zu den
bereits über WikiPron vorhandenen Wörtern.

**Nachtrag:** Aus derselben Quelle wurde später zusätzlich die rohe
Tab-getrennte Originaldatei (`data/fa.txt` aus dem Haupt-Repository
`open-dict-data/ipa-dict`, Format `WORT<TAB>/IPA/`) geprüft. Sie ist zu
über 99,9 % inhaltsgleich mit der DSL-Version oben - bis auf 6 Wörter,
darunter zwei (جهالت, چرخ زدن), die in der DSL-Version durch einen
Kodierungsfehler (Replacement-Zeichen U+FFFD) unbrauchbar und deshalb
beim ersten Import übersprungen worden waren. In der rohen TSV-Datei sind
sie fehlerfrei und wurden ergänzt.

## Wie die lateinische Lesung erzeugt wurde (beide Quellen)

Jedes IPA-Symbol wurde einzeln auf die im Projekt bereits etablierte
lateinische Lesekonvention abgebildet (dieselbe wie in
`ARABISCH_KONSONANTEN`/`ARABISCH_HALBVOKALE` in `transliterationClient.js`,
z. B. kh, gh, sh, zh, ch, dh, q, ' für Hamza/Ayn, w/y für Halbvokale).
Vokallängen-Unterschiede (a vs. aː) werden dabei bewusst nicht kodiert,
konsistent mit der übrigen Umschrift-Praxis im Projekt (keine Diakritika
im Endergebnis). Bei mehreren dokumentierten Aussprachen desselben Wortes
wurde die erste (meist die Standard-/häufigste) übernommen.

## Quelle 3: vom Nutzer bereitgestellte Ergänzung (Lizenz nicht dokumentiert)

Zusätzlich zu den beiden oben beschriebenen Quellen wurde eine vom Nutzer
bereitgestellte Liste mit 40.307 Wörtern eingearbeitet, die die moderne
Alltagsaussprache (Standard-Teheran-Persisch) statt der eher literarisch/
klassischen Aussprache der Quellen 1+2 abbildet (z. B. "mo'attali" statt
"mu'attali", "kordi" statt "kurdi", "vojuh" statt "wujuh" - der bekannte
Lautwandel klassisch u→o, i→e, w→v). **Herkunft und Lizenz dieser Liste
sind nicht dokumentiert** (auf ausdrücklichen Wunsch des Nutzers). Bei
Überschneidung mit Quelle 1/2 (8.602 Wörter) hat diese dritte Quelle
Vorrang; 31.705 Wörter sind ausschließlich hier vorhanden. Die 5.327
Wörter aus Quelle 1/2 ohne Gegenstück in Quelle 3 bleiben unverändert
mit ihrer CC BY-SA 4.0/MIT-Lizenz erhalten.

**Gesamtergebnis:** 45.634 Wörter (13.929 aus Quelle 1+2, davon 5.327
nur dort; 40.307 aus Quelle 3, davon 34.980 nur dort und 5.327 in
Quelle 1+2 überschrieben).

## Verwendung im Projekt

`js/transliterationClient.js` schlägt für **Farsi (fa-IR)** jedes Wort
zunächst in dieser Liste nach; bei einem Treffer wird die daraus
gewonnene lateinische Lesung direkt verwendet, sonst greift wie bisher
die allgemeine arabische Konsonant+Vokal-Heuristik (siehe
ARABISCH_KONSONANTEN). Urdu/Paschtu/Kurdisch-Sorani (die sich dieselbe
Heuristik teilen) sind davon bewusst NICHT betroffen - die Daten sind
persisch-spezifisch und würden bei anderen Sprachen trotz teils gleicher
Schriftzeichen falsche Lautungen liefern.

**Abdeckung:** 45.634 Wörter gesamt, siehe "Quelle 3" oben für die
aktuelle Aufschlüsselung - ein nützlicher Ausschnitt, kein vollständiges
Lexikon. Wörter ohne Treffer verhalten sich exakt wie vorher (keine
Regression).

