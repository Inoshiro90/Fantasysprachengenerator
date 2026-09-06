/**
 * beispielsaetze.js
 * Ein Beispielsatz pro realer Zwischensprache (Quelle: SPRACHEN in languages.js),
 * jeweils bereits in reinem ASCII (siehe asciiSanitizer.js) und ohne Ton-/
 * Laengenmarkierung, analog zur Ausgabe der Transliterationsmodule dieses
 * Projekts. Dient als kleine Voranschau im Profil-Editor: sobald eine reale
 * Zwischensprache im Dropdown ausgewaehlt wird (und kein eigener Sprachcode
 * aktiv ist), zeigt profileEditor.js hier den passenden Satz an, damit man
 * ein Gefuehl fuer typische Buchstabenfolgen der gewaehlten Sprache bekommt,
 * bevor man Vokal-/Konsonantenregeln definiert.
 *
 * Es wird bewusst nur der fremdsprachige Satz gepflegt, keine deutsche
 * Uebersetzung - die Vorschau soll das Sprachgefuehl (Lautbild) vermitteln,
 * nicht als Uebungssatz zum Nachvollziehen der Bedeutung dienen.
 *
 * Chinesisch (Vereinfacht/Traditionell) teilen sich denselben Pinyin-Satz,
 * da sich die Umschrift auf die Aussprache bezieht, nicht auf die Schriftvariante.
 * 'Kurdisch' (ku-TR) steht fuer Kurmanji, 'Kurdisch (Sorani)' (ckb-IQ) fuer
 * Sorani - beide erhalten dialektangemessene Saetze.
 */

