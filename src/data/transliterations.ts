// Maps JPS English proper nouns → academic Hebrew transliteration.
// Conventions: ḥ=ח  ṭ=ט  ṣ=צ  q=ק  ʿ=ע  ś=שׂ  w=ו(cons.)  v=בֿ(vet)  th=תֿ(thav)
// א: unmarked when obvious; ʾ between vowels to prevent misreading

const TRANSLITERATIONS: Record<string, string> = {
  // ===== People =====

  // Genesis
  'Keturah': 'Qeṭurah',
  'Esau': 'ʿEsaw',
  'Hamor': 'Ḥamor',
  'Ephron': 'ʿEfron',
  'Heth': 'Ḥeth',
  'Potiphar': 'Poṭifar',
  'Laban': 'Lavan',
  'Leah': 'Leʾah',
  'Tamar': 'Thamar',
  'Judah': 'Yehudah',
  'Reuben': 'Reʾuven',
  'Simeon': 'Shimʿon',
  'Issachar': 'Yiśśakhar',
  'Naphtali': 'Nafthali',
  'Zebulun': 'Zevulun',
  'Ishmael': 'Yishmaʿel',
  'Nahor': 'Naḥor',
  'Shechem': 'Shekhem',
  'Seir': 'Seʿir',
  'Zoar': 'Ṣoʿar',

  // Exodus–Deuteronomy
  'Zipporah': 'Ṣipporah',
  'Hobab': 'Ḥovav',
  'Hur': 'Ḥur',
  'Bezalel': 'Beṣalʾel',
  'Oholiab': 'Oholiav',
  'Korah': 'Qoraḥ',
  'Abiram': 'Aviram',
  'Sihon': 'Siḥon',
  'Balak': 'Balaq',
  'Balaam': 'Bilʿam',
  'Phinehas': 'Pinḥas',
  'Og': 'ʿOg',
  'Eleazar': 'Elʿazar',
  'Zelophehad': 'Ṣelofḥad',
  'Nahshon': 'Naḥshon',
  'Kohath': 'Qehath',
  'Kohathites': 'Qehathites',
  'Zippor': 'Ṣippor',
  'Beor': 'Beʿor',
  'Caleb': 'Kalev',
  'Kain': 'Qayin',
  'Abihu': 'Avihu',
  'Chemosh': 'Kemosh',
  'Elizur': 'Eliṣur',
  'Gamaliel': 'Gamliʾel',
  'Shelumiel': 'Shelumiʾel',
  'Eliasaph': 'Elyasaf',

  // ===== Places =====
  'Heshbon': 'Ḥeshbon',
  'Kadesh': 'Qadesh',
  'Hebron': 'Ḥevron',
  'Haran': 'Ḥaran',
  'Hormah': 'Ḥormah',
  'Horeb': 'Ḥorev',
  'Jabbok': 'Yabboq',
  'Jahaz': 'Yahaṣ',
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

  // ===== Nations & Peoples =====
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

  // ===== Compound place names =====
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
};

// Remove no-op entries (where value equals key)
const entries = Object.entries(TRANSLITERATIONS).filter(([k, v]) => k !== v);

const pattern = new RegExp(
  `\\b(${entries.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'g',
);

const map = Object.fromEntries(entries);

export function transliterateNouns(text: string): string {
  return text.replace(pattern, (match) => map[match] ?? match);
}
