import type { TarotCard, DrawnCard, Spread } from './types';
import { getEnrichedMeaning } from './enrichedMeanings';

// ══════════════════════════════════════════════════════════════
// ── LEVEL C: Question-Aware Static Engine ─────────────────────
//
// Seluruh engine ini sekarang membaca dan merespons pertanyaan user
// secara konkret — bukan hanya template generik.
//
// Arsitektur baru:
//   analyzeQuestion()       → ekstrak intent, tema, entitas dari pertanyaan
//   pickOpening()           → pilih pembuka berdasarkan KONTEN question
//   getPositionNarrative()  → inject konteks question ke narasi kartu
//   buildBridgeSection()    → paragraf eksplisit yang sambungkan question ke kartu
//   generateInterpretation()→ orchestrate semua bagian dengan konteks penuh
//   getSpreadAdvice()       → advice sadar akan tema question
//   generateFollowUp()      → inject pertanyaan asli user ke jawaban
// ══════════════════════════════════════════════════════════════

// ── Analisis Pertanyaan ──────────────────────────────────────

export interface QuestionAnalysis {
  /** Pertanyaan asli, dibersihkan */
  raw: string;
  /** Tema utama yang terdeteksi */
  theme: 'love' | 'career' | 'money' | 'health' | 'decision' | 'purpose' | 'conflict' | 'general';
  /** Sub-tema */
  subTheme: string;
  /** Apakah ada entitas orang lain ("dia", "mereka") */
  hasPerson: boolean;
  /** Apakah ini pertanyaan tentang masa depan */
  isFuture: boolean;
  /** Apakah ini pertanyaan tentang keputusan/pilihan */
  isDecision: boolean;
  /** Apakah ini pertanyaan "mengapa" / mencari makna */
  isWhyQuestion: boolean;
  /** Kata kunci penting dari pertanyaan (maks 3) */
  keywords: string[];
  /** Frasa pembuka yang sesuai untuk bridge section */
  bridgeOpener: string;
}

/**
 * Analisis pertanyaan user secara mendalam.
 * Deteksi tema, intent, entitas, dan hasilkan konteks
 * yang bisa dipakai oleh semua fungsi narasi.
 */
export function analyzeQuestion(question: string): QuestionAnalysis {
  const q = question.toLowerCase().trim();
  const raw = question.trim();

  // ── Deteksi tema utama ──
  const loveKw = ['cinta', 'pacar', 'hubungan', 'pasangan', 'dia', 'suka', 'perasaan', 'romant', 'menikah', 'tunangan', 'mantan', 'selingkuh', 'jodoh', 'pacaran', 'move on', 'crush'];
  const careerKw = ['karier', 'karir', 'kerja', 'pekerjaan', 'jabatan', 'promosi', 'resign', 'bisnis', 'usaha', 'perusahaan', 'bos', 'rekan', 'proyek', 'klien', 'wirausaha', 'freelance'];
  const moneyKw = ['uang', 'keuangan', 'hutang', 'investasi', 'modal', 'tabungan', 'finansial', 'gaji', 'penghasilan', 'untung', 'rugi', 'pinjam', 'kredit'];
  const healthKw = ['kesehatan', 'sehat', 'sakit', 'penyakit', 'sembuh', 'tubuh', 'mental', 'stres', 'cemas', 'depresi', 'fisik', 'energi', 'lelah'];
  const decisionKw = ['pilih', 'antara', ' atau ', 'keputusan', 'putuskan', 'baiknya', 'sebaiknya', 'haruskah', 'perlu', 'lanjutkan', 'berhenti', 'mulai', 'mundur'];
  const purposeKw = ['tujuan', 'makna', 'arah', 'hidup', 'passion', 'panggilan', 'jiwa', 'diri', 'potensi', 'masa depan', 'nasib', 'takdir', 'impian', 'mimpi'];
  const conflictKw = ['konflik', 'masalah', 'bertengkar', 'ribut', 'perselisihan', 'tidak cocok', 'susah', 'sulit', 'hambatan', 'rintangan', 'terjebak', 'stuck'];

  const score = (kws: string[]) => kws.filter(kw => q.includes(kw)).length;
  const scores = {
    love: score(loveKw),
    career: score(careerKw),
    money: score(moneyKw),
    health: score(healthKw),
    decision: score(decisionKw),
    purpose: score(purposeKw),
    conflict: score(conflictKw),
  };

  const maxScore = Math.max(...Object.values(scores));
  let theme: QuestionAnalysis['theme'] = 'general';
  if (maxScore > 0) {
    theme = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as QuestionAnalysis['theme'];
  }

  // ── Sub-tema berdasarkan theme utama ──
  const subThemeMap: Record<string, string> = {
    love: q.includes('mantan') ? 'rekonsiliasi' : q.includes('selingkuh') ? 'pengkhianatan' : q.includes('menikah') || q.includes('tunangan') ? 'komitmen' : q.includes('move on') ? 'melepaskan' : 'hubungan romantis',
    career: q.includes('resign') ? 'perpindahan kerja' : q.includes('bisnis') || q.includes('usaha') ? 'kewirausahaan' : q.includes('promosi') ? 'kenaikan jabatan' : 'perkembangan karier',
    money: q.includes('hutang') ? 'pengelolaan hutang' : q.includes('investasi') ? 'investasi' : 'keuangan umum',
    health: q.includes('mental') || q.includes('stres') || q.includes('cemas') ? 'kesehatan mental' : 'kesehatan fisik',
    decision: 'pengambilan keputusan',
    purpose: 'pencarian makna',
    conflict: 'penyelesaian konflik',
    general: 'refleksi diri',
  };

  // ── Flag-flag kontekstual ──
  const hasPerson = /\b(dia|mereka|ia|kamu|kita|kami|orang lain|seseorang)\b/.test(q);
  const isFuture = /\b(akan|nanti|masa depan|ke depan|besok|suatu hari|akhirnya|berhasil|bisa)\b/.test(q);
  const isDecision = score(decisionKw) > 0 || q.includes('?');
  const isWhyQuestion = /^(kenapa|mengapa|apa penyebab|dari mana|bagaimana bisa)/.test(q);

  // ── Ekstrak kata kunci bermakna dari pertanyaan ──
  const stopwords = new Set(['apa', 'apakah', 'bagaimana', 'kapan', 'siapa', 'yang', 'dan', 'atau', 'di', 'ke', 'dari', 'ini', 'itu', 'dengan', 'untuk', 'akan', 'sudah', 'belum', 'bisa', 'tidak', 'bukan', 'ada', 'saya', 'aku', 'kamu', 'nya', 'pun', 'juga', 'tapi', 'namun', 'jika', 'kalau', 'maka', 'karena', 'agar', 'supaya', 'dalam', 'pada', 'oleh', 'sebagai', 'lebih', 'sangat', 'sekali', 'harus', 'perlu', 'ingin', 'mau', 'bisa', 'sekarang', 'saat', 'ketika', 'lagi', 'masih', 'sudah', 'telah', 'sedang', 'an', 'the', 'my', 'i']);
  const keywords = raw
    .replace(/[?!.,;:]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w.toLowerCase()))
    .slice(0, 3);

  // ── Bridge opener — kalimat pembuka yang langsung menyebut pertanyaan ──
  const bridgeOpeners: Record<QuestionAnalysis['theme'], string[]> = {
    love: [
      `Pertanyaanmu tentang hubungan ini`,
      `Apa yang kamu rasakan dalam soal ini`,
      `Dalam urusan hati yang kamu tanyakan`,
    ],
    career: [
      `Dalam perjalanan kariermu yang kamu tanyakan`,
      `Pertanyaanmu tentang pekerjaan ini`,
      `Menyangkut langkah profesional yang kamu gumuli`,
    ],
    money: [
      `Dalam situasi keuangan yang kamu hadapi`,
      `Pertanyaanmu tentang kondisi finansial ini`,
      `Menyangkut aliran uang dan sumber daya yang kamu tanyakan`,
    ],
    health: [
      `Dalam hal kesehatan dan vitalitas yang kamu tanyakan`,
      `Pertanyaanmu tentang kondisi ini`,
      `Menyangkut energi dan kondisi diri yang kamu gumuli`,
    ],
    decision: [
      `Di persimpangan keputusan yang kamu hadapi`,
      `Dalam kebingungan memilih yang kamu tanyakan`,
      `Pertanyaanmu tentang langkah yang harus diambil`,
    ],
    purpose: [
      `Dalam pencarianmu akan arah dan makna`,
      `Pertanyaanmu tentang tujuan hidupmu`,
      `Menyangkut panggilan jiwa yang kamu tanyakan`,
    ],
    conflict: [
      `Dalam situasi sulit yang kamu hadapi`,
      `Pertanyaanmu tentang hambatan ini`,
      `Menyangkut ketegangan yang sedang kamu jalani`,
    ],
    general: [
      `Dalam situasi yang kamu tanyakan`,
      `Pertanyaanmu membawa energi`,
      `Apa yang kamu bawa ke dalam bacaan ini`,
    ],
  };

  const openerList = bridgeOpeners[theme];
  // Pilih opener berdasarkan djb2 hash dari pertanyaan (deterministik, tapi berbasis konten)
  const hash = djb2(raw);
  const bridgeOpener = openerList[Math.abs(hash) % openerList.length];

  return {
    raw,
    theme,
    subTheme: subThemeMap[theme] || 'refleksi diri',
    hasPerson,
    isFuture,
    isDecision,
    isWhyQuestion,
    keywords,
    bridgeOpener,
  };
}

