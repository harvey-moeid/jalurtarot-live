/**
 * Enriched card meanings dari Tina Gong "Tarot" (DK Publishing, 2020)
 * Diparafrase ke Bahasa Indonesia untuk keperluan interpretasi
 * Key: card ID (e.g. 'major-00', 'wands-01')
 */

export interface EnrichedMeaning {
  uprightDeep: string;    // Interpretasi mendalam normal
  reversedDeep: string;   // Interpretasi mendalam terbalik
  reflection: string;     // Pertanyaan refleksi
  action: string;         // Saran tindakan
}

export const enrichedMeanings: Record<string, EnrichedMeaning> = {

  // ── Major Arcana ──────────────────────────────────────────

  'major-00': { // The Fool
    uprightDeep: 'Sang Bodoh mewakili potensi tak terbatas yang ada dalam diri kita. Ia adalah sumber energi murni — innocent dan bebas, seperti kanvas kosong yang siap dibentuk melalui perjalanan mengenal diri. Ia melemparkan hatinya ke petualangan tanpa rasa takut. Kartu ini bisa menandai dimulainya jalan baru yang penuh risiko sekaligus hadiah besar.',
    reversedDeep: 'Dalam posisi terbalik, antusiasme Sang Bodoh bisa menjadi gegabah dan terburu-buru. Ia mungkin tak melihat bagaimana langkah-langkahnya mempengaruhi orang lain, atau justru sebaliknya — ia dihantui keraguan dan ketakutan sehingga tak berani melangkah sama sekali.',
    reflection: 'Apa yang akan kamu lakukan jika tidak ada yang menghalangi? Apakah kamu begitu bersemangat sehingga tidak melihat gambaran besarnya? Atau justru rasa takut yang menahan langkahmu?',
    action: 'Sentuh rasa ingin tahu dan petualanganmu. Hadapi apa yang membuatmu takut — ketika kita tidak menghadapi ketakutan, ia tetap tersembunyi dalam gelap dan terus tumbuh. Dengan meneranginya, kamu mungkin menemukan bahwa ia tidak sebesar yang kamu bayangkan.',
  },

  'major-01': { // The Magician
    uprightDeep: 'Sang Pesulap menyadari bahwa ia punya kendali penuh atas arah hidupnya — bahwa perjalanannya bisa bergeser sesuai kehendaknya. Ia adalah perwujudan kemauan, pilihan, dan hasrat. Ia adalah kunci semua keajaiban dan pengingat bahwa niat serta perspektif bisa menjadi alat ampuh untuk mewujudkan hasil nyata.',
    reversedDeep: 'Sang Pesulap mungkin menggunakan kekuatannya untuk tujuan yang tidak murni — merangkai ilusi, trik, dan tipu daya demi keuntungan sendiri. Ambisi yang sehat bisa berubah jadi manipulasi. Di sisi lain, ketidakhadiran kekuatan Sang Pesulap bisa menandai kurangnya kejelasan dan fokus.',
    reflection: 'Ketika kamu melihat ke dalam dan mengakui kekuatanmu, kamu akan belajar bahwa menciptakan takdirmu sendiri bukan hanya mungkin, tapi merupakan tanggung jawabmu. Apa yang bisa kamu lakukan sekarang untuk menggerakkan tujuanmu?',
    action: 'Kenali kekuatanmu — tuliskan kekuatan alami dan kemampuan yang bisa membantumu mewujudkan visimu. Ingat kembali tujuanmu yang sesungguhnya agar kamu bisa kembali selaras dengan diri terbaikmu.',
  },

  'major-02': { // The High Priestess
    uprightDeep: 'Sang Pendeta Agung mewakili hubungan kita dengan dunia batin. Ia adalah intuisi dan kebijaksanaan ilahi kita. Ia adalah suara yang memanggil dari kedalaman, membawa pengetahuan tentang semua yang tersembunyi: sifat sejati kita, spiritualitas, dan diri kita. Tugasnya mengajari kita cara menerangi mimpi, fantasi, dan ketakutan dengan cahaya kesadaran.',
    reversedDeep: 'Ketika Sang Pendeta Agung terbalik, pesan yang ia sampaikan dari diri batinmu tidak diterima atau dipahami. Suaranya tenggelam oleh input eksternal: kecemasan, keinginan orang lain, overthinking, ekspektasi sosial, rasa bersalah, atau bahkan trauma masa lalu.',
    reflection: 'Jawaban yang kamu cari ada di dalam dirimu. Di antara kesibukan sehari-hari, ada inti yang damai dan tahu kebenaranmu. Apa yang intuisimu coba katakan? Apakah kamu merasa terputus dari dirimu sendiri?',
    action: 'Perhatikan momen ketika intuisimu berbicara — apa rasanya di tubuhmu? Jaga jurnal mimpi. Memahami pola dalam mimpi bisa menjadi titik awal untuk membangun koneksi yang lebih dalam dengan dirimu.',
  },

  'major-03': { // The Empress
    uprightDeep: 'Sang Permaisuri mewakili kelimpahan, kreativitas, dan pengasuhan. Ia terhubung dengan semua yang tumbuh dan berkembang — kesuburan dalam segala bentuknya. Ia mengingatkan kita untuk menghargai keindahan alam dan tubuh kita, serta untuk merawat diri kita dan orang-orang di sekitar kita dengan penuh kasih.',
    reversedDeep: 'Ketika Sang Permaisuri terbalik, kreativitas mungkin mengering atau kamu merasa bergantung terlalu besar pada orang lain. Sumber daya habis dikeluarkan untuk orang lain sementara dirimu sendiri terabaikan. Ini saatnya terhubung kembali dengan alam dan kekuatan batinmu.',
    reflection: 'Apa yang bisa kamu syukuri — angin sepoi yang menyentuh wajah, atau sinar matahari di pagi dingin? Apakah kamu merasa perlu merawat orang lain? Apakah kamu menghabiskan sumber dayamu untuk orang lain sementara kamu sendiri membutuhkan perhatian?',
    action: 'Nikmati semua indera. Mulai proyek kreatif. Manjakan dirimu dengan perawatan diri — ini bukan hal yang egois. Percayalah bahwa kamu punya semua yang dibutuhkan untuk berkembang.',
  },

  'major-04': { // The Emperor
    uprightDeep: 'Sang Kaisar adalah kemampuan kita untuk memberi struktur, mengorganisir, melindungi, dan menciptakan stabilitas. Ia melakukannya dengan membangun aturan dan sistem, menumbuhkan disiplin, menetapkan batasan, menghormati nilai-nilai, dan memimpin dengan otoritas. Ia juga sosok pelindung yang tidak takut konflik.',
    reversedDeep: 'Sang Kaisar yang terbalik bisa menjadi pemimpin yang tidak efektif atau tiran yang kejam. Ia mungkin lemah saat tanggung jawab nyata datang, tapi sedetik kemudian mengamuk karena hal sepele. Atau sebaliknya, ia menyalahgunakan otoritasnya dan menyakiti banyak orang.',
    reflection: 'Kamu mungkin dikelilingi kekacauan, tapi memanggil Kaisar dari dalam dirimu bisa membawa ketenangan. Bagaimana kamu bisa lebih tegas dan membela dirimu? Apakah ada kekuasaan yang disalahgunakan dalam hidupmu?',
    action: 'Ciptakan struktur dan proses — aturan dan metodologi membantu menyelesaikan sesuatu tanpa terbebani emosi. Katakan apa yang kamu maksud. Tetapkan batasan dan jagalah.',
  },

  'major-05': { // The Hierophant
    uprightDeep: 'Sang Hierophant adalah guru yang bijak dan dihormati. Ia menghubungkan langit dan bumi dan memahami bahwa dalam permainan kehidupan yang kompleks ini, segalanya memiliki perannya. Ia menghargai dan menjunjung struktur sosial yang menjaga segalanya dalam harmoni dan ketertiban.',
    reversedDeep: 'Ketika Hierophant terbalik, struktur hierarkis yang seharusnya menciptakan harmoni justru menjadi basi dan tidak efektif. Penerimaan buta terhadap status quo bisa berubah menjadi ketidakmampuan menerima perubahan. Mereka yang bertindak sebagai individu bisa dihakimi dan dipaksa kembali ke jalur.',
    reflection: 'Apa yang bisa kamu pelajari dari tradisi? Di mana kamu merasa diasingkan, tertekan, atau sendirian? Apakah visimu tentang yang kamu inginkan bertentangan dengan apa yang dianggap "normal"?',
    action: 'Cari mentor. Ikuti kelas. Hormati tradisi yang bermakna bagimu. Atau sebaliknya — jangan terima sesuatu hanya karena "sudah begitu adanya". Lepaskan dirimu dari dogma yang membatasi dan buat aturanmu sendiri.',
  },

  'major-06': { // The Lovers
    uprightDeep: 'Kartu Kekasih mewakili cinta yang murni dan tanpa syarat. Hubungan yang digambarkan di sini adalah hubungan kepercayaan, kasih sayang, dan keseimbangan. Masing-masing saling melengkapi dan memberdayakan, membuat keseluruhan lebih besar dari jumlah bagian-bagiannya. Selain cinta, pilihan juga menjadi inti kartu ini.',
    reversedDeep: 'Ketika Kekasih terbalik, hubungan mereka tidak lagi harmonis. Apa yang dulu terasa saling melengkapi kini terasa seperti ketidakcocokan. Kartu ini menunjuk pada kurangnya pilihan dan mencerminkan keputusan sulit yang harus dibuat ketika tidak ada pilihan yang menyenangkan.',
    reflection: 'Kartu ini bisa merujuk pada hubungan kuat apa pun dalam hidupmu atau hubunganmu dengan dirimu sendiri. Siapa yang membuatmu merasa dihargai dan dipahami? Komitmen apa yang harus kamu buat untuk diri sendiri atau orang lain?',
    action: 'Analisis cinta — bandingkan hubungan yang pernah terasa mengekang dengan yang benar-benar memuaskan. Buat komitmen yang tegas. Seimbangkan kembali dinamika hubungan. Kembangkan cinta diri.',
  },

  'major-07': { // The Chariot
    uprightDeep: 'Inti dari Kereta Perang adalah ketangguhan, ketekunan, dan fokus. Sang kusir harus tetap fokus, mengendalikan situasi, dan memastikan ia mencapai tujuannya. Dua sifat yang berlawanan — seperti dua kuda yang menarik kereta — harus bekerja sama untuk bergerak maju.',
    reversedDeep: 'Ketika terbalik, sang kusir mungkin begitu fokus pada tujuan sehingga tidak melihat bagaimana ia berubah dalam pengejarannya, atau bahwa ada alternatif yang memberikan hasil serupa tanpa tekanan. Di sisi lain, motivasi atau kepercayaan diri mungkin melemah.',
    reflection: 'Ketika kamu punya tujuan yang tampak sulit dicapai, bagaimana kamu menghadapinya? Kereta Perang memintamu memanggil seluruh tekadmu. Kemenangan terbesar bukan apakah kamu mencapai tujuan itu, tapi perjalanan yang kamu tempuh.',
    action: 'Nilai ulang tujuanmu — apakah yang kamu kejar masih penting bagimu sekarang? Identifikasi gangguan. Pikirkan ulang metode — mungkin ada jalur yang lebih mudah. Pertahankan akuntabilitas dirimu.',
  },

  'major-08': { // Strength
    uprightDeep: 'Kekuatan dalam kartu ini bukan tentang dominasi, tapi tentang ketahanan, kemampuan beradaptasi, dan keyakinan bahwa apapun belokan hidup yang datang, kamu bisa menghadapinya dengan tenang. Ini tentang menguasai dan menyalurkan dorongan naluriah untuk sukses meski dalam tekanan.',
    reversedDeep: 'Ketika terbalik, Sang Kekuatan mungkin kekurangan kepercayaan diri, atau justru agresif dan mudah meledak. Inti dari kartu Kekuatan adalah hubungan simbiosis antara kemanusiaan kita dan naluri hewani kita — ketika insting dibiarkan bebas tanpa kendali, dorongan gelap menjadi tak terkendali.',
    reflection: 'Bagaimana kamu memanggil kekuatan batin untuk membuat pilihan terbaik bagimu, bahkan ketika ketakutan atau orang lain mencegahmu? Kartu ini juga menandakan disiplin dan penyaluran impuls yang lebih primitif ke tindakan konstruktif.',
    action: 'Ubah emosi menjadi tindakan — input emosional adalah cara bawah sadar menyampaikan bahwa perubahan perlu dibuat. Amati emosimu secara teratur. Periksa apa yang menghambatmu — identifikasi perilaku dan keyakinan yang merusak diri sendiri.',
  },

  'major-09': { // The Hermit
    uprightDeep: 'Sang Pertapa mencoba menemukan sumber kebijaksanaan yang ada di dalam dirinya. Ia mundur ke dalam kegelapan sendirian dan tanpa rasa takut. Lentera di tangannya menerangi tempat-tempat yang paling tidak nyaman, mengungkap rahasia, motivasi tersembunyi, dan ketakutan yang belum terselesaikan.',
    reversedDeep: 'Ketika terbalik, Sang Pertapa mungkin tersesat dalam jalan-jalan berliku yang membawanya pada dirinya sendiri. Jalan bawah sadar bisa berbahaya karena penuh dengan kecemasan, proyeksi, dan ketakutan. Atau ia mungkin terganggu oleh distraksi, tidak bisa atau tidak mau memulai perjalanannya.',
    reflection: 'Sang Pertapa menandai waktu introspeksi dan kesendirian. Apakah kamu mencari jawaban dalam dirimu sendiri? Apakah kamu merasa terputus dari orang yang kamu cintai? Apakah isolasi telah mendistorsi cara kamu melihat dunia?',
    action: 'Masuk dalam alur — temukan keadaan fokus intens ketika kamu begitu terlibat dalam sebuah aktivitas sehingga semua pikiran memudar. Bersihkan pikiranmu dari teknologi. Terhubung kembali dengan dunia — mungkin dunia luar lebih ramah dari yang kamu ingat.',
  },

  'major-10': { // Wheel of Fortune
    uprightDeep: 'Roda Nasib mewakili hal yang tak terhindarkan — ia adalah roda yang memintali benang cerita setiap orang. Kartu ini adalah simbol ketidakpastian dan ketidakkekalan hidup. Namun jika kita bisa berdiri di pusat Roda, kita mungkin menemukan ketenangan dalam kekacauan.',
    reversedDeep: 'Seiring Roda berputar, nasib kita ikut berputar bersamanya. Ada yang berpegangan erat pada sisinya untuk mencoba memaksa arahnya — ini adalah energi dan emosi yang terbuang sia-sia, membuat perubahan yang tak terhindarkan menjadi jauh lebih menyakitkan.',
    reflection: 'Apakah kamu merasa hidup di luar kendalimu? Apakah ada perubahan dalam hidupmu yang kamu tahan? Atau jika kamu merasa terjebak dalam siklus yang sama berulang, mungkin kamu akhirnya memutus siklus itu.',
    action: 'Terima ketidakkekalan — hargai masa-masa baik dan hadapi badai, tahu bahwa keduanya akan berlalu. Identifikasi pola yang berulang. Temukan pusatmu — apa yang membuatmu tetap membumi di mana pun Roda membawamu.',
  },

  'major-11': { // Justice
    uprightDeep: 'Keadilan adalah kemampuan kita untuk menilai situasi secara objektif, melihat fakta tanpa pengaruh emosi, dan mengakui tanggung jawab kita atas pilihan-pilihan kita. Ini tentang mencari kebenaran, menghormati hukum sebab-akibat, dan bertanggung jawab atas tindakan kita.',
    reversedDeep: 'Ketika terbalik, ada situasi yang tidak adil atau penilaian yang dipengaruhi prasangka. Mungkin seseorang tidak mau mengakui tanggung jawab mereka, atau kebenaran sedang disembunyikan. Kecurangan dan penghindaran tanggung jawab menjadi tema utama.',
    reflection: 'Apakah ada keputusan penting yang perlu kamu buat? Apakah kamu menilai situasi secara adil — baik untuk orang lain maupun untuk dirimu sendiri? Apakah ada ketidakadilan dalam hidupmu yang perlu ditangani?',
    action: 'Ciptakan struktur dan proses objektif. Jujurlah dalam komunikasi. Bertanggung jawablah atas keputusanmu. Cari solusi yang adil bagi semua pihak.',
  },

  'major-12': { // The Hanged Man
    uprightDeep: 'Sang Orang Tergantung mengambil jeda sukarela — ia melepaskan diri dari dunia sejenak untuk mendapatkan perspektif baru. Posisinya yang terbalik memberikan pandangan yang tidak bisa diperoleh dengan cara biasa. Ada pengorbanan dalam posisi ini, tapi hasilnya adalah pencerahan.',
    reversedDeep: 'Ketika terbalik, Sang Orang Tergantung menunda atau membuat pengorbanan yang tidak perlu. Ia mungkin menolak untuk melepaskan apa yang sudah tidak lagi melayaninya, atau ia terjebak dalam ketidakaktifan yang diperpanjang.',
    reflection: 'Apakah ada area dalam hidupmu yang membutuhkan jeda dan refleksi? Apakah ada sesuatu yang perlu kamu lepaskan untuk bergerak maju? Terkadang mundur selangkah adalah satu-satunya cara untuk melihat gambaran besar.',
    action: 'Beri dirimu izin untuk berhenti sejenak dan merenungkan situasi dari sudut pandang yang berbeda. Identifikasi apa yang perlu kamu relakan. Terkadang ketidakaktifan yang disengaja adalah bentuk tindakan yang paling bijak.',
  },

  'major-13': { // Death
    uprightDeep: 'Kartu Kematian mewakili transformasi dan awal baru — bukan kematian secara harfiah. Ini adalah akhir dari satu babak dan dimulainya babak berikutnya. Sang Bodoh harus melepaskan cara lama untuk memberi ruang bagi cara baru yang lebih baik. Setiap akhir mengandung benih awal baru.',
    reversedDeep: 'Ketika terbalik, Sang Bodoh mungkin menolak perubahan yang sudah tak terhindarkan. Ia mungkin mencoba mempertahankan sesuatu yang sudah waktunya berakhir, atau berjuang untuk melepaskan masa lalu yang tidak lagi melayaninya.',
    reflection: 'Babak apa dalam hidupmu yang perlu ditutup? Apa yang perlu kamu relakan agar sesuatu yang baru bisa lahir? Perubahan apa yang kamu tahan, dan mengapa?',
    action: 'Terima bahwa setiap akhir adalah permulaan. Ucapkan selamat tinggal pada apa yang sudah selesai dengan rasa syukur. Buka dirimu untuk transformasi yang datang.',
  },

  'major-14': { // Temperance
    uprightDeep: 'Sang Kesederhanaan mengajarkan seni keseimbangan dan integrasi. Ia memadukan yang berlawanan menjadi harmoni yang indah. Kesabaran dan moderasi adalah kunci — ia tidak terburu-buru dan tidak memaksa. Ia mengalir seperti air, menemukan jalan tengah yang sempurna.',
    reversedDeep: 'Ketika terbalik, ada ketidakseimbangan atau ekstrem dalam beberapa area kehidupan. Mungkin kamu bergerak terlalu cepat, berlebihan dalam beberapa hal, atau tidak mampu menemukan keseimbangan yang kamu butuhkan.',
    reflection: 'Di mana kamu membutuhkan lebih banyak keseimbangan dalam hidupmu? Apakah ada area di mana kamu berlebihan atau justru kekurangan? Bagaimana kamu bisa membawa harmoni yang lebih besar ke dalam situasimu?',
    action: 'Cari jalan tengah dalam konflik. Sabar dengan prosesnya. Integrasi membutuhkan waktu — beri dirimu waktu itu. Kombinasikan perspektif yang berbeda untuk menemukan solusi yang lebih baik.',
  },

  'major-15': { // The Devil
    uprightDeep: 'Sang Iblis mewakili sisi bayangan kita — keinginan, ketakutan, dan pola-pola yang mengikat kita. Kartu ini menunjukkan di mana kita mungkin merasa terjebak atau dikendalikan oleh sesuatu. Namun penting diingat: rantai yang mengikat dalam gambar ini bisa dilepas kapan saja.',
    reversedDeep: 'Ketika terbalik, Sang Bodoh mulai mengenali belenggunya dan mengambil langkah untuk melepaskan diri. Mungkin ada momen kesadaran yang kuat tentang pola yang merusak, dan kemauan yang tumbuh untuk memutusnya.',
    reflection: 'Apa yang terasa mengikat atau membelenggu kamu saat ini — apakah itu pola pikir, hubungan, kebiasaan, atau ketakutan? Belenggumu mungkin lebih lemah dari yang kamu kira. Apa yang menghalangimu untuk membebaskan diri?',
    action: 'Kenali apa yang benar-benar memiliki kuasamu. Bedakan antara ketakutan yang nyata dan yang dibuat-buat. Ambil langkah kecil pertama menuju kebebasan — terkadang itu sudah cukup untuk memutus rantai.',
  },

  'major-16': { // The Tower
    uprightDeep: 'Sang Menara mewakili gangguan tiba-tiba dan kehancuran mendadak. Sesuatu yang dibangun di atas fondasi yang goyah akhirnya runtuh. Ini bisa terasa menghancurkan, tapi tujuannya adalah pembersihan — menghapus apa yang tidak lagi berfungsi agar sesuatu yang lebih otentik bisa dibangun.',
    reversedDeep: 'Ketika terbalik, perubahan dramatis mungkin terus tertunda atau ditahan. Atau runtuhnya datang lebih lambat dan lebih menyakitkan. Dalam keduanya, ada kebutuhan untuk menghadapi realita dan melepaskan apa yang sudah tidak bisa dipertahankan lagi.',
    reflection: 'Apakah ada sesuatu dalam hidupmu yang sedang runtuh atau perlu diruntuhkan? Apakah kamu menolak perubahan yang seharusnya terjadi? Terkadang kehancuran adalah satu-satunya jalan menuju fondasi yang lebih kokoh.',
    action: 'Hadapi kenyataan dengan berani. Lepaskan apa yang sudah waktunya pergi. Gunakan momen kehancuran sebagai kesempatan untuk membangun ulang sesuatu yang lebih autentik dan kuat.',
  },

  'major-17': { // The Star
    uprightDeep: 'Setelah bertemu dengan Sang Menara, Sang Bodoh menemukan Bintang. Bahkan di antara reruntuhan sistem yang hancur dan ilusi yang tersapu bersih, ia mengenali semua yang ia miliki. Ia dipenuhi keyakinan bahwa ia punya semua yang dibutuhkan dalam dirinya untuk menemukan pemenuhan. Bintang tahu bahwa inti kemanusiaannya — spiritnya — tidak bisa disentuh.',
    reversedDeep: 'Ketika terbalik, kepercayaan Sang Bodoh pada dirinya dan alam semesta telah menguap. Mungkin bintang-bintang kini tertutup awan, dan apapun yang dibutuhkan sang Bodoh untuk panduan sedang terhalang. Namun di hati kita semua, Bintang batin kita bisa memandu kita bahkan di malam yang paling gelap.',
    reflection: 'Mungkin kamu sedang dalam proses sembuh dari tantangan hidup yang berat. Bagaimana kehilangan memperjelas apa yang kekal dalam dirimu? Di mana kamu bisa menemukan harapan yang diperbarui?',
    action: 'Pupuk optimisme. Bawa cahaya kepada orang-orang di sekitarmu. Temukan inspirasi dari alam dan keindahan. Temukan kembali tujuanmu — apa yang memberimu alasan untuk bangun setiap hari.',
  },

  'major-18': { // The Moon
    uprightDeep: 'Sang Bulan mewakili dunia cermin batin, di mana imajinasi berkembang dan fantasi kita berkeliaran. Instingku dan perasaan kita mempengaruhi cara kita memandang dunia — apa yang kita lihat di sekitar kita mencerminkan lanskap internal kita. Batas antara nyata dan yang dibayangkan menjadi kabur.',
    reversedDeep: 'Ketika terbalik, langit dan pantulannya telah menyatu; kita tidak lagi bisa membedakan mana yang nyata. Sang Bodoh melihat banyak bayangan yang menakutkan muncul — ini mungkin adalah visi emosi yang belum dihadapi, atau trauma yang terlalu menyakitkan sehingga ia mendorongnya ke alam bawah sadar yang lebih dalam.',
    reflection: 'Ketika Bulan hadir, persepsi kita sangat dipengaruhi oleh narasi internal kita. Apakah membaca situasi dalam hubunganmu sulit karena memicu pemicu bawah sadar? Ilusi dan ketakutan apa yang kamu pegang? Emosi negatif apa yang kamu coba hindari?',
    action: 'Amati fantasimu. Perhatikan suasana hatimu — bagaimana mereka mewarnai interaksimu. Pisahkan perilaku dari interpretasimu tentang perilaku orang lain. Cari bantuan profesional jika kecemasan terus mengganggumu.',
  },

  'major-19': { // The Sun
    uprightDeep: 'Dalam Tarot, Sang Matahari mewakili cahaya, kehangatan, kecemerlangan, dan kehidupan. Ia memberi Sang Bodoh energi, kekuatan, positivitas, dan karisma. Cahaya matahari bersinar padanya, dalam dirinya, dan melalui dirinya; ia menerangi dunia dengan energinya dan optimismenya yang tak terbatas.',
    reversedDeep: 'Ketika Matahari terbalik, awan menutup cahayanya yang menghidupkan, dan kehangatan serta kegembiraan yang ditawarkannya bisa menjadi redup. Namun bayangan yang ada sekarang akan segera menghilang. Terkadang Matahari bisa terlalu keras dan tanpa henti, dan kehangatan kebahagiaan bisa berubah menjadi antusias yang berlebihan.',
    reflection: 'Energi kartu ini penuh semangat — ini adalah pengingat bahwa setelah setiap malam gelap, selalu datang hari baru. Apakah kamu percaya bahwa cahaya selalu kembali setelah kegelapan? Masalahmu memiliki kemungkinan besar untuk terselesaikan, selama kamu terus melangkah maju.',
    action: 'Definisikan kebahagiaanmu — apa yang kamu lakukan ketika paling bahagia? Bagikan cahayamu. Bermainlah — lakukan sesuatu setiap hari yang tidak punya tujuan lain selain memberimu kesenangan murni.',
  },

  'major-20': { // Judgement
    uprightDeep: 'Ketika Sang Bodoh bertemu Penghakiman, ia mendengar panggilan retentang semangat sendirinya untuk melihat melampaui dirinya. Kartu ini melambangkan kelahiran kembali jiwa yang datang bersama kesadaran baru. Malaikat dalam kartu ini adalah utusan dari kesadaran yang lebih tinggi, meminta Sang Bodoh untuk menjalani hidupnya dengan lebih penuh kesadaran.',
    reversedDeep: 'Ketika Penghakiman terbalik, Sang Bodoh mungkin terlalu takut dengan tantangan dan pengorbanan yang diperlukan oleh perubahan. Ia mungkin memilih untuk melanjutkan jalan yang sudah ada, merasa aman dan terlindungi dalam rutinitas. Tapi panggilan, ketika tidak didengar, tidak akan pergi — ia hanya akan semakin keras.',
    reflection: 'Pernahkah kamu mengalami momen kesadaran tiba-tiba yang mengubah arah hidupmu? Pesan apa dari kesadaran yang lebih tinggi yang belum kamu hiraukan? Panggilan apa yang gagal kamu jawab?',
    action: 'Ikuti tujuanmu. Buat penilaian diri yang jujur. Pupuk kesadaran diri — jadwalkan check-in harian dengan dirimu sendiri. Jangan hindari penghakiman yang perlu dihadapi.',
  },

  'major-21': { // The World
    uprightDeep: 'Akhirnya, Sang Bodoh mencapai Dunia dan merasa utuh. Di sinilah batas antara diri dan yang lain, emosi dan tindakan, identitas dan dunia bersatu sebagai satu. Ia telah menemukan kesuksesan dalam bentuk apapun yang ia definisikan untuk dirinya sendiri dan menjalani hidupnya secara autentik.',
    reversedDeep: 'Ketika Sang Bodoh mendekati akhir perjalanannya, ia mungkin takut mengambil langkah berikutnya. Secara sadar atau tidak, ia mungkin menunda atau menghindari penyelesaiannya. Di sisi lain, mungkin ada momen masa lalu yang bangkit menghantui — ia perlu meletakkan beberapa hal di belakangnya untuk akhirnya menyelesaikan perjalanannya.',
    reflection: 'Kartu Dunia mewakili terpenuhinya tujuan yang sudah lama ditunggu. Apa rasanya menyelesaikan sebuah tahap dalam hidupmu? Penyelesaian satu perjalanan menandai datangnya perjalanan lain. Apa yang menghambatmu dari menyelesaikan fase hidupmu ini?',
    action: 'Hargai perjalananmu. Rayakan pencapaianmu. Pandang ke depan dengan rasa ingin tahu. Selesaikan yang perlu diselesaikan — langkah terakhir selalu yang paling sulit, tapi juga yang paling penting.',
  },

  // ── Minor Arcana — Wands ──────────────────────────────────

  'wands-01': {
    uprightDeep: 'Ace of Wands mewakili percikan visi kreatif. Ide-ide baru punya potensi kuat untuk menjadi kenyataan, seperti percikan yang berubah menjadi nyala api yang menyala-nyala. Wands menyalurkan kekuatan dan membuka kemungkinan, tapi kilatan inspirasi ini bersifat sementara — untuk mengubah ide menjadi realita, kita harus meraih tongkat itu dengan keyakinan dan antusiasme.',
    reversedDeep: 'Ketika terbalik, kreativitas dan inovasi terhambat. Mungkin terlalu banyak ide tanpa fokus atau arah, atau kurangnya antusiasme dan motivasi. Tanpa fokus, tongkat tidak tahu ke mana harus mengarahkan energinya.',
    reflection: 'Passion, motivasi, dan imajinasi membanjirimu sekarang. Apakah kamu punya kilatan inspirasi tiba-tiba? Apa yang akan terjadi jika kamu mengesampingkan keraguan dan bekerja untuk mewujudkan visimu? Apa yang memadamkan semangat kreatifmu?',
    action: 'Sambut inspirasi — buka matamu pada kemungkinan. Salurkan energimu — ketika kamu ingin melakukan sesuatu, lakukan. Jangan terlalu banyak berpikir — sekarang bukan waktunya menganalisis, tapi bertindak.',
  },

  'wands-02': {
    uprightDeep: 'Two of Wands membentuk ide-ide baru menjadi rencana konkret. Kartu ini mewakili tahap persiapan, penemuan, dan detail. Sang Bodoh mengambil percikan kreasi dan mengembangkan rencana jangka panjang. Ia meneliti dan merancang masa depannya, kemudian memetakan jalan menuju tujuannya.',
    reversedDeep: 'Rencana yang sangat matang bisa berubah menjadi keinginan berlebihan untuk mengendalikan lingkungan. Sang Bodoh harus berdamai dengan fakta bahwa beberapa hal akan selalu mengejutkan. Di sisi lain, ia mungkin tidak memiliki rencana sama sekali — antusiasme tanpa strategi.',
    reflection: 'Impian kreatif atau profesionalmu kini mulai terwujud. Apakah kamu berencana, atau lebih spontan? Apakah kamu overthinking? Ketika kamu mencoba membuat rencana dengan kemungkinan sukses tertinggi, apakah itu malah menghambatmu dari bertindak?',
    action: 'Rancang petamu — sekarang kamu tahu ke mana ingin pergi, petakan semua cara untuk sampai ke sana. Damaikan dirimu dengan ketidakpastian — kamu tidak bisa mengendalikan segalanya. Keluar dari zona nyamanmu.',
  },

  'wands-03': {
    uprightDeep: 'Langkah-langkah pertama telah diambil untuk mengeksekusi rencana dan mengejar impian. Momentum sangat besar; tugas-tugas diselesaikan, masing-masing membawa Sang Bodoh lebih dekat ke visinya. Ia mengembangkan fondasi yang kuat, dan kepercayaan dirinya tumbuh. Visinya pun berkembang.',
    reversedDeep: 'Meski sudah berusaha sebaik mungkin, rencana tidak selalu terwujud. Pekerjaan mungkin sudah dilakukan, tapi entah mengapa, Sang Bodoh menemukan rintangan, frustrasi, kekecewaan, dan penundaan. Mungkin ia harus merevisi ide-ide awalnya.',
    reflection: 'Produktivitasmu yang tinggi membantu kamu mencapai kemajuan menuju tujuan-tujuanmu. Kemenangan apa yang kamu raih belakangan ini? Impian besar apa yang kamu tahan karena ingin realistis? Apa yang bisa kamu pelajari dari kemunduran yang kamu alami?',
    action: 'Rayakan — merayakan pencapaian menjaga motivasi tetap tinggi. Perluas visimu — sekarang saatnya bermimpi besar. Ubah kemunduran menjadi pelajaran. Ganti ekspektasimu agar punya ruang untuk melanjutkan tanpa terlalu terbebani emosi.',
  },

  'wands-04': {
    uprightDeep: 'Setelah kemenangan Sang Bodoh, ia pulang untuk merayakan. Ia disambut oleh teman dan keluarga yang bangga dengan pencapaiannya. Ada kenyamanan dan keakraban di sini, dan ia merasa didukung. Kartu ini juga bisa menggambarkan pernikahan, reuni, ulang tahun, atau acara bahagia lain yang dibagikan bersama orang-orang tersayang.',
    reversedDeep: 'Kartu ini mungkin menggambarkan situasi domestik yang sulit. Ketika Sang Bodoh pulang dari perjalanannya, ia mungkin menemukan ketegangan di antara anggota keluarga. Alih-alih kehangatan dan kenyamanan di rumah, ada kedinginan dan ketidakpastian.',
    reflection: 'Apa yang kamu capai belakangan ini? Bisakah kamu kini beristirahat dan menikmati stabilitas ini? Di mana kamu menemukan rasa rumah? Apa yang membuatmu merasa aman dan nyaman? Tanpa basis yang stabil, semuanya terasa lebih sulit.',
    action: 'Temukan kenyamanan dalam rumah — basklah dalam perusahaan orang-orang yang cintanya membantumu di sepanjang jalan. Istirahat sejenak. Ucapkan terima kasih kepada mereka yang selalu membuatmu merasa di rumah. Ciptakan kecocokan — ingat bahwa rumah tidak harus keluarga asal, tapi bisa keluarga yang kamu pilih.',
  },

  'wands-05': {
    uprightDeep: 'Ketegangan dan konflik ditunjukkan di sini; banyak suara berjuang untuk didengar dan alih-alih bekerja sama, mereka malah bertarung untuk supremasi. Ada persaingan, kompetisi, dan egoisme. Konflik juga bisa bersifat internal, ketika Sang Bodoh menyortir banyak skenario dalam pikirannya.',
    reversedDeep: 'Sang Bodoh mungkin kesulitan menghadapi argumen dan perselisihan. Kartu ini bisa menandai penghindaran konflik atau eskalasi tajam dari kebencian antara pihak-pihak yang bertikai. Kecemburuan atau ego yang terluka bisa memicu konflik dalam lingkungan yang sudah panas.',
    reflection: 'Dengan ketegangan yang ada, tindakan yang tidak berbahaya pun bisa disalahartikan. Bagaimana kamu bisa menghindari terseret ke dalamnya? Apa visi bersama yang ada? Seberapa penting bagimu untuk "benar"?',
    action: 'Ingat prinsipmu. Berikan benefit of the doubt kepada orang lain. Temukan kesamaan. Hadapi konflik — terkadang percakapan yang paling menakutkan dalam kepala kita ternyata sederhana dalam kehidupan nyata.',
  },

  'wands-06': {
    uprightDeep: 'Dengan melampaui konflik, Sang Bodoh mendapatkan pengakuan dari sesama. Ia telah mencapai tonggak penting lain dalam rencananya jangka panjang, dan ini menarik perhatian orang lain. Pujian bisa datang dalam bentuk penghargaan bergengsi atau sekadar tepukan di punggung.',
    reversedDeep: 'Meski Sang Bodoh sudah bekerja keras, ia merasa tidak mendapatkan penghargaan yang layak ia dapatkan. Kurangnya pujian membuatnya kehilangan kepercayaan diri. Tanpa pengakuan atas usahanya, ia mempertanyakan apa arti kesuksesan.',
    reflection: 'Kamu sudah bekerja sangat keras untuk hari ini tiba; ketekunan dan passion sudah terbayar. Bagaimana kamu akan menikmati kemenanganmu? Seberapa banyak kamu mengukur kesuksesan dari pengakuan eksternal? Apakah kamu mengabaikan kompasmu sendiri?',
    action: 'Nikmati kesuksesanmu. Bagikan kebahagiaanmu. Jadilah contoh yang baik. Tampilkan kesuksesanmu dengan caramu sendiri — ciptakan standar kesuksesanmu sendiri.',
  },

  'wands-07': {
    uprightDeep: 'Sang Bodoh mungkin diserang dari segala penjuru dan harus mengambil sikap untuk membela dirinya. Mempertahankan dan memelihara kesuksesan adalah dua hal yang berbeda. Orang lain mungkin bersaing untuk posisinya. Kartu ini juga bisa menjadi seruan untuk berdiri di atas prinsip-prinsipnya, bahkan ketika orang lain mengkritiknya.',
    reversedDeep: 'Ketika antisipasi stres dan bahaya menjadi konstan, kita mendapatkan Seven of Wands yang terbalik. Sang Bodoh mungkin merasa kelelahan dan siap menyerah. Ia mungkin merasa kewalahan dari selalu waspada dan defensif.',
    reflection: 'Nilai-nilai kita membentuk inti identitas kita; ketika diserang, itu terasa sangat pribadi. Kapan terakhir kali kamu menyuarakan prinsip yang dipegang kuat, hanya untuk dikritik? Apakah membela keyakinanmu membuatmu semangat atau kelelahan?',
    action: 'Ambil pandangan jangka panjang — ini akan menjadi uji ketahanan. Berdiri untuk sesuatu. Bersiap dan waspada. Daftarkan bebanmu — mengetahui apa yang kamu lawan dan melihat bahwa daftarnya terbatas bisa membantumu mendapatkan pegangan lebih baik atas realita.',
  },

  'wands-08': {
    uprightDeep: 'Sekarang adalah periode kemajuan pesat dan pergerakan bebas tanpa hambatan. Banyak energi yang disarankan oleh kartu ini, mendorong Sang Bodoh menuju tujuannya. Ini mungkin waktu yang sibuk dan produktif yang didorong oleh semangat baru. Jika ia mengalir dengan energi itu dan menyalurkannya ke fokus tunggal, ia bisa mencapai banyak hal.',
    reversedDeep: 'Energi yang intens dan frenetik bisa membuat Sang Bodoh tanpa fokus atau visi yang jelas. Ia mungkin membuat kesalahan saat terburu-buru atau membuang energi ini pada tindakan yang tidak bertujuan. Mungkin ada hambatan, penghalang, dan frustrasi.',
    reflection: 'Ini adalah periode kemajuan frenetik dalam kehidupan profesional, romantis, atau pribadimu. Apakah semua usahamu membuahkan hasil? Keputusan cepat diperlukan. Bagaimana kamu menghadapi energi yang frenetik?',
    action: 'Ikuti alurnya — ikuti jalannya peristiwa dan manfaatkan momentum. Arahkan perjalanannya — ke mana kamu ingin semua ini berakhir? Selaraskan tujuanmu. Percayakan instingmu.',
  },

  'wands-09': {
    uprightDeep: 'Ujian dan penderitaan telah mendefinisikan perjalanan wands, dan Sang Bodoh memar dan babak belur karena ketegangan. Kelelahan dan rendah hati, ia berdiri dengan tekad yang luar biasa. Kemauan murni dan mungkin keras kepala telah membawanya sejauh ini. Kartu ini tentang menetapkan dan melindungi batas.',
    reversedDeep: 'Tekad hilang; banyak tantangan dan rintangan yang menghalangi, dan Sang Bodoh goyah di bawah tekanan. Ia siap menyerah. Atau kartu ini menandakan terlalu banyak batas yang dibangun; kecurigaan dan ketakutan mengarah pada defensif. Perjuangan yang panjang dan melelahkan telah mengajarkan bahwa untuk bertahan, ia harus membangun pertahanan — tapi ini bisa menjadi penjara buatan sendiri.',
    reflection: 'Pikirkan tentang kesulitan yang berhasil kamu atasi. Bagaimana rasanya melihat ke belakang? Biarkan ketahananmu menjadi motivasi untuk apa yang kamu hadapi sekarang. Apakah kamu siap menyerah? Apa yang akan kamu sesali lebih banyak: bertahan dan gagal, atau pergi tanpa tahu?',
    action: 'Berbangga pada usaha, bukan hasilnya. Lindungi batasmu. Nilai ulang batasmu — apakah melindungimu atau mengisolasimu? Kenali luka-lukamu.',
  },

  'wands-10': {
    uprightDeep: 'Sang Bodoh telah mengatasi banyak perjuangan, masing-masing lebih sulit dari sebelumnya. Tapi kini ia menyadari bahwa usahanya masih belum cukup. Ia dibebani tanggung jawab berat untuk mempertahankan kesuksesannya. Ia punya banyak tugas dan orang yang bergantung padanya.',
    reversedDeep: 'Beban yang berat yang Sang Bodoh mungkin keras kepala menolak untuk dibagikan, bahkan saat ia goyah di bawah beratnya. Ia harus meminta bantuan atau berbagi beban emosional dari rahasia yang ia bawa sendiri.',
    reflection: 'Pencapaian selalu datang dengan lebih banyak tanggung jawab; bahkan mempertahankan status quo bisa terasa tidak tertahankan. Beban apa yang kamu bawa yang sebenarnya bukan milikmu? Apa konsekuensi emosional dari menanggung beban orang lain?',
    action: 'Minta bantuan. Kenali bakatmu dan di mana kamu kekurangan. Prioritaskan tugas. Beri ruang — jangan langsung terjun ke masalah orang lain. Ciptakan batas — ketahui kapan harus berhenti.',
  },

  // ── Cups ──────────────────────────────────────────────────

  'cups-01': {
    uprightDeep: 'Ace of Cups mewakili awal baru dalam dunia emosi dan intuisi. Ini adalah cangkir yang meluap dengan kemungkinan emosional — cinta baru, koneksi mendalam, atau kreativitas yang mengalir bebas. Seperti sumber air yang jernih, energi ini siap mengalir ke mana pun hatimu membawanya.',
    reversedDeep: 'Ketika terbalik, aliran emosional terhambat. Mungkin ada sesuatu yang menghalangi perasaan mengalir dengan bebas — ketakutan, luka masa lalu, atau sekadar keengganan untuk membuka hati. Energi yang tersumbat ini membutuhkan perhatian dan kelembutan.',
    reflection: 'Apakah ada cinta atau koneksi baru yang sedang tumbuh dalam hidupmu? Apakah kamu terbuka untuk perasaan baru? Apa yang mungkin menghalangimu dari menerima kasih sayang atau memberikannya dengan bebas?',
    action: 'Buka hatimu untuk kemungkinan emosional baru. Percayai perasaanmu sebagai panduan. Jika ada hambatan, hadapi dengan kelembutan dan kesabaran.',
  },

  'cups-02': {
    uprightDeep: 'Two of Cups melambangkan penyatuan dua jiwa dalam hubungan yang seimbang dan saling menghormati. Ini tentang koneksi yang bermakna di mana kedua pihak memberikan dan menerima secara setara. Sinergi di antara keduanya menciptakan sesuatu yang lebih besar dari masing-masing individu.',
    reversedDeep: 'Ketika terbalik, ada ketidakseimbangan dalam hubungan — mungkin satu pihak memberi lebih dari yang lain, atau komunikasi telah rusak. Keselarasan yang dulu ada kini terganggu oleh kesalahpahaman atau ekspektasi yang tidak terpenuhi.',
    reflection: 'Apakah ada hubungan dalam hidupmu yang membutuhkan lebih banyak keseimbangan dan saling menghormati? Apakah kamu memberi dan menerima secara setara? Apa yang perlu diselaraskan agar koneksi bisa berkembang?',
    action: 'Rawat hubungan yang bermakna. Komunikasikan kebutuhanmu dengan jelas. Cari keseimbangan antara memberi dan menerima. Jika ada ketidakseimbangan, hadapi dengan keterbukaan.',
  },

  'cups-03': {
    uprightDeep: 'Three of Cups merayakan persahabatan, komunitas, dan kegembiraan bersama. Ini adalah saat untuk merayakan bersama orang-orang yang kita cintai, berbagi pencapaian, dan menghargai ikatan yang memperkaya hidup kita. Ada rasa kepuasan kolektif yang hangat di sini.',
    reversedDeep: 'Ketika terbalik, kegembiraan sosial mungkin berubah menjadi gosip, drama, atau dinamika kelompok yang tidak sehat. Perayaan mungkin terasa kosong atau ada ketidakselarasan dalam kelompok yang biasanya mendukung.',
    reflection: 'Dengan siapa kamu paling terhubung dan dirayakan? Kapan terakhir kali kamu benar-benar merayakan bersama orang-orang yang kamu cintai? Apakah lingkaran sosialmu memberi atau menguras energimu?',
    action: 'Luangkan waktu untuk merayakan bersama orang-orang tersayang. Perkuat persahabatan yang bermakna. Jika ada drama sosial, tangani dengan bijak atau pertimbangkan untuk menjauh dari dinamika yang tidak sehat.',
  },

  'cups-04': {
    uprightDeep: 'Four of Cups menandakan kontemplasi dan evaluasi ulang terhadap kondisi emosi saat ini. Sang Bodoh duduk dalam meditasi, mungkin merasa tidak puas atau jenuh, mencari makna yang lebih dalam dari apa yang ditawarkan kehidupan saat ini. Ada peluang baru yang ditawarkan, tapi ia belum siap menerimanya.',
    reversedDeep: 'Ketika terbalik, Sang Bodoh akhirnya bangkit dari keadaan stagnannya. Ia melihat peluang yang sebelumnya diabaikan dengan mata baru. Pembaruan energi dan keterbukaan baru terhadap kemungkinan membawanya keluar dari kelesuan.',
    reflection: 'Apakah kamu merasa jenuh atau tidak puas meski hidupmu secara objektif baik-baik saja? Apakah ada sesuatu yang menunggu perhatianmu yang selama ini kamu abaikan? Apa yang benar-benar kamu inginkan yang mungkin belum kamu akui?',
    action: 'Perhatikan apa yang datang kepadamu dengan mata terbuka. Keluar dari keadaan kontemplasi yang berlebihan dan ambil tindakan kecil. Tanyakan pada dirimu apa yang benar-benar membuatmu hidup.',
  },

  'cups-05': {
    uprightDeep: 'Ketika ekspektasi tidak terpenuhi, ada kekecewaan dan kehilangan. Sang Bodoh mungkin terjebak melihat ke belakang, merenungi rasa sakit dan penyesalannya. Tiga cangkir telah tumpah, tapi dua masih tegak. Ini berarti situasinya, meski menyakitkan, masih bisa diselamatkan.',
    reversedDeep: 'Sang Bodoh menunjukkan pemulihan yang signifikan dari kehilangan dan penyesalan yang mencegahnya dari sepenuhnya mengalami kehidupan. Kesalahan dilihat dari perspektif yang lebih besar; mereka tidak mendefinisikannya tapi masih memiliki nilai dengan membentuk hidupnya ke depan.',
    reflection: 'Apakah kamu tenggelam dalam perasaan putus asa dan kesedihan? Bagaimana kamu bisa menjaga dan melindungi apa yang masih bisa diselamatkan? Bisakah kamu mereframe perspektifmu dan berdamai dengan masa lalu?',
    action: 'Maafkan — memiliki rasa bersalah atau menyalahkan orang lain bisa membuatmu tetap berakar pada masa lalu yang tidak bisa diubah. Temukan kenyamanan. Fokus pada apa yang bisa kamu lakukan. Ubah rintangan menjadi peluang.',
  },

  'cups-06': {
    uprightDeep: 'Untuk sembuh dari luka-lukanya, Sang Bodoh mencari perlindungan dari masa kini dengan mengunjungi kembali momen-momen cerah dari masa lalunya. Di sini, ia menemukan perlindungan, kenyamanan, dan keamanan. Ini bisa berupa kenangan indah atau bahkan pulang ke rumah secara fisik.',
    reversedDeep: 'Ia mungkin berpegangan pada kenangan lama untuk menghindari masa kini. Masa lalu bisa membawa pelajaran untuk masa depan, tapi masa depan itu bergantung pada ia hidup di masa kini, di mana ia bisa membuat perubahan.',
    reflection: 'Apa yang kamu rindukan dari masa lalumu? Kenangan apa yang memberimu rasa puas dan aman? Bisakah kamu terhubung dengan anak batinmu untuk melihat dunia dengan kepolosan dan keajaiban?',
    action: 'Terhubung kembali dengan masa lalu. Temukan kesenangan sederhana. Cari penutupan — identifikasi apa yang belum terselesaikan. Tarik garis antara dirimu di masa lalu dan masa kini.',
  },

  'cups-07': {
    uprightDeep: 'Sang Bodoh ditawari berbagai pilihan yang memukau, beberapa mengarah ke ketenaran, kekuasaan, dan kekayaan, dan yang lain ke cinta, kebahagiaan, dan kesenangan hidup yang sederhana. Masing-masing punya daya tariknya sendiri, sehingga ia merasa tersesat dalam lamunan itu, berharap dan berangan-angan tanpa mengambil tindakan nyata.',
    reversedDeep: 'Pilihan bisa menjadi indah, tapi ketika dihadapkan dengan terlalu banyak opsi, kita bisa merasa kewalahan. Segalanya adalah gangguan yang menggoda. Alih-alih membuat keputusan aktif, Sang Bodoh mungkin menunggu sampai pilihan dibuat untuknya.',
    reflection: 'Apakah pilihan yang tak terbatas menggodamu, membuatmu tetap bermimpi tanpa mengambil tindakan? Apakah kamu lumpuh oleh banyaknya pilihan? Apa hambatan nyata dan mana yang hanya buatan kecemasanmu?',
    action: 'Daftar konsekuensinya. Jadilah realistis. Sederhanakan impianmu. Beri dirimu batas waktu. Buka topeng kecemasan — identifikasi ketakutan mana yang nyata.',
  },

  'cups-08': {
    uprightDeep: 'Sang Bodoh menyadari bahwa ia telah membuat pilihan yang salah. Awalnya, jalan ini membawanya bahagia, sehingga ia berinvestasi sepenuh hati. Namun ia kecewa dengan hasilnya; seberapa pun ia mencoba, ia masih merasa kosong. Meski menyakitkan, ia tahu bahwa ia harus meninggalkannya untuk menemukan kebahagiaan sejati.',
    reversedDeep: 'Sang Bodoh mencoba sekali lagi untuk memperbaiki situasi yang malang. Kekecewaan berlanjut, dan ia mungkin kehilangan harapan. Namun ia merasa sulit untuk membuang sesuatu yang sudah ia investasikan begitu banyak usaha.',
    reflection: 'Kehidupan adalah jalan yang berliku — kadang kita harus melangkah mundur untuk melangkah maju. Apa yang harus kamu tinggalkan sekarang? Apakah pergi demi kebaikan yang lebih besar? Apa keinginan yang kamu tekan demi tetap nyaman?',
    action: 'Ucapkan selamat tinggal — bersyukur atas waktu dan kenangan, tapi berdamailah dengan kenyataan bahwa perubahan harus datang. Terima kerentanan. Ikuti bintangmu sendiri. Hadapi ketakutanmu.',
  },

  'cups-09': {
    uprightDeep: 'Dikenal sebagai kartu keinginan, Nine of Cups melambangkan apresiasi mendalam dan kepuasan. Sang Bodoh telah menemukan kedamaian yang datang dari terpenuhinya semua kebutuhan dan keinginannya. Setelah gejolak emosional dalam perjalanan cups, akhirnya ia mencapai kepuasan tenang.',
    reversedDeep: 'Sang Bodoh memiliki segalanya yang bisa ia inginkan. Ia tidak bisa membayangkan hasil yang lebih baik, tapi ada sesuatu yang terasa tidak beres. Ia tidak bisa mengartikulasikan mengapa, tapi ia merasakan kekosongan. Dalam pencarian kebahagiaannya, ia mungkin menginginkan penanda eksternal kesuksesan.',
    reflection: 'Apakah kamu tahu apa kebutuhan emosionalmu? Apakah kamu mengalami kepuasan yang datang dari mengetahui keinginanmu dan mengejarnya? Apa yang selalu kamu inginkan yang sudah kamu miliki sekarang?',
    action: 'Banggalah. Buat keinginan — bermimpilah besar. Nikmati momen. Nilai ulang tujuanmu. Singkirkan egomu — tentukan tujuan mana yang dangkal dan mana yang bermakna.',
  },

  'cups-10': {
    uprightDeep: 'Ketika cinta diri dalam Ace of Cups meluap dan menghidupi semua orang, kita menemukan pemenuhan emosional sejati dengan komunitas dan hubungan. Kehidupan Sang Bodoh dipenuhi orang-orang tersayang. Koneksi yang diwakili oleh kartu ini dalam, setia, dan harmonis.',
    reversedDeep: 'Dalam posisi terbalik, ikatan keluarga dan komunitas dalam kartu ini mungkin melemah atau terputar. Masalah dapat muncul di rumah atau di antara lingkaran sosial, menciptakan jarak, ketidakpuasan, dan gesekan.',
    reflection: 'Begitu banyak keindahan dan keajaiban yang mengisi hidupmu sekarang, dan kamu bisa merasakan rasa syukur yang mendalam. Siapa koneksimu yang paling kuat? Siapa yang membuatmu merasa tak tergoyahkan? Apakah ada masalah dalam situasi domestikmu?',
    action: 'Hargai hubungan — identifikasi hubungan yang memberimu rasa keamanan. Bangun komunitas yang suportif. Hadapi masalah keluarga dengan keterbukaan dan kasih sayang.',
  },

  // ── Swords ────────────────────────────────────────────────

  'swords-01': {
    uprightDeep: 'Ace of Swords mewakili kejernihan pikiran, kebenaran, dan terobosan intelektual. Seperti pedang yang memotong kabut ilusi, kartu ini membawa kejelasan tajam ke situasi yang sebelumnya membingungkan. Ini adalah momen ketika kebenaran terungkap dan pikiran beroperasi dengan presisi yang sempurna.',
    reversedDeep: 'Ketika terbalik, ada kebingungan pikiran atau komunikasi yang merusak. Pikiran yang tajam mungkin digunakan secara destruktif atau terdistorsi oleh ketidakjujuran. Kebenaran yang perlu dihadapi mungkin dihindari.',
    reflection: 'Apakah ada situasi yang membutuhkan kejernihan dan kejujuran yang berani? Apakah ada kebenaran yang kamu hindari untuk dikatakan atau diakui? Bagaimana kamu bisa menggunakan kecerdasan untuk memotong melalui kebingungan?',
    action: 'Berbicara dengan jujur dan langsung. Cari fakta sebelum bertindak. Gunakan kecerdasanmu untuk memperjelas bukan untuk melukai. Hadapi kebenaran bahkan ketika tidak nyaman.',
  },

  'swords-02': {
    uprightDeep: 'Two of Swords mewakili kebuntuan dan pilihan yang sulit. Sang Bodoh duduk dengan mata tertutup, memegang dua pedang yang menyilang — ia tidak bisa atau tidak mau melihat pilihan-pilihan di depannya. Ada keseimbangan paksa antara dua kekuatan yang saling bertentangan.',
    reversedDeep: 'Ketika terbalik, kebuntuan mungkin mulai mencair. Sang Bodoh mungkin akhirnya bersedia melihat situasi dengan lebih jelas, atau keputusan dipaksakan oleh keadaan. Tapi terkadang, mata tertutup lebih tahan lama.',
    reflection: 'Apakah ada keputusan yang kamu hindari? Apakah kamu terjebak dalam kebuntuan? Informasi apa yang kamu butuhkan untuk membuat keputusan yang lebih jelas? Ketakutan apa yang menghalangimu untuk memilih?',
    action: 'Kumpulkan informasi yang diperlukan. Hadapi situasi secara langsung. Terima bahwa tidak membuat keputusan juga merupakan keputusan. Cari perspektif luar jika terjebak.',
  },

  'swords-03': {
    uprightDeep: 'Three of Swords membawa tema patah hati, pengkhianatan, dan kesedihan yang tajam. Tiga pedang menusuk jantung — gambar yang menyakitkan tapi jujur tentang rasa sakit emosional. Kebenaran ini, meski menyakitkan, perlu dihadapi.',
    reversedDeep: 'Ketika terbalik, proses penyembuhan mulai berlangsung. Memaafkan diri sendiri dan orang lain menjadi lebih mungkin. Luka masih ada, tapi pemulihan sedang dimulai.',
    reflection: 'Apakah kamu sedang mengalami kesedihan atau patah hati? Bagaimana kamu bisa memproses rasa sakit ini secara sehat? Pelajaran apa yang bisa kamu ambil dari situasi yang menyakitkan ini?',
    action: 'Izinkan dirimu berduka. Cari dukungan dari orang-orang yang kamu percaya. Proses rasa sakit ini tanpa menghindarinya. Percayalah bahwa waktu dan perhatian akan membawa penyembuhan.',
  },

  'swords-04': {
    uprightDeep: 'Four of Swords menandakan istirahat, pemulihan, dan mundur sementara. Setelah pertempuran, Sang Bodoh berbaring untuk memulihkan energi dan memproses pengalaman. Ini bukan kemalasan — ini adalah pengisian yang diperlukan sebelum pertempuran berikutnya.',
    reversedDeep: 'Ketika terbalik, istirahat yang diperlukan tidak terjadi atau tidak bisa terjadi. Pikiran yang terus berlari mencegah pemulihan sejati. Atau sebaliknya, periode istirahat yang diperlukan akhirnya berakhir dan saatnya kembali beraksi.',
    reflection: 'Apakah kamu memberi dirimu istirahat yang cukup? Apakah kamu benar-benar memulihkan energi atau hanya berhenti sementara? Apa yang mencegahmu dari istirahat sejati?',
    action: 'Izinkan dirimu beristirahat tanpa rasa bersalah. Ciptakan kondisi untuk pemulihan yang nyata — ketenangan, refleksi, dan perawatan diri. Ketika kamu siap, bangkit dengan energi yang telah diperbarui.',
  },

  'swords-05': {
    uprightDeep: 'Five of Swords menggambarkan kemenangan dengan cara yang meragukan dan kekosongan yang mengikutinya. Sang Bodoh memenangkan pertempuran tapi mungkin kehilangan rasa hormat dan ketenangan batin dalam prosesnya. Ada pertanyaan tentang harga kemenangan yang sebenarnya.',
    reversedDeep: 'Ketika terbalik, ada penyesalan atas perilaku masa lalu dan keinginan untuk rekonsiliasi. Mengakui kesalahan adalah langkah pertama. Terkadang tidak ada pemenang sejati dalam konflik.',
    reflection: 'Apakah ada situasi di mana kamu memenangkan argumen tapi kehilangan sesuatu yang lebih penting? Apakah kamu menggunakan taktik yang membuat kamu tidak nyaman? Bagaimana kamu bisa mengatasi konflik dengan cara yang mempertahankan integritas?',
    action: 'Evaluasi cara kamu menghadapi konflik. Pertimbangkan dampak jangka panjang dari cara kemenangan. Cari rekonsiliasi jika ada luka yang belum sembuh.',
  },

  'swords-06': {
    uprightDeep: 'Six of Swords melambangkan transisi dari situasi yang menyakitkan menuju yang lebih damai. Sang Bodoh berangkat dari kesulitan menuju perairan yang lebih tenang. Perjalanan ini mungkin tidak terasa menyenangkan sepenuhnya, tapi arahnya membawa harapan.',
    reversedDeep: 'Ketika terbalik, ada ketidakmampuan atau keengganan untuk meninggalkan situasi yang tidak sehat. Beban masa lalu terus dibawa ke depan, mencegah transisi yang diperlukan.',
    reflection: 'Apakah ada situasi yang perlu kamu tinggalkan demi kebaikanmu sendiri? Apa yang mencegahmu untuk melanjutkan? Bagaimana perubahan ini, meski sulit, membawamu ke arah yang lebih baik?',
    action: 'Beranikan diri untuk bergerak menuju situasi yang lebih sehat. Lepaskan apa yang tidak lagi melayanimu. Percayalah bahwa perubahan ini, meski sulit, membawamu ke arah yang lebih baik.',
  },

  'swords-07': {
    uprightDeep: 'Seven of Swords berkaitan dengan strategi, tipu daya, dan bertindak diam-diam. Sang Bodoh mungkin menghindari tanggung jawab atau ada yang menggunakan tipu muslihat padanya. Ada perasaan bahwa tidak semua kartu terlihat di atas meja.',
    reversedDeep: 'Ketika terbalik, rahasia terungkap atau sang Bodoh memilih untuk jujur. Harga penipuan menjadi jelas — saatnya menghadapi diri sendiri dengan jujur. Atau ada pengakuan bahwa strategi yang licik lebih merusak daripada yang diyakini.',
    reflection: 'Apakah ada situasi di mana kamu tidak sepenuhnya jujur? Apakah kamu merasa seseorang tidak sepenuhnya terbuka denganmu? Bagaimana kejujuran, meski tidak nyaman, bisa membebaskan situasi ini?',
    action: 'Jujurlah pada dirimu sendiri dan orang lain. Hadapi apa yang kamu hindari. Beranikan diri untuk berbicara kebenaran dengan bijak.',
  },

  'swords-08': {
    uprightDeep: 'Eight of Swords menggambarkan perasaan terkungkung dan tidak berdaya. Sang Bodoh merasa dikelilingi dan dipenjara. Namun yang mengikatnya sebagian besar adalah buatan sendiri. Jika ia melepas penutup mata yang mencegahnya mengenali kekuatannya, ia bisa meloloskan diri dari situasi ini.',
    reversedDeep: 'Ketika terbalik, penjara Sang Bodoh semakin menyempit atau justru mengembang untuk membebaskannya. Mungkin keadaan semakin memburuk sehingga benar-benar tidak ada pilihan. Atau sebaliknya, pedang-pedang penjara ini mengendur dan jatuh, membebaskannya.',
    reflection: 'Apakah kamu merasa tidak berdaya? Apakah kamu menunggu seseorang atau sesuatu untuk menyelamatkanmu? Perilaku, sikap, dan keyakinan apa yang menghambatmu? Apa penjara-penjaramu?',
    action: 'Ambil tanggung jawab — victimisasi diri melepaskan tanggung jawab atas hidupmu. Kenali kembali kekuatan pribadimu. Pegang harapan — hal-hal akan membaik.',
  },

  'swords-09': {
    uprightDeep: 'Nine of Swords mewakili kecemasan, mimpi buruk, dan penyiksaan pikiran yang tanpa henti. Sang Bodoh terjaga di malam hari, dihantui oleh apa yang bisa terjadi. Pikiran yang berlarian dalam kegelapan sering kali jauh lebih menakutkan daripada realita yang sebenarnya.',
    reversedDeep: 'Ketika terbalik, ini adalah momen kritis di mana ketakutan bisa semakin memburuk atau Sang Bodoh bisa menemukan jalan keluar dari keputusasaan dan penderitaannya. Ada harapan bahwa dengan bantuan yang tepat, kegelapan bisa terangkat.',
    reflection: 'Ketika kamu berbaring di malam hari, percakapan atau skenario apa yang berputar dalam pikiranmu? Apa yang membuatmu tetap terjaga? Apakah ketakutanmu benar-benar nyata atau amplifikiasi kecemasan?',
    action: 'Hitung angkanya — bandingkan jumlah hal yang kamu khawatirkan dengan jumlah yang benar-benar terjadi. Temukan jangkar di masa kini. Cari dukungan — jangan isolasi dirimu. Cari profesional jika kecemasan tidak tertahankan.',
  },

  'swords-10': {
    uprightDeep: 'Ten of Swords menandai titik terendah yang menyakitkan — kekalahan dan kehancuran yang tampaknya total. Tapi kartu ini juga membawa pesan bahwa yang terburuk sudah berlalu. Matahari mulai terbit di kejauhan. Tidak ada yang tersisa untuk kehilangan, dan dengan cara yang aneh, itu sendiri adalah semacam pembebasan.',
    reversedDeep: 'Ketika terbalik, pedang-pedang yang menekan Sang Bodoh mulai jatuh, dan kekhawatiran serta tekanan yang menghantuinya mulai mereda. Ia mencapai titik terendah, tapi dalam kejatuhan itu, ia juga menemukan harapan. Yang terburuk sudah berlalu.',
    reflection: 'Apakah masalah yang sudah lama kamu coba hindari akhirnya mengejarmu? Apakah mencapai titik terendah justru memberimu rasa lega? Apa yang datang setelah ini akan mengarah pada awal baru.',
    action: 'Hadapi ketakutanmu yang terburuk. Kenali pelajarannya. Berkabunglah — untuk meninggalkan masa lalu, kita perlu melepaskannya sepenuhnya. Pisahkan masa lalu dari masa kini dan masa depanmu. Sembuhkan dirimu.',
  },

  // ── Pentacles ─────────────────────────────────────────────

  'pentacles-01': {
    uprightDeep: 'Ace of Pentacles mewakili awal baru dalam dunia materi dan keuangan. Ini adalah benih kemakmuran yang baru ditanam — sebuah peluang nyata untuk pertumbuhan finansial, material, atau karier. Seperti tanah yang subur, kondisinya ideal untuk sesuatu yang berharga untuk tumbuh.',
    reversedDeep: 'Ketika terbalik, peluang material mungkin terlewatkan atau kondisi untuk pertumbuhan belum matang. Mungkin ada ketidakstabilan finansial atau penundaan dalam mewujudkan potensi material.',
    reflection: 'Apakah ada peluang material atau finansial yang baru terbuka untukmu? Apakah kamu berada dalam posisi yang baik untuk memulai sesuatu yang baru dalam hal sumber daya? Apa yang perlu dipersiapkan?',
    action: 'Ambil langkah praktis pertama untuk mewujudkan peluang ini. Buat rencana yang realistis. Rawat investasi waktumu dan energimu dengan bijak.',
  },

  'pentacles-02': {
    uprightDeep: 'Two of Pentacles melambangkan keseimbangan dan fleksibilitas dalam mengelola berbagai tanggung jawab. Sang Bodoh dengan terampil menjaga dua pentakel berputar — mengelola berbagai aspek kehidupan dengan gesit. Ada kemampuan beradaptasi dalam kartu ini yang memungkinkan seseorang untuk menghadapi perubahan.',
    reversedDeep: 'Ketika terbalik, keseimbangan mulai goyah. Terlalu banyak tanggung jawab atau perubahan yang datang terlalu cepat membuatnya sulit untuk mempertahankan semua bola di udara.',
    reflection: 'Bagaimana kamu mengelola berbagai tanggung jawab dalam hidupmu? Apakah ada area di mana kamu merasa kelelahan karena mencoba menyeimbangkan terlalu banyak hal? Apa yang perlu diprioritaskan?',
    action: 'Evaluasi prioritasmu. Tentukan apa yang benar-benar penting dan apa yang bisa ditunda atau didelegasikan. Cari cara untuk menyederhanakan tanpa mengorbankan apa yang paling penting.',
  },

  'pentacles-03': {
    uprightDeep: 'Three of Pentacles melambangkan kolaborasi, kerja tim, dan keahlian. Tiga pengrajin bekerja sama untuk menciptakan sesuatu yang lebih baik dari apa yang bisa dicapai secara individual. Ada sinergi antara keterampilan, visi, dan eksekusi.',
    reversedDeep: 'Ketika terbalik, dinamika tim mungkin tidak berfungsi dengan baik — ada konflik, kurangnya koordinasi, atau upaya yang tidak selaras. Kualitas pekerjaan mungkin menderita karena kurangnya kerjasama.',
    reflection: 'Bagaimana kamu berkolaborasi dengan orang lain dalam proyek atau tujuan bersama? Apakah ada hambatan dalam komunikasi atau koordinasi tim? Bagaimana kamu bisa berkontribusi lebih efektif pada upaya kolektif?',
    action: 'Investasikan dalam hubungan kerja yang kuat. Komunikasikan dengan jelas tentang peran dan ekspektasi. Hargai kontribusi orang lain dan cari cara untuk bermain sesuai kekuatan masing-masing.',
  },

  'pentacles-04': {
    uprightDeep: 'Four of Pentacles menggambarkan seseorang yang memegang erat apa yang mereka miliki. Ada rasa keamanan dalam kartu ini, tapi juga peringatan bahwa memegang terlalu erat bisa mencegah pertumbuhan. Stabilitas finansial adalah tujuan yang baik, tapi tidak boleh menjadi obsesi.',
    reversedDeep: 'Ketika terbalik, kelekatan berlebihan pada keamanan material bisa mencegah pertumbuhan dan kemungkinan baru. Atau sebaliknya, seseorang mulai belajar untuk melepaskan dan berbagi dengan lebih bebas.',
    reflection: 'Apakah kamu memegang terlalu erat pada sumber daya atau keamananmu? Apakah ketakutan akan kehilangan menghalangimu dari mengambil risiko yang bermakna? Apa yang benar-benar perlu kamu lindungi, dan apa yang bisa kamu lepaskan?',
    action: 'Bedakan antara keamanan yang sehat dan kelekatan yang berlebihan. Temukan cara untuk merasa aman tanpa memegang terlalu erat. Pertimbangkan bagaimana berbagi sumber dayamu bisa menciptakan lebih banyak kelimpahan.',
  },

  'pentacles-05': {
    uprightDeep: 'Five of Pentacles menggambarkan kesulitan material dan perasaan ditinggalkan. Sang Bodoh kekurangan sumber daya dan merasa sendirian dalam perjuangannya. Namun penting untuk diperhatikan bahwa bantuan mungkin lebih dekat daripada yang terlihat — jika saja ia bersedia mencarinya.',
    reversedDeep: 'Ketika terbalik, masa-masa sulit mulai membaik. Sang Bodoh mungkin mulai menemukan jalan keluar dari kesulitannya, baik melalui sumber daya eksternal atau pergeseran perspektif internal.',
    reflection: 'Apakah kamu mengalami kesulitan material atau merasa tidak mendapat dukungan yang kamu butuhkan? Apakah ada bantuan yang ditawarkan tapi kamu ragu menerimanya? Apa yang menghalangimu untuk mencari dukungan?',
    action: 'Jangan biarkan rasa malu atau kesombongan menghalangimu untuk mencari bantuan. Identifikasi sumber dukungan yang ada. Ingat bahwa menerima bantuan memungkinkan kamu untuk memberi kembali di masa depan.',
  },

  'pentacles-06': {
    uprightDeep: 'Six of Pentacles adalah kartu kemurahan hati dan pertukaran yang adil. Siklus memberi dan menerima adalah tema utama. Ini tentang memastikan sumber daya mengalir dengan adil — baik kamu adalah pemberi atau penerima saat ini.',
    reversedDeep: 'Ketika terbalik, dinamika kekuasaan dalam pemberian dan penerimaan menjadi tidak sehat. Mungkin ada pemberian yang datang dengan syarat tersembunyi, atau keresahan tentang ketidakseimbangan dalam pertukaran.',
    reflection: 'Bagaimana perasaanmu tentang memberi dan menerima? Apakah kamu merasa tidak nyaman menerima bantuan? Apakah niatmu murni ketika kamu memberi? Apakah ada ketidakseimbangan dalam pertukaran yang perlu ditangani?',
    action: 'Periksa motivasimu ketika memberi. Terimalah bantuan dengan rasa syukur. Pastikan pertukaran bersifat saling menguntungkan. Ciptakan siklus kemurahan hati yang tulus dalam hidupmu.',
  },

  'pentacles-07': {
    uprightDeep: 'Seven of Pentacles menggambarkan kerja keras yang perlahan membuahkan hasil. Sang Bodoh menatap tujuh koin yang tumbuh di pohon yang ia rawat — ia akhirnya mengambil jeda untuk menghargai apa yang telah dicapai melalui kesabaran dan ketekunan.',
    reversedDeep: 'Ketika terbalik, mungkin ada ketidaksabaran atau usaha yang tidak menghasilkan hasil yang diharapkan. Perlu dilakukan evaluasi tentang di mana sumber daya diinvestasikan dan bagaimana strategi perlu disesuaikan.',
    reflection: 'Bagaimana kamu mengukur kemajuan dalam hidupmu? Apakah kamu memberikan cukup waktu bagi usahamu untuk berbuah? Apa yang sudah berhasil dan apa yang perlu disesuaikan?',
    action: 'Evaluasi pencapaianmu dengan kesabaran. Hargai kemajuan kecil. Beri dirimu hadiah atas pencapaian. Analisis apa yang berhasil dan refokus energi pada itu.',
  },

  'pentacles-08': {
    uprightDeep: 'Eight of Pentacles menggambarkan pengrajin yang berkonsentrasi penuh dalam menyempurnakan keahliannya. Ini adalah kartu dedikasi, komitmen terhadap keunggulan, dan cinta terhadap pekerjaan itu sendiri. Ada kepuasan mendalam dalam proses penguasaan suatu keterampilan.',
    reversedDeep: 'Ketika terbalik, cinta terhadap keahlian mungkin telah memudar. Pekerjaan dilakukan karena kewajiban, bukan passion. Kualitas mungkin menderita akibat kurangnya perhatian dan dedikasi.',
    reflection: 'Apakah kamu sepenuhnya berkomitmen pada pengembangan keahlianmu? Apakah ada area dalam hidupmu di mana kamu hanya melakukan yang minimal? Apa yang bisa mengembalikan semangatmu?',
    action: 'Investasikan dalam pertumbuhan keahlianmu. Temukan kembali apa yang membuatmu jatuh cinta pada pekerjaanmu. Dedikasikan dirimu pada keunggulan dengan sabar.',
  },

  'pentacles-09': {
    uprightDeep: 'Nine of Pentacles melambangkan kemakmuran, kemandirian, dan kepuasan diri yang diperoleh melalui usaha sendiri. Sang Bodoh menikmati buah kerjanya dalam ketenangan dan keanggunan. Ada rasa kelimpahan yang tenang di sini.',
    reversedDeep: 'Ketika terbalik, kekayaan materi mungkin ada tapi kepuasan batin terasa kosong. Atau kemandirian yang dicari datang dengan isolasi yang tidak diinginkan. Ada ketidaksesuaian antara penampilan luar dan perasaan dalam.',
    reflection: 'Apakah kamu menikmati buah kerja kerasmu? Apakah kemakmuran materialmu selaras dengan kekayaan batinmu? Apa yang benar-benar memberimu rasa kecukupan dan kepuasan?',
    action: 'Nikmati pencapaian materialmu dengan rasa syukur. Bagikan kelimpahanmu dengan murah hati. Cari keseimbangan antara kemerdekaan dan keterhubungan.',
  },

  'pentacles-10': {
    uprightDeep: 'Ten of Pentacles melambangkan puncak kesuksesan material dan warisan yang abadi. Ini tentang menciptakan fondasi yang kuat untuk generasi mendatang dan menikmati buah dari investasi jangka panjang. Ada rasa penyelesaian dan kelimpahan yang melampaui kebutuhan individu.',
    reversedDeep: 'Ketika terbalik, ada ketidakstabilan dalam fondasi keluarga atau material. Mungkin ada perselisihan tentang warisan, atau investasi jangka panjang tidak memberikan hasil yang diharapkan.',
    reflection: 'Apa yang ingin kamu wariskan kepada generasi berikutnya — apakah nilai-nilai, sumber daya material, atau keduanya? Bagaimana kamu membangun fondasi yang tahan lama bagi mereka yang datang setelahmu?',
    action: 'Rencanakan jangka panjang. Investasikan dalam hubungan keluarga dan komunitas. Ciptakan warisan yang bermakna melalui nilai-nilai dan tindakanmu.',
  },

  // ── Court Cards — Wands ──────────────────────────────────

  'wands-11': { // Page of Wands
    uprightDeep: 'Page of Wands membawa semangat eksplorasi dan rasa ingin tahu yang menyala-nyala. Ia adalah jiwa muda yang antusias, siap mempelajari hal baru dan mengekspresikan kreativitasnya tanpa hambatan. Ada keberanian naif di sini — keberanian yang belum tahu batasnya, dan justru itu kekuatannya.',
    reversedDeep: 'Ketika terbalik, semangat Page of Wands menjadi tidak fokus atau frustrasi. Energi kreatif yang besar tidak menemukan salurannya, menghasilkan kekacauan atau konflik. Ide-ide besar tanpa eksekusi.',
    reflection: 'Di mana kamu bisa membawa lebih banyak semangat dan kepolosan anak-anak ke dalam kehidupanmu? Apakah ada proyek kreatif yang sudah lama ingin kamu mulai tapi selalu ditunda?',
    action: 'Mulai sesuatu yang baru hari ini — sekecil apapun. Biarkan rasa ingin tahumu memimpinmu. Jangan khawatir sempurna dulu.',
  },

  'wands-12': { // Knight of Wands
    uprightDeep: 'Knight of Wands adalah energi api yang bergerak cepat — penuh passion, berani, dan selalu siap untuk petualangan. Ia bergerak dengan kecepatan dan keyakinan, tapi kadang tanpa pertimbangan matang. Kartu ini mendorong tindakan berani dan pengejaran tujuan dengan semangat penuh.',
    reversedDeep: 'Ketika terbalik, Knight of Wands menjadi gegabah dan impulsif — bertindak tanpa memikirkan konsekuensi. Energinya yang kuat menjadi destruktif atau arahnya berubah-ubah tanpa konsistensi.',
    reflection: 'Apakah kamu bergerak terlalu cepat atau terlalu lambat mengejar tujuanmu? Di mana kamu perlu lebih berani, dan di mana kamu perlu lebih sabar?',
    action: 'Salurankan energimu ke tujuan yang jelas. Tetap fokus pada satu hal sebelum berpindah ke hal lain. Keberanian tanpa arah adalah pemborosan.',
  },

  'wands-13': { // Queen of Wands
    uprightDeep: 'Queen of Wands memancarkan kepercayaan diri, karisma, dan kehangatan yang membesarkan orang lain. Ia adalah pemimpin yang menginspirasi — penuh semangat hidup, kreatif, dan berani. Ia tahu siapa dirinya dan tidak membutuhkan persetujuan orang lain untuk merasa utuh.',
    reversedDeep: 'Ketika terbalik, kepercayaan diri Queen of Wands bisa berubah menjadi arogansi atau kecemburuan. Energinya yang kuat bisa menjadi intimidasi atau kontrol yang berlebihan.',
    reflection: 'Bagaimana kamu memancarkan kehangatan dan kepercayaan diri dalam kehidupanmu? Apakah ada area di mana kamu perlu lebih percaya diri? Atau di mana kepercayaan dirimu sudah melampaui batas?',
    action: 'Jadilah dirimu sepenuhnya tanpa meminta maaf. Ilhami orang-orang di sekitarmu dengan semangatmu yang autentik. Pimpin dengan hati dan api.',
  },

  'wands-14': { // King of Wands
    uprightDeep: 'King of Wands adalah visi besar yang diwujudkan melalui kepemimpinan yang karismatik. Ia tahu ke mana ia pergi dan bagaimana membawa orang lain bersamanya. Ia adalah pemimpin alami — berani, inovatif, dan selalu menginspirasi.',
    reversedDeep: 'Ketika terbalik, King of Wands bisa menjadi impulsif dan otoriter. Visinya yang besar bisa berubah menjadi ego yang tidak terkendali, membuatnya sulit bekerja sama dengan orang lain.',
    reflection: 'Bagaimana kamu menggunakan kekuatanmu untuk memimpin dan menginspirasi orang lain? Apakah visimu untuk masa depan jelas dan menginspirasi?',
    action: 'Ambil peran kepemimpinan dengan percaya diri. Bagikan visimu dengan orang lain. Pimpin dengan integritas dan passion.',
  },

  // ── Court Cards — Cups ────────────────────────────────────

  'cups-11': { // Page of Cups
    uprightDeep: 'Page of Cups adalah jiwa sensitif dan intuitif yang membawa pesan emosional. Ia bermimpi besar dan penuh imajinasi — terbuka untuk hal-hal yang tidak biasa dan kejutan yang menyenangkan. Ia mengajak kita untuk mempercayai intuisi dan terbuka pada kemungkinan tak terduga.',
    reversedDeep: 'Ketika terbalik, kepekaan Page of Cups bisa menjadi sangat emosional atau tidak matang. Mimpi indah mungkin sulit diwujudkan karena kurangnya praktikalitas atau ketakutan yang tidak diakui.',
    reflection: 'Apakah kamu membiarkan dirimu bermimpi dan berimajinasi? Apakah ada pesan dari intuisimu yang perlu kamu dengarkan lebih sungguh-sungguh?',
    action: 'Percayai intuisimu dan biarkan imajinasi berkembang bebas. Catat mimpimu. Buka dirimu pada kejutan dan kemungkinan tak terduga.',
  },

  'cups-12': { // Knight of Cups
    uprightDeep: 'Knight of Cups mengikuti hatinya — ia adalah si romantis sejati, selalu mengejar cinta dan keindahan. Penuh pesona dan idealisme, ia membawa tawaran yang indah. Ia bergerak mengikuti emosi dan intuisinya, tapi kadang kehilangan pijakan realita.',
    reversedDeep: 'Ketika terbalik, Knight of Cups menjadi tidak stabil secara emosional — mudah kecewa ketika realita tidak memenuhi idealisme. Ia mungkin manipulatif atau tidak dapat diandalkan.',
    reflection: 'Apakah kamu mengejar sesuatu yang benar-benar bermakna atau hanya impian yang tidak realistis? Bagaimana kamu menyeimbangkan idealisme dengan realita?',
    action: 'Ikuti hatimu tapi tetap membumi. Bedakan antara cinta yang nyata dan romansa yang idealis. Tetap setia pada komitmenmu.',
  },

  'cups-13': { // Queen of Cups
    uprightDeep: 'Queen of Cups adalah sosok yang penuh empati dan kebijaksanaan emosional. Ia bisa merasakan apa yang orang lain rasakan sebelum mereka mengatakannya. Ia adalah penyembuh dan pengasuh yang intuitif — penuh kasih tanpa kehilangan dirinya sendiri.',
    reversedDeep: 'Ketika terbalik, Queen of Cups mungkin kehilangan keseimbangan antara memberi dan menerima. Ia bisa menjadi terlalu bergantung secara emosional atau menggunakan empatinya untuk manipulasi.',
    reflection: 'Bagaimana kamu merawat dirimu sendiri sambil tetap hadir untuk orang lain? Apakah batasmu sehat? Apakah kamu memberi dari tempat yang penuh atau dari kekosongan?',
    action: 'Rawat dirimu sendiri sebelum merawat orang lain. Tetapkan batas emosional yang sehat. Gunakan empatimu sebagai kekuatan, bukan beban.',
  },

  'cups-14': { // King of Cups
    uprightDeep: 'King of Cups telah menguasai dunia emosi — ia bisa merasakan dengan dalam sekaligus bertindak dengan kepala dingin. Ia adalah pemimpin yang bijak dan penuh kasih, yang bisa menjaga stabilitas emosi bahkan di tengah badai. Ia adalah penyeimbang antara hati dan pikiran.',
    reversedDeep: 'Ketika terbalik, King of Cups menekan emosinya berlebihan atau justru dikuasai olehnya. Keseimbangan yang biasanya ia miliki hilang, menyebabkan ketidakstabilan emosi atau pengambilan keputusan yang buruk.',
    reflection: 'Bagaimana kamu mengelola emosimu dalam situasi sulit? Apakah kamu bisa menjadi tumpuan bagi orang lain tanpa kehilangan dirimu sendiri?',
    action: 'Praktikkan keseimbangan antara perasaan dan pikiran. Jadilah tempat yang aman bagi orang-orang di sekitarmu. Bimbing dengan hati yang tenang.',
  },

  // ── Court Cards — Swords ──────────────────────────────────

  'swords-11': { // Page of Swords
    uprightDeep: 'Page of Swords adalah pikiran yang tajam dan rasa ingin tahu yang besar. Ia mengajukan pertanyaan-pertanyaan sulit dan mencari kebenaran tanpa rasa takut. Ia belajar dengan cepat dan komunikasinya langsung. Tapi ia masih muda dalam caranya — kadang terlalu tajam tanpa kebijaksanaan.',
    reversedDeep: 'Ketika terbalik, ketajaman Page of Swords menjadi tajam mulut yang melukai. Gosip, fitnah, atau kata-kata yang diucapkan tanpa berpikir bisa menciptakan kerusakan yang tidak disengaja.',
    reflection: 'Apakah kamu menggunakan kecerdasanmu untuk membangun atau untuk menghancurkan? Apakah ada kebenaran yang perlu kamu cari atau sampaikan dengan lebih bijak?',
    action: 'Gunakan kecerdasanmu secara konstruktif. Pikirkan sebelum berbicara. Cari fakta sebelum menarik kesimpulan.',
  },

  'swords-12': { // Knight of Swords
    uprightDeep: 'Knight of Swords bergerak cepat menuju tujuannya dengan tekad yang tak tergoyahkan. Ia tajam, langsung, dan tidak takut konflik. Ia adalah pejuang yang bersemangat untuk kebenaran dan keadilan, tapi kadang terlalu keras dan tidak peka.',
    reversedDeep: 'Ketika terbalik, Knight of Swords menjadi impulsif dan agresif — bertindak tanpa berpikir dan melukai orang-orang di sekitarnya. Tekadnya yang kuat bisa berubah menjadi kekakuan yang merusak.',
    reflection: 'Apakah kamu bergerak terlalu cepat tanpa mempertimbangkan dampak pada orang lain? Di mana keberanian diperlukan, dan di mana kebijaksanaan lebih penting?',
    action: 'Perlambat langkahmu dan pertimbangkan dampak kata-kata dan tindakanmu. Keberanian tanpa kebijaksanaan bisa merusak lebih dari yang membangun.',
  },

  'swords-13': { // Queen of Swords
    uprightDeep: 'Queen of Swords adalah kejernihan pikiran yang terpasangkan dengan pengalaman yang dalam. Ia melihat melalui ilusi dan berbicara kebenaran dengan langsung tapi adil. Ia telah melalui banyak hal dan kesedihan telah mengasah kebijaksanaannya. Ia tidak takut sendirian dalam kebenarannya.',
    reversedDeep: 'Ketika terbalik, Queen of Swords menjadi dingin dan kejam — menggunakan kecerdasannya untuk melukai daripada menyembuhkan. Luka masa lalu mungkin menyebabkan ia menutup diri dan menjadi tidak berperasaan.',
    reflection: 'Bagaimana kamu menggunakan kejernihan dan kemandirian pikirmu? Apakah kamu menyampaikan kebenaran dengan cara yang membangun atau melukai?',
    action: 'Berbicara kebenaran dengan penuh kasih dan kejelasan. Jaga batasmu tanpa kehilangan kehangatan. Gunakan kebijaksanaanmu untuk membimbing, bukan menghakimi.',
  },

  'swords-14': { // King of Swords
    uprightDeep: 'King of Swords mewakili otoritas intelektual tertinggi — pikiran yang jernih, penilaian yang adil, dan komunikasi yang tepat. Ia adalah pemimpin yang berpikir sebelum bertindak, mempertimbangkan semua sudut pandang, dan membuat keputusan berdasarkan logika dan prinsip.',
    reversedDeep: 'Ketika terbalik, King of Swords menggunakan kecerdasannya untuk kontrol dan manipulasi. Keadilannya menjadi keras dan tanpa belas kasihan. Atau ia mungkin tidak bisa mengambil keputusan karena terlalu banyak menganalisis.',
    reflection: 'Bagaimana kamu menggunakan otoritas dan kecerdasanmu? Apakah keputusanmu benar-benar adil dan bijak, atau dipengaruhi oleh ego?',
    action: 'Ambil keputusan berdasarkan fakta dan prinsip, bukan emosi atau ego. Komunikasikan dengan jelas dan adil. Gunakan kekuatanmu untuk melindungi, bukan mendominasi.',
  },

  // ── Court Cards — Pentacles ───────────────────────────────

  'pentacles-11': { // Page of Pentacles
    uprightDeep: 'Page of Pentacles adalah murid yang rajin dan tekun — penuh semangat untuk belajar hal praktis dan membangun fondasi yang kuat. Ia sabar, terencana, dan bersedia melakukan pekerjaan yang diperlukan. Ada potensi besar di sini yang menunggu untuk dikembangkan.',
    reversedDeep: 'Ketika terbalik, Page of Pentacles menjadi malas atau tidak fokus dalam membangun keterampilannya. Ia mungkin terlalu bermimpi tanpa mengambil langkah praktis, atau terlalu materialistis tanpa pertumbuhan nyata.',
    reflection: 'Apakah kamu berinvestasi dalam pengembangan dirimu dengan kesabaran dan ketekunan? Apakah ada keterampilan baru yang perlu kamu pelajari untuk mencapai tujuanmu?',
    action: 'Tetapkan tujuan belajar yang jelas dan praktis. Ambil langkah kecil yang konsisten setiap hari. Kesabaran dan ketekunan akan membuahkan hasil.',
  },

  'pentacles-12': { // Knight of Pentacles
    uprightDeep: 'Knight of Pentacles bergerak lambat tapi pasti — ia adalah penjelmaan ketekunan dan keandalan. Ia tidak terburu-buru, tapi setiap langkah yang ia ambil kokoh dan terencana. Ia adalah orang yang bisa kamu andalkan untuk menyelesaikan apa yang ia mulai.',
    reversedDeep: 'Ketika terbalik, Knight of Pentacles menjadi stagnan atau terlalu kaku. Kehati-hatiannya berubah menjadi ketidakmampuan untuk beradaptasi dengan perubahan. Rutinitas menjadi penjara.',
    reflection: 'Apakah kamu bergerak dengan kecepatan yang tepat menuju tujuanmu? Apakah kamu terlalu lambat dan stagnan, atau terlalu kaku dengan rencanamu?',
    action: 'Tetap teguh dan konsisten dalam usahamu. Tapi juga belajar untuk beradaptasi ketika keadaan berubah. Keandalan adalah kekuatan besar.',
  },

  'pentacles-13': { // Queen of Pentacles
    uprightDeep: 'Queen of Pentacles adalah gambaran kemakmuran yang diwujudkan melalui kebijaksanaan praktis dan kasih sayang. Ia menciptakan rumah dan lingkungan yang subur — tempat di mana orang-orang merasa aman dan dirawat. Ia mengelola sumber daya dengan bijak dan murah hati.',
    reversedDeep: 'Ketika terbalik, Queen of Pentacles mungkin kelelahan karena terlalu banyak memberi tanpa mengisi ulang dirinya sendiri. Atau ia menjadi terlalu materialistis, mengukur segalanya dari nilai finansialnya.',
    reflection: 'Apakah kamu merawat dirimu sendiri sama seperti kamu merawat orang lain dan lingkunganmu? Apakah ada keseimbangan antara memberi dan menerima dalam hidupmu?',
    action: 'Ciptakan lingkungan yang memupuk pertumbuhan dan kesejahteraan. Rawat dirimu sendiri dengan kelembutan yang sama seperti kamu merawat orang lain.',
  },

  'pentacles-14': { // King of Pentacles
    uprightDeep: 'King of Pentacles adalah perwujudan kemakmuran dan kesuksesan material yang dicapai melalui kerja keras dan ketekunan jangka panjang. Ia adalah pemimpin bisnis yang bijak — andal, murah hati, dan pragmatis. Ia tahu cara mengubah sumber daya menjadi kemakmuran yang berkelanjutan.',
    reversedDeep: 'Ketika terbalik, King of Pentacles menjadi terlalu materialistis atau pelit. Kesuksesannya membutakannya dari nilai-nilai yang lebih dalam. Atau ia menjadi terlalu konservatif, takut risiko yang diperlukan untuk pertumbuhan.',
    reflection: 'Bagaimana kamu mendefinisikan kesuksesan? Apakah kemakmuran materialmu selaras dengan kekayaan batinmu dan nilai-nilaimu?',
    action: 'Bangun kekayaan dengan integritas dan visi jangka panjang. Gunakan sumber dayamu untuk menciptakan nilai bagi orang lain. Kemakmuran sejati mencakup lebih dari sekadar uang.',
  },
};

/**
 * Mendapatkan enriched meaning untuk kartu tertentu
 * Fallback ke undefined jika kartu tidak ada dalam database
 */
export function getEnrichedMeaning(cardId: string): EnrichedMeaning | undefined {
  return enrichedMeanings[cardId];
}