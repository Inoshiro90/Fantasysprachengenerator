# Herkunft und Lizenz: japanischWoerterbuch.json

## Quelle 1: Wikipedia-Kana-/Kanji-Tabelle (vom Nutzer bereitgestellt)

Der Nutzer hat eine Tabelle mit vier Abschnitten bereitgestellt
(`Japanese_Transliteration.txt`, laut Nutzer aus Wikipedia entnommen):

- **Hiragana** (106 Einträge) und **Katakana** (109 Einträge): die
  Standard-Kana-Silbenschrift inkl. der kombinierten Kleinbuchstaben-
  Digraphen (きゃ→kya, しゅ→shu, ...).
- **Katakana erweitert** (212 Einträge): zusätzliche Mehrzeichen-
  Kombinationen für Fremdwort-Laute, die in normalem Japanisch nicht
  vorkommen (z. B. ファ→fa, ティ→ti, ヴィェ→vye) - werden für Lehnwörter
  wie ファッション (fasshon, "fashion") gebraucht.
- **Kanji** (2.136 Einträge): EIN romanisierter Lesungsvorschlag pro
  einzelnem Kanji-Schriftzeichen (mit Hepburn-Makronen für lange Vokale,
  z. B. 'ryō'), vermutlich die japanische Wikipedia-Liste der
  Jōyō-Kanji mit On-Lesung.

**Einschätzung zur Lizenz:** Eine Silbenschrift-Umschrifttabelle
(Hiragana/Katakana → Hepburn-Umschrift) bildet eine seit Jahrzehnten
standardisierte, öffentlich dokumentierte Lautzuordnung ab (Hepburn-
System) - keine eigene kreative Leistung, die urheberrechtlich geschützt
wäre. Die Kanji-Tabelle ordnet jedem Zeichen die (oder eine) japanische
On-Lesung zu; auch das ist eine im Wesentlichen faktische Information
(die tatsächliche Aussprache des Zeichens), keine Textform mit
Schöpfungshöhe. Aus diesem Grund wird diese Tabelle - anders als z. B.
die Wortliste in `PASHTO_AUSSPRACHE_LIZENZ.md`, die eine kuratierte
Sammlung ganzer Wörter darstellt - hier ohne gesonderte Lizenzangabe
verwendet.

**Bekannte Einschränkung der Kanji-Tabelle:** Sie liefert pro Kanji nur
EINE kontextfreie On-Lesung. Die meisten Kanji haben aber je nach Wort
mehrere mögliche Lesungen (On- und Kun-Lesungen). Diese Tabelle wird
deshalb nur als LETZTER Fallback verwendet, wenn Quelle 2 (JMdict) das
Zeichen nicht als Teil eines bekannten Wortes kennt (siehe unten).

**Zwei Lücken der Kana-Tabelle wurden ergänzt** (Abgleich mit der alten,
im Projekt bereits vorhandenen Kana-Tabelle, um keine Regression
einzuführen): das Silbenzeichen ん/ン (fehlte in der Hiragana-Sektion
komplett - eines der häufigsten Zeichen im Japanischen!), Hiragana ゔ,
die veralteten Hiragana ゐ/ゑ, sowie alleinstehende kleine Vokal-/Ya-Yu-
Yo-Kana. Das Mittelpunkt-Trennzeichen ・ (kommt bei buchstabierten
Akronym-Lesungen wie エス・エフ für "SF" vor) wird zu einem Leerzeichen.

## Quelle 2: JMdict (Electronic Dictionary Research and Development Group)