export const BEISPIELSAETZE = {
  'af-ZA': 'Die ou boer skryf elke oggend \'n lang brief aan sy dogter in die stad.', // Afrikaans
  'sq-AL': 'Ai nuk deshiron te shkoje ne shtepine e madhe, sepse rruga eshte shume e gjate dhe e lodhshme.', // Albanisch
  'ak-GH': 'Wo pe kpaa se yeko gua no anopa yi ana?', // Akan
  'am-ET': 'Setyowa wede t\'iru gezaw temelesech, gena lijochu wede gebeya hedu.', // Amharisch
  'ar-SA': 'Indama tushriqu ash-shamsu fawqa l-jibali, yakhruju l-fallahuna ila l-huquli l-wasi\'ati.', // Arabisch
  'hy-AM': 'Ays tuny aveli mets e, k\'an ayn poqrik tuny vor mer harevanneri e.', // Armenisch
  'az-AZ': 'Menim atam bizim boyuk baghchamizda her gun chicheklere baxir.', // Aserbaidschanisch
  'as-IN': 'Aji akax meghia ase, hoyoto borokhun hobo.', // Assamesisch
  'ay-BO': 'Uraqin sarnaqma, thaya jutaskiwa!', // Aymara
  'bm-ML': 'I ni ce! I ka kene wa? Ne fana ka kene, an ka taa so kono ka dumuni dun.', // Bambara
  'ba-RU': 'Eger bala oson yulda barsa, ul dus keshelerge tiz barip etar.', // Baschkirisch
  'eu-ES': 'Etxeko atsoak dio itsasoa handia dela eta txalupa txikia dela beti.', // Baskisch
  'bem-ZM': 'Abaana bonse baalelaala mu ng\'anda iikalamba pantu bali no tulo tukalamba.', // Bemba
  'bn-IN': 'Nodir dhare ekta boro bari ache, jekhane onek manush thake.', // Bengalisch
  'be-BY': 'Ja pryjshow dadomu pozna, bo vowk chakaw mianie kalya lesu.', // Belarussisch
  'bs-BA': 'Na vrhu visokog brda raste crveno cvijece koje privlaci mnogo ptica svako jutro.', // Bosnisch
  'br-FR': 'Ha c\'hoant ho peus mont d\'an ti kozh e-kichen ar gwez bras?', // Bretonisch
  'bg-BG': 'Kuchkata ne iska da darzhi topkata, zashtoto e mnogo umorena sled dalgata razhodka.', // Bulgarisch
  'my-MM': 'Hnga tway pyan thwa tal, myauk tway dow nay tal.', // Birmanisch
  'ca-ES': 'Quan arriba la nit, la cel.la del castell es plena de llum suau i tranquil.la.', // Katalanisch
  'ceb-PH': 'Ang dako nga balay mas maayo kaysa sa gamay nga balay sa may suba.', // Cebuano
  'zh-CN': 'Zhe zhi mao de zhuren zhu zai na zuo da fangzi li.', // Chinesisch (Vereinfacht)
  'zh-TW': 'Zhe zhi mao de zhuren zhu zai na zuo da fangzi li.', // Chinesisch (Traditionell)
  'ht-HT': 'Jodi a soley la cho anpil, epi timoun yo ap benyen nan dlo lariviye a.', // Haitianisches Kreol
  'crs-SC': 'Al dan lakour e sey met sa bann zanfan anba lonbraz avan soley i vin tro so!', // Seychellenkreol
  'hr-HR': 'Kako si danas? Dobro sam, hvala, upravo sam vidio crveno cvijece na vrhu brda.', // Kroatisch
  'cs-CZ': 'Kdyz strc prst skrz krk, urcite to bude bolet, i kdyz to zni jako vtip.', // Tschechisch
  'da-DK': 'Den, der graver en grav for andre, falder tit selv deri, sagde den gamle mand fra den lille landsby ved soeen.', // Daenisch
  'nl-NL': 'Ik lach luid terwijl ik een ei eet en naar de kinderen kijk die buiten spelen.', // Niederlaendisch
  'dz-BT': 'Bu chungku tsho zhim mo za wa, pha tsho khangpa nang do.', // Dzongkha
  'en-GB': 'There are several strange things about the strengths of this ancient bridge that nobody truly understands.', // Englisch
  'eo-EU': 'La knabo, kiu cxiam sxatas mangxi freshan pomon, promenas kun sia hundo en la granda gxardeno.', // Esperanto
  'et-EE': 'Kas kalamees, kes eile jarve aarde laks, puudis tana ka mone suure kala?', // Estnisch
  'ee-GH': 'Devi la melo be yeano kpo dzi le gbedzi o, elabena vovo le esi.', // Ewe
  'fo-FO': 'Hann fer ut at fiska vid batinum i kvold, og konan hansara bidar heima vid teirra litla hus.', // Faeroeisch
  'fj-FJ': 'Ni sa mai na siga levu, era sa lako kece na gone ki na vale levu.', // Fidschianisch
  'fi-FI': 'Tama talo on paljon suurempi kuin se pieni talo, jossa isani asui lapsena.', // Finnisch
  'fr-FR': 'Mon bon vin blanc sent tres bon dans le grand jardin de mon oncle a la campagne.', // Franzoesisch
  'ff-SN': 'Duule ina wuuri dow, \'biddo on ina hulaa ndiyam toowata.', // Fulfulde
  'gl-ES': 'Vai axina cara o rio antes de que o neno pequeno se moxe cos pes na herba humida!', // Galicisch
  'lg-UG': 'Oli otya? Ndi bulungi, kale tugende ewaffe tulye ennyimba enkulu ez\'edda.', // Ganda (Luganda)
  'ka-GE': 'Gvprtskvni k\'lde gaqarcvivda mtsvrtnels, magram is bednierad ar dashavda.', // Georgisch
  'el-GR': 'Opios speiei anemous, therizei thyelles, elege o palios daskalos sto horio.', // Griechisch
  'gu-IN': 'Hun dar roj sanje mara bhai sathe moti bagmaan jaun chhun.', // Gujarati
  'gn-PY': 'Mita kuera oho ysyry rupi ka\'aguype.', // Guarani
  'ha-NE': 'Akwai wata babbar gida a bayan gari inda tsofaffi suke zaune cikin nutsuwa.', // Hausa
  'haw-US': 'Ke holo nei ka wahine i ka nalu nui a pau na keiki e nana ana mai ka one.', // Hawaiianisch
  'he-IL': 'Ha\'im hayeled rats el habayit hagadol bimhirut gdola kol yom achar beit hasefer?', // Hebraeisch
  'hi-IN': 'Ladka apni kitab ghar mein nahin rakhta, kyonki use school jaldi jaana hota hai.', // Hindi
  'hu-HU': 'A kis gyerek orul a fenyes konek, es masnap elviszi azt az iskolaba megmutatni.', // Ungarisch
  'ig-NG': 'Mgbe anyanwu na-acha, nwata ahu na-eri nri n\'ulo ha tupu ha apuo ije.', // Igbo
  'is-IS': 'Kotturinn er miklu hradari en hundurinn, en hann sefur samt lengur a hverjum degi i myrkrinu.', // Islaendisch
  'id-ID': 'Rumah besar itu milik kakekku, dan di dalamnya anak itu selalu makan nasi bersama keluarganya.', // Indonesisch
  'ga-IE': 'Ta an ghrian ag taitneamh go geal os cionn an tighe mhoir agus ta an bhean ag siul chun na siopai.', // Irisch
  'it-IT': 'Nonno, mangia il pane caldo subito prima che diventi freddo ogni mattina!', // Italienisch
  'jv-ID': 'Piye kabare? Aku sehat, ayo mangan sega ing omah gedhe bareng-bareng.', // Javanisch
  'ja-JP': 'Moshi neko ga ookii ie no naka de nemuttara, kodomotachi wa shizuka ni asobu deshou.', // Japanisch
  'kea-CV': 'Kenha ki ta trabadja sedu, ta kolhe fruta sedu tambe.', // Kabuverdianu
  'kab-DZ': 'Nekk zeddi deg wexxam ameqqran akked baba d yemma.', // Kabylisch
  'kn-IN': 'Aa maneyalli iruva makkalu doddavaru mattu chikkavaru ella ondu sthalalli oduttiddare.', // Kannada
  'kk-KZ': 'Ulken uyde kop kitap bar, birak balalar til bilmegendikten oqi almaidy.', // Kasachisch
  'ks-IN': 'Bacha gharas manz roz kathi wanan chu apni maji khatre.', // Kaschmiri
  'km-KM': 'Tae kmeng noh chong leng knong phteah thom cheamuoy mday robos koat rue te?', // Khmer
  'ki-KE': 'Mwana ucio ndathiaga gukuru muno, no ariiaga irio njega.', // Kikuyu
  'rw-RW': 'Umwaana araryaamye mu nzu nini cyane, ariko abavandimwe be baracyakina hanze.', // Kinyarwanda
  'rn-BI': 'Igihe umwana ariraara mu nzu nini, abavukanyi biwe baragenda kw\'ishuri.', // Kirundi
  'kg-CD': 'Nzo yayi ya nene me luta nzo ya nkaka mu bunene, kansi mwana wele kaka na yau.', // Kongo (Kikongo)
  'ko-KR': 'Keun jip-eun uri harabeoji-ui jip-ida, geurigo agi-ga geu an-eseo jamdeulda.', // Koreanisch
  'co-FR': 'Oghje u tempu he bellu e caldu, dunque u figliolu chjucu manghja u pane fora di casa.', // Korsisch
  'ku-TR': 'Here mala xwe zu, beri ku baran dest pe bike li ser wan ciyayen bilind!', // Kurdisch
  'ckb-IQ': 'To choni? Man bashim, wera bchine male gawrewe nan bixoyn legel yektir.', // Kurdisch (Sorani)
  'ky-KG': 'Eger bala choong uidoo kitep oqup jatsa, ata-enesi any tynch koyot.', // Kirgisisch
  'lo-LA': 'Dek noi kin khao nyai nai heuan, lae phor mae khong khoated huk laai.', // Laotisch
  'la-VA': 'Ego in villa antiqua cum patre meo habito et puerum magnum cotidie video prope hortum.', // Latein
  'lv-LV': 'Bernini spele lielaa maja pie upes, kamer vinu vecaki runa ar kaimeniem darza.', // Lettisch
  'li-NL': 'Doa is e groot hoes achter de kerk, boe vreuger en ald boer mit zien vrouw woonde.', // Limburgisch
  'ln-CD': 'Mwana azali kolia biloko elamu na ndako monene, mpe tata na ye azali kotala ye na esengo.', // Lingala
  'lt-LT': 'Ar vaikas, kuris skaito didele knyga savo namuose, jau baige visa pasakojima?', // Litauisch
  'lb-LU': 'D\'kand spillt net virun dem grousse haus, well et reent haut ganz staark dobaussen.', // Luxemburgisch
  'mk-MK': 'Deteto igra vo golemata kukja, no majka mu go povikuva za da vecera zaedno so semejstvoto.', // Mazedonisch
  'mg-MG': 'Rehefa mihinana vary ny zaza ao an-trano lehibe, dia mihira ny reniny eo akaikiny.', // Malagasy
  'ms-MY': 'Rumah besar ini lebih cantik daripada rumah kecil yang terletak berhampiran sungai itu.', // Malaiisch
  'ml-IN': 'Ee valiya veetu ente appante swantham aanu, avide oru kutti choru kazhikkunnu.', // Malayalam
  'dv-MV': 'Firihama gina therein ve, kudain gedegai innanee.', // Maledivisch
  'mt-MT': 'Iekol il-hobz shun issa qabel ma jiksah, u mbaghad mur ghand ommok!', // Maltesisch
  'mi-NZ': 'Kei te pehea koe? Kei te pai ahau, haere mai tatou ki te whare nui ki te moe.', // Maori
  'mr-IN': 'Jar mulga mothya gharat basla tar tyachi aai khup khush hoil ani tyala khau ghalel.', // Marathi
  'mn-MN': 'Khuukhed bagaasaa surval, tom bolokhod n\' said bolno gedeg yum.', // Mongolisch
  'ne-NP': 'Ma aafno thulo gharma baseko cha ra dherai pustakharu padhchu dinbhari.', // Nepalesisch
  'no-NO': 'Barna spiser epler sammen i det store huset mens foreldrene snakker med naboene ute.', // Norwegisch
  'nb-NO': 'Det finnes et gammelt tre utenfor det store huset der jenta pleier a lese boken sin.', // Norwegisch (Bokmål)
  'nn-NO': 'Guten les ei bok i det store huset medan katten soev roleg attmed omnen.', // Norwegisch (Nynorsk)
  'ny-MW': 'Kodi mwana akudya chakudya chabwino m\'nyumba yaikulu tsopano kapena ayi?', // Chichewa (Nyanja)
  'or-IN': 'Bhai aji bodo gharoku jau nahin, kahinki tanku bahut kama achi.', // Odia (Oriya)
  'oc-FR': 'Lo drolle juega dins l\'ostal grand, mas sa maire lo sona per manjar amb tota la familha.', // Okzitanisch
  'om-ET': 'Yeroo mucaan guddaan mana guddaa keessa ta\'u, haati isaa nyaata gaarii isaaf qopheessiti.', // Oromo
  'ur-PK': 'Yeh bara ghar us chote ghar se kahin zyada khubsurat hai jo dariya ke qareeb hai.', // Urdu
  'pa-IN': 'Eh vadda ghar mere dade da hai, jithe munda har roz apni kitab parhda hai.', // Punjabi
  'pap-CW': 'Awe solo ta kayente masha, p\'esei e mucha ta hunga den e sombra di e cas grandi.', // Papiamentu
  'ps-PK': 'Zar khpal loy kor ta za, tsalor da baran na makhke!', // Paschtu
  'fa-IR': 'Hale shoma chetor ast? Man khoobam, biya be khane-ye bozorg berim va ghaza bokhorim.', // Persisch
  'pl-PL': 'Jesli nasz duzy chwopiec przeczyta ksiazke w szkole, to nauczycielka bedzie bardzo zadowolona.', // Polnisch
  'pt-PT': 'Cao que ladra muito, poucas vezes morde, dizia sempre o meu avo perto do rio.', // Portugiesisch
  'qu-PE': 'Noqaqa wasiypi tiyani hatun qhawarispa intita sapa punchaw wawqiywan kuska.', // Quechua
  'ro-RO': 'Copiii invatsa multe cuvinte noi in scoala, in timp ce parintii lor lucreaza afara.', // Rumaenisch
  'ru-RU': 'V etom bolshom dome est mnogo starykh knig, kotorye nikto uzhe davno ne chitaet.', // Russisch
  'sm-WS': 'O le tama e ta\'alo pea i le maketi tele a\'o le fafine matua e faatali i le fale.', // Samoanisch
  'sg-CF': 'Bara mbi, mo yeke nzoni? Mo bara azo kue na kodoro ni la?', // Sango
  'sa-IN': 'Balakah vrikshasya chayayam na tishthati, api tu grihe eva sada vasati.', // Sanskrit
  'sc-IT': 'Su pitzinnu mannu essit dae sa domo cun su cuaddu, ma sa sorre sua abarrat inie.', // Sardisch
  'gd-GB': 'Nuair a bhios am balach a\' ithe a\' bhuntata, bidh an cu a\' feitheamh anns an taigh mor.', // Gaelisch (Schottisch)
  'sr-RS': 'Ovo veliko brdo je mnogo lepse od onog malog brda gde raste crveno cvece.', // Serbisch
  'sn-ZW': 'Imba yedu huru ndeye sekuru vangu, uye mwana anofamba paruzevha rwavo mazuva ese.', // Shona
  'sd-PK': 'Aaj ghar bahar bahut garmi aahe, ain chokro pani ma khedhi rahyo aahe.', // Sindhi
  'si-LK': 'Ikman karala loku gedarai enna, wahinawa patan gaanna kalinma!', // Singhalesisch
  'sk-SK': 'Ako sa mas? Dobre, podme spolu na vrch, kde sme videli vlka a srnu minule.', // Slowakisch
  'sl-SI': 'Ce bo fant bral knjigo v velikem mestu, bo zagotovo veliko novega izvedel.', // Slowenisch
  'so-SO': 'Wiilku wuxuu ku faraxsan yahay guriga cusub ee weyn ee dhex jira magaalada.', // Somali
  'nr-ZA': 'Mina ngihlala endlini enkulu begodu ngicabanga ngendlu leyo qobe langa.', // Süd-Ndebele
  'su-ID': 'Barudak leutik dahar sangu babarengan di imah gede sabot indungna damang di dapur.', // Sundanesisch
  'st-ST': 'Ho na le ntlo e kgolo haufi le noka, moo ngwana a hlokomelang diphoofolo tsa hae.', // Sesotho
  'es-ES': 'El perro corre rapido por el jardin mientras el gato duerme tranquilo sobre la silla vieja.', // Spanisch
  'sw-SZ': 'Je, mtoto mkubwa anasoma kitabu ghalani kila siku baada ya shule kumalizika?', // Swahili
  'ss-SZ': 'Umntfwana akacabangi ngendlu lenkhulu, kodvwa ucabanga ngemake wakhe njalo.', // Swati (Siswati)
  'sv-SE': 'Flickan sjunger en vacker sang i det stora huset, och hennes bror lyssnar noga fran koket.', // Schwedisch
  'tl-PH': 'Kapag ang bata\'y kumakain ng malaking mangga sa bahay, ang kanyang ina ay natutuwa nang husto.', // Tagalog
  'tg-TJ': 'In khonai bozorg az khonai khurdi nazdik ba dare khele zebotar ast.', // Tadschikisch
  'ta-LK': 'Intha periya veedu en appavukku sondham, adhil oru paiyan vazhi vazhi nadakkiran.', // Tamil
  'tt-RU': 'Bugen tashkarida bik yily, shuna kure bala oli oyda kitap uqiy utyra.', // Tatarisch
  'te-IN': 'Ippude pedda intiki vellu, vana modalu kakamunde!', // Telugu
  'tet-TL': 'Oinsa? Ha\'u diak, mai ita ba hamutuk ba uma boot atu han hamutuk ho familia.', // Tetum
  'th-TH': 'Tha dek noi kin khao nai baan yai laeo, mae khong khao ja dee jai maak.', // Thailaendisch
  'bo-CN': 'Bu chung gis khangpa chenpo nang legpar do na, pha ma gaki gyur gi red.', // Tibetisch
  'ti-TI': 'Ane geza\'ey iye zenebar, k\'ondi eyu geza\'ey.', // Tigrinya
  'tpi-PG': 'Ol pikinini i stap insait long bikpela haus, na ol i wetim papa bilong ol i kam bek long taun.', // Tok Pisin
  'cv-RU': 'Pysak churtra ashshe puranat, unta numai kneke pur.', // Tschuwaschisch
  'ts-ZA': 'N\'wana loyi wa antswa endlwini leyikulu naswona wa tsakela ku tlanga na vamakwavo hi masiku.', // Tsonga
  'tn-BW': 'A ngwana o dira tiro mo ntlung e kgolo gompieno kgotsa o santse a robetse?', // Tswana
  'tr-TR': 'Buyuk chocuk agach altinda kitap okumuyor, cunku hava bugun cok sicak.', // Tuerkisch
  'tk-TM': 'Oglan uly oyde kitap okayar, emma onun uyasy bagda gullar bilen oynayar.', // Turkmenisch
  'tw-GH': 'Se yeko gua no a, yebeto nnuane pa ama abusua no nyinaa adi.', // Twi
  'ug-CN': 'Bu chong oy u kichik oydin kop guzel, chunki uningda kop derakhtlar bar.', // Uigurisch
  'uk-UA': 'Tsey velykyi budynok nalezhyt\' moiemu didusevi, i onuk chytaie tam knyhu shchodnia.', // Ukrainisch
  'uz-UZ': 'Bugun tashqarida juda issiq, shuning uchun bola katta uyda kitob oqib otiribdi.', // Usbekisch
  'vi-VN': 'Hay vao trong cai nha lon ngay di, truoc khi con meo chay mat ra ngoai troi mua!', // Vietnamesisch
  'cy-GB': 'Sut wyt ti? Rydw i\'n dda, dere i chwarae yn y llan fach gyda\'r bachgen mawr.', // Walisisch
  'fy-NL': 'As de jonge boer nei it grutte hus rint, sil syn frou al klear stean mei it iten.', // Westfriesisch
  'wo-SN': 'Xale bi dafa lekk ceeb bu baax ci ker gi bu rafet.', // Wolof
  'xh-ZA': 'Umntwana uhlala kwikhaya elikhulu kwaye uyaqonda ukuba uzokhula kakuhle apha.', // Xhosa
  'yi-YD': 'Di kinder lernen zeyere bikher in a groysn hoyz, nokh in nemen fun zeyer alter zeyde.', // Jiddisch
  'yo-NG': 'Omo nla kan wa ti n gbe ile nla, o si maa n ka iwe ni gbogbo ojo.', // Yoruba
  'zu-ZA': 'Umntwana uhlala endlini enkulu futhi uyaqonda ukuthi indlu leyo yakhiwe ngu khokho wakhe.', // Zulu
};

/**
 * Liefert den Beispielsatz fuer einen Sprachcode, oder null, wenn keiner
 * hinterlegt ist (z. B. bei einem eigenen/benutzerdefinierten Sprachcode).
 * @param {string} code
 * @returns {string|null}
 */
export function beispielsatzFuerCode(code) {
  return BEISPIELSAETZE[code] || null;
}