/** djb2 hash — deterministik berdasarkan konten string, bukan panjang */
function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h & h; // force 32-bit int
  }
  return h;
}

// ── Pembuka narasi per spread — sekarang question-aware ──────

const spreadOpenings: Record<string, Record<string, string[]>> = {
  'single': {
    spiritual: [
      'Di antara keheningan, satu kartu muncul sebagai cermin. Ia bukan kebetulan — ia adalah proyeksi dari energi yang paling dalam darimu saat ini.',
      'Semesta menjawab dengan satu suara. Kartu ini membawa pesan arketipal yang tepat untuk kondisi batinmu.',
      'Satu kartu, satu pesan. Bukan karena jawabannya sederhana, tapi karena inilah yang paling perlu kamu sadari sekarang.',
    ],
    praktis: [
      'Satu kartu untuk satu fokus. Baca energinya dan terjemahkan ke dalam satu langkah nyata yang bisa kamu ambil hari ini.',
      'Pertanyaanmu membutuhkan jawaban yang jelas. Kartu ini hadir untuk membantu kamu bergerak — bukan merenungkan tanpa arah.',
      'Satu kartu, satu tindakan. Apa yang bisa kamu lakukan berbeda berdasarkan apa yang terungkap di sini?',
    ],
    puitis: [
      'Satu kartu dipilih dari kedalaman yang tak bernama. Ia datang bukan sebagai jawaban, tapi sebagai pertanyaan yang lebih jujur.',
      'Dari 78 kemungkinan, satu ini yang muncul. Bukan kebetulan — melainkan sesuatu dalam dirimu yang sudah tahu.',
      'Sebuah kartu di ambang batas antara yang diketahui dan yang belum. Bacalah dengan hati, bukan hanya dengan pikiran.',
    ],
  },
  'three-card': {
    spiritual: [
      'Tiga kartu terbentang seperti benang waktu — masa lalu yang membentukmu, kini yang kamu hadapi, dan kemungkinan yang menunggumu. Baca ketiganya sebagai satu kisah jiwa.',
      'Masa lalu, kini, masa depan — tiga titik dalam perjalanan batinmu yang saling terhubung dan saling menerangi.',
      'Waktu bukan garis lurus, tapi tiga kartu ini membantu kamu melihat arus energi yang bekerja dalam dirimu.',
    ],
    praktis: [
      'Tiga kartu, tiga lensa: dari mana kamu datang, di mana kamu sekarang, dan ke mana kamu bisa melangkah. Baca ini sebagai peta tindakan.',
      'Masa lalu menjelaskan konteks, kini menentukan pilihan, masa depan menunjukkan arah. Fokus pada yang bisa kamu lakukan sekarang.',
      'Tiga titik dalam perjalananmu. Yang paling penting adalah kartu tengah — kondisi nyata yang kamu hadapi hari ini.',
    ],
    puitis: [
      'Tiga kartu seperti tiga bait dalam sebuah sajak yang ditulis takdir. Baca dari kiri ke kanan, seperti nafas yang masuk dan keluar.',
      'Ada masa lalu yang tak bisa diubah, masa kini yang rapuh, dan masa depan yang masih terbuka. Tiga kartu ini menjaga ketiganya.',
      'Waktu adalah ilusi — tapi tiga kartu ini berbicara dalam bahasa yang lebih jujur dari kalender.',
    ],
  },
  'two-options': {
    spiritual: [
      'Dua jalur terbentang di hadapanmu. Kartu-kartu ini mengungkap energi psikologis di balik masing-masing pilihan agar kamu bisa memutuskan dari tempat yang lebih dalam.',
      'Setiap pilihan membawa arketipenya sendiri. Mari kita baca apa yang tersembunyi di balik masing-masing jalan — bukan hanya yang tampak di permukaan.',
      'Dilema adalah undangan untuk mengenal diri lebih dalam. Kartu-kartu ini menerangi kedua jalur dari dalam ke luar.',
    ],
    praktis: [
      'Dua pilihan di depanmu. Kartu-kartu ini menunjukkan trade-off nyata dari masing-masing — proses yang akan kamu jalani dan hasil yang paling mungkin.',
      'Bukan soal pilihan mana yang "benar" — tapi pilihan mana yang paling selaras dengan tujuanmu. Kartu-kartu ini membantu kamu membuat keputusan berdasarkan data energi.',
      'Setiap jalur punya biayanya sendiri dan hasilnya sendiri. Mari kita baca keduanya secara jujur sebelum kamu memutuskan.',
    ],
    puitis: [
      'Dua jalan di hutan yang tidak bisa kamu tempuh keduanya. Kartu-kartu ini tidak memilihkan — mereka hanya menerangi bayangan di balik masing-masing tikungan.',
      'Di persimpangan ini, setiap langkah adalah janji. Dua kartu ini menjaga dua kemungkinan yang sama-sama nyata.',
      'Pilihan bukan antara benar dan salah. Ia adalah antara dua versi dirimu yang berbeda. Kartu mana yang berbicara lebih keras ke hatimu?',
    ],
  },
  'relationship': {
    spiritual: [
      'Hubungan adalah cermin yang kompleks — dua energi batin yang saling mempengaruhi. Kartu-kartu ini mengungkap dinamika psikologis di permukaan dan di bawahnya.',
      'Dalam setiap hubungan ada dua dunia batin yang bersentuhan. Mari kita baca keduanya dengan kejujuran dan tanpa penilaian.',
      'Kartu-kartu ini menerangi dinamika hubungan dari sudut yang jarang dilihat — apa yang tidak terucapkan dan apa yang perlu diakui.',
    ],
    praktis: [
      'Hubungan butuh kejujuran dan tindakan nyata. Kartu-kartu ini menunjukkan kondisi yang sesungguhnya dan langkah konkret yang bisa diambil.',
      'Setiap hubungan punya tantangannya. Kartu-kartu ini membantu kamu melihat di mana energi perlu diarahkan agar hubungan ini bisa bergerak maju.',
      'Bukan soal siapa yang benar — tapi tentang apa yang perlu diubah atau dikomunikasikan. Kartu-kartu ini menunjukkan area kerja konkret.',
    ],
    puitis: [
      'Dua jiwa yang berjarak sangat dekat tapi tidak pernah sepenuhnya satu. Kartu-kartu ini menangkap ruang antara itu dengan jujur.',
      'Hubungan adalah puisi yang ditulis dua orang pada waktu yang berbeda. Kartu-kartu ini membaca baris-baris yang belum diucapkan.',
      'Ada yang terlihat, ada yang tersembunyi. Ada yang dirasakan, ada yang tidak bisa dikatakan. Semua ada di sini.',
    ],
  },
  'timeline': {
    spiritual: [
      'Setiap situasi memiliki akar, alur, dan arah. Kartu-kartu ini membantu kamu melihat rantai sebab-akibat dan menemukan titik di mana kesadaran bisa mengubah arah.',
      'Seperti sungai yang bermula dari mata air jauh di hulu, situasimu memiliki asal-usul psikologis yang dalam. Mari kita telusuri bersama.',
      'Waktu mengalir, dan setiap momen terhubung. Kartu-kartu ini menunjukkan bagaimana pola lama membentuk kini, dan ke mana energi ini bergerak.',
    ],
    praktis: [
      'Situasi ini tidak muncul tiba-tiba. Dengan memahami akarnya, kamu bisa mengambil tindakan yang tepat — bukan hanya merespons permukaan.',
      'Kartu-kartu ini memetakan perjalanan dari akar ke arah. Fokus pada kartu saran tindakan — itulah yang paling bisa kamu pengaruhi sekarang.',
      'Memahami pola waktu memberimu keunggulan: kamu bisa bereaksi lebih cerdas dan merencanakan langkah berikutnya dengan lebih tepat.',
    ],
    puitis: [
      'Ada akar yang tidak kamu pilih, ada kini yang sedang kamu jalani, ada ke depan yang masih bisa ditulis ulang. Tiga kartu ini menjaga ketiganya.',
      'Waktu meninggalkan jejaknya di dalam diri. Kartu-kartu ini membaca jejak itu — bukan untuk disesali, tapi untuk dipahami.',
      'Setiap situasi adalah sungai. Kartu-kartu ini membantu kamu melihat dari mana ia mengalir dan ke mana ia bermuara.',
    ],
  },
  'celtic-cross': {
    spiritual: [
      'Salib Celtic adalah peta terlengkap dari jiwa — ia membaca situasimu dari luar dan dalam, dari yang tampak dan yang tersembunyi, dari apa yang ada dan apa yang mungkin.',
      'Sepuluh kartu, sepuluh sudut pandang dari kondisi batinmu. Ini bukan ramalan cepat — ini adalah percakapan mendalam dengan lapisan-lapisan dirimu sendiri.',
      'Dari inti masalah hingga kemungkinan akhir, dari harapan tersembunyi hingga pengaruh luar — Celtic Cross menerangi semua dimensi jiwa yang relevan.',
    ],
    praktis: [
      'Celtic Cross memberikan gambaran paling lengkap dari situasimu. Setelah membacanya, kamu akan tahu persis di mana harus fokus dan apa yang perlu dilakukan.',
      'Sepuluh kartu untuk sepuluh dimensi situasimu. Baca dengan sabar — setiap kartu menambah informasi yang akan membantu kamu membuat keputusan lebih baik.',
      'Peta terlengkap yang tarot bisa berikan. Dari pengaruh tersembunyi hingga hasil yang paling mungkin — semua faktor ada di sini.',
    ],
    puitis: [
      'Sepuluh kartu seperti sepuluh cermin yang ditempatkan di sudut berbeda. Bersama-sama mereka membentuk gambar yang tidak bisa dilihat dari satu sudut saja.',
      'Celtic Cross adalah sajak yang terlalu panjang untuk dibaca sekali. Biarkan setiap kartu mengendap sebelum melanjutkan ke berikutnya.',
      'Dari tengah ke pinggir, dari bawah ke atas — ada kisah yang sedang dibuka, lapis demi lapis, seperti buku yang telah lama tertutup.',
    ],
  },
};

