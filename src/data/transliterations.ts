// Master switch for the custom academic transliteration feature. When false,
// the original text (JPS proper nouns and the standard parasha names) is shown
// unchanged. The mapping tables and logic below are intentionally preserved so
// the feature can be turned back on by flipping this flag.
export const CUSTOM_TRANSLITERATION_ENABLED = false;

// Maps JPS English proper nouns → academic Hebrew transliteration.
// Conventions applied throughout:
//   ḥ = ח  (anywhere in word)
//   ṭ = ט  (anywhere in word)
//   ṣ = צ  (anywhere in word — never 'ts', 'z', or plain 's')
//   q = ק
//   ʿ = ע  (anywhere in word)
//   ʾ = א  (between vowels, to prevent misreading)
//   f = פ  (fricative, without dagesh — never 'ph')
//   v = ב / ו  (fricative)
//   Y or I = י at the start of a name (never J)

const TRANSLITERATIONS: Record<string, string> = {

  // ===================== PATRIARCHS & MATRIARCHS =====================

  'Abraham': 'Avraham',
  'Sarah': 'Sarah',
  'Hagar': 'Hagar',
  'Isaac': 'Yiṣḥaq',
  'Rebekah': 'Rivqah',
  'Jacob': 'Yaʿaqov',
  'Rachel': 'Raḥel',
  'Leah': 'Leʾah',
  'Esau': 'ʿEsaw',
  'Ishmael': 'Yishmaʿel',
  'Nahor': 'Naḥor',

  // ===================== SONS OF JACOB / TRIBES =====================

  'Reuben': 'Reʾuven',
  'Reubenites': 'Reʾuvenites',
  'Simeon': 'Shimʿon',
  'Simeonites': 'Shimʿonites',
  'Judah': 'Yehudah',
  'Joseph': 'Yosef',
  'Benjamin': 'Binyamin',
  'Issachar': 'Yiśśakhar',
  'Naphtali': 'Naftali',
  'Naphtalites': 'Naftalites',
  'Zebulun': 'Zevulun',
  'Zebulunites': 'Zevulunites',
  'Ephraim': 'Efrayim',
  'Manasseh': 'Menasheh',

  // ===================== GENESIS FIGURES =====================

  'Ham': 'Ḥam',
  'Japheth': 'Yefeth',
  'Joktan': 'Yoqtan',
  'Jobab': 'Yovav',
  'Enoch': 'Ḥanokh',
  'Methuselah': 'Metushelaḥ',
  'Lamech': 'Lemekh',
  'Cain': 'Qayin',
  'Kain': 'Qayin',
  'Er': 'ʿEr',
  'Onan': 'ʾOnan',
  'Shelah': 'Shelah',
  'Perez': 'Pereṣ',
  'Perezites': 'Pereṣites',
  'Zerah': 'Zeraḥ',
  'Zerahites': 'Zeraḥites',
  'Tamar': 'Tamar',
  'Keturah': 'Qeṭurah',
  'Hamor': 'Ḥamor',
  'Ephron': 'ʿEfron',
  'Heth': 'Ḥeth',
  'Laban': 'Lavan',
  'Shechem': 'Shekhem',
  'Shechemites': 'Shekhemites',
  'Seir': 'Seʿir',
  'Zoar': 'Ṣoʿar',
  'Potiphar': 'Poṭifar',
  'Asenath': 'ʾAsenat',
  'Eliphaz': 'Elifaz',
  'Abimelech': 'Avimelekh',
  'Phicol': 'Fikol',
  'Nephilim': 'Nefilim',
  'Bela': 'Belaʿ',
  'Belaites': 'Belaʿites',
  'Eliab': 'Eliav',
  'Ephrathah': 'Efratah',
  'Ephrath': 'Efrat',

  // ===================== EXODUS FIGURES =====================

  'Moses': 'Moshe',
  'Aaron': 'Aharon',
  'Miriam': 'Miryam',
  'Jochebed': 'Yokheved',
  'Jethro': 'Yitro',
  'Zipporah': 'Ṣipporah',
  'Hobab': 'Ḥovav',
  'Hur': 'Ḥur',
  'Bezalel': 'Beṣalʾel',
  'Oholiab': 'Oholiav',

  // ===================== NUMBERS / WILDERNESS =====================

  'Korah': 'Qoraḥ',
  'Korahites': 'Qoraḥites',
  'Abiram': 'Aviram',
  // Dathan: JPS "Dathan" already reflects thav — entry removed (no-op)
  'Sihon': 'Siḥon',
  'Balak': 'Balaq',
  'Balaam': 'Bilʿam',
  'Phinehas': 'Pinḥas',
  'Og': 'ʿOg',
  'Eleazar': 'Elʿazar',
  'Zelophehad': 'Ṣelofḥad',
  'Mahlah': 'Maḥlah',
  'Hoglah': 'Ḥoglah',
  'Milcah': 'Milkah',                  // מִלְכָּה — כּ (kaf with dagesh = k), NOT ק
  'Tirzah': 'Tirṣah',
  'Nahshon': 'Naḥshon',
  'Kohath': 'Qehath',
  'Kohathites': 'Qehathites',
  'Jair': 'Yaʾir',
  'Jahleel': 'Yaḥleʾel',
  'Jahleelites': 'Yaḥleʾelites',
  'Jahzeel': 'Yaḥṣeʾel',
  'Jahzeelites': 'Yaḥṣeʾelites',
  'Jahath': 'Yaḥath',
  'Jashub': 'Yashuv',
  'Jashubites': 'Yashuvites',
  'Zippor': 'Ṣippor',
  'Beor': 'Beʿor',
  'Caleb': 'Kalev',
  'Joshua': 'Yehoshuaʿ',
  'Jephunneh': 'Yefunneh',
  'Elizur': 'Eliṣur',
  'Gamaliel': 'Gamliʾel',
  'Shelumiel': 'Shelumiʾel',
  'Eliasaph': 'Elyasaf',
  'Chemosh': 'Kemosh',
  'Abihu': 'Avihu',
  'Nadab': 'Nadav',                  // נָדָב — final ב after vowel = vet
  'Zur': 'Ṣur',
  'Evi': 'ʾEvi',                     // אֱוִי — Midianite king (Num 31:8); ʾ for alef, v for vet
  'Rekem': 'Reqem',                  // רֶקֶם — q for quf
  'Reba': 'Revaʿ',                   // רֶבַע — v for vet after vowel, ʿ for ayin
  'Midian': 'Midyan',

  // ===== Numbers 26 clan names =====

  // Reuben
  'Hanoch': 'Ḥanokh',
  'Hanochites': 'Ḥanokhites',
  'Enochites': 'Ḥanokhites',
  'Hezron': 'Ḥeṣron',
  'Hezronites': 'Ḥeṣronites',
  'Palluites': 'Palluʾites',

  // Simeon
  'Nemuel': 'Nemuʾel',
  'Nemuelites': 'Nemuʾelites',
  'Jamin': 'Yamin',
  'Jaminites': 'Yaminites',
  'Jachin': 'Yakhin',
  'Jachinites': 'Yakhinites',
  'Shaul': 'Shaʾul',
  'Shaulites': 'Shaʾulites',
  'Saulites': 'Shaʾulites',

  // Gad
  'Zephon': 'Ṣefon',
  'Zephonites': 'Ṣefonites',
  'Haggi': 'Ḥaggi',
  'Haggites': 'Ḥaggites',
  'Eri': 'ʿEri',
  'Erites': 'ʿErites',

  // Judah
  'Hamul': 'Ḥamul',
  'Hamulites': 'Ḥamulites',

  // Issachar
  'Tola': 'Tolaʿ',
  'Tolaites': 'Tolaʿites',
  'Puvah': 'Fuvah',

  // Manasseh
  'Machir': 'Makhir',
  'Machirites': 'Makhirites',
  'Helek': 'Ḥeleq',
  'Helekites': 'Ḥeleqites',
  'Iezer': 'Iyeʿzer',
  'Iezerites': 'Iyeʿzerites',
  'Hepher': 'Ḥefer',
  'Hepherites': 'Ḥeferites',
  'Shemidaites': 'Shemidaites',
  'Malchiel': 'Malkiʾel',              // מַלְכִּיאֵל — כּ (kaf with dagesh = k), NOT ק
  'Malchielites': 'Malkiʾelites',
  'Gileadites': 'Gilʿadites',

  // Ephraim
  'Shuthelah': 'Shutelaḥ',
  'Shuthelahites': 'Shutelaḥites',
  'Becher': 'Bekher',
  'Becherites': 'Bekherites',
  'Tahan': 'Taḥan',
  'Tahanites': 'Taḥanites',
  'Eran': 'ʿEran',
  'Eranites': 'ʿEranites',

  // Benjamin
  'Ahiram': 'Aḥiram',
  'Ahiramites': 'Aḥiramites',
  'Shupham': 'Shufam',
  'Shuphamites': 'Shufamites',
  'Shephupham': 'Shefufam',
  'Hupham': 'Ḥufam',
  'Huphamites': 'Ḥufamites',
  'Naamanites': 'Naʿamanites',

  // Dan
  'Shuham': 'Shuḥam',
  'Shuhamites': 'Shuḥamites',

  // Asher
  'Imnah': 'Yimnah',
  'Imnites': 'Yimnites',
  'Ishvi': 'Yishvi',
  'Ishvites': 'Yishvites',
  'Beriah': 'Beriʿah',
  'Beriites': 'Beriʿites',
  'Beriahites': 'Beriʿahites',
  'Heber': 'Ḥever',
  'Heberites': 'Ḥeverites',
  'Serah': 'Seraḥ',

  // Naphtali
  'Jezer': 'Yeṣer',
  'Jezerites': 'Yeṣerites',

  // Levi (Numbers 26:57–62)
  'Hebronites': 'Ḥevronites',
  'Mahli': 'Maḥli',
  'Mahlites': 'Maḥlites',
  'Mahlon': 'Maḥlon',

  // Numbers 1 tribal leaders
  'Elishama': 'Elishamaʿ',
  'Ahiezer': 'Aḥiʿezer',
  'Pagiel': 'Pagʿiʾel',
  'Ahira': 'Aḥiraʿ',
  'Nethanel': 'Netanʾel',
  'Abidan': 'Avidan',

  // ===================== JUDGES / EARLY PROPHETS =====================

  'Jephthah': 'Yiftaḥ',
  'Gideon': 'Gidʿon',
  'Jabin': 'Yavin',
  'Barak': 'Baraq',
  'Deborah': 'Devorah',
  'Samson': 'Shimshon',
  'Rahab': 'Raḥav',
  'Hannah': 'Ḥannah',
  'Eli': 'ʿEli',
  'Japhia': 'Yafiʿa',
  'Ophrah': 'ʿOfrah',

  // ===================== SAMUEL / KINGS ERA =====================

  'Samuel': 'Shemuʾel',
  'Saul': 'Shaʾul',
  'Jonathan': 'Yonathan',
  'David': 'David',
  'Solomon': 'Shelomoh',
  // Nathan: JPS "Nathan" already reflects thav — entry removed (no-op)
  'Joab': 'Yoʾav',
  'Abner': 'Avner',
  'Shaphat': 'Shafaṭ',
  'Elijah': 'Eliyyahu',
  'Elisha': 'Elishaʿ',
  'Obadiah': 'ʿOvadyah',
  'Ahab': 'Aḥav',
  'Ahaz': 'Aḥaz',
  'Ahaziah': 'Aḥazyah',
  'Ahijah': 'Aḥiyyah',
  'Jezebel': 'Izével',
  'Rehoboam': 'Reḥovʿam',
  'Jeroboam': 'Yarovʿam',
  'Jehu': 'Yehu',
  'Joel': 'Yoʾel',
  'Joash': 'Yoʾash',
  'Jehoshaphat': 'Yehoshafat',
  'Jehoiada': 'Yehoyadeaʿ',
  'Jehoiakim': 'Yehoyaqim',
  'Jehoiachin': 'Yehoyakhin',
  'Hazael': 'Ḥazaʾel',
  'Naaman': 'Naʿaman',
  'Gehazi': 'Geḥazi',
  'Hezekiah': 'Ḥizqiyyah',
  'Uzziah': 'ʿUziyyah',
  'Amaziah': 'ʿAmaṣyah',
  'Zedekiah': 'Ṣidqiyyahu',
  'Javan': 'Yavan',
  'Pharaoh': 'Parʿoh',
  'Pharaohs': 'Parʿohs',

  // ===================== WRITING PROPHETS =====================

  'Isaiah': 'Yeshaʿyahu',
  'Jeremiah': 'Yirmeyahu',
  'Ezekiel': 'Yeḥezqeʾel',
  'Hosea': 'Hosheaʿ',
  'Hoshea': 'Hosheaʿ',
  'Amos': 'ʿAmos',
  'Jonah': 'Yonah',
  'Micah': 'Mikhah',
  'Nahum': 'Naḥum',
  'Habakkuk': 'Ḥavaquq',
  'Zephaniah': 'Ṣefanyah',
  'Haggai': 'Ḥaggai',
  'Zechariah': 'Zekaryah',
  'Malachi': 'Malʾakhi',
  'Nehemiah': 'Neḥemyah',
  'Rezin': 'Reṣin',

  // ===================== RUTH / MEGILLOT =====================

  'Boaz': 'Boʿaz',
  'Naomi': 'Noʿomi',
  'Orpah': 'ʿOrpah',
  'Obed': 'ʿOved',
  // Ruth: JPS "Ruth" already reflects thav — entry removed (no-op)
  'Elimelech': 'Elimelekh',

  // ===================== PLACES =====================

  'Nebo': 'Nevo',                      // נְבוֹ — ב after vowel = vet
  'Sebam': 'Sevam',                    // שְׂבָם — שׂ = sin; ב after vowel = vet
  'Sibmah': 'Sivmah',                  // שִׂבְמָה — alternate spelling same place
  'Elealeh': 'ʾElʿaleh',              // אֶלְעָלֵה — ʾ for alef, ʿ for ayin
  'Jogbehah': 'Yogvehah',             // יׇגְבְּהָה — J→Y; ב after vowel = vet
  'Beth-nimrah': 'Beth-Nimrah',        // בֵּית נִמְרָה — capitalize second element
  'Beth-haran': 'Beth-Haran',          // בֵּית הָרָן — ה (hey), NOT ח; plain h
  'Heshbon': 'Ḥeshbon',
  'Kadesh': 'Qadesh',
  'Hebron': 'Ḥevron',
  'Haran': 'Ḥaran',
  'Hormah': 'Ḥormah',
  'Horeb': 'Ḥorev',
  'Jabbok': 'Yabboq',
  'Jahaz': 'Yahaṣ',
  'Jazer': 'Yaʿzer',
  'Jordan': 'Yarden',
  'Jericho': 'Yeriḥo',
  'Jezreel': 'Yizreʿel',
  'Jabesh': 'Yavesh',
  'Jabesh-gilead': 'Yavesh-Gilʿad',
  'Peor': 'Peʿor',
  'Beer': 'Beʾer',
  'Nahaliel': 'Naḥaliʾel',
  'Zin': 'Ṣin',
  'Edrei': 'Edreʿi',
  'Arad': 'ʿArad',
  'Shittim': 'Shiṭṭim',
  'Oboth': 'Ovoth',
  'Dibon': 'Divon',
  'Hazor': 'Ḥaṣor',
  'Succoth': 'Sukkoth',
  'Hazeroth': 'Ḥaṣeroth',
  'Penuel': 'Penuʾel',
  'Mahanaim': 'Maḥanayim',
  'Tabor': 'Tavor',
  'Gilead': 'Gilʿad',
  'Bethel': 'Beth-El',
  'Beersheba': 'Beʾer-Shevaʿ',
  'Ophir': 'Ofir',
  'Moriah': 'Moriyyah',
  'Canaan': 'Kenaʿan',
  'Gomorrah': 'ʿAmorah',
  'Gaza': 'ʿAzah',
  'Gibeah': 'Givʿah',
  'Gibeon': 'Givʿon',
  'Geba': 'Gevaʿ',
  'Elam': 'ʿElam',
  'Hamath': 'Ḥamath',
  'Bethlehem': 'Beth-Leḥem',
  'Joppa': 'Yafo',
  'Jokneam': 'Yoqneʿam',
  'Zion': 'Ṣiyyon',
  'Zorah': 'Ṣorʿah',
  'Zarephath': 'Ṣarefath',           // צָרְפַת — final ת = thav
  'Elath': 'ʾElath',                 // אֵילַת — final ת = thav

  // ===================== NATIONS & PEOPLES =====================

  'Moab': 'Moʾav',
  'Moabite': 'Moʾavite',
  'Moabites': 'Moʾavites',
  'Ammonite': 'ʿAmmonite',
  'Ammonites': 'ʿAmmonites',
  'Amalek': 'ʿAmaleq',
  'Amalekite': 'ʿAmaleqite',
  'Amalekites': 'ʿAmaleqites',
  'Kenite': 'Qenite',
  'Kenites': 'Qenites',
  'Hittite': 'Ḥittite',
  'Hittites': 'Ḥittites',
  'Hivite': 'Ḥiwwite',
  'Hivites': 'Ḥiwwites',
  'Horite': 'Ḥorite',
  'Horites': 'Ḥorites',
  'Midianite': 'Midyanite',
  'Midianites': 'Midyanites',
  'Ishmaelite': 'Yishmaʿelite',
  'Ishmaelites': 'Yishmaʿelites',
  'Jebusite': 'Yevusite',
  'Jebusites': 'Yevusites',
  'Canaanite': 'Kenaʿanite',
  'Canaanites': 'Kenaʿanites',
  'Gibeonite': 'Givʿonite',
  'Gibeonites': 'Givʿonites',
  'Philistine': 'Pelishti',
  'Philistines': 'Pelishtim',

  // ===================== COMPOUND PLACE NAMES =====================

  'Baal-peor': 'Baʿal-Peʿor',
  'Kiriath-huzoth': 'Qiryath-Ḥuṣoth',
  'Bamoth-baal': 'Bamoth-Baʿal',
  'Ir-moab': 'ʿIr-Moʾav',
  'Iye-abarim': 'ʿIye-haʿAvarim',
  'Sedeh-zophim': 'Sedeh-Ṣofim',
  'Meribath-kadesh': 'Merivath-Qadesh',
  'Kibroth-hattaavah': 'Qivroth-haTaʾawah',
  'Kadesh-barnea': 'Qadesh-Barneaʿ',
  'Beer-sheba': 'Beʾer-Shevaʿ',
  'Beth-peor': 'Beth-Peʿor',
  'Baal-zephon': 'Baʿal-Ṣefon',
  'Kiriath-arba': 'Qiryath-Arbaʿ',

  // ===================== J → Y CORRECTIONS =====================

  'Adonijah': 'Adoniyyah',           // אֲדֹנִיָּה
  'Jabal': 'Yaval',                  // יָבָל
  'Jael': 'Yaʿel',                   // יָעֵל — also ayin
  'Jalam': 'Yaʿlam',                 // יַעְלָם — also ayin
  'Jashobeam': 'Yashobʿam',          // יָשׇׁבְעָם — also ayin
  'Jeconiah': 'Yekhonyah',           // יְכׇנְיָה
  'Jeduthun': 'Yeduthun',             // יְדוּתוּן — ת after vowel = thav
  'Jehiel': 'Yeḥiʾel',               // יְחִיאֵל — also ḥet
  'Jehoahaz': 'Yehoʾaḥaz',           // יְהוֹאָחָז — also ḥet
  'Jehoash': 'Yehoʾash',             // יְהוֹאָשׁ
  'Jehoram': 'Yehoram',              // יְהוֹרָם
  'Jehosheba': 'Yehoshevaʿ',         // יְהוֹשֶׁבַע — also ayin
  'Jeiel': 'Yeʿiʾel',                // יְעִיאֵל — also ayin
  'Jerahmeel': 'Yeraḥmeʾel',         // יְרַחְמְאֵל — also ḥet
  'Jeruel': 'Yeruʾel',               // יְרוּאֵל
  'Jeshimon': 'Yeshimon',            // יְשִׁימוֹן
  'Jetheth': 'Yeteth',               // יְתֵת
  'Jetur': 'Yeṭur',                  // יְטוּר — ט = ṭ
  'Jeuel': 'Yeʿiʾel',                // יְעִיאֵל — variant of Jeiel
  'Jeush': 'Yeʿush',                 // יְעוּשׁ — also ayin
  'Jidlaph': 'Yidlaf',               // יִדְלָף — also peh → f
  'Joah': 'Yoʾaḥ',                   // יוֹאָח — also ḥet
  'Jonadab': 'Yonadav',              // יוֹנָדָב
  'Jokshan': 'Yoqshan',              // יָקְשָׁן — also quf
  'Joram': 'Yoram',                  // יוֹרָם
  'Josiah': 'Yoshiyyahu',            // יֹאשִׁיָּהוּ
  'Jubal': 'Yuval',                  // יוּבָל
  'Judith': 'Yehudith',               // יְהוּדִית — final ת = thav
  'Benjaminite': 'Binyaminite',
  'Benjaminites': 'Binyaminites',
  'Bene-jaakan': 'Bene-Yaʿaqan',     // also ayin
  'Beeroth-bene-jaakan': 'Beeroth-Bene-Yaʿaqan',  // בְּאֵרֹת — final ת = thav

  // ===================== AYIN (ʿ) =====================

  'Abarim': 'ʿAvarim',               // עֲבָרִים
  'Abida': 'Avidaʿ',                 // אֲבִידָע — ayin at end
  'Abinoam': 'Avinoʿam',             // אֲבִינֹעַם
  'Achbor': 'ʿAkhbor',               // עַכְבּוֹר
  'Achor': 'ʿAkhor',                 // עָכוֹר
  'Adah': 'ʿAdah',                   // עָדָה
  'Adullamite': 'ʿAdullamite',       // עֲדֻלָּמִי
  'Ain': 'ʿAyin',                    // עַיִן
  'Akan': 'ʿAqan',                   // עָקָן — also quf
  'Akrabbim': 'ʿAqrabbim',           // עַקְרַבִּים — also quf
  'Almon-diblathaim': 'ʿAlmon-Divlathaim', // עַלְמֹן דִּבְלָתַיְמָה — ת after vowel = thav
  'Alvah': 'ʿAlvah',                 // עַלְוָה
  'Alvan': 'ʿAlvan',                 // עַלְוָן
  'Amasa': 'ʿAmasa',                 // עֲמָשָׂא
  'Ammiel': 'ʿAmmiʾel',              // עַמִּיאֵל
  'Ammihud': 'ʿAmmihud',             // עַמִּיהוּד — ה (hey) in הוּד, NOT ח
  'Amminadab': 'ʿAmminadav',         // עַמִּינָדָב
  'Ammishaddai': 'ʿAmishaddai',      // עַמִּישַׁדַּי
  'Amram': 'ʿAmram',                 // עַמְרָם
  'Amramites': 'ʿAmramites',
  'Anah': 'ʿAnah',                   // עֲנָה
  'Anak': 'ʿAnaq',                   // עֲנָק — also quf
  'Anakites': 'ʿAnaqites',
  'Anath': 'ʿAnath',                 // עֲנָת — final ת = thav
  'Anathoth': 'ʿAnatoth',            // עֲנָתוֹת — final ת = thav
  'Arabah': 'ʿAravah',               // עֲרָבָה
  'Arod': 'ʿArod',                   // עֲרוֹד
  'Arodi': 'ʿArodi',
  'Arodites': 'ʿArodites',
  'Ashtaroth': 'ʿAshtaroth',         // עַשְׁתָּרוֹת — final ת = thav
  'Ashteroth-karnaim': 'ʿAshtaroth-Qarnayim', // final ת = thav; also quf
  'Ataroth': 'ʿAtaroth',             // עֲטָרוֹת — final ת = thav
  'Atroth-shophan': 'ʿAtroth-Shofan', // עַטְרֹת שׁוֹפָן — ת = thav; also peh → f
  'Avvim': 'ʿAwwim',                 // עַוִּים
  'Azazel': 'ʿAzaʾzel',              // עֲזָאזֵל
  'Azmon': 'ʿAṣmon',                 // עַצְמוֹן — also tsadi
  'Azzan': 'ʿAzzan',                 // עַזָּן
  'Baal': 'Baʿal',                   // בַּעַל
  'Baalim': 'Baʿalim',
  'Baali': 'Baʿali',
  'Baal-hanan': 'Baʿal-Ḥanan',       // also ḥet
  'Baal-meon': 'Baʿal-Meʿon',        // ayin in both parts
  'Baal-shalishah': 'Baʿal-Shalishah',
  'Belial': 'Beliyaʿal',             // בְּלִיַּעַל
  'Ben-ammi': 'Ben-ʿAmmi',           // עַמִּי
  'Beon': 'Veʿon',                   // בְּעֹן — ב without dagesh = vet
  'Bera': 'Beraʿ',                   // בֶּרַע — king of Sodom
  'Birsha': 'Birshaʿ',               // בֶּרֶשַׁע — king of Gomorrah
  'Chedorlaomer': 'Kedorlaʿomer',    // כְּדׇרְלָעֹמֶר
  'Eber': 'ʿEver',                   // עֵבֶר
  'Ebal': 'ʿEival',                  // עֵיבָל (Mount Ebal)
  'Eden': 'ʿEden',                   // עֵדֶן
  'Hadadezer': 'Hadadʿezer',         // הֲדַדְעֶזֶר
  'Maon': 'Maʿon',                   // מָעוֹן
  'Naamah': 'Naʿamah',               // נַעֲמָה
  'Ophel': 'ʿOfel',                  // עֹפֶל
  'Reu': 'Reʿu',                     // רְעוּ
  'Shua': 'Shuaʿ',                   // שׁוּעַ — Judah's wife
  'Taberah': 'Tavʿerah',             // תַּבְעֵרָה
  'Tekoa': 'Teqoʿa',                 // תְּקוֹעַ — also quf
  'Tekoah': 'Teqoʿa',                // alternate spelling
  'Timna': 'Timnaʿ',                 // תִּמְנַע — ayin at end
  'Uzza': 'ʿUzza',                   // עֻזָּא
  'Uzzah': 'ʿUzzah',                 // עֻזָּה
  'Uzziel': 'ʿUzziʾel',              // עֻזִּיאֵל
  'Uzzielites': 'ʿUzziʾelites',
  'Zaavan': 'Zaʿavan',               // זַעֲוָן
  'Zibeon': 'Ṣivʿon',                // צִבְעוֹן — also tsadi
  'Zoan': 'Ṣoʿan',                   // צֹעַן — also tsadi

  // ===================== HET (ḥ) =====================

  'Abel-meholah': 'Abel-Meḥolah',    // מְחוֹלָה
  'Abihail': 'Aviḥayil',             // אֲבִיחַיִל
  'Ahihud': 'Aḥihud',                // אֲחִיהוּד
  'Ahiman': 'Aḥiman',                // אֲחִימָן
  'Ahio': 'Aḥyo',                    // אַחְיוֹ
  'Ahisamach': 'Aḥisamakh',          // אֲחִיסָמָךְ
  'Ahuzzath': 'Aḥuzzath',            // אֲחֻזַּת — final ת = thav
  'Bahurim': 'Baḥurim',              // בַּחוּרִים
  'Baruch': 'Barukh',                // בָּרוּךְ (kaf)
  'Beer-lahai-roi': 'Beʾer-Laḥai-Roʾi', // לַחַי
  'Cheran': 'Ḥeran',                 // חֵרָן — Horite chief
  'Hananiah': 'Ḥananyah',            // חֲנַנְיָה
  'Havilah': 'Ḥavilah',              // חֲוִילָה
  'Hobah': 'Ḥovah',                  // חֹבָה — ב after vowel = vet
  'Huldah': 'Ḥuldah',                // חֻלְדָּה
  'Hushai': 'Ḥushai',                // חוּשַׁי
  'Nahash': 'Naḥash',                // נָחָשׁ
  'Rehob': 'Reḥov',                  // רְחֹב
  'Shuah': 'Shuaḥ',                  // שׁוּחַ — Keturah's son
  'Terah': 'Teraḥ',                  // תֶּרַח
  'Zohar': 'Ṣoḥar',                  // צֹחַר — also tsadi

  // ===================== TSADI (ṣ) =====================

  'Amoz': 'ʾAmoṣ',                   // אָמוֹץ — Isaiah's father
  'Bozrah': 'Boṣrah',                // בָּצְרָה
  'Sidon': 'Ṣidon',                  // צִידוֹן
  'Zalmonah': 'Ṣalmonah',            // צַלְמֹנָה
  'Zaphenath-paneah': 'Ṣafnat-Paneaḥ', // צָפְנַת פַּעְנֵחַ — also ayin + ḥet
  'Zarethan': 'Ṣarethan',            // צָרְתַן
  'Zedad': 'Ṣedad',                  // צְדָד
  'Zeboiim': 'Ṣevoyyim',             // צְבוֹיִם
  'Zemarites': 'Ṣemarites',          // צְמָרִי
  'Zeruiah': 'Ṣeruyah',              // צְרוּיָה
  'Zuriel': 'Ṣuriʾel',               // צוּרִיאֵל
  'Zurishaddai': 'Ṣurishaddai',      // צוּרִישַׁדַּי

  // ===================== PEH → F =====================

  'Abiasaph': 'Avyasaf',             // אֶבְיָסָף — final peh → f
  'Amraphel': 'Amrafel',             // אַמְרָפֶל
  'Arioch': 'Aryokh',                // אַרְיוֹךְ — kaf at end
  'Bethuel': 'Bethuʾel',             // בְּתוּאֵל — aleph in middle
  'Sheleph': 'Shelef',               // שֶׁלֶף — Joktan's son
  'Shepham': 'Shefam',               // שְׁפָם — northern boundary
  'Shepher': 'Shefer',               // שֶׁפֶר — campsite
  'Shepho': 'Shefo',                 // שֶׁפוֹ — Shobal's son
  'Shiphrah': 'Shifrah',             // שִׁפְרָה — midwife
  'Shiphtan': 'Shifṭan',             // שִׁפְטָן — ט = ṭ; also peh → f

  // ===================== ADDITIONAL — BATCH 2 =====================

  // Ayin
  'Shimei': 'Shimʿi',               // שִׁמְעִי
  'Shimeites': 'Shimʿites',
  'Shinar': 'Shinʿar',              // שִׁנְעָר
  'Taanach': 'Taʿanakh',            // תַּעֲנַךְ
  'Tidal': 'Tidʿal',                // תִּדְעָל — king in Gen 14
  'Zuar': 'Ṣuʿar',                  // צוּעָר — also tsadi

  // Het
  'Tahash': 'Taḥash',               // תַּחַשׁ — Nahor's son
  'Tahath': 'Taḥath',               // תַּחַת — final ת = thav
  'Harod': 'Ḥarod',                 // חֲרֹד — Gideon's spring
  'Harosheth-hagoiim': 'Ḥarosheth-haGoyim', // חֲרֹשֶׁת הַגּוֹיִם — final ת = thav

  // Tsadi
  'Sitnah': 'Siṭnah',              // שִׂטְנָה — note: sin+ṭet; ṭ for tet
  'Zadok': 'Ṣadoq',                 // צָדוֹק — tsadi + quf
  'Zepho': 'Ṣefo',                  // צְפוֹ — Edomite chief
  'Ziphion': 'Ṣifyon',              // צִפְיוֹן — Gad's son (Gen 46)
  'Ziphron': 'Ṣifron',              // צִפְרֹן — northern boundary
  'Zebulunite': 'Zevulunite',       // from Zevulun

  // Quf
  'Tubal-cain': 'Tuval-Qayin',      // תּוּבַל-קַיִן — quf in qayin

  // J → Y
  'Jaazaniah': 'Yaʾazanyahu',       // יַאֲזַנְיָהוּ — Ezekiel haftarot

  // ===================== ADDITIONAL — BATCH 3 =====================

  // Major places (high-frequency across many parashiot)
  'Jerusalem': 'Yerushalayim',      // יְרוּשָׁלַיִם
  'Lebanon': 'Levanon',             // לְבָנוֹן — ב after vowel = vet
  'Hermon': 'Ḥermon',               // חֶרְמוֹן — ḥ for het
  'Babel': 'Bavel',                  // בָּבֶל — second ב after vowel = vet
  'Babylon': 'Bavel',                // same Hebrew word
  'Euphrates': 'Perat',              // פְּרָת — Hebrew name
  'Gihon': 'Giḥon',                  // גִּיחוֹן — ḥ for het (river of Eden)
  'Machpelah': 'Makhpelah',         // מַכְפֵּלָה — kh for kaf-rafe
  'Shephelah': 'Shefelah',           // שְׁפֵלָה — peh without dagesh = f
  'Chinnereth': 'Kinnereth',         // כִּנֶּרֶת — kaf (not het); final ת = thav
  'Lebo-hamath': 'Levo-Ḥamath',    // לְבוֹא חֲמָת — vet, ḥ for het
  'Riblah': 'Rivlah',                // רִבְלָה — ב after vowel = vet
  'Sirion': 'Siryon',                // שִׁרְיוֹן — yod before nun
  'Rephaim': 'Refaʾim',             // רְפָאִים — peh without dagesh = f; ʾ for alef
  'Salcah': 'Salkhah',               // סַלְכָה — kh for kaf-rafe
  'Kedemoth': 'Qedemoth',           // קְדֵמוֹת — q for quf; final ת = thav
  'Bezer': 'Beṣer',                  // בֶּצֶר — ṣ for tsadi

  // Common religious/ceremonial terms
  'Cherubim': 'Keruvim',            // כְּרוּבִים — kaf not het; ב after vowel = vet
  'Thummim': 'Tummim',              // תֻּמִּים — ת with dagesh = t (not th)
  'Abib': 'Aviv',                    // אָבִיב — ב after vowel = vet (month name)
  'Mizraim': 'Miṣrayim',            // מִצְרַיִם — ṣ for tsadi (Hebrew for Egypt)
  'Ephod': 'ʾEfod',                  // אֵפוֹד — ʾ for alef; peh without dagesh = f

  // People — vet (ב without dagesh)
  'Reuel': 'Reʿuʾel',               // רְעוּאֵל — ʿ for ayin, ʾ for alef
  'Nebaioth': 'Nevayoth',           // נְבָיוֹת — ב after vowel = vet; final ת = thav
  'Poti-phera': 'Poṭi-Feraʿ',      // פּוֹטִי פֶרַע — ṭ for tet; ph→f; ʿ for ayin
  'Abinadab': 'Avinadav',           // אֲבִינָדָב — vet for both bet letters
  'Michal': 'Mikhal',                // מִיכַל — kh for kaf-rafe
  'Nacon': 'Nakhon',                 // נָכוֹן — kh for kaf-rafe

  // People — J → Y
  'Jerubbaal': 'Yerubaʿal',         // יְרֻבַּעַל — J→Y; ʿ for ayin
  'Jemuel': 'Yemuʾel',              // יְמוּאֵל — J→Y; ʾ for alef
  'Jether': 'Yeter',                 // יֶתֶר — J→Y; ת with dagesh = t
  'Jotbath': 'Yoṭvath',             // יׇטְבָתָה — J→Y; ṭ for tet; ב=vet; final ת=thav
  'Jogli': 'Yogli',                  // יׇגְלִי — J→Y

  // People — het (ḥ)
  'Hanamel': 'Ḥanamel',             // חֲנַמְאֵל — ḥ for het
  'Hanniel': 'Ḥanniʾel',            // חַנִּיאֵל — ḥ for het; ʾ for alef
  'Haggith': 'Ḥaggith',             // חַגִּית — ḥ for het; final ת = thav

  // People — tsadi/quf/other
  'Elizaphan': 'Eliṣafan',          // אֶלִיצָפָן — ṣ for tsadi; peh without dagesh = f
  'Elzaphan': 'Elṣafan',            // אֶלְצָפָן — same
  'Kemuel': 'Qemuʾel',              // קְמוּאֵל — q for quf; ʾ for alef
  'Bukki': 'Buqqi',                  // בֻּקִּי — q for quf
  'Paltiel': 'Palṭiʾel',            // פַּלְטִיאֵל — ṭ for tet; ʾ for alef
  'Pedahel': 'Pedahʾel',            // פְּדַהְאֵל — ʾ for alef
  'Parnach': 'Parnakh',              // פַּרְנָךְ — ך (khaf sofit) = kh, NOT ח
  'Chislon': 'Kislon',               // כִּסְלוֹן — kaf (not het)
  'Machi': 'Makhi',                  // מָכִי — kh for kaf-rafe
  'Vophsi': 'Vofsi',                 // וָפְסִי — peh without dagesh = f
  'Gaddiel': 'Gaddiʾel',            // גַּדִּיאֵל — ʾ for alef
  'Michael': 'Mikhaʾel',            // מִיכָאֵל — kh for kaf-rafe; ʾ for alef
  'Neriah': 'Neriyyah',             // נֵרִיָּה
  'Remaliah': 'Remalyahu',          // רְמַלְיָהוּ

  // People — peh → f
  'Riphath': 'Rifath',              // רִיפַת — peh without dagesh = f; final ת = thav

  // Haftarah people
  'Pekah': 'Peqaḥ',                 // פֶּקַח — q for quf; ḥ for het
  'Tabeel': 'Ṭavʾel',               // טָבְאֵל — ṭ for tet; vet; ʾ for alef
  'Amanah': 'ʾAmanah',              // אֲמָנָה — ʾ for alef
  'Pharpar': 'Farpar',               // פַּרְפַּר — peh without dagesh = f

  // Compound place names — haftarot
  'Obed-edom': 'ʿOved-ʾEdom',      // עֹבֵד אֱדֹם — ʿ for ayin; vet; ʾ for alef
  'Perez-uzzah': 'Pereṣ-ʿUzzah',   // פֶּרֶץ עֻזָּה — ṣ for tsadi; ʿ for ayin
  'Kishon': 'Qishon',                // קִישׁוֹן — q for quf
  'Harosheth-goiim': 'Ḥarosheth-haGoyim', // variant spelling of Harosheth-hagoiim

  // Genesis — Table of Nations (Noach)
  'Arpachshad': 'Arpakhshad',       // אַרְפַּכְשַׁד — kh for kaf-rafe
  'Abimael': 'Avimaʾel',            // אֲבִימָאֵל — vet; ʾ for alef
  'Hazarmaveth': 'Ḥaṣarmaveth',    // חֲצַרְמָוֶת — ḥ for het; ṣ for tsadi
  'Naphtuhim': 'Naftuḥim',          // נַפְתֻּחִים — peh without dagesh = f; ח = het → ḥ
  'Casluhim': 'Kasluḥim',           // כַּסְלֻחִים — kaf; ḥ for het
  'Elishah': 'ʾElishah',            // אֱלִישָׁה — ʾ for alef

  // Numbers 33 — wilderness stations
  'Pi-hahiroth': 'Pi-haḤiroth',     // פִּי הַחִירֹת — ḥ for het; final ת = thav
  'Pene-hahiroth': 'Pene-haḤiroth', // alternate spelling
  'Libnah': 'Livnah',               // לִבְנָה — ב after vowel = vet
  'Kehelath': 'Qehelath',           // קְהֵלָתָה — q for quf; final ת = thav
  'Haradah': 'Ḥaradah',             // חֲרָדָה — ḥ for het
  'Makheloth': 'Maqheloth',         // מַקְהֵלֹת — q for quf; final ת = thav
  'Mithkah': 'Mithqah',             // מִתְקָה — final ת = thav; q for quf
  'Hashmonah': 'Ḥashmonah',         // חַשְׁמֹנָה — ḥ for het
  'Dophkah': 'Dofqah',              // דָּפְקָה — peh without dagesh = f; q for quf
  'Abronah': 'ʿAvronah',            // עַבְרֹנָה — ʿ for ayin; ב after vowel = vet
  'Dibon-gad': 'Divon-Gad',         // דִּיבֹן גָּד — ב after vowel = vet
  'Abel-shittim': 'Abel-Shiṭṭim',   // אָבֵל הַשִּׁטִּים — ṭ for tet
  'Beth-jeshimoth': 'Beth-Yeshimoth', // בֵּית הַיְשִׁימוֹת — J→Y in Jeshimoth
  'Nobah': 'Novaḥ',                 // נֹבַח — ב after vowel = vet; ḥ for het
  'Nophah': 'Nofah',                // נֹפַח — peh without dagesh = f
  // Numbers 34 — land boundaries
  'Kenath': 'Qenath',               // קְנָת — q for quf; final ת = thav
  'Kiriathaim': 'Qiryathaim',       // קִרְיָתַיִם — q for quf; th from ת
  'Kenizzite': 'Qenizzite',          // קְנִזִּי — q for quf
  'Kenizzites': 'Qenizzites',
  'Ezion-geber': 'ʿEṣyon-Gever',   // עֶצְיוֹן גֶּבֶר — ʿ for ayin; ṣ for tsadi; ב after vowel = vet

  // ===================== COMPOUND PLACE NAMES — BATCH 4 =====================
  // Systematic coverage of hyphenated compounds that appear across Torah + haftarot.

  // Hazar- (חֲצַר = Ḥaṣar — enclosed settlement; ḥ for het, ṣ for tsadi)
  'Hazar-enan': 'Ḥaṣar-ʿEnan',          // חֲצַר עֵינָן — Num 34:9-10; ʿ for ayin
  'Hazar-addar': 'Ḥaṣar-ʿAddar',        // חֲצַר אַדָּר — Num 34:4; ʿ for ayin
  'Hazar-gaddah': 'Ḥaṣar-Gaddah',       // חֲצַר גַּדָּה — Josh 15:27
  'Hazar-shual': 'Ḥaṣar-Shual',         // חֲצַר שׁוּעָל — Josh 15:28

  // Havvoth- (חַוֹּת = Ḥavvoth — tent-villages; ḥ for het)
  'Havvoth-jair': 'Ḥavvoth-Yaʾir',      // חַוֹּת יָאִיר — Num 32:41; Deut 3:14; J→Y, ʾ for alef

  // En- (עֵין = ʿEn — spring; ʿ for ayin throughout)
  'En-mishpat': 'ʿEn-Mishpaṭ',          // עֵין מִשְׁפָּט — Gen 14:7; ṭ for tet
  'En-rogel': 'ʿEn-Rogel',              // עֵין רֹגֵל — Josh 15:7; 2 Sam 17:17
  'En-gedi': 'ʿEn-Gedi',                // עֵין גֶּדִי — 1 Sam 24:2; Song of Songs
  'En-dor': 'ʿEn-Dor',                  // עֵין דֹּאר — Josh 17:11; 1 Sam 28:7
  'En-harod': 'ʿEn-Ḥarod',              // עֵין חֲרֹד — Judg 7:1; ḥ for het
  'En-rimmon': 'ʿEn-Rimmon',            // עֵין רִמּוֹן — Neh 11:29
  'En-tappuah': 'ʿEn-Tappuaḥ',         // עֵין תַּפּוּחַ — Josh 16:8; ḥ for final het
  'En-shemesh': 'ʿEn-Shemesh',          // עֵין שֶׁמֶשׁ — Josh 15:7
  'En-gannim': 'ʿEn-Gannim',            // עֵין גַּנִּים — Josh 19:21

  // Kiriath- additional (קִרְיַת = Qiryath; q for quf)
  'Kiriath-jearim': 'Qiryath-Yeʿarim',  // קִרְיַת יְעָרִים — J→Y; ʿ for ayin
  'Kiriath-sepher': 'Qiryath-Sefer',    // קִרְיַת סֵפֶר — peh without dagesh = f
  'Kiriath-baal': 'Qiryath-Baʿal',      // קִרְיַת בַּעַל — ʿ for ayin in Baʿal

  // Ramoth- (רָמֹת = Ramoth — heights)
  'Ramoth-gilead': 'Ramoth-Gilʿad',     // רָמֹת גִּלְעָד — ʿ for ayin in Gilʿad

  // Kir- (קִיר = Qir — wall; q for quf)
  'Kir-hareseth': 'Qir-Ḥareseth',       // קִיר חֲרֶשֶׂת — q for quf; ḥ for het
  'Kir-heres': 'Qir-Ḥeres',             // קִיר חֶרֶשׂ — variant spelling
  'Kir-moab': 'Qir-Moʾav',              // קִיר מוֹאָב — Isa 15:1; ʾ for alef in Moʾav

  // Gath- (גַּת = Gath — winepress)
  'Gath-hepher': 'Gath-Ḥefer',          // גַּת הַחֵפֶר — ḥ for het; peh without dagesh = f
  'Gath-rimmon': 'Gath-Rimmon',         // גַּת רִמּוֹן — Josh 19:45

  // Beth- additional (בֵּית = Beth — house of)
  'Beth-horon': 'Beth-Ḥoron',           // בֵּית חוֹרוֹן — ḥ for het
  'Beth-rehob': 'Beth-Reḥov',           // בֵּית רְחֹב — ḥ for het; ב after vowel = vet
  'Beth-tappuah': 'Beth-Tappuaḥ',       // בֵּית תַּפּוּחַ — ḥ for final het
  'Beth-shittah': 'Beth-Shiṭṭah',       // בֵּית הַשִּׁטָּה — ṭ for tet
  'Beth-anath': 'Beth-ʿAnath',          // בֵּית עֲנָת — ʿ for ayin
  'Beth-aven': 'Beth-ʾAven',            // בֵּית אָוֶן — ʾ for alef
  'Beth-arabah': 'Beth-ʿAravah',        // בֵּית הָעֲרָבָה — ʿ for ayin; ב = vet
  'Beth-zur': 'Beth-Ṣur',               // בֵּית צוּר — ṣ for tsadi
  'Beth-shemesh': 'Beth-Shemesh',       // בֵּית שֶׁמֶשׁ — capitalize second element
  'Beth-shean': 'Beth-Shean',           // בֵּית שְׁאָן — capitalize second element

  // Baal- additional (בַּעַל = Baʿal; ʿ for ayin throughout)
  'Baal-hazor': 'Baʿal-Ḥaṣor',         // בַּעַל חָצוֹר — ḥ for het; ṣ for tsadi
  'Baal-hermon': 'Baʿal-Ḥermon',        // בַּעַל חֶרְמוֹן — ḥ for het
  'Baal-gad': 'Baʿal-Gad',              // בַּעַל גָּד — ʿ for ayin
  'Baal-tamar': 'Baʿal-Tamar',          // בַּעַל תָּמָר — ʿ for ayin

  // Abel- additional (אָבֵל = Abel — meadow)
  'Abel-beth-maacah': 'Abel-Beth-Maʿakhah', // אָבֵל בֵּית מַעֲכָה — ʿ for ayin; kh for khaf-rafe
  'Abel-mizraim': 'Abel-Miṣrayim',      // אָבֵל מִצְרַיִם — ṣ for tsadi (Gen 50:11)

  // Hazzon-/Hazazon-tamar (חַצְצוֹן תָּמָר — Gen 14:7; ḥ for het; ṣ for tsadi)
  'Hazzon-tamar': 'Ḥaṣaṣon-Tamar',
  'Hazazon-tamar': 'Ḥaṣaṣon-Tamar',

  // Maacah (מַעֲכָה = Maʿakhah — ʿ for ayin; kh for khaf-rafe)
  'Maacah': 'Maʿakhah',
  'Maacathite': 'Maʿakhathite',
  'Maacathites': 'Maʿakhathites',

  // Allon-bacuth (Gen 35:8 — ʾ for alef; kh for khaf-rafe)
  'Allon-bacuth': 'ʾAllon-Bakhuth',     // אַלּוֹן בָּכוּת — final ת = thav

  // Argob (אַרְגֹּב — Deut 3:4,13,14 — ʾ for alef; ב after vowel = vet)
  'Argob': 'ʾArgov',

  // Salecah (alternate JPS spelling of Salcah — סַלְכָה — kh for khaf-rafe)
  'Salecah': 'Salekhah',
};

