import { Spread } from './types';

export const spreads: Spread[] = [
  {
    id: 'single',
    name: 'Single Card',
    nameCn: 'Kartu Tunggal',
    description: 'Ramalan cepat, dapatkan petunjuk singkat atau kartu harian',
    positions: [
      {
        id: 'single-1',
        name: 'The Card',
        nameCn: 'Petunjuk',
        description: 'Pesan inti atau saran untuk situasi saat ini'
      }
    ]
  },
  {
    id: 'three-card',
    name: 'Three Card Spread',
    nameCn: 'Tiga Kartu',
    description: 'Susunan klasik Masa Lalu-Kini-Masa Depan',
    positions: [
      {
        id: 'three-1',
        name: 'Past',
        nameCn: 'Masa Lalu',
        description: 'Faktor masa lalu yang memengaruhi situasi saat ini'
      },
      {
        id: 'three-2',
        name: 'Present',
        nameCn: 'Kini',
        description: 'Kondisi dan tantangan saat ini'
      },
      {
        id: 'three-3',
        name: 'Future',
        nameCn: 'Masa Depan',
        description: 'Kemungkinan hasil jika terus di jalan yang sama'
      }
    ]
  },
  {
    id: 'two-options',
    name: 'Two Options Spread',
    nameCn: 'Dua Pilihan',
    description: 'Analisis dua pilihan, kelebihan, kekurangan, dan arah masing-masing',
    positions: [
      {
        id: 'two-options-1',
        name: 'Current Situation',
        nameCn: 'Situasi Saat Ini',
        description: 'Kondisi inti yang kamu hadapi dalam mengambil keputusan ini'
      },
      {
        id: 'two-options-2',
        name: 'Option A Process',
        nameCn: 'Proses Pilihan A',
        description: 'Proses dan tantangan jika memilih A'
      },
      {
        id: 'two-options-3',
        name: 'Option A Outcome',
        nameCn: 'Hasil Pilihan A',
        description: 'Kemungkinan hasil akhir jika memilih A'
      },
      {
        id: 'two-options-4',
        name: 'Option B Process',
        nameCn: 'Proses Pilihan B',
        description: 'Proses dan tantangan jika memilih B'
      },
      {
        id: 'two-options-5',
        name: 'Option B Outcome',
        nameCn: 'Hasil Pilihan B',
        description: 'Kemungkinan hasil akhir jika memilih B'
      }
    ]
  },
  {
    id: 'relationship',
    name: 'Relationship Spread',
    nameCn: 'Hubungan',
    description: 'Analisis mendalam hubungan romantis atau interpersonal',
    positions: [
      {
        id: 'relationship-1',
        name: 'Your Feelings',
        nameCn: 'Perasaanmu',
        description: 'Kondisi batin dan sikapmu dalam hubungan ini'
      },
      {
        id: 'relationship-2',
        name: "Other's Feelings",
        nameCn: 'Perasaan Mereka',
        description: 'Kondisi batin dan sikap pihak lain dalam hubungan ini'
      },
      {
        id: 'relationship-3',
        name: 'Connection',
        nameCn: 'Kondisi Hubungan',
        description: 'Pola interaksi dan kualitas hubungan saat ini'
      },
      {
        id: 'relationship-4',
        name: 'Challenge',
        nameCn: 'Tantangan Hubungan',
        description: 'Hambatan yang perlu dihadapi dan diatasi dalam hubungan ini'
      },
      {
        id: 'relationship-5',
        name: 'Potential',
        nameCn: 'Arah Hubungan',
        description: 'Tren perkembangan dan kemungkinan masa depan hubungan ini'
      }
    ]
  },
  {
    id: 'timeline',
    name: 'Timeline Spread',
    nameCn: 'Aliran Waktu',
    description: 'Telusuri akar masalah, lihat alur perkembangan dan arah tindakan',
    positions: [
      {
        id: 'timeline-1',
        name: 'Root Cause',
        nameCn: 'Akar Masalah',
        description: 'Penyebab mendalam dan asal-usul situasi ini'
      },
      {
        id: 'timeline-2',
        name: 'Past Influence',
        nameCn: 'Pengaruh Masa Lalu',
        description: 'Bagaimana pengalaman masa lalu memengaruhi situasi saat ini'
      },
      {
        id: 'timeline-3',
        name: 'Present',
        nameCn: 'Saat Ini',
        description: 'Kondisi inti dan faktor kunci saat ini'
      },
      {
        id: 'timeline-4',
        name: 'Near Future',
        nameCn: 'Tren Jangka Pendek',
        description: 'Arah perkembangan situasi dalam waktu dekat'
      },
      {
        id: 'timeline-5',
        name: 'Advice',
        nameCn: 'Saran Tindakan',
        description: 'Tindakan yang sebaiknya kamu ambil atau hal yang perlu diperhatikan'
      }
    ]
  },
  {
    id: 'celtic-cross',
    name: 'Celtic Cross',
    nameCn: 'Salib Celtic',
    description: 'Analisis mendalam, memahami masalah dari semua sudut pandang',
    positions: [
      {
        id: 'celtic-1',
        name: 'Present',
        nameCn: 'Kondisi Sekarang',
        description: 'Situasi inti saat ini'
      },
      {
        id: 'celtic-2',
        name: 'Challenge',
        nameCn: 'Tantangan',
        description: 'Hambatan atau tantangan utama yang dihadapi'
      },
      {
        id: 'celtic-3',
        name: 'Past',
        nameCn: 'Masa Lalu',
        description: 'Kejadian masa lalu yang menyebabkan situasi saat ini'
      },
      {
        id: 'celtic-4',
        name: 'Future',
        nameCn: 'Masa Depan Dekat',
        description: 'Hal yang akan segera terjadi'
      },
      {
        id: 'celtic-5',
        name: 'Above',
        nameCn: 'Tujuan',
        description: 'Tujuanmu atau hasil terbaik yang mungkin dicapai'
      },
      {
        id: 'celtic-6',
        name: 'Below',
        nameCn: 'Bawah Sadar',
        description: 'Faktor dari alam bawah sadar'
      },
      {
        id: 'celtic-7',
        name: 'Advice',
        nameCn: 'Saran',
        description: 'Sikap atau tindakan yang sebaiknya kamu ambil'
      },
      {
        id: 'celtic-8',
        name: 'External',
        nameCn: 'Pengaruh Eksternal',
        description: 'Pengaruh lingkungan sekitar dan orang lain'
      },
      {
        id: 'celtic-9',
        name: 'Hopes/Fears',
        nameCn: 'Harapan & Ketakutan',
        description: 'Harapan atau ketakutan terdalam dalam hatimu'
      },
      {
        id: 'celtic-10',
        name: 'Outcome',
        nameCn: 'Hasil Akhir',
        description: 'Kemungkinan hasil yang paling mungkin terjadi'
      }
    ]
  }
];

export function getSpreadById(id: string): Spread | undefined {
  return spreads.find(spread => spread.id === id);
}

export function getDefaultSpread(): Spread {
  return spreads[1]; // Tiga kartu sebagai default
}