/**
 * Pilih pembuka berdasarkan djb2 hash dari ISI question — bukan panjangnya.
 * Berbeda dari sebelumnya: dua pertanyaan berbeda hampir pasti dapat opener berbeda.
 */
function pickOpening(spreadId: string, question: string, tone: string = 'spiritual'): string {
  const spreadData = spreadOpenings[spreadId] || spreadOpenings['single'];
  const toneOptions = spreadData[tone] || spreadData['spiritual'];
  const idx = Math.abs(djb2(question)) % toneOptions.length;
  return toneOptions[idx];
}

// ── Penutup narasi ───────────────────────────────────────────

const closingsByTone: Record<string, string[]> = {
  spiritual: [
    'Kartu tidak menentukan nasibmu — mereka adalah cermin yang merefleksikan apa yang sudah ada dalam dirimu. Kebijaksanaan ini milikmu.',
    'Apa yang terungkap hari ini adalah undangan untuk refleksi yang lebih dalam. Bawa ini ke dalam diam, dan perhatikan apa yang muncul.',
    'Semoga pesan ini membawa kejernihan yang kamu butuhkan. Percayalah pada proses, dan pada kebijaksanaan batinmu sendiri.',
    'Bawa pesan ini dengan lembut. Renungkan bukan untuk mencari kepastian, tapi untuk menemukan apa yang beresonansi paling dalam.',
    'Ingat: kartu tarot adalah alat untuk introspeksi, bukan oracle yang mutlak. Sumber kebijaksanaan terdalam ada di dalam dirimu.',
  ],
  praktis: [
    'Informasi ini ada di tanganmu sekarang. Pertanyaannya: apa satu langkah konkret yang akan kamu ambil dalam 24 jam ke depan?',
    'Kartu memberi gambaran — tapi kamu yang mengambil tindakan. Apa keputusan paling jelas yang bisa kamu buat berdasarkan bacaan ini?',
    'Gunakan ini sebagai panduan, bukan sebagai kepastian. Uji setiap insight ini terhadap realita yang kamu hadapi.',
    'Bacaan selesai — tapi pekerjaan baru saja dimulai. Terjemahkan setiap insight ke dalam langkah yang bisa diukur.',
    'Yang paling berharga dari bacaan ini bukan apa yang terungkap, tapi apa yang akan kamu lakukan dengan pengetahuan ini.',
  ],
  puitis: [
    'Kartu telah berbicara. Sekarang giliran hatimu untuk mendengarkan apa yang paling beresonansi — bukan yang paling nyaman.',
    'Ini bukan akhir dari bacaan. Ini awal dari pertanyaan yang lebih jujur yang hanya bisa kamu tanyakan pada dirimu sendiri.',
    'Beberapa pesan butuh waktu untuk meresap. Biarkan kata-kata ini bekerja dalam diam, dalam mimpi, dalam momen tak terduga.',
    'Seperti sajak yang baik, bacaan ini tidak harus dipahami sepenuhnya hari ini. Bawa ia denganmu, dan lihat apa yang tumbuh.',
    'Yang paling kuat dari kartu-kartu ini bukanlah apa yang mereka katakan, tapi apa yang mereka buat kamu tanyakan.',
  ],
};

function pickClosing(drawnCards: DrawnCard[], tone: string = 'spiritual'): string {
  const options = closingsByTone[tone] || closingsByTone['spiritual'];
  // Pakai jumlah kartu + pola reversed sebagai hash yang sedikit lebih unik
  const reversedCount = drawnCards.filter(dc => dc.isReversed).length;
  const idx = (drawnCards.length * 7 + reversedCount * 3) % options.length;
  return options[idx];
}

// ── Narasi per posisi — sekarang menerima konteks question ───