**Quelle:** [JMdict](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project),
ein seit 1991 gepflegtes, maschinenlesbares japanisches Wörterbuch
(ursprünglich von Jim Breen, heute EDRDG/Monash University). Die vom
Nutzer bereitgestellte Datei `JMdict_japanese_only.json` (211.311
Einträge, jeweils mit Kanji-Schreibung(en) und Lesung(en) in Kana) ist
eine auf die japanischen Felder reduzierte Version des offiziellen
JMdict-Exports (vermutlich über das
[jmdict-simplified](https://github.com/scriptin/jmdict-simplified)-
Projekt erzeugt, das JMdict als JSON bereitstellt).

**Lizenz:** CC BY-SA 4.0, siehe https://www.edrdg.org/edrdg/licence.html.
JMdict ist damit gleich lizenziert wie Wiktionary/WikiPron, die für die
anderen Sprachen in diesem Projekt verwendet werden.

**Wie verwendet:** Von den 211.311 Einträgen haben 171.276 mindestens
eine Kanji-Schreibung (die übrigen sind reine Kana-Wörter, für die
unsere Kana-Tabelle bereits eine korrekte Umschrift liefert - sie
bringen daher keinen zusätzlichen Nutzen für dieses Wörterbuch und
wurden nicht aufgenommen, um die Dateigröße nicht unnötig aufzublähen).
Jede Kanji-Schreibung wird auf die LATEINISCHE Umschrift der ERSTEN
gelisteten Lesung abgebildet (Lesung wird beim Erstellen dieser Datei
einmalig mit der Kana-Tabelle aus Quelle 1 vorab romanisiert, inkl.
korrekter Behandlung von Verdopplungspunkt und Längungszeichen - siehe
unten). Bei mehreren Kanji-Schreibungen pro Eintrag wird jede einzelne
auf dieselbe erste Lesung abgebildet. Ergibt 218.713 eindeutige
Kanji-Schreibungen (manche Schreibung kommt in mehreren Wörterbuch-
einträgen mit unterschiedlicher Bedeutung/Lesung vor - hier gewinnt der
zuerst in der Datei gefundene Eintrag, analog zur "erste Zeile gewinnt"-
Praxis bei Farsi/Urdu/Paschtu).

**Bekannte Einschränkung:** Wie bei jeder wörterbuchbasierten Lösung
ohne echte Satzanalyse wird die Lesung nicht kontextabhängig gewählt -
Wörter mit identischer Schreibung, aber unterschiedlicher Lesung/
Bedeutung (Homographen) bekommen immer dieselbe (die zuerst gefundene)
Lesung, unabhängig vom tatsächlichen Satzzusammenhang.

## Wie die lateinische Lesung erzeugt wurde

Die Kana-Romanisierung (für Quelle 2 vorab, und zur Laufzeit für
Kana-Reste, die nicht Teil eines Wörterbucheintrags sind) folgt der
Wikipedia-Tabelle aus Quelle 1 mit Längste-Treffer-Suche (Mehrzeichen-
Digraphen vor Einzelzeichen), plus zwei Sonderregeln:
- **Verdopplungspunkt っ/ッ**: verdoppelt den Anfangskonsonant der
  nächsten Mora (がっこう → gakkou, いっぱい → ippai), statt wie in der
  alten Tabelle einfach zu verschwinden.
- **Längungszeichen ー**: wird verworfen (keine Vokallängen-Kodierung,
  konsistent mit der übrigen Praxis im Projekt - genau wie bei Farsi/
  Urdu/Paschtu/Tibetisch).

## Verwendung im Projekt

`js/japanischTransliteration.js` schlägt für **Japanisch (ja-JP)** an
jeder Position zunächst im JMdict-/Kanji-Fallback-Wörterbuch nach
(Längste-Treffer-Suche), dann in der Kana-Tabelle. Reine Kana-Abschnitte
(Partikel, Verbendungen, Wörter ohne Kanji) werden weiterhin korrekt
über die Kana-Tabelle romanisiert. Nur Kanji, die WEDER als Teil eines
JMdict-Wortes NOCH in der Einzelzeichen-Fallback-Liste vorkommen (sehr
seltene/exotische Zeichen), bleiben unverändert stehen wie bisher -
keine Regression gegenüber dem alten Verhalten.

**Abdeckung:** 219.307 JMdict-/Fallback-Einträge (2.136 Einzelzeichen-
Fallback + 218.713 JMdict-Kanji-Schreibungen, davon 1.542 durch JMdict
überschrieben, wenn das Zeichen auch als eigenständiges Wort vorkommt),
plus 35 kuratierte Kopula-/Partikel-Ergänzungen (siehe unten).

## Nachträgliche Korrekturen (nach Auslieferung gefunden und behoben)

**は/を/へ als grammatische Partikel:** In `japanischTransliteration.js`
werden freistehende (nicht Teil eines JMdict-Wortes) は/を/へ jetzt mit
ihrer Partikel-Lesung ("wa"/"o"/"e") statt der gewöhnlichen Kana-Lesung
("ha"/"wo"/"he") ausgegeben und immer als eigenes Wort abgetrennt - der
klassische Stolperstein der Hepburn-Umschrift. **Bekanntes Restrisiko:**
selten in Hiragana geschriebene Inhaltswörter, die zufällig mit は/を/へ
beginnen (z. B. はな "Blume", へや "Zimmer" - im Alltag so gut wie immer
in Kanji geschrieben), würden dadurch falsch gelesen. Die Partikel-
Verwendung ist in echtem Fließtext um Größenordnungen häufiger, daher
eine klare Nettoverbesserung. Eine versuchte Erweiterung dieser Logik auf
weitere Partikeln (が/の/と/や/わ/し/...) wurde nach Tests wieder
zurückgenommen: diese Laute stehen zu oft auch am Anfang gewöhnlicher
Wörter (の in この/その, わ in わたし, し in しています/ました) - das
Risiko, häufige Wörter falsch zu zertrennen, überwog den Lesbarkeitsgewinn.

**109 Wörterbuch-Einträge korrigiert:** Einträge, deren Kanji-Schreibung
auf は/を/へ endet (dort IMMER die grammatische Partikel, z. B. 今日は
"konnichiwa", nie eine gewöhnliche Lesung), hatten eine falsch
vorberechnete Endung ("...ha"/"...wo"/"...he") fest im Datensatz - jetzt
auf die korrekte Partikel-Lesung umgestellt.

**35 Kopula-/mehrzeichige Partikelformen ergänzt:** です/でした/だ/だった/
から/まで/より/だけ/しか/ばかり/けど/ので/... kommen in JMdict (primär ein
Nomen-/Verb-/Inhaltswort-Wörterbuch) praktisch nicht als eigene Einträge
vor, obwohl sie zu den häufigsten Wörtern jedes Satzes gehören - ohne sie
verschmelzen sie mit benachbarten freien Kana zu unlesbaren Blöcken
(z. B. "gaiidesune" statt "ga ii desu ne").

**3 gezielte Lesungs-Korrekturen** für extrem häufige Wörter, bei denen
der Datensatz eine seltene/archaische statt der im Alltag überwiegenden
Lesung enthielt: 彼 → kare (war: are), 僕 → boku (war: shimobe), 貴方 →
anata (war: kihou). Kein systematischer Fix - dafür wäre die
Roh-JMdict-Datei mit allen Lesungs-Prioritäten pro Eintrag nötig, die dem
Projekt nicht vorliegt (nur die bereits auf eine Lesung reduzierte
Export-Datei) - aber hoher Alltagsnutzen durch die Worthäufigkeit dieser
drei Pronomen. Weitere ähnliche Fälle sind wahrscheinlich, aber ohne
systematisches Auditieren aller 219K Einträge nicht auffindbar.
