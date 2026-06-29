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
  'Dathan': 'Datan',
  'Sihon': 'Siḥon',
  'Balak': 'Balaq',
  'Balaam': 'Bilʿam',
  'Phinehas': 'Pinḥas',
  'Og': 'ʿOg',
  'Eleazar': 'Elʿazar',
  'Zelophehad': 'Ṣelofḥad',
  'Mahlah': 'Maḥlah',
  'Hoglah': 'Ḥoglah',
  'Milcah': 'Milqah',
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
  'Zur': 'Ṣur',
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
  'Malchiel': 'Malqiʾel',
  'Malchielites': 'Malqiʾelites',
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
  'Jonathan': 'Yonatan',
  'David': 'David',
  'Solomon': 'Shelomoh',
  'Nathan': 'Natan',
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
  'Ruth': 'Rut',
  'Elimelech': 'Elimelekh',

  // ===================== PLACES =====================

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
  'Zarephath': 'Ṣarefat',
  'Elath': 'ʾElat',

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
  'Jeduthun': 'Yedutun',             // יְדוּתוּן
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
  'Jetur': 'Yetur',                  // יְטוּר
  'Jeuel': 'Yeʿiʾel',                // יְעִיאֵל — variant of Jeiel
  'Jeush': 'Yeʿush',                 // יְעוּשׁ — also ayin
  'Jidlaph': 'Yidlaf',               // יִדְלָף — also peh → f
  'Joah': 'Yoʾaḥ',                   // יוֹאָח — also ḥet
  'Jonadab': 'Yonadav',              // יוֹנָדָב
  'Jokshan': 'Yoqshan',              // יָקְשָׁן — also quf
  'Joram': 'Yoram',                  // יוֹרָם
  'Josiah': 'Yoshiyyahu',            // יֹאשִׁיָּהוּ
  'Jubal': 'Yuval',                  // יוּבָל
  'Judith': 'Yehudit',               // יְהוּדִית
  'Benjaminite': 'Binyaminite',
  'Benjaminites': 'Binyaminites',
  'Bene-jaakan': 'Bene-Yaʿaqan',     // also ayin
  'Beeroth-bene-jaakan': 'Beerot-Bene-Yaʿaqan',

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
  'Almon-diblathaim': 'ʿAlmon-Divlatayim', // עַלְמֹן
  'Alvah': 'ʿAlvah',                 // עַלְוָה
  'Alvan': 'ʿAlvan',                 // עַלְוָן
  'Amasa': 'ʿAmasa',                 // עֲמָשָׂא
  'Ammiel': 'ʿAmmiʾel',              // עַמִּיאֵל
  'Ammihud': 'ʿAmmiḥud',             // עַמִּיהוּד — also ḥet
  'Amminadab': 'ʿAmminadav',         // עַמִּינָדָב
  'Ammishaddai': 'ʿAmishaddai',      // עַמִּישַׁדַּי
  'Amram': 'ʿAmram',                 // עַמְרָם
  'Amramites': 'ʿAmramites',
  'Anah': 'ʿAnah',                   // עֲנָה
  'Anak': 'ʿAnaq',                   // עֲנָק — also quf
  'Anakites': 'ʿAnaqites',
  'Anath': 'ʿAnat',                  // עֲנָת
  'Anathoth': 'ʿAnatot',             // עֲנָתוֹת
  'Arabah': 'ʿAravah',               // עֲרָבָה
  'Arod': 'ʿArod',                   // עֲרוֹד
  'Arodi': 'ʿArodi',
  'Arodites': 'ʿArodites',
  'Ashtaroth': 'ʿAshtarot',          // עַשְׁתָּרוֹת
  'Ashteroth-karnaim': 'ʿAshtarot-Qarnayim', // also quf
  'Ataroth': 'ʿAtarot',              // עֲטָרוֹת
  'Atroth-shophan': 'ʿAtrot-Shofan', // עַטְרֹת שׁוֹפָן — also peh → f
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
  'Beon': 'Beʿon',                   // בְּעֹן
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
  'Ahuzzath': 'Aḥuzzat',             // אֲחֻזַּת
  'Bahurim': 'Baḥurim',              // בַּחוּרִים
  'Baruch': 'Barukh',                // בָּרוּךְ (kaf)
  'Beer-lahai-roi': 'Beʾer-Laḥai-Roʾi', // לַחַי
  'Cheran': 'Ḥeran',                 // חֵרָן — Horite chief
  'Hananiah': 'Ḥananyah',            // חֲנַנְיָה
  'Havilah': 'Ḥavilah',              // חֲוִילָה
  'Hobah': 'Ḥobah',                  // חֹבָה
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
  'Shiphtan': 'Shiftan',             // שִׁפְטָן

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
  'Tahath': 'Taḥat',                // תַּחַת — campsite / Levite name
  'Harod': 'Ḥarod',                 // חֲרֹד — Gideon's spring
  'Harosheth-hagoiim': 'Ḥaroshet-haGoyim', // חֲרֹשֶׁת הַגּוֹיִם — Sisera's city

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
  return text.replace(pattern, (match) => map[match] ?? match);
}