function getPositionNarrative(
  position: DrawnCard['position'],
  card: TarotCard,
  isReversed: boolean,
  tone: string = 'spiritual',
  qa?: QuestionAnalysis,
): string {
  const posId = position.id || '';
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;
  const meaning = isReversed ? card.meaning.reversed : card.meaning.upright;
  const orientation = isReversed ? 'dalam posisi terbalik' : 'dalam posisi normal';
  const kwStr = keywords.slice(0, 3).join(', ');

  const enriched = getEnrichedMeaning(card.id);
  const deepMeaning = enriched ? (isReversed ? enriched.reversedDeep : enriched.uprightDeep) : meaning;
  const reflectionText = enriched ? enriched.reflection : null;
  const actionText = enriched ? enriched.action : null;

  // ── Konteks dari pertanyaan: suffix tambahan yang menyambungkan kartu ke pertanyaan ──
  let questionBridge = '';
  if (qa) {
    questionBridge = buildPositionBridge(posId, card, isReversed, qa, tone);
  }

  // Tone-aware suffix
  const toneSuffix = (() => {
    if (tone === 'puitis') {
      return reflectionText ? `\n\n*${reflectionText}*` : '';
    } else if (tone === 'praktis') {
      return actionText ? `\n\n**Yang bisa dilakukan:** ${actionText}` : '';
    } else {
      // spiritual
      let s = '';
      if (reflectionText) s += `\n\n*Pertanyaan untuk direnungkan: ${reflectionText}*`;
      if (actionText) s += `\n\n**Yang bisa dilakukan:** ${actionText}`;
      return s;
    }
  })();

  // FIX KRITIS: semua keys pakai ID aktual dari spreads.ts
  // single: 'single-1'
  // three-card: 'three-1' (Past), 'three-2' (Present), 'three-3' (Future)
  // two-options: 'two-options-1' (Situation) s/d 'two-options-5' (Option B Outcome)
  // relationship: 'relationship-1' s/d 'relationship-5'
  // timeline: 'timeline-1' s/d 'timeline-5'
  // celtic-cross: 'celtic-1' s/d 'celtic-10'
  const positionPrefixes: Record<string, string> = {
    // ── Single Card ──
    'single-1': `**Petunjuk — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nPesan inti dari semesta saat ini: **${kwStr}**.\n\n${deepMeaning}\n\nSatu kartu, satu kebenaran yang paling perlu kamu dengar sekarang.`,

    // ── Three Card: Past / Present / Future ──
    'three-1': `**Masa Lalu — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nEnergi masa lalu yang membentuk situasimu: **${kwStr}**.\n\n${deepMeaning}\n\nInilah pondasi dari mana kamu berdiri saat ini. Masa lalu ini bukan beban — ia adalah pelajaran yang membawamu ke titik ini.`,
    'three-2': `**Kini — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nEnergi yang paling dominan saat ini: **${kwStr}**.\n\n${deepMeaning}\n\nInilah realitas yang kamu hadapi sekarang. Kartu ini mencerminkan kondisi dan tantangan yang paling nyata dalam hidupmu saat ini.`,
    'three-3': `**Masa Depan — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nKemungkinan yang menunggumu jika arus energi terus mengalir: **${kwStr}**.\n\n${deepMeaning}\n\nIni bukan kepastian, melainkan kemungkinan yang paling kuat berdasarkan energi saat ini. Kamu masih memiliki kuasa untuk mempengaruhinya.`,

    // ── Two Options: Situation / Option A Process / Option A Outcome / Option B Process / Option B Outcome ──
    'two-options-1': `**Situasi Saat Ini — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nKondisi intimu menghadapi keputusan ini: **${kwStr}**.\n\n${deepMeaning}\n\nSebelum memilih jalur, pahami dulu dari mana kamu berdiri — kartu ini menggambarkan fondasi keputusanmu.`,
    'two-options-2': `**Jalur A · Proses — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nJika kamu memilih jalur pertama, inilah perjalanan yang akan kamu tempuh: **${kwStr}**.\n\n${deepMeaning}`,
    'two-options-3': `**Jalur A · Hasil — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nHasil yang paling mungkin dari jalur pertama: **${kwStr}**.\n\n${deepMeaning}`,
    'two-options-4': `**Jalur B · Proses — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nJika kamu memilih jalur kedua, inilah perjalanan yang menanti: **${kwStr}**.\n\n${deepMeaning}`,
    'two-options-5': `**Jalur B · Hasil — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nHasil yang paling mungkin dari jalur kedua: **${kwStr}**.\n\n${deepMeaning}`,

    // ── Relationship: Your Feelings / Other's Feelings / Connection / Challenge / Potential ──
    'relationship-1': `**Perasaanmu — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nBegini kondisi batin dan sikapmu dalam hubungan ini: **${kwStr}**.\n\n${deepMeaning}`,
    'relationship-2': `**Perasaan Mereka — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nEnergi yang pihak lain bawa dalam hubungan ini: **${kwStr}**.\n\n${deepMeaning}\n\nIngat, ini adalah gambaran energi, bukan pembacaan pikiran seseorang secara harfiah.`,
    'relationship-3': `**Kondisi Hubungan — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nDinamika dan kualitas hubungan saat ini: **${kwStr}**.\n\n${deepMeaning}`,
    'relationship-4': `**Tantangan Hubungan — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nHambatan yang perlu dihadapi bersama: **${kwStr}**.\n\n${deepMeaning}`,
    'relationship-5': `**Arah Hubungan — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nKe mana hubungan ini bergerak jika energi saat ini terus mengalir: **${kwStr}**.\n\n${deepMeaning}`,

    // ── Timeline: Root Cause / Past Influence / Present / Near Future / Advice ──
    'timeline-1': `**Akar Masalah — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nPenyebab terdalam dari situasimu: **${kwStr}**.\n\n${deepMeaning}`,
    'timeline-2': `**Pengaruh Masa Lalu — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nBagaimana pengalaman masa lalu membentuk kondisi saat ini: **${kwStr}**.\n\n${deepMeaning}`,
    'timeline-3': `**Saat Ini — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nKondisi inti dan faktor kunci yang kamu hadapi: **${kwStr}**.\n\n${deepMeaning}`,
    'timeline-4': `**Tren Jangka Pendek — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nArah perkembangan situasi dalam waktu dekat: **${kwStr}**.\n\n${deepMeaning}`,
    'timeline-5': `**Saran Tindakan — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nApa yang sebaiknya kamu lakukan atau perhatikan: **${kwStr}**.\n\n${deepMeaning}`,

    // ── Celtic Cross: celtic-1 s/d celtic-10 ──
    'celtic-1': `**Kondisi Sekarang — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nSituasi inti yang kamu hadapi: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-2': `**Tantangan — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nKartu ini bersilang dengan kondisimu — menunjukkan hambatan atau kekuatan yang mendorongmu: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-3': `**Masa Lalu — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nFondasi dan pengaruh yang membentuk situasi saat ini: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-4': `**Masa Depan Dekat — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nEnergi yang akan segera memasuki hidupmu: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-5': `**Tujuan & Harapan Tertinggi — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nApa yang kamu harapkan atau tuju secara sadar: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-6': `**Bawah Sadar — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nEnergi tersembunyi yang bekerja di bawah permukaan: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-7': `**Saran — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nSikap atau tindakan terbaik untuk situasimu: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-8': `**Pengaruh Eksternal — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nFaktor dari luar — orang lain, lingkungan, atau keadaan — yang mempengaruhi situasimu: **${kwStr}**.\n\n${deepMeaning}`,
    'celtic-9': `**Harapan & Ketakutan — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nApa yang kamu harapkan sekaligus khawatirkan: **${kwStr}**.\n\n${deepMeaning}\n\nKartu ini sering menunjukkan dua sisi yang berlawanan — apa yang paling kamu inginkan sekaligus paling kamu takuti.`,
    'celtic-10': `**Hasil Akhir — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nKemungkinan hasil yang paling kuat berdasarkan semua energi dalam susunan ini: **${kwStr}**.\n\n${deepMeaning}\n\nIni adalah kesimpulan dari keseluruhan kisah yang dibaca kartu-kartu sebelumnya.`,
  };

  let base = '';
  if (positionPrefixes[posId]) {
    base = positionPrefixes[posId] + toneSuffix;
  } else {
    base = `**${position.nameCn} — ${card.nameCn}** *(${card.name}, ${orientation})*\n\nEnergi di posisi ini: **${kwStr}**.\n\n${meaning}` + toneSuffix;
  }

  // Inject bridge ke pertanyaan jika ada dan relevan
  if (questionBridge) {
    base += `\n\n${questionBridge}`;
  }

  return base;
}

/**
 * Bangun kalimat bridge yang eksplisit menyambungkan kartu ke pertanyaan user.
 * Dipanggil per posisi kartu — hanya inject jika relevan.
 */
function buildPositionBridge(
  posId: string,
  card: TarotCard,
  isReversed: boolean,
  qa: QuestionAnalysis,
  tone: string,
): string {
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;
  const kw1 = keywords[0] || '';
  const kw2 = keywords[1] || '';

  // Posisi "kunci" yang mendapat bridge — sesuai ID aktual spreads.ts
  // Present/kini, saran tindakan, hasil akhir, masa depan, kartu tunggal
  const BRIDGEABLE_IDS = new Set([
    'single-1',
    'three-2', 'three-3',          // Present, Future
    'two-options-1',               // Current Situation
    'two-options-3', 'two-options-5', // Outcome A & B
    'timeline-3', 'timeline-5',   // Present, Advice
    'celtic-1', 'celtic-7', 'celtic-10', // Present, Advice, Outcome
    'relationship-1', 'relationship-5',  // Your Feelings, Potential
  ]);
  if (!BRIDGEABLE_IDS.has(posId)) return '';

  const { theme, subTheme, hasPerson, isDecision, raw } = qa;

  // Grup posisi: "kini/inti" vs "saran" vs "hasil" vs "single"
  const isCurrent = ['single-1', 'three-2', 'two-options-1', 'timeline-3', 'celtic-1', 'relationship-1'].includes(posId);
  const isAdvice  = ['timeline-5', 'celtic-7'].includes(posId);
  const isOutcome = ['three-3', 'two-options-3', 'two-options-5', 'celtic-10', 'relationship-5'].includes(posId);

  // ── Love ──
  if (theme === 'love') {
    if (isCurrent) {
      return hasPerson
        ? (tone === 'puitis'
          ? `*Dalam hal yang kamu tanyakan tentang hubungan itu — energi **${kw1}** ini bukan hanya gambaran kartu. Ia adalah sesuatu yang sudah lama kamu rasakan tapi belum sepenuhnya kamu akui.*`
          : `Dalam konteks **${subTheme}** yang kamu tanyakan, energi **${kw1}** dan **${kw2}** dari kartu ini berbicara langsung tentang kondisi batin yang kamu bawa ke dalam situasi tersebut.`)
        : `Dalam konteks **${subTheme}** yang kamu tanyakan, kartu ini mencerminkan kondisi hatimu yang paling jujur saat ini.`;
    }
    if (isAdvice) {
      return `Khusus untuk situasi **${subTheme}** yang kamu hadapi, saran konkret dari kartu ini: jangan abaikan energi **${kw1}** — ia adalah kompas yang paling jujur untuk langkah berikutmu.`;
    }
    if (isOutcome && hasPerson) {
      return tone === 'puitis'
        ? `*Tentang arah **${subTheme}** yang kamu tanyakan — ini bukan ramalan. Tapi ia menunjukkan ke mana energi sedang bergerak jika tidak ada yang berubah.*`
        : `Untuk pertanyaanmu tentang **${subTheme}**: arah ini masih bisa dipengaruhi — energi **${kw1}** adalah sinyal yang perlu kamu perhatikan.`;
    }
  }

  // ── Career ──
  if (theme === 'career') {
    if (isCurrent) {
      return tone === 'praktis'
        ? `Dalam konteks **${subTheme}** yang kamu tanyakan: energi **${kw1}** ini adalah kondisi riil yang perlu kamu akui dulu sebelum langkah apa pun bisa diambil dengan jernih.`
        : `Dalam perjalanan **${subTheme}** yang kamu tanyakan, kartu ini menunjukkan kondisi batin yang sebenarnya sedang kamu bawa — bukan hanya situasi eksternal, tapi apa yang ada di dalam.`;
    }
    if (isOutcome) {
      return `Untuk pertanyaanmu tentang **${subTheme}**: arah ini bukan soal apakah kamu *bisa* mencapainya — kartu ini mengisyaratkan apakah energi **${kw1}** dalam dirimu sudah siap untuk itu.`;
    }
    if (isAdvice) {
      return `Satu langkah konkret yang paling relevan untuk **${subTheme}** yang kamu tanyakan: energi **${kw1}** menunjukkan arah yang paling bisa segera dieksekusi.`;
    }
  }

  // ── Decision ──
  if (theme === 'decision') {
    if (isAdvice || posId === 'single-1') {
      return tone === 'puitis'
        ? `*Di persimpangan yang kamu tanyakan — kartu ini tidak memilihkan. Tapi energi **${kw1}** ini membisikkan ke arah mana gravitasi batinmu sebenarnya condong.*`
        : `Dalam keputusan yang kamu tanyakan, kartu ini menjadi referensi paling jernih: energi **${kw1}** menunjukkan arah yang paling selaras dengan kondisi batinmu sekarang.`;
    }
    if (isOutcome) {
      return `Dari dua jalur yang kamu pertimbangkan, posisi ini menunjukkan kemungkinan yang paling kuat jika energi **${kw1}** terus mendominasi situasimu.`;
    }
  }

  // ── Money ──
  if (theme === 'money') {
    if (isCurrent) {
      return `Dalam situasi **${subTheme}** yang kamu tanyakan, energi **${kw1}** ini mencerminkan kondisi nyata — bukan hanya angka, tapi cara kamu berhubungan dengan kelimpahan dan kekurangan secara psikologis.`;
    }
    if (isAdvice) {
      return `Untuk situasi **${subTheme}** yang kamu hadapi: energi **${kw1}** menunjukkan arah yang paling bijak untuk saat ini — bukan sekadar strategi, tapi sikap dasar yang perlu diadopsi.`;
    }
  }

  // ── Purpose ──
  if (theme === 'purpose') {
    return tone === 'puitis'
      ? `*Dalam pencarianmu akan **${subTheme}** yang kamu tanyakan — kartu ini bukan jawaban. Tapi ia adalah cermin yang menunjukkan apa yang sudah ada dalam dirimu, menunggu untuk dilihat.*`
      : `Dalam pertanyaanmu tentang **${subTheme}**: energi **${kw1}** dari kartu ini bukan petunjuk dari luar — ia adalah refleksi dari sesuatu dalam dirimu yang sudah bergerak ke arah itu.`;
  }

  // ── Conflict ──
  if (theme === 'conflict') {
    if (isCurrent) {
      return `Dalam situasi sulit yang kamu tanyakan, kartu ini menerangi kondisi inti: energi **${kw1}** adalah apa yang paling dominan saat ini — baik sebagai beban maupun sebagai kekuatan yang belum dikenali.`;
    }
    if (isAdvice) {
      return `Untuk hambatan yang kamu hadapi: energi **${kw1}** dari kartu ini menunjukkan pendekatan yang paling konstruktif — bukan untuk menang, tapi untuk menemukan resolusi yang nyata.`;
    }
  }

  // ── Health ──
  if (theme === 'health') {
    if (isCurrent) {
      return `Dalam konteks **${subTheme}** yang kamu tanyakan, energi **${kw1}** ini mencerminkan kondisi yang perlu mendapat perhatian — bukan sebagai diagnosis, tapi sebagai undangan untuk lebih mendengarkan dirimu sendiri.`;
    }
  }

  // Generic — selalu menyebut pertanyaan, tidak pernah kosong untuk posisi kunci
  if (isCurrent || posId === 'single-1') {
    return `Dihubungkan langsung dengan apa yang kamu tanyakan: energi **${kw1}** ini adalah kondisi yang paling relevan untuk diakui saat ini.`;
  }
  if (isAdvice) {
    return `Untuk situasi yang kamu tanyakan, kartu ini menjadi saran paling jelas: perhatikan energi **${kw1}** sebagai kompas tindakan berikutmu.`;
  }

  return '';
}

// ── Bridge section utama — paragraf penghubung question ke kartu ──

/**
 * Bangun paragraf bridge yang eksplisit muncul SEBELUM narasi per kartu.
 * Ini adalah kalimat yang langsung mengakui pertanyaan user dan
 * menyambungkannya ke kartu yang hadir — inti dari Level C.
 */
function buildBridgeSection(qa: QuestionAnalysis, drawnCards: DrawnCard[], spread: Spread, tone: string): string {
  const { raw, theme, subTheme, hasPerson, isFuture, isDecision, isWhyQuestion, keywords, bridgeOpener } = qa;

  // Kutip pertanyaan asli (dipotong jika terlalu panjang)
  const quotedQ = raw.length > 80 ? `"${raw.slice(0, 77)}…"` : `"${raw}"`;

  // Kartu paling menonjol — yang major arcana, atau yang pertama
  const majorCards = drawnCards.filter(dc => dc.card.type === 'major');
  const leadCard = majorCards.length > 0 ? majorCards[0] : drawnCards[0];
  const leadKw = (leadCard.isReversed ? leadCard.card.keywords.reversed : leadCard.card.keywords.upright)[0] || '';

  // Bangun kalimat berdasarkan kombinasi theme + intent
  let bridgeCore = '';

  if (isWhyQuestion) {
    bridgeCore = tone === 'puitis'
      ? `${bridgeOpener} — ${quotedQ} — membawa pertanyaan yang lebih dalam dari sekadar "kenapa". Kartu-kartu yang muncul tidak menjawab dengan satu sebab, tapi dengan pola — pola yang mungkin sudah lama berjalan tanpa disadari.`
      : `${bridgeOpener} — ${quotedQ} — menunjuk pada dinamika yang lebih dalam dari apa yang tampak di permukaan. Kartu-kartu ini membantu memetakan akar dan alurnya.`;
  } else if (isDecision && theme === 'decision') {
    bridgeCore = tone === 'praktis'
      ? `${bridgeOpener} — ${quotedQ} — menghadirkan kartu-kartu yang tidak memilih, tapi menerangi energi di balik setiap pilihan. Baca ini sebagai data, bukan perintah.`
      : `${bridgeOpener} — ${quotedQ} — menunjukkan bahwa pilihan yang benar seringkali bukan soal logika. Kartu-kartu ini menerangi apa yang sudah kamu ketahui di bawah permukaan.`;
  } else if (theme === 'love') {
    bridgeCore = hasPerson
      ? (tone === 'puitis'
        ? `${bridgeOpener} — ${quotedQ} — menghadirkan cermin yang tidak berdusta. Kartu-kartu ini bukan tentang apa yang dia pikirkan. Mereka tentang apa yang *kamu* bawa ke dalam situasi ini.`
        : `${bridgeOpener} — ${quotedQ} — direspons oleh kartu-kartu yang membaca dinamika ini dari dalam ke luar. Perhatikan apa yang muncul di posisi perasaanmu — seringkali lebih jujur dari yang kamu akui.`)
      : `${bridgeOpener} — ${quotedQ} — direspons oleh kartu-kartu yang menerangi kondisi hatimu saat ini.`;
  } else if (theme === 'career') {
    bridgeCore = tone === 'praktis'
      ? `${bridgeOpener} — ${quotedQ} — direspons oleh kartu-kartu yang membaca situasimu dari kondisi batin ke arah tindakan. Fokus pada posisi saran — itulah yang paling bisa kamu pengaruhi.`
      : `${bridgeOpener} — ${quotedQ} — menghadirkan kartu-kartu yang membaca bukan hanya posisimu sekarang, tapi energi yang membentuk perjalananmu ke depan.`;
  } else if (theme === 'money') {
    bridgeCore = `${bridgeOpener} — ${quotedQ} — direspons oleh kartu-kartu yang membaca kondisi finansial bukan hanya sebagai angka, tapi sebagai cerminan hubunganmu dengan kelimpahan dan keamanan.`;
  } else if (theme === 'purpose') {
    bridgeCore = tone === 'puitis'
      ? `${bridgeOpener} — ${quotedQ} — menghadirkan kartu-kartu yang tahu bahwa pertanyaan tentang makna tidak pernah bisa dijawab sekali. Mereka datang untuk membuka lapisan, bukan untuk menutupnya.`
      : `${bridgeOpener} — ${quotedQ} — direspons oleh kartu-kartu yang menerangi arah yang sudah ada dalam dirimu, menunggu untuk diakui.`;
  } else if (theme === 'conflict') {
    bridgeCore = `${bridgeOpener} — ${quotedQ} — menghadirkan kartu-kartu yang membaca situasi sulit ini dari sudut yang mungkin belum pernah kamu lihat sebelumnya.`;
  } else {
    // general
    bridgeCore = `${bridgeOpener} — ${quotedQ} — membawa kartu-kartu yang merespons kondisi dan energi yang kamu bawa saat ini.`;
  }

  // Tambahkan catatan tentang kartu yang paling menonjol
  const majorNote = majorCards.length >= 2
    ? (tone === 'puitis'
      ? ` Ada **${majorCards.length} Arkana Mayor** dalam susunan ini — ini bukan hal biasa. Kartu-kartu besar sedang berbicara.`
      : ` Perhatikan: **${majorCards.length} dari ${drawnCards.length} kartu** adalah Arkana Mayor — situasimu menyentuh lapisan yang lebih dalam dari sekadar kejadian sehari-hari.`)
    : '';

  return bridgeCore + majorNote;
}

// ── Analisis hubungan antar kartu ───────────────────────────

function getCardRelationship(drawnCards: DrawnCard[], tone: string = 'spiritual'): string {
  if (drawnCards.length < 2) return '';

  const majorCount = drawnCards.filter(dc => dc.card.type === 'major').length;
  const reversedCount = drawnCards.filter(dc => dc.isReversed).length;
  const total = drawnCards.length;

  const parts: string[] = [];

  if (majorCount === total) {
    const msg: Record<string, string> = {
      spiritual: 'Seluruh susunan ini dipenuhi Arkana Mayor — situasimu sedang berada dalam fase transformasi jiwa yang besar. Energi yang bergerak saat ini memiliki dampak yang melampaui kejadian sehari-hari.',
      praktis: 'Semua kartu Arkana Mayor — situasimu membutuhkan perhatian penuh dan keputusan yang matang. Ini bukan masalah kecil yang bisa ditunda.',
      puitis: 'Semua Arkana Mayor. Semua dewa berbicara sekaligus. Jarang sekali ini terjadi — dan jarang sekali orang benar-benar mendengarnya.',
    };
    parts.push(msg[tone] || msg.spiritual);
  } else if (majorCount >= Math.ceil(total / 2)) {
    parts.push(`${majorCount} dari ${total} kartu adalah Arkana Mayor — dimensi yang lebih dalam dari sekadar kejadian sehari-hari sedang bekerja di sini.`);
  } else if (majorCount === 0) {
    const msg: Record<string, string> = {
      spiritual: 'Semua kartu adalah Arkana Minor — situasimu berkaitan dengan ritme kehidupan sehari-hari dan pilihan-pilihan praktis yang ada dalam kendalimu.',
      praktis: 'Semua Arkana Minor — kabar baik: situasimu sepenuhnya dalam kendalimu. Ini bukan soal takdir besar; ini soal tindakan yang tepat.',
      puitis: 'Semua Arkana Minor — bukan soal takdir besar, tapi soal detail-detail kecil yang membentuk realitas. Sering kali di situlah kehidupan yang sebenarnya terjadi.',
    };
    parts.push(msg[tone] || msg.spiritual);
  }

  if (reversedCount > total / 2) {
    const msg: Record<string, string> = {
      spiritual: `Banyak kartu dalam posisi terbalik (${reversedCount} dari ${total}) — ada energi yang sedang ditahan atau diolah dari dalam. Sesuatu perlu diakui sebelum bisa bergerak maju.`,
      praktis: `${reversedCount} kartu terbalik — ada hambatan nyata yang perlu diatasi. Identifikasi dulu mana yang paling menghalangi, lalu fokus ke sana.`,
      puitis: `Banyak yang terbalik — seperti cermin yang dipasang di posisi salah. Gambarnya ada, tapi perlu diputar dulu untuk bisa dibaca dengan benar.`,
    };
    parts.push(msg[tone] || msg.spiritual);
  } else if (reversedCount === 0 && total > 1) {
    const msg: Record<string, string> = {
      spiritual: 'Semua kartu dalam posisi normal — energi mengalir dengan relatif terbuka dan siap untuk disalurkan.',
      praktis: 'Semua kartu normal — kondisi mendukung untuk bergerak. Tidak ada hambatan energi yang besar saat ini.',
      puitis: 'Semua menghadap ke atas. Semua berbicara dengan suara yang jelas. Pertanyaannya: apakah kamu siap untuk mendengarnya?',
    };
    parts.push(msg[tone] || msg.spiritual);
  }

  const suits: Record<string, number> = {};
  drawnCards.forEach(dc => { if (dc.card.suit) suits[dc.card.suit] = (suits[dc.card.suit] || 0) + 1; });
  const dominantSuit = Object.entries(suits).sort((a, b) => b[1] - a[1])[0];
  if (dominantSuit && dominantSuit[1] >= 2) {
    const suitMessages: Record<string, Record<string, string>> = {
      wands: {
        spiritual: 'Dominasi Tongkat (Wands) — api sedang berbicara. Semangat, kreativitas, dan ambisi adalah tema yang perlu dieksplorasi secara mendalam.',
        praktis: 'Dominasi Wands — energi api dan tindakan. Fokus pada inisiatif dan langkah nyata yang perlu diambil.',
        puitis: 'Banyak Tongkat hadir — api dalam banyak bentuk. Ada yang menghangatkan, ada yang membakar. Bedakan keduanya.',
      },
      cups: {
        spiritual: 'Dominasi Cawan (Cups) — air sedang mengalir. Perasaan, hubungan, dan dunia batin adalah pusat dari situasimu.',
        praktis: 'Dominasi Cups — situasimu sangat emosional. Jangan buat keputusan besar sebelum perasaan lebih jernih.',
        puitis: 'Banyak Cawan — banyak perasaan yang menggenang. Ada yang perlu direguk, ada yang perlu dibuang.',
      },
      swords: {
        spiritual: 'Dominasi Pedang (Swords) — pikiran dan kebenaran sedang beradu. Konflik, kejelasan, dan keputusan adalah tema yang dominan.',
        praktis: 'Dominasi Swords — banyak keputusan dan konflik mental. Prioritaskan mana yang benar-benar penting dan mana yang bisa dilepas.',
        puitis: 'Banyak Pedang — pikiran yang tidak bisa berhenti, atau kebenaran yang tidak bisa dihindar. Keduanya memotong, tapi hanya satu yang membebaskan.',
      },
      pentacles: {
        spiritual: 'Dominasi Koin (Pentacles) — bumi sedang berbicara. Materi, pekerjaan, tubuh, dan hal-hal nyata adalah fokus energi saat ini.',
        praktis: 'Dominasi Pentacles — situasimu berkaitan langsung dengan hal-hal konkret: uang, karir, atau kesehatan. Fokus pada yang bisa disentuh dan diukur.',
        puitis: 'Banyak Koin — banyak hal yang bisa dipegang, tapi tidak semua yang berharga bisa ditimbang.',
      },
    };
    const suitMsg = suitMessages[dominantSuit[0]];
    if (suitMsg) parts.push(suitMsg[tone] || suitMsg.spiritual);
  }

  return parts.length > 0 ? '**Pola Keseluruhan**\n\n' + parts.join(' ') : '';
}

// ── Saran akhir — sekarang sadar akan tema question ──────────

function getSpreadAdvice(spreadId: string, drawnCards: DrawnCard[], tone: string = 'spiritual', qa?: QuestionAnalysis): string {
  const reversedCount = drawnCards.filter(dc => dc.isReversed).length;
  const hasChallenge = reversedCount > 0;
  const theme = qa?.theme || 'general';
  const subTheme = qa?.subTheme || '';

  // Suffix spesifik tema — ditambahkan di akhir saran standar
  const themeSpecificSuffix = (): string => {
    if (!qa) return '';
    switch (theme) {
      case 'love':
        return tone === 'puitis'
          ? ` Soal **${subTheme}** yang kamu bawa: kartu-kartu ini tidak memberi garansi. Tapi mereka membantumu melihat lebih jelas — dan itu lebih berharga dari kepastian.`
          : ` Dalam konteks **${subTheme}** yang kamu tanyakan: gunakan bacaan ini sebagai bahan refleksi, bukan keputusan — hati perlu lebih dari satu malam untuk merespons dengan jujur.`;
      case 'career':
        return ` Untuk pertanyaanmu tentang **${subTheme}**: langkah konkret yang paling berguna adalah mengidentifikasi satu hal yang bisa kamu mulai atau hentikan minggu ini.`;
      case 'money':
        return ` Dalam situasi **${subTheme}** yang kamu hadapi: kartu-kartu ini menunjukkan kondisi batin — bukan instruksi finansial. Konsultasikan keputusan konkret dengan orang yang relevan.`;
      case 'decision':
        return ` Di persimpangan yang kamu tanyakan: jika bacaan ini beresonansi, percayai itu. Jika ada yang terasa tidak pas, itu juga informasi yang berharga.`;
      case 'purpose':
        return ` Dalam pencarian **${subTheme}** yang kamu bawa: jawaban tidak datang sekali. Baca ini berulang kali dalam beberapa hari ke depan — artinya bisa berubah.`;
      default:
        return '';
    }
  };

  type AdviceByTone = { spiritual: string; praktis: string; puitis: string };
  const adviceMap: Record<string, AdviceByTone> = {
    'single': {
      spiritual: hasChallenge
        ? 'Kartu terbalik bukan pertanda buruk — ia mengundangmu untuk melihat ke dalam, bukan ke luar. Ada sesuatu yang perlu dilepaskan atau diakui sebelum energi ini bisa mengalir bebas.'
        : 'Kartu ini hadir dengan energi yang terbuka dan siap. Percayai apa yang datang dengan ringan dan terbuka.',
      praktis: hasChallenge
        ? 'Kartu terbalik menunjukkan hambatan spesifik. Identifikasi apa yang menghalangi, dan cari satu tindakan konkret untuk mengatasinya.'
        : 'Energi mendukung tindakan. Tentukan satu langkah konkret yang bisa kamu ambil hari ini berdasarkan pesan kartu ini.',
      puitis: hasChallenge
        ? 'Kartu terbalik bukan salah — ia hanya sedang berbicara dalam bahasa yang lebih dalam. Dengarkan dengan lebih pelan.'
        : 'Satu kartu, satu kebenaran. Tidak semua kebenaran perlu dipahami sekaligus — beberapa butuh waktu untuk meresap.',
    },
    'three-card': {
      spiritual: 'Baca ketiga kartu sebagai satu narasi jiwa yang mengalir. Masa lalu menjelaskan kini, dan kini membentuk masa depan. Kamu tidak terjebak di mana pun dalam kisah ini.',
      praktis: 'Kartu tengah adalah prioritasmu — itulah kondisi nyata yang bisa kamu pengaruhi sekarang. Gunakan masa lalu sebagai konteks, bukan sebagai beban.',
      puitis: 'Tiga kartu, tiga bait. Biarkan kisahnya mengalir — tidak perlu dipaksa menjadi satu kesimpulan yang rapi.',
    },
    'two-options': {
      spiritual: `Kedua jalur memiliki nilai dan tantangannya sendiri. Pertimbangkan: jalur mana yang paling selaras dengan nilai-nilaimu yang terdalam, bukan hanya yang terasa paling nyaman?${hasChallenge ? ' Kartu terbalik menunjukkan area yang membutuhkan kewaspadaan ekstra.' : ''}`,
      praktis: `Pertimbangkan trade-off nyata dari masing-masing jalur. Mana yang memberikan hasil terbaik untuk tujuanmu jangka panjang?${hasChallenge ? ' Kartu terbalik menunjukkan risiko spesifik yang perlu diperhitungkan.' : ''}`,
      puitis: 'Tidak ada jalur yang sempurna. Yang ada hanya jalur yang lebih jujur — yang kamu pilih bukan karena mudah, tapi karena selaras dengan siapa kamu sebenarnya.',
    },
    'relationship': {
      spiritual: 'Hubungan tumbuh melalui kejujuran dan komunikasi dari hati. Apa yang terungkap dalam kartu-kartu ini bisa menjadi bahan percakapan yang jujur — dengan diri sendiri maupun dengan pihak lain.',
      praktis: 'Identifikasi satu area konkret yang perlu diperbaiki dalam hubungan ini. Jadwalkan percakapan yang jujur — bukan konfrontasi, tapi dialog yang berorientasi solusi.',
      puitis: 'Hubungan adalah cermin yang tidak pernah berbohong. Pertanyaannya bukan apa yang kamu lihat di sana — tapi apakah kamu siap untuk melihatnya.',
    },
    'timeline': {
      spiritual: 'Kamu tidak harus mengikuti arus yang sudah ada. Mengerti asal-usul situasi memberimu kesadaran untuk mengambil tindakan yang tepat — bukan bereaksi, tapi merespons dari tempat yang lebih dalam.',
      praktis: 'Fokus pada kartu saran tindakan — itulah yang paling bisa kamu pengaruhi sekarang. Gunakan pemahaman tentang akar dan tren sebagai konteks untuk keputusanmu.',
      puitis: 'Memahami dari mana kamu berasal tidak berarti kamu harus ke sana lagi. Mengetahui akar memberimu kebebasan — bukan untuk melarikan diri, tapi untuk memilih dengan lebih sadar.',
    },
    'celtic-cross': {
      spiritual: 'Celtic Cross tidak harus dibaca secara harfiah. Biarkan keseluruhan gambaran meresap, dan perhatikan kartu mana yang paling beresonansi atau paling mengejutkanmu. Sering kali, itulah pesan terpenting dari bawah sadar.',
      praktis: 'Dari sepuluh kartu ini, identifikasi tiga yang paling relevan untuk tindakan: kondisi saat ini, hambatan utama, dan saran tindakan. Fokus ke sana dulu.',
      puitis: 'Sepuluh kartu, sepuluh sudut pandang. Tidak semua harus dipahami hari ini. Beberapa akan muncul kembali maknanya berminggu-minggu kemudian, dalam momen yang tidak terduga.',
    },
  };

  const entry = adviceMap[spreadId];
  const baseAdvice = entry
    ? (entry[tone as keyof AdviceByTone] || entry.spiritual)
    : 'Renungkan pesan kartu-kartu ini dengan hati yang terbuka.';

  return baseAdvice + themeSpecificSuffix();
}

// ── Fungsi utama: generate interpretasi — Level C ─────────────

export function generateInterpretation(
  question: string,
  spread: Spread,
  drawnCards: DrawnCard[],
  tone: string = 'spiritual',
): string {
  const parts: string[] = [];

  // Analisis pertanyaan — fondasi dari Level C
  const qa = analyzeQuestion(question);

  // 1. Pembuka — pilihan berbasis konten question (djb2), bukan length
  const opening = pickOpening(spread.id, question, tone);
  parts.push(`*${opening}*`);
  parts.push('');

  // 2. Bridge section — paragraf yang langsung sambungkan question ke kartu
  //    Ini yang membuat static engine "membaca" pertanyaan user secara eksplisit
  const bridge = buildBridgeSection(qa, drawnCards, spread, tone);
  if (bridge) {
    parts.push(bridge);
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  // 3. Per kartu — dengan konteks question disuntikkan ke posisi kunci
  drawnCards.forEach((dc) => {
    parts.push(getPositionNarrative(dc.position, dc.card, dc.isReversed, tone, qa));
    parts.push('');
  });

  // 4. Pola keseluruhan
  if (drawnCards.length > 1) {
    const relationship = getCardRelationship(drawnCards, tone);
    if (relationship) {
      parts.push('---');
      parts.push('');
      parts.push(relationship);
      parts.push('');
    }
  }

  // 5. Saran akhir — sadar tema question
  parts.push('---');
  parts.push('');
  parts.push('**Renungan**');
  parts.push('');
  parts.push(getSpreadAdvice(spread.id, drawnCards, tone, qa));
  parts.push('');

  // 6. Penutup
  parts.push(`*${pickClosing(drawnCards, tone)}*`);

  return parts.join('\n');
}

// ── Interpretasi kartu harian ────────────────────────────────

const dailyThemes = [
  { intro: 'Hari ini semesta berbisik melalui', focus: 'Bawa energi ini sebagai kompas harimu.' },
  { intro: 'Kartu hari ini hadir dengan pesan', focus: 'Renungkan maknanya sepanjang hari.' },
  { intro: 'Semesta memilihkan kartu ini untukmu hari ini', focus: 'Perhatikan momen-momen yang beresonansi dengan energi ini.' },
  { intro: 'Di antara 78 kemungkinan, hari ini membawa', focus: 'Jadikan ini cermin untuk hari yang akan kamu jalani.' },
  { intro: 'Energi hari ini bergerak melalui', focus: 'Biarkan ia memandumu dengan lembut.' },
  { intro: 'Bintang-bintang hari ini menunjukkan', focus: 'Simpan pesan ini di hatimu hari ini.' },
  { intro: 'Kartu ini dipilih oleh hari ini untukmu', focus: 'Perhatikan bagaimana energi ini muncul dalam situasi nyata.' },
];

const dailyReflections: Record<string, string[]> = {
  normal: [
    'Bagaimana energi ini sudah terasa dalam hidupmu belakangan ini?',
    'Di area mana dalam hidupmu energi ini paling dibutuhkan hari ini?',
    'Apa satu langkah kecil yang bisa kamu ambil hari ini yang selaras dengan pesan kartu ini?',
    'Siapa dalam hidupmu yang mencerminkan energi kartu ini?',
    'Apa yang perlu kamu lepaskan agar energi positif kartu ini bisa mengalir lebih bebas?',
  ],
  reversed: [
    'Kartu terbalik mengajak kamu menatap ke dalam. Apa yang selama ini kamu hindari untuk dilihat?',
    'Di mana dalam hidupmu energi ini terasa terhambat atau tertahan?',
    'Apa pola lama yang mungkin perlu kamu ubah hari ini?',
    'Adakah sesuatu yang perlu kamu lepaskan sebelum energi baru bisa masuk?',
    'Bagaimana kamu bisa bersikap lebih lembut pada diri sendiri hari ini?',
  ],
};

export function generateDailyInterpretation(
  card: TarotCard,
  isReversed: boolean,
  dateKey: string,
): string {
  const dayNum = parseInt(dateKey.replace(/-/g, '')) || 0;
  const themeIdx = dayNum % dailyThemes.length;
  const theme = dailyThemes[themeIdx];

  const orientation = isReversed ? 'terbalik' : 'normal';
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;
  const meaning = isReversed ? card.meaning.reversed : card.meaning.upright;
  const kwStr = keywords.slice(0, 4).join(' · ');

  const enriched = getEnrichedMeaning(card.id);
  const deepMeaning = enriched ? (isReversed ? enriched.reversedDeep : enriched.uprightDeep) : meaning;

  const reflections = isReversed ? dailyReflections.reversed : dailyReflections.normal;
  const reflectionIdx = (dayNum + 2) % reflections.length;
  const reflection = enriched ? enriched.reflection : reflections[reflectionIdx];

  const actionPhrases = isReversed ? [
    'Luangkan waktu sejenak hari ini untuk merenung ke dalam.',
    'Hari ini adalah undangan untuk berhenti sejenak dan mendengarkan dirimu sendiri.',
    'Perhatikan dorongan untuk bereaksi — ada kebijaksanaan dalam jeda.',
  ] : [
    'Bawa energi ini ke dalam tindakan nyata hari ini.',
    'Percayai aliran hari ini — kamu lebih siap dari yang kamu kira.',
    'Energi ini ada di pihakmu hari ini.',
  ];
  const actionIdx = (dayNum + 1) % actionPhrases.length;
  const todayAction = enriched ? enriched.action : actionPhrases[actionIdx];

  const parts = [
    `*${theme.intro} **${card.nameCn}** (${card.name}, ${orientation}).*`,
    '',
    `**Kata Kunci Hari Ini:** ${kwStr}`,
    '',
    deepMeaning,
    '',
    '---',
    '',
    `**Untuk Harimu**`,
    '',
    `${todayAction}`,
    '',
    `*${theme.focus}*`,
    '',
    `*Pertanyaan untuk direnungkan: ${reflection}*`,
  ];

  return parts.join('\n');
}

// ── Follow-up statis — sekarang inject pertanyaan asli ke jawaban ─

export function generateFollowUp(
  followUpQuestion: string,
  drawnCards: DrawnCard[],
  spread: Spread,
  tone: string = 'spiritual',
): string {
  const qLower = followUpQuestion.toLowerCase();

  // ── Cari kartu yang paling relevan dengan pertanyaan lanjutan ──
  let mostRelevantCard = drawnCards[0];
  let highestScore = 0;

  drawnCards.forEach(dc => {
    const kws = dc.isReversed ? dc.card.keywords.reversed : dc.card.keywords.upright;
    const score = kws.filter(kw => qLower.includes(kw.toLowerCase())).length;
    if (score > highestScore) { highestScore = score; mostRelevantCard = dc; }
  });

  const card = mostRelevantCard.card;
  const isReversed = mostRelevantCard.isReversed;
  const keywords = isReversed ? card.keywords.reversed : card.keywords.upright;
  const meaning = isReversed ? card.meaning.reversed : card.meaning.upright;

  const isAboutAction = qLower.includes('apa yang harus') || qLower.includes('bagaimana') || qLower.includes('langkah') || qLower.includes('tindakan');
  const isAboutTime = qLower.includes('kapan') || qLower.includes('berapa lama') || qLower.includes('waktu');
  const isAboutPerson = qLower.includes('dia') || qLower.includes('mereka') || qLower.includes('orang');
  const isAboutFeelings = qLower.includes('perasaan') || qLower.includes('rasa') || qLower.includes('hati');

  const enriched = getEnrichedMeaning(card.id);
  const deepMeaning = enriched ? (isReversed ? enriched.reversedDeep : enriched.uprightDeep) : meaning;
  const enrichedAction = enriched ? enriched.action : null;
  const enrichedReflection = enriched ? enriched.reflection : null;

  // Tone-aware closing suffix
  const closingSuffix: Record<string, string> = {
    spiritual: enrichedReflection ? `\n\n*${enrichedReflection}*` : '',
    praktis: enrichedAction ? `\n\n**Yang bisa dilakukan:** ${enrichedAction}` : '',
    puitis: enrichedReflection ? `\n\n*${enrichedReflection}*` : '',
  };
  const suffix = closingSuffix[tone] || closingSuffix.spiritual;

  // Kutip pertanyaan lanjutan di awal — agar user merasa didengar
  const quotedQ = followUpQuestion.length > 70
    ? `"${followUpQuestion.slice(0, 67)}…"`
    : `"${followUpQuestion}"`;

  let responseBody = '';

  if (isAboutAction) {
    responseBody = `Kamu bertanya: ${quotedQ}\n\nMelihat kembali **${card.nameCn}** — energi **${keywords.slice(0,2).join(' dan ')}** menunjukkan arah yang paling selaras.\n\n${deepMeaning}${tone === 'praktis' && enrichedAction ? `\n\n**Yang bisa dilakukan:** ${enrichedAction}` : suffix}`;
  } else if (isAboutTime) {
    responseBody = `Kamu bertanya: ${quotedQ}\n\nKartu tarot tidak berbicara dalam satuan waktu yang pasti — mereka berbicara dalam energi. Yang bisa dibaca dari **${card.nameCn}** adalah bahwa waktunya tiba ketika energi **${keywords.slice(0,2).join(' dan ')}** terasa kuat dalam hidupmu.\n\n${deepMeaning}`;
  } else if (isAboutPerson) {
    responseBody = `Kamu bertanya: ${quotedQ}\n\nTentang orang yang kamu maksud — **${card.nameCn}** dalam posisi ${isReversed ? 'terbalik' : 'normal'} menggambarkan energi **${keywords.slice(0,2).join(' dan ')}** yang mungkin mencerminkan kondisi mereka atau dinamika antara kalian.\n\n${deepMeaning}\n\n*Ingat bahwa kartu membaca energi, bukan membaca pikiran seseorang secara harfiah.*`;
  } else if (isAboutFeelings) {
    responseBody = `Kamu bertanya: ${quotedQ}\n\nDalam hal perasaan, **${card.nameCn}** berbicara tentang **${keywords.slice(0,3).join(', ')}**.\n\n${deepMeaning}${suffix || '\n\nPerasaan ini valid dan layak untuk diakui.'}`;
  } else {
    responseBody = `Kamu bertanya: ${quotedQ}\n\nMembawa pertanyaanmu kembali ke kartu-kartu yang hadir — khususnya **${card.nameCn}** — energi **${keywords.slice(0,3).join(', ')}** memberikan konteks.\n\n${deepMeaning}${suffix}`;
  }

  const footerByTone: Record<string, string> = {
    spiritual: `*Kartu-kartu dalam susunan ${spread.nameCn} ini tetap relevan sebagai panduan keseluruhan. Baca jawabannya bukan sebagai kepastian, tapi sebagai perspektif tambahan untuk direnungkan.*`,
    praktis: `*Gunakan ini sebagai perspektif tambahan untuk membantu keputusanmu. Kartu-kartu dalam susunan ${spread.nameCn} masih relevan sebagai konteks.*`,
    puitis: `*Setiap pertanyaan lanjutan membuka lapisan baru. Kartu-kartu dalam susunan ${spread.nameCn} masih menjaga kisahmu.*`,
  };

  return [
    responseBody,
    '',
    footerByTone[tone] || footerByTone.spiritual,
  ].join('\n');
}