// Academic transliterations for the 54 parasha names (and combined readings)
// as they appear in schedule.json.  Entries omitted here mean the schedule
// key is already correct (e.g. "Vayeshev" already ends in vet "v").
export const PARASHA_TRANSLITERATIONS: Record<string, string> = {
  'Bereshit':            'Bereʾshith',       // ʾ for alef, th for final thav
  'Noach':               'Noaḥ',             // ḥ for het
  'Lech-Lecha':          'Lekh-Lekha',       // kh for kaf-rafe
  'Vayera':              'Vayeraʾ',          // ʾ for final alef
  'Chayei Sara':         'Ḥayyei Sarah',     // Ḥ for het
  'Toldot':              'Toldoth',          // th for final thav
  'Vayetzei':            'Vayeṣeʾ',          // ṣ for tsadi, ʾ for final alef
  'Vayishlach':          'Vayishlaḥ',        // ḥ for het
  'Miketz':              'Miqeṣ',            // q for quf, ṣ for tsadi
  'Vayechi':             'Vayeḥi',           // ḥ for het
  'Shemot':              'Shemoth',          // th for final thav
  'Vaera':               'Vaʾeraʾ',          // ʾ for both alefs
  'Bo':                  'Boʾ',              // ʾ for final alef
  'Beshalach':           'Beshallaḥ',        // ḥ for het
  'Yitro':               'Yithro',           // th for thav (follows vowel)
  'Mishpatim':           'Mishpaṭim',        // ṭ for tet
  'Tetzaveh':            'Teṣavveh',         // ṣ for tsadi
  'Ki Tisa':             'Ki Tissaʾ',        // ʾ for final alef
  'Vayakhel':            'Vayaqhel',         // q for quf
  'Pekudei':             'Pequdei',          // q for quf
  'Vayikra':             'Vayiqraʾ',         // q for quf, ʾ for final alef
  'Tzav':                'Ṣav',              // ṣ for tsadi
  'Tazria':              'Tazriaʿ',          // ʿ for final ayin
  'Metzora':             'Meṣoraʿ',          // ṣ for tsadi, ʿ for final ayin
  'Achrei Mot':          'ʾAḥarei Moth',     // ʾ for alef, ḥ for het, th for thav
  'Kedoshim':            'Qedoshim',         // q for quf
  'Emor':                'ʾEmor',            // ʾ for initial alef
  'Bechukotai':          'Beḥuqqotai',       // ḥ for het, q for quf
  'Nasso':               'Nassoʾ',           // ʾ for final alef
  "Beha'alotcha":        'Behaʿalothekha',   // ʿ for ayin, th for thav, kh for kaf-rafe
  "Sh'lach":             'Shelaḥ',           // ḥ for het
  'Korach':              'Qoraḥ',            // q for quf, ḥ for het
  'Chukat':              'Ḥuqqath',          // Ḥ for het, q for quf, th for thav
  'Balak':               'Balaq',            // q for quf
  'Pinchas':             'Pinḥas',           // ḥ for het
  'Matot':               'Maṭoth',           // ṭ for tet, th for final thav
  'Masei':               'Masseʿei',         // ʿ for ayin
  'Vaetchanan':          'Vaʾetḥannan',      // ʾ for alef, ḥ for het
  'Eikev':               'ʿEiqev',           // ʿ for initial ayin, q for quf
  "Re'eh":               'Reʾeh',            // ʾ for alef
  'Shoftim':             'Shofṭim',          // ṭ for tet
  'Ki Teitzei':          'Ki Teṣeʾ',         // ṣ for tsadi, ʾ for final alef
  'Ki Tavo':             'Ki Tavoʾ',         // ʾ for final alef
  'Nitzavim':            'Niṣṣavim',         // ṣ for tsadi
  'Vayeilech':           'Vayelekh',         // kh for kaf-rafe
  "Ha'azinu":            'Haʾazinu',         // ʾ for alef
  // Combined parashiot
  'Vayakhel-Pekudei':       'Vayaqhel-Pequdei',
  'Tazria-Metzora':         'Tazriaʿ-Meṣoraʿ',
  'Achrei Mot-Kedoshim':    'ʾAḥarei Moth-Qedoshim',
  'Behar-Bechukotai':       'Behar-Beḥuqqotai',
  'Chukat-Balak':           'Ḥuqqath-Balaq',
  'Matot-Masei':            'Maṭoth-Masseʿei',
  'Nitzavim-Vayeilech':     'Niṣṣavim-Vayelekh',
};

// Remove no-op entries (where value equals key)
const entries = Object.entries(TRANSLITERATIONS).filter(([k, v]) => k !== v);

// Sort longest-first so compound names (e.g. "Beer-sheba") are tried before
// their shorter prefixes (e.g. "Beer") in the alternation.
const sortedKeys = [...entries].sort(([a], [b]) => b.length - a.length);

const pattern = new RegExp(
  `\\b(${sortedKeys.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'g',
);

const map = Object.fromEntries(entries);

export function transliterateNouns(text: string): string {
  if (!CUSTOM_TRANSLITERATION_ENABLED) return text;
  return text.replace(pattern, (match) => map[match] ?? match);
}
