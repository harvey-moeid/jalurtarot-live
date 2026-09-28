import { TarotCard, Suit } from './types';

// å¤§é¿å¡çº³ (Major Arcana) - 22å¼ 
const majorArcana: TarotCard[] = [
  {
    id: 'major-00',
    name: 'The Fool',
    nameCn: 'The Fool',
    type: 'major',
    number: 0,
    image: '/cards/major/00-fool.jpg',
    keywords: {
      upright: ['Awal Baru', 'Petualangan', 'Kemurnian', 'Kebebasan', 'Potensi'],
      reversed: ['Gegabah', 'Sembrono', 'Kebodohan', 'Stagnasi', 'Ketakutan']
    },
    meaning: {
      upright: 'Melambangkan awal baru, semangat petualangan, dan kemungkinan tak terbatas. Kamu berada di titik awal perjalanan hidup, penuh harapan dan potensi.',
      reversed: 'Memperingatkan tindakan gegabah atau terlalu naif. Mungkin ada ketakutan yang menghalangi langkahmu ke depan.'
    }
  },
  {
    id: 'major-01',
    name: 'The Magician',
    nameCn: 'The Magician',
    type: 'major',
    number: 1,
    image: '/cards/major/01-magician.jpg',
    keywords: {
      upright: ['Kreativitas', 'Tekad', 'Kemampuan', 'Fokus', 'Tindakan'],
      reversed: ['Penipuan', 'Manipulasi', 'Bakat Terbuang', 'Tanpa Arah']
    },
    meaning: {
      upright: 'Melambangkan bahwa kamu memiliki semua sumber daya dan kemampuan untuk mencapai tujuan. Saatnya mewujudkan ide menjadi tindakan.',
      reversed: 'Mungkin ada bakat yang terbuang atau risiko dimanipulasi. Perlu mengevaluasi motivasi dan arahmu sendiri.'
    }
  },
  {
    id: 'major-02',
    name: 'The High Priestess',
    nameCn: 'The High Priestess',
    type: 'major',
    number: 2,
    image: '/cards/major/02-high-priestess.jpg',
    keywords: {
      upright: ['Intuisi', 'Misteri', 'Kebijaksanaan Batin', 'Bawah Sadar', 'Spiritualitas'],
      reversed: ['Rahasia', 'Tersembunyi', 'Mengabaikan Intuisi', 'Permukaan']
    },
    meaning: {
      upright: 'Mengingatkanmu untuk mendengarkan suara batin dan mempercayai intuisi. Jawabannya mungkin tersembunyi di kedalaman bawah sadarmu.',
      reversed: 'Mungkin mengabaikan sinyal intuisi penting, atau ada rahasia yang belum terungkap.'
    }
  },
  {
    id: 'major-03',
    name: 'The Empress',
    nameCn: 'The Empress',
    type: 'major',
    number: 3,
    image: '/cards/major/03-empress.jpg',
    keywords: {
      upright: ['Kelimpahan', 'Keibuan', 'Alam', 'Kreasi', 'Keindahan'],
      reversed: ['Ketergantungan', 'Kekosongan', 'Kreativitas Terhambat', 'Mengabaikan Diri']
    },
    meaning: {
      upright: 'Melambangkan kelimpahan, kreativitas, dan pengasuhan. Bisa menandakan kehamilan, lahirnya proyek baru, atau kemakmuran materi.',
      reversed: 'Mungkin merasa kreativitas mengering atau terlalu bergantung pada orang lain. Perlu terhubung kembali dengan alam dan kekuatan batin.'
    }
  },
  {
    id: 'major-04',
    name: 'The Emperor',
    nameCn: 'The Emperor',
    type: 'major',
    number: 4,
    image: '/cards/major/04-emperor.jpg',
    keywords: {
      upright: ['Otoritas', 'Struktur', 'Kontrol', 'Kebapakan', 'Stabilitas'],
      reversed: ['Otoriter', 'Kaku', 'Kurang Disiplin', 'Penyalahgunaan Kekuasaan']
    },
    meaning: {
      upright: 'Melambangkan otoritas, keteraturan, dan stabilitas. Menandakan perlunya membangun struktur atau mencari bimbingan dari yang berpengalaman.',
      reversed: 'Mungkin menandakan kontrol berlebihan atau kurang disiplin. Perlu menemukan keseimbangan antara otoritas dan fleksibilitas.'
    }
  },
  {
    id: 'major-05',
    name: 'The Hierophant',
    nameCn: 'The Hierophant',
    type: 'major',
    number: 5,
    image: '/cards/major/05-hierophant.jpg',
    keywords: {
      upright: ['Tradisi', 'Kepercayaan', 'Pendidikan', 'Bimbingan', 'Ritual'],
      reversed: ['Pemberontakan', 'Non-tradisional', 'Menantang Otoritas', 'Keyakinan Pribadi']
    },
    meaning: {
      upright: 'Melambangkan kebijaksanaan tradisi, bimbingan spiritual, dan pendidikan formal. Mungkin menandakan perlunya mencari mentor atau mengikuti tradisi.',
      reversed: 'Mungkin sedang menantang tradisi atau mencari jalan spiritualmu sendiri. Mendorong pemikiran mandiri.'
    }
  },
  {
    id: 'major-06',
    name: 'The Lovers',
    nameCn: 'The Lovers',
    type: 'major',
    number: 6,
    image: '/cards/major/06-lovers.jpg',
    keywords: {
      upright: ['Cinta', 'Harmoni', 'Pilihan', 'Nilai', 'Penyatuan'],
      reversed: ['Ketidakseimbangan', 'Konflik Nilai', 'Ketidakharmonisan', 'Pilihan Keliru']
    },
    meaning: {
      upright: 'Melambangkan cinta, hubungan yang harmonis, dan pilihan penting. Mungkin menghadapi keputusan yang perlu diikuti dengan hati.',
      reversed: 'Mungkin menandakan hubungan yang tidak harmonis atau konflik nilai. Perlu mengevaluasi kembali pilihan-pilihanmu.'
    }
  },
  {
    id: 'major-07',
    name: 'The Chariot',
    nameCn: 'The Chariot',
    type: 'major',
    number: 7,
    image: '/cards/major/07-chariot.jpg',
    keywords: {
      upright: ['Kemenangan', 'Tekad', 'Tekad Bulat', 'Kontrol', 'Melangkah Maju'],
      reversed: ['Hilang Kendali', 'Tanpa Arah', 'Agresivitas', 'Hambatan']
    },
    meaning: {
      upright: 'Melambangkan kemenangan melalui tekad dan kehendak yang kuat. Menandakan kamu punya kemampuan untuk mengatasi hambatan dan melangkah menuju tujuan.',
      reversed: 'Mungkin merasa kehilangan kendali atau arah yang tidak jelas. Perlu memfokuskan kembali dan menguasai situasi.'
    }
  },
  {
    id: 'major-08',
    name: 'Strength',
    nameCn: 'Strength',
    type: 'major',
    number: 8,
    image: '/cards/major/08-strength.jpg',
    keywords: {
      upright: ['Keberanian', 'Kesabaran', 'Kekuatan Batin', 'Kelembutan', 'Kepercayaan Diri'],
      reversed: ['Keraguan Diri', 'Kelemahan', 'Kurang Percaya Diri', 'Kasar']
    },
    meaning: {
      upright: 'Melambangkan kekuatan batin, keberanian, dan kelembutan yang teguh. Mengingatkanmu bahwa kekuatan sejati berasal dari dalam.',
      reversed: 'Mungkin sedang mengalami keraguan diri atau merasa lemah. Perlu terhubung kembali dengan kekuatan batin.'
    }
  },
  {
    id: 'major-09',
    name: 'The Hermit',
    nameCn: 'The Hermit',
    type: 'major',
    number: 9,
    image: '/cards/major/09-hermit.jpg',
    keywords: {
      upright: ['Introspeksi', 'Kesendirian', 'Kebijaksanaan', 'Mencari Kebenaran', 'Panduan'],
      reversed: ['Terisolasi', 'Kesendirian', 'Menghindar', 'Menolak Bantuan']
    },
    meaning: {
      upright: 'Melambangkan masa introspeksi, kesendirian, dan mencari kebijaksanaan batin. Saatnya mundur sementara dari keramaian dan mencari jawaban.',
      reversed: 'Mungkin terlalu terisolasi atau menolak bantuan orang lain. Perlu menemukan keseimbangan antara kesendirian dan pergaulan.'
    }
  },
  {
    id: 'major-10',
    name: 'Wheel of Fortune',
    nameCn: 'Wheel of Fortune',
    type: 'major',
    number: 10,
    image: '/cards/major/10-wheel-of-fortune.jpg',
    keywords: {
      upright: ['Nasib', 'Transformasi', 'Siklus', 'Keberuntungan', 'Kesempatan'],
      reversed: ['Kesialan', 'Menolak Perubahan', 'Hilang Kendali', 'Kesulitan']
    },
    meaning: {
      upright: 'Melambangkan perubahan nasib dan siklus kehidupan. Keberuntungan akan segera datang, sambut kesempatan.',
      reversed: 'Mungkin sedang mengalami kesulitan atau menolak perubahan yang diperlukan. Ingat ini hanyalah siklus sementara.'
    }
  },
  {
    id: 'major-11',
    name: 'Justice',
    nameCn: 'Justice',
    type: 'major',
    number: 11,
    image: '/cards/major/11-justice.jpg',
    keywords: {
      upright: ['Keadilan', 'Kebenaran', 'Sebab Akibat', 'Hukum', 'Keseimbangan'],
      reversed: ['Ketidakadilan', 'Lari dari Tanggung Jawab', 'Prasangka', 'Penipuan']
    },
    meaning: {
      upright: 'Melambangkan keadilan, kebenaran, dan hukum sebab-akibat. Mengingatkanmu untuk bertanggung jawab atas tindakanmu dan mengejar keadilan.',
      reversed: 'Mungkin menandakan situasi yang tidak adil atau lari dari tanggung jawab. Perlu jujur menghadapi kebenaran.'
    }
  },
  {
    id: 'major-12',
    name: 'The Hanged Man',
    nameCn: 'The Hanged Man',
    type: 'major',
    number: 12,
    image: '/cards/major/12-hanged-man.jpg',
    keywords: {
      upright: ['Pengorbanan', 'Melepaskan', 'Perspektif Baru', 'Menunggu', 'Penerimaan'],
      reversed: ['Penundaan', 'Penolakan', 'Pengorbanan Sia-sia', 'Stagnasi']
    },
    meaning: {
      upright: 'Melambangkan jeda, pengorbanan, dan melihat masalah dari sudut pandang baru. Terkadang dengan melepaskan kita justru mendapatkan lebih banyak.',
      reversed: 'Mungkin menunda tanpa tujuan atau melakukan pengorbanan yang tidak perlu. Perlu mengevaluasi kembali situasimu.'
    }
  },
  {
    id: 'major-13',
    name: 'Death',
    nameCn: 'Death',
    type: 'major',
    number: 13,
    image: '/cards/major/13-death.jpg',
    keywords: {
      upright: ['Pengakhiran', 'Transformasi', 'Transisi', 'Melepaskan', 'Kelahiran Baru'],
      reversed: ['Menolak Perubahan', 'Stagnasi', 'Ketakutan', 'Tidak Bisa Melepaskan']
    },
    meaning: {
      upright: 'Melambangkan akhir dan awal baru — transformasi, bukan kematian harfiah. Yang lama harus berakhir agar yang baru bisa dimulai.',
      reversed: 'Mungkin menolak perubahan yang diperlukan atau tidak bisa melepaskan masa lalu. Perlu menerima transformasi.'
    }
  },
  {
    id: 'major-14',
    name: 'Temperance',
    nameCn: 'Temperance',
    type: 'major',
    number: 14,
    image: '/cards/major/14-temperance.jpg',
    keywords: {
      upright: ['Keseimbangan', 'Kesabaran', 'Keselarasan', 'Moderasi', 'Tujuan'],
      reversed: ['Ketidakseimbangan', 'Berlebihan', 'Kurang Sabar', 'Konflik']
    },
    meaning: {
      upright: 'Melambangkan keseimbangan, kesabaran, dan keselarasan. Mengingatkanmu untuk menjaga moderasi dan harmoni dalam semua aspek kehidupan.',
      reversed: 'Mungkin kehidupan sedang tidak seimbang atau kurang sabar. Perlu menemukan kembali jalan tengah.'
    }
  },
  {
    id: 'major-15',
    name: 'The Devil',
    nameCn: 'The Devil',
    type: 'major',
    number: 15,
    image: '/cards/major/15-devil.jpg',
    keywords: {
      upright: ['Belenggu', 'Keinginan', 'Materialisme', 'Sisi Gelap', 'Ketergantungan'],
      reversed: ['Pembebasan', 'Pembebasan', 'Menghadapi Sisi Gelap', 'Memutus Belenggu']
    },
    meaning: {
      upright: 'Melambangkan belenggu, keinginan, dan sisi gelap. Mungkin terjebak oleh materi atau hubungan yang tidak sehat.',
      reversed: 'Menandakan sedang memutus belenggu atau menghadapi sisi gelap batin. Kebebasan sudah dekat.'
    }
  },
  {
    id: 'major-16',
    name: 'The Tower',
    nameCn: 'The Tower',
    type: 'major',
    number: 16,
    image: '/cards/major/16-tower.jpg',
    keywords: {
      upright: ['Perubahan Drastis', 'Keruntuhan', 'Wahyu', 'Kebangkitan', 'Pembebasan'],
      reversed: ['Menghindari Bencana', 'Takut Berubah', 'Menunda Kehancuran']
    },
    meaning: {
      upright: 'Melambangkan guncangan mendadak dan runtuhnya struktur lama. Meskipun menyakitkan, ini membuka jalan untuk pembangunan ulang.',
      reversed: 'Mungkin menghindari perubahan yang diperlukan atau bencana hanya ditunda. Perlu menghadapi kenyataan.'
    }
  },
  {
    id: 'major-17',
    name: 'The Star',
    nameCn: 'The Star',
    type: 'major',
    number: 17,
    image: '/cards/major/17-star.jpg',
    keywords: {
      upright: ['Harapan', 'Inspirasi', 'Ketenangan', 'Pembaruan', 'Kepercayaan Diri'],
      reversed: ['Keputusasaan', 'Kehilangan Kepercayaan', 'Kehilangan Koneksi', 'Pesimisme']
    },
    meaning: {
      upright: 'Melambangkan harapan, inspirasi, dan ketenangan batin. Setelah badai berlalu, kedamaian dan penyembuhan akan segera tiba.',
      reversed: 'Mungkin merasa putus asa atau kehilangan kepercayaan. Perlu terhubung kembali dengan harapan dan inspirasi.'
    }
  },
  {
    id: 'major-18',
    name: 'The Moon',
    nameCn: 'The Moon',
    type: 'major',
    number: 18,
    image: '/cards/major/18-moon.jpg',
    keywords: {
      upright: ['Ilusi', 'Ketakutan', 'Bawah Sadar', 'Intuisi', 'Ketidakpastian'],
      reversed: ['Melepas Ketakutan', 'Kebenaran Terungkap', 'Kebingungan Hilang']
    },
    meaning: {
      upright: 'Melambangkan ilusi, ketakutan, dan bawah sadar. Hal-hal mungkin tidak seperti yang terlihat di permukaan — percayai intuisimu.',
      reversed: 'Ketakutan sedang mereda dan kebenaran akan segera terungkap. Masa kebingungan akan segera berakhir.'
    }
  },
  {
    id: 'major-19',
    name: 'The Sun',
    nameCn: 'The Sun',
    type: 'major',
    number: 19,
    image: '/cards/major/19-sun.jpg',
    keywords: {
      upright: ['Kebahagiaan', 'Kesuksesan', 'Vitalitas', 'Optimisme', 'Kebenaran'],
      reversed: ['Kemunduran Sementara', 'Terlalu Optimis', 'Kesuksesan Tertunda']
    },
    meaning: {
      upright: 'Melambangkan kebahagiaan, kesuksesan, dan energi positif. Salah satu kartu paling menguntungkan — pertanda masa-masa indah.',
      reversed: 'Kesuksesan mungkin sedikit tertunda, tapi pasti akan datang. Tetap optimis namun realistis.'
    }
  },
  {
    id: 'major-20',
    name: 'Judgement',
    nameCn: 'Judgement',
    type: 'major',
    number: 20,
    image: '/cards/major/20-judgement.jpg',
    keywords: {
      upright: ['Kebangkitan', 'Kelahiran Baru', 'Panggilan', 'Refleksi', 'Pengampunan'],
      reversed: ['Keraguan Diri', 'Menolak Panggilan', 'Tidak Bisa Memaafkan']
    },
    meaning: {
      upright: 'Melambangkan kebangkitan, kelahiran kembali, dan menjawab panggilan yang lebih tinggi. Saatnya merenungkan masa lalu dan menyambut kehidupan baru.',
      reversed: 'Mungkin mengabaikan panggilan batin atau tidak bisa memaafkan diri sendiri/orang lain. Perlu melepaskan masa lalu.'
    }
  },
  {
    id: 'major-21',
    name: 'The World',
    nameCn: 'The World',
    type: 'major',
    number: 21,
    image: '/cards/major/21-world.jpg',
    keywords: {
      upright: ['Penyelesaian', 'Integrasi', 'Pencapaian', 'Akhir Perjalanan', 'Kesempurnaan'],
      reversed: ['Belum Selesai', 'Tidak Ada Penyelesaian', 'Tertunda', 'Kekosongan']
    },
    meaning: {
      upright: 'Melambangkan penyelesaian, pencapaian, dan akhir yang sempurna dari sebuah siklus. Kamu telah menyelesaikan perjalanan hidup yang penting.',
      reversed: 'Mungkin ada urusan yang belum selesai atau merasa kurang berprestasi. Perlu menyelesaikan siklus yang sedang berjalan.'
    }
  }
];

// å°é¿å¡çº³çæå½æ°
function createMinorArcana(suit: Suit, suitNameCn: string): TarotCard[] {
  const courtCards = [
    { num: 11, name: 'Page', nameCn: 'Page' },
    { num: 12, name: 'Knight', nameCn: 'Knight' },
    { num: 13, name: 'Queen', nameCn: 'Queen' },
    { num: 14, name: 'King', nameCn: 'King' }
  ];

  // å°é¿å¡çº³å³é®è¯ä¸æ­£éä½è¡¨è¿°ï¼æè±è²ç¬ç«å®å¶ï¼åºäºæ åä¼ç¹å¡ç½çä¹ï¼
  const minorKeywords: Record<Suit, Record<number, { upright: string[]; reversed: string[] }>> = {
    wands: {
  1: { upright: ['Kreasi', 'Inspirasi', 'Tindakan Baru', 'Antusias', 'Potensi'], reversed: ['Tertunda', 'Kurang Semangat', 'Frustrasi'] },
      2: { upright: ['Perencanaan', 'Keputusan', 'Visi', 'Pilihan'], reversed: ['Keragu-raguan', 'Takut Berubah', 'Konservatif'] },
      3: { upright: ['Ekspansi', 'Pandangan Jauh', 'Kemajuan', 'Kerja Sama'], reversed: ['Hambatan', 'Tertunda', 'Kemunduran'] },
      4: { upright: ['Stabilitas', 'Rumah', 'Perayaan', 'Harmoni'], reversed: ['Tidak Stabil', 'Kurang Dukungan', 'Sementara'] },
  5: { upright: ['Persaingan', 'Konflik', 'Adu Kekuatan', 'Tantangan'], reversed: ['Menghindari Konflik', 'Harmoni', 'Menghormati'] },
      6: { upright: ['Kemenangan', 'Kesuksesan', 'Pengakuan', 'Kemajuan'], reversed: ['Kesombongan', 'Tidak Diakui', 'Kegagalan'] },
      7: { upright: ['Ketekunan', 'Pertahanan', 'Keberanian', 'Pendirian'], reversed: ['Menyerah', 'Kelelahan Total', 'Kewalahan'] },
      8: { upright: ['Tindakan Cepat', 'Kecepatan', 'Kemajuan', 'Pesan'], reversed: ['Tertunda', 'Kepanikan', 'Melambat'] },
      9: { upright: ['Ketangguhan', 'Kewaspadaan', 'Ketahanan', 'Penjagaan'], reversed: ['Kelelahan', 'Habis Tenaga', 'Goyah'] },
      10: { upright: ['Beban', 'Tanggung Jawab', 'Tekanan', 'Penyelesaian'], reversed: ['Keruntuhan', 'Tidak Bisa Mendelegasikan', 'Kehabisan Tenaga'] },
      11: { upright: ['Penjelajahan', 'Kegembiraan', 'Kebebasan', 'Pesan'], reversed: ['Tanpa Arah', 'Penundaan', 'Konflik'] },
      12: { upright: ['Tindakan', 'Petualangan', 'Antusias', 'Impulsif'], reversed: ['Gegabah', 'Kemarahan', 'Ketidakstabilan'] },
      13: { upright: ['Antusias', 'Kepercayaan Diri', 'Pesona', 'Independen'], reversed: ['Keegoisan', 'Kecemburuan', 'Ketidakamanan'] },
      14: { upright: ['Kepemimpinan', 'Visi', 'Antusias', 'Ketegasan'], reversed: ['Otoriter', 'Impulsif', 'Tidak Realistis'] }
    },
    cups: {
      1: { upright: ['Perasaan Baru', 'Cinta', 'Intuisi', 'Spiritualitas', 'Empati'], reversed: ['Hambatan Emosional', 'Kekosongan', 'Kehilangan'] },
      2: { upright: ['Penyatuan', 'Pasangan', 'Harmoni', 'Ketertarikan'], reversed: ['Ketidakseimbangan', 'Pemisahan', 'Ketegangan'] },
      3: { upright: ['Persahabatan', 'Perayaan', 'Komunitas', 'Kegembiraan'], reversed: ['Berlebihan', 'Gosip', 'Terisolasi'] },
      4: { upright: ['Ketidakpedulian', 'Kontemplasi', 'Ketidakpuasan', 'Penilaian'], reversed: ['Kebangkitan', 'Kesempatan Baru', 'Penerimaan'] },
  5: { upright: ['Kehilangan', 'Kesedihan', 'Penyesalan', 'Kekecewaan'], reversed: ['Penerimaan', 'Rekonsiliasi', 'Melangkah Maju'] },
      6: { upright: ['Nostalgia', 'Kemurnian', 'Kenangan', 'Hadiah'], reversed: ['Melangkah Maju', 'Meninggalkan Masa Lalu', 'Independen'] },
      7: { upright: ['Khayalan', 'Pilihan', 'Mimpi', 'Godaan'], reversed: ['Kekacauan', 'Tanpa Arah', 'Kenyataan'] },
      8: { upright: ['Kepergian', 'Menyerah', 'Mencari', 'Kekecewaan'], reversed: ['Pelarian', 'Takut Berubah', 'Stagnasi'] },
      9: { upright: ['Kepuasan', 'Keinginan', 'Kelimpahan', 'Kemewahan'], reversed: ['Keserakahan', 'Tidak Puas', 'Hampa'] },
      10: { upright: ['Kesempurnaan', 'Kebahagiaan', 'Kepuasan Emosional', 'Harmoni'], reversed: ['Retak', 'Ketidakselarasan', 'Kekecewaan'] },
      11: { upright: ['Kepekaan', 'Intuisi', 'Kejutan', 'Pesan'], reversed: ['Tidak Matang', 'Emosional', 'Ketidakamanan'] },
      12: { upright: ['Romantis', 'Mengikuti Hati', 'Idealisme', 'Usulan'], reversed: ['Emosional', 'Kekecewaan', 'Mudah Berubah'] },
  13: { upright: ['Empati', 'Perhatian', 'Intuisi', 'Kedewasaan'], reversed: ['Ketergantungan', 'Emosional', 'Terlalu Sensitif'] },
  14: { upright: ['Pengendalian Emosi', 'Empati', 'Keseimbangan', 'Kebijaksanaan'], reversed: ['Ketidakpedulian', 'Manipulasi', 'Dingin'] },
    },
    swords: {
      1: { upright: ['Terobosan', 'Kejernihan', 'Kebenaran', 'Tekad Bulat', 'Ide Baru'], reversed: ['Kekacauan', 'Kejam', 'Kebingungan'] },
  2: { upright: ['Kebuntuan', 'Pilihan Sulit', 'Keseimbangan', 'Ketidakpastian'], reversed: ['Pelarian', 'Informasi Kurang', 'Rekonsiliasi'] },
      3: { upright: ['Patah Hati', 'Kesedihan', 'Pemisahan', 'Penderitaan', 'Pengkhianatan'], reversed: ['Penyembuhan', 'Pengampunan', 'Pemulihan', 'Penerimaan'] },
      4: { upright: ['Istirahat', 'Pemulihan', 'Kontemplasi', 'Penyembuhan'], reversed: ['Gelisah', 'Kelelahan', 'Tekanan'] },
  5: { upright: ['Konflik', 'Kekalahan', 'Strategi', 'Keegoisan'], reversed: ['Penyesalan', 'Rekonsiliasi', 'Pengampunan'] },
      6: { upright: ['Transisi', 'Meninggalkan', 'Penyembuhan', 'Melangkah Maju'], reversed: ['Stagnasi', 'Beban Masa Lalu', 'Penolakan'] },
      7: { upright: ['Penipuan', 'Strategi', 'Pelarian', 'Rahasia'], reversed: ['Jujur', 'Terungkap', 'Bertobat'] },
      8: { upright: ['Belenggu', 'Membatasi Diri', 'Ketakutan', 'Menjadi Korban'], reversed: ['Pembebasan', 'Perspektif Baru', 'Kebebasan'] },
      9: { upright: ['Kecemasan', 'Mimpi Buruk', 'Keputusasaan', 'Kekhawatiran', 'Trauma'], reversed: ['Harapan', 'Mencari Bantuan', 'Pemulihan'] },
      10: { upright: ['Pengakhiran', 'Kegagalan', 'Pengkhianatan', 'Keruntuhan'], reversed: ['Pemulihan', 'Bangkit Kembali', 'Mengakhiri Penderitaan'] },
      11: { upright: ['Keingintahuan', 'Kewaspadaan', 'Kebenaran', 'Pembelajaran'], reversed: ['Gosip', 'Penipuan', 'Tidak Matang'] },
      12: { upright: ['Ketegasan', 'Ambisi', 'Konflik', 'Ketidaksabaran'], reversed: ['Gegabah', 'Tanpa Arah', 'Agresif'] },
      13: { upright: ['Kejernihan', 'Independen', 'Kejujuran', 'Batasan', 'Kebijaksanaan'], reversed: ['Tidak Berperasaan', 'Kejam', 'Dendam', 'Kepahitan'] },
      14: { upright: ['Kebenaran', 'Otoritas', 'Logika', 'Keadilan'], reversed: ['Otoriter', 'Kejam', 'Penyalahgunaan', 'Manipulasi'] }
    },
    pentacles: {
      1: { upright: ['Kesempatan Baru', 'Kemakmuran', 'Awal Materi', 'Kelimpahan'], reversed: ['Melewatkan Peluang', 'Investasi Buruk', 'Tertunda'] },
      2: { upright: ['Keseimbangan', 'Adaptasi', 'Prioritas', 'Multi-tugas'], reversed: ['Ketidakseimbangan', 'Kekacauan', 'Berlebihan'] },
      3: { upright: ['Kerja Sama', 'Tim', 'Kemampuan', 'Membangun'], reversed: ['Kurang Kerja Sama', 'Pekerjaan Buruk', 'Konflik'] },
      4: { upright: ['Stabilitas', 'Konservatif', 'Keamanan', 'Tabungan'], reversed: ['Keserakahan', 'Pelit', 'Keras Kepala'] },
      5: { upright: ['Kemiskinan', 'Kesulitan', 'Kehilangan', 'Ketidakamanan'], reversed: ['Pemulihan', 'Bantuan', 'Perbaikan'] },
      6: { upright: ['Kemurahan Hati', 'Berbagi', 'Kedermawanan', 'Imbalan'], reversed: ['Syarat', 'Keegoisan', 'Utang'] },
      7: { upright: ['Penilaian', 'Kesabaran', 'Investasi Jangka Panjang', 'Panen'], reversed: ['Tidak Sabar', 'Hasil Buruk', 'Pemborosan'] },
      8: { upright: ['Ketekunan', 'Magang', 'Penyempurnaan', 'Keahlian'], reversed: ['Kurang Semangat', 'Kasar', 'Tanpa Motivasi'] },
      9: { upright: ['Independen', 'Kemakmuran', 'Kemewahan', 'Kepuasan Diri'], reversed: ['Masalah Keuangan', 'Terisolasi', 'Terlalu Melindungi'] },
      10: { upright: ['Kekayaan', 'Warisan', 'Stabilitas Keluarga', 'Tradisi'], reversed: ['Ketidakstabilan', 'Kerugian', 'Masalah Keluarga'] },
      11: { upright: ['Pembelajaran', 'Peluang', 'Rajin', 'Praktis'], reversed: ['Kemalasan', 'Kurang Komitmen', 'Keserakahan'] },
      12: { upright: ['Dapat Diandalkan', 'Ketekunan', 'Tanggung Jawab', 'Kemajuan Lambat'], reversed: ['Kemalasan', 'Stagnasi', 'Keras Kepala'] },
      13: { upright: ['Praktis', 'Kelimpahan', 'Merawat', 'Pragmatis'], reversed: ['Keegoisan', 'Kecemburuan', 'Materialisme'] },
      14: { upright: ['Kemakmuran', 'Kesuksesan', 'Dapat Diandalkan', 'Kecerdasan Bisnis'], reversed: ['Keserakahan', 'Keras Kepala', 'Korupsi'] }
    }
  };

  // å°é¿å¡çº³æ­£éä½å®æ´è¡¨è¿°ï¼ä¸å³é®è¯å¹éï¼æä¾æ´èªç¶ãè§£éæ§çæè¿°ï¼
  const minorMeanings: Record<Suit, Record<number, { upright: string; reversed: string }>> = {
    wands: {
  1: { upright: 'Percikan kreasi menyala, saatnya mewujudkan ide dengan berani dan merintis jalanmu.', reversed: 'Kreativitas atau semangat terhambat sementara. Tindakan tertunda, perlu menemukan kembali motivasi.' },
      2: { upright: 'Perencanaan masa depan dan pilihan kunci di persimpangan hidup — butuh keputusan berwawasan.', reversed: 'Takut berubah atau rencana kurang matang. Mungkin terjebak di zona nyaman.' },
  3: { upright: 'Visi meluas dan karier berkembang stabil. Kerja keras mulai menunjukkan hasil, kolaborasi membuka lebih banyak peluang.', reversed: 'Kemajuan terhambat atau tertunda. Butuh kesabaran dan penyesuaian strategi.' },
  4: { upright: 'Rumah, rasa memiliki, dan momen stabilitas yang layak dirayakan. Nikmati harmoni yang telah diperjuangkan.', reversed: 'Rasa stabil mulai retak atau kurang dukungan. Jangan terlalu bergantung pada pengakuan orang lain.' },
  5: { upright: 'Persaingan dan konflik sebagai jalan untuk tumbuh. Dengan tetap fokus, kamu bisa keluar sebagai pemenang.', reversed: 'Menghindari konflik perlu atau energi terpecah. Belajar menghormati perbedaan dan ubah persaingan menjadi kolaborasi.' },
  6: { upright: 'Kemenangan publik dan kesuksesan yang diakui. Usahamu berbuah hasil — nikmati kejayaan ini dengan rendah hati.', reversed: 'Kemenangan tidak terlihat atau kesombongan menimbulkan masalah. Evaluasi posisimu.' },
  7: { upright: 'Teguh pada pendirian dan keberanian mempertahankan hasil susah payah — kamu sudah dekat.', reversed: 'Merasa kelelahan atau kepercayaan goyah. Minta bantuan jika diperlukan.' },
  8: { upright: 'Tindakan cepat dan perkembangan pesat. Kabar atau peluang datang mendadak — ambil dengan tegas.', reversed: 'Tindakan terhambat atau kacau karena terlalu terburu-buru. Perlu perlambat ritme.' },
  9: { upright: 'Ketangguhan tahan lama dan kewaspadaan terakhir. Kamu sudah melalui banyak ujian — tetap jaga pencapaianmu.', reversed: 'Kelelahan fisik dan mental. Kenali kapan harus beristirahat.' },
  10: { upright: 'Tanggung jawab berat dan penyelesaian yang hampir tiba. Jangan biarkan tekanan menghancurkanmu — bagi beban.', reversed: 'Beban sudah di batas maksimal. Harus belajar mendelegasikan, atau akan kehabisan energi.' },
  11: { upright: 'Semangat muda dalam menjelajahi hasrat. Api kreatif baru muncul — jaga rasa ingin tahu dan keterbukaan.', reversed: 'Kurang arah atau terus menunda. Kegembiraan bisa berubah menjadi konflik tanpa rencana.' },
  12: { upright: 'Semangat penuh dalam aksi berani bergaya kesatria. Kejar tujuan dengan tekad — kendalikan impuls dan arah.', reversed: 'Bertindak gegabah atau semangat sulit dipertahankan. Kemarahan bisa merusak kemajuan.' },
  13: { upright: 'Antusiasme, kepercayaan diri, dan kepemimpinan penuh pesona. Bersinar dan ilhami orang lain dengan kehangatan.', reversed: 'Keegoan atau kecemburuan mulai muncul. Terlalu fokus pada diri bisa merusak hubungan.' },
  14: { upright: 'Visi luas dan kepemimpinan tegas penuh semangat. Mampu melihat gambaran besar dan menginspirasi orang sekitar.', reversed: 'Otoriter atau keputusan impulsif. Semangat berlebihan bisa menjadi kontrol yang menekan.' },
    },
    cups: {
  1: { upright: 'Kebangkitan emosi dan pembukaan hati. Cinta baru, inspirasi, atau koneksi mendalam sedang datang — buka hatimu.', reversed: 'Energi emosional terhambat atau hati terasa kosong. Mungkin melewatkan aliran perasaan.' },
  2: { upright: 'Penyatuan jiwa dan terbangunnya hubungan mendalam. Dua hati saling tertarik dan mencerminkan — harmoni dan saling memahami.', reversed: 'Hubungan tidak seimbang atau komunikasi terputus. Koneksi mulai merenggang.' },
  3: { upright: 'Persahabatan, perayaan, dan kelimpahan emosional. Ada orang-orang yang layak berbagi kebahagiaan bersamamu.', reversed: 'Berlebihan atau muncul gosip. Kegembiraan bisa berubah menjadi isolasi.' },
  4: { upright: 'Kontemplasi dan evaluasi ulang kondisi emosi saat ini. Mungkin merasa ada kekosongan — cari ke dalam apa yang benar-benar diinginkan.', reversed: 'Bangkit dari kebas atau melihat peluang yang dulu ditolak.' },
  5: { upright: 'Kehilangan, kesedihan, dan penyesalan akan masa lalu. Fokus pada yang hilang bukan yang masih tersisa.', reversed: 'Mulai menerima kenyataan dan bersedia melangkah maju. Kamu sudah siap untuk rekonsiliasi.' },
  6: { upright: 'Kenangan masa kecil yang murni dan hadiah emosional dari masa lalu. Ingatan indah memberi penghiburan dan penyembuhan.', reversed: 'Terjebak di masa lalu atau tidak mau tumbuh. Perlu melepaskan dependensi pada keamanan lama.' },
  7: { upright: 'Banyak pilihan, khayalan, dan kerinduan batin. Ilusi dan realita bercampur — perlu membedakan mana yang layak dikejar.', reversed: 'Khayalan runtuh atau terlalu banyak opsi. Kembali ke kenyataan dan buat pilihan yang bertanggung jawab.' },
  8: { upright: 'Secara aktif meninggalkan lingkungan emosi yang sudah tidak memuaskan demi mencari makna lebih dalam.', reversed: 'Takut berubah atau menghindari kepergian yang perlu. Bertahan di hubungan tidak sehat hanya memperpanjang penderitaan.' },
  9: { upright: 'Terwujudnya keinginan emosional dan kepuasan batin. Sembilan cawan melambangkan kelimpahan yang sudah atau akan kamu miliki.', reversed: 'Kaya di luar tapi hampa di dalam. Keserakahan atau kekecewaan pada kepuasan semu.' },
  10: { upright: 'Kesempurnaan emosional dan harmoni tertinggi dalam keluarga atau hubungan. Impian terwujud — cinta dan rasa memiliki mengelilingimu.', reversed: 'Keretakan dalam hubungan intim atau keluarga. Perlu menghadapi kenyataan dan memperbaiki atau menerima perubahan.' },
  11: { upright: 'Kepekaan emosional dan hadiah intuisi. Hati muda membawa kejutan dan pesan murni — tetaplah lembut.', reversed: 'Emosi tidak matang atau terlalu bergantung pada orang lain. Perlu mengembangkan stabilitas emosi dari dalam.' },
  12: { upright: 'Mengikuti hati dan idealisme romantis sang kesatria. Bertindak dengan kelembutan dan imajinasi demi koneksi emosional bermakna.', reversed: 'Emosi tidak menentu atau kecewa setelah idealisme runtuh. Perlu lebih membumi.' },
  13: { upright: 'Kebijaksanaan emosi yang matang dan empati mendalam. Mampu menanggung emosi orang lain dengan tenang sambil menjaga batasan yang jelas.', reversed: 'Terlalu sensitif atau bergantung secara emosional. Perlu belajar melindungi dan memelihara diri sendiri.' },
  14: { upright: 'Pengendalian emosi yang matang dan kebijaksanaan seimbang. Menemukan jalan tengah antara cinta dan rasionalitas, mempengaruhi orang sekitar dengan kasih dan stabilitas.', reversed: 'Emosi ditekan atau disembunyikan di balik kedinginan. Mungkin memanipulasi atau menghindari keintiman.' },
    },
    swords: {
  1: { upright: 'Terobosan pikiran dan pedang kebenaran. Kejernihan memotong kabut — saatnya menghadapi kenyataan dengan tekad dan kejujuran.', reversed: 'Pikiran kacau atau kebenaran terdistorsi. Kata-kata kejam atau kebingungan batin sedang menimbulkan kerugian.' },
  2: { upright: 'Pilihan sulit dan kebuntuan sementara. Seperti wanita bermata tertutup memegang dua pedang — keseimbangan yang tidak alami.', reversed: 'Menghindari keputusan atau menerima solusi yang kurang optimal. Informasi tidak cukup memperburuk kebingungan.' },
  3: { upright: 'Patah hati, pengkhianatan, dan kepedihan perpisahan yang tajam. Tiga pedang menembus hati — kebenaran itu menyakitkan tapi perlu.', reversed: 'Perlahan-lahan pulih. Memaafkan diri dan orang lain menjadi mungkin — luka masih ada tapi pemulihan dimulai.' },
  4: { upright: 'Istirahat, pemulihan, dan mundur sementara. Saatnya menyembuhkan diri dan merenung.', reversed: 'Tidak bisa benar-benar beristirahat atau tekanan terus menguras. Kelelahan menumpuk — paksa diri berhenti.' },
  5: { upright: 'Kemenangan dengan cara yang meragukan dan kekosongan yang mengikutinya. Menang pertempuran tapi kehilangan rasa hormat dan ketenangan batin.', reversed: 'Penyesalan atas perilaku masa lalu dan keinginan untuk rekonsiliasi. Mengakui kesalahan adalah langkah pertama.' },
  6: { upright: 'Transisi dari kepedihan dan meninggalkan tempat yang menyakitkan. Enam pedang membawa perjalanan penyembuhan ke depan.', reversed: 'Menolak pergi yang perlu atau membawa beban lama. Tidak bisa melepaskan masa lalu mempersulit transisi.' },
  7: { upright: 'Strategi, penipuan, dan tindakan sembunyi-sembunyi. Mungkin menghindari tanggung jawab atau ada yang menggunakan tipu muslihat padamu.', reversed: 'Rahasia terungkap atau memilih untuk jujur. Harga penipuan terlihat — saatnya menghadapi diri sendiri dengan jujur.' },
  8: { upright: 'Membatasi diri sendiri dan jiwa yang terkungkung ketakutan. Dikelilingi pedang — tapi sebenarnya bebas untuk pergi.', reversed: 'Terbebas dari belenggu yang dibuat sendiri. Perspektif baru muncul — kamu selalu punya pilihan.' },
  9: { upright: 'Kecemasan ekstrem, mimpi buruk, dan penyiksaan mental. Ketakutan mencapai puncaknya di malam hari.', reversed: 'Perlahan keluar dari jurang keputusasaan. Bersedia mencari bantuan atau melihat secercah harapan.' },
  10: { upright: 'Kegagalan total, pengkhianatan, dan akhir di titik terendah. Pola lama harus benar-benar mati agar yang baru bisa lahir.', reversed: 'Situasi terburuk sudah berlalu. Satu-satunya arah adalah ke atas — pemulihan dan awal baru sedang datang.' },
  11: { upright: 'Keingintahuan tajam dan jiwa muda yang memburu kebenaran. Selalu siap belajar dan mengungkap.', reversed: 'Gosip, menyebarkan informasi negatif, atau kata-kata tidak bertanggung jawab sedang menciptakan konflik.' },
  12: { upright: 'Serangan pemikiran yang tegas dan semangat kesatria berjuang demi keyakinan. Cepat, tapi mudah mengabaikan perasaan orang lain.', reversed: 'Pernyataan atau tindakan gegabah menimbulkan kerugian. Serangan tanpa arah membuat situasi makin kacau.' },
  13: { upright: 'Pikiran jernih, kejujuran, dan kebijaksanaan melindungi diri. Sang Ratu memegang pedang — menetapkan batasan dengan tenang.', reversed: 'Tidak berperasaan atau menjadi kejam akibat luka masa lalu. Kepahitan dan dendam meracuni hatimu.' },
  14: { upright: 'Otoritas yang menghakimi dengan kebenaran dan logika. Pedang Raja menunjuk ke langit — puncak pikiran yang tertinggi.', reversed: 'Penyalahgunaan kekuasaan atau menggunakan rasionalitas sebagai alasan manipulasi. Penghakiman kejam menyakiti semua.' },
    },
    pentacles: {
  1: { upright: 'Peluang materi dan benih kelimpahan yang jatuh ke tanah. Kemungkinan nyata baru sedang terbuka.', reversed: 'Peluang terlewat atau penundaan keuangan. Investasi buruk atau keraguan di awal — evaluasi kondisi nyata.' },
  2: { upright: 'Menjaga keseimbangan dan fleksibilitas di tengah perubahan. Menunjukkan kemampuan beradaptasi di bawah berbagai tanggung jawab.', reversed: 'Ketidakseimbangan dan beban berlebih. Segalanya kacau — perlu meletakkan beberapa tugas dan memprioritaskan ulang.' },
  3: { upright: 'Kerja sama tim dan pameran keahlian profesional. Tiga pengrajin membangun bersama — kolaborasi menghasilkan kualitas tinggi.', reversed: 'Kurang kerja sama nyata atau kualitas rendah. Ada konflik tim atau setengah-setengah — selaraskan tujuan kembali.' },
  4: { upright: 'Penjagaan konservatif keamanan materi dan fondasi yang solid. Raja menggenggam koin — menikmati stabilitas yang dimiliki saat ini.', reversed: 'Keserakahan, pelit, atau terlalu takut kehilangan. Keras kepala memegang sesuatu justru menghambat pertumbuhan.' },
  5: { upright: 'Kekurangan materi, kesulitan, dan perasaan terlupakan. Dua orang miskin melewati gereja dalam salju tanpa bantuan.', reversed: 'Perlahan pulih dari kesulitan. Mendapat bantuan atau situasi mulai membaik — penting untuk bersedia menerima dukungan.' },
  6: { upright: 'Kemurahan hati dalam memberi dan pertukaran yang adil. Seseorang memberikan koin, yang lain merespons dengan hormat — mencerminkan timbal balik.', reversed: 'Memberi dengan syarat atau ketidaksetaraan kekuasaan. Derma berubah menjadi kontrol.' },
  7: { upright: 'Menunggu dengan sabar dan menuai dari investasi jangka panjang. Petani memandang tujuh koin yang tumbuh — mengevaluasi kemajuan.', reversed: 'Kurang sabar atau usaha tidak memberikan hasil yang diharapkan. Mungkin terganggu atau waktunya tidak tepat.' },
  8: { upright: 'Keahlian yang terfokus dan penyempurnaan melalui latihan berulang. Pengrajin mengukir delapan koin — menikmati keahlian itu sendiri.', reversed: 'Kehilangan semangat dalam bekerja atau asal-asalan. Kurang motivasi menurunkan kualitas — perlu menemukan kembali kecintaan awal.' },
  9: { upright: 'Kemandirian dan kepuasan diri secara materi. Wanita di taman menikmati sembilan koin — merayakan kelimpahan dalam kesendirian.', reversed: 'Keuangan tidak bijaksana atau isolasi karena terlalu protektif. Kesuksesan permukaan tidak bisa memberi rasa aman sejati.' },
  10: { upright: 'Kekayaan keluarga, tradisi, dan stabilitas materi jangka panjang. Sepuluh koin membentuk lambang keluarga — melambangkan warisan dan rasa memiliki.', reversed: 'Ketidakstabilan keluarga atau fondasi materi. Sengketa warisan atau kebingungan tentang makna sukses.' },
  11: { upright: 'Belajar keterampilan nyata dan dengan tekun memanfaatkan peluang. Sang halaman muda fokus meneliti koin — penuh potensi.', reversed: 'Malas atau kurang komitmen untuk belajar. Terlalu mencari kenyamanan tanpa mau berusaha — akan melewatkan pertumbuhan.' },
  12: { upright: 'Dapat diandalkan, rajin, dan kemajuan yang lambat tapi mantap. Kuda sang kesatria berjalan pelan tapi arahnya teguh dan bertanggung jawab.', reversed: 'Malas, stagnan, atau terlalu kaku pada detail. Kurang fleksibilitas membuat segala sesuatu tidak bisa bergerak maju.' },
  13: { upright: 'Kelimpahan praktis dan kemampuan merawat orang lain. Sang Ratu duduk di taman dengan kelinci di kakinya — melambangkan pengasuhan nyata.', reversed: 'Egois atau terlalu melekat pada materi. Kecemburuan dan rasa memiliki merusak kehangatan interpersonal.' },
  14: { upright: 'Kesuksesan materi, keandalan, dan kecerdasan bisnis. Raja bersila di singgasana memegang koin dan tongkat — menguasai kelimpahan.', reversed: 'Keserakahan, keras kepala, atau materialisme yang korup. Uang menjadi tujuan bukan alat — mengikis nilai batin.' },
    }
  };

  const cards: TarotCard[] = [];

  for (let i = 1; i <= 14; i++) {
    const isCourtCard = i >= 11;
    const courtCard = courtCards.find(c => c.num === i);

    let name: string;
    let nameCn: string;

    if (i === 1) {
      name = `Ace of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
      nameCn = `Ace of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
    } else if (isCourtCard && courtCard) {
      name = `${courtCard.name} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
      nameCn = `${courtCard.name} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
    } else {
      const numerals = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
      name = `${i} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
      nameCn = `${numerals[i] ?? i} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
    }

    const kws = minorKeywords[suit][i];
    const m = minorMeanings[suit][i];
    cards.push({
      id: `${suit}-${i.toString().padStart(2, '0')}`,
      name,
      nameCn,
      type: 'minor',
      suit,
      number: i,
      image: `/cards/minor/${suit}/${i.toString().padStart(2, '0')}.jpg`,
      keywords: kws,
      meaning: m
    });
  }

  return cards;
}

// çæææå°é¿å¡çº³
const wands = createMinorArcana('wands', 'Tongkat');
const cups = createMinorArcana('cups', 'Cawan');
const swords = createMinorArcana('swords', 'Pedang');
const pentacles = createMinorArcana('pentacles', 'Koin');

// å¯¼åºå®æ´ç78å¼ ç
export const allCards: TarotCard[] = [
  ...majorArcana,
  ...wands,
  ...cups,
  ...swords,
  ...pentacles
];

export const majorArcanaCards = majorArcana;
export const minorArcanaCards = [...wands, ...cups, ...swords, ...pentacles];

// æè±è²è·åç
export function getCardsBySuit(suit: Suit): TarotCard[] {
  return allCards.filter(card => card.suit === suit);
}

// è·åå¤§é¿å¡çº³
export function getMajorArcana(): TarotCard[] {
  return majorArcana;
}

// éæºæ½ç
export function drawRandomCards(count: number): TarotCard[] {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}