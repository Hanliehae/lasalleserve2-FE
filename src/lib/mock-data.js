export const getAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`
  ];
};

// Fungsi untuk mendapatkan tahun ajaran saat ini
export const getAcademicYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  // Asumsi tahun ajaran Juli-Juni
  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

// Fungsi untuk mendapatkan opsi semester
export const getSemesterOptions = () => [
  { value: 'all', label: 'Semua Semester' },
  { value: 'ganjil', label: 'Ganjil' },
  { value: 'genap', label: 'Genap' },
];

// Fungsi untuk mendapatkan semester dari tanggal
export const getSemesterFromDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // Januari = 1, Desember = 12
  
  // Semester Ganjil: Agustus - Januari (8-1)
  // Semester Genap: Februari - Juli (2-7)
  if (month >= 8 || month <= 1) {
    return 'ganjil';
  } else {
    return 'genap';
  }
};

// Fungsi untuk mendapatkan semester dan tahun ajaran lengkap
export const getAcademicYearAndSemester = (date = new Date()) => {
  const academicYear = getAcademicYear(date);
  const semester = getSemesterFromDate(date);
  return { academicYear, semester };
};

export const mockAssets = [
  {
    id: 'a1',
    acquisitionYear: "2024/2025",
    name: 'Ruang Seminar A',
    category: 'ruangan',
    location: 'Gedung Agustinus',
    totalStock: 1,
    availableStock: 1,
    condition: 'baik',
    description: 'Kapasitas 100 orang, dilengkapi proyektor dan sound system',
  },
  {
    id: 'a2',
    acquisitionYear: "2024/2025",
    name: 'Ruang Meeting B',
    category: 'ruangan',
    location: 'Gedung Josephus',
    totalStock: 1,
    availableStock: 0,
    condition: 'baik',
    description: 'Kapasitas 20 orang, AC, whiteboard',
  },
  {
    id: 'a7',
    acquisitionYear: "2024/2025",
    name: 'Ruang Kuliah C1',
    category: 'ruangan',
    location: 'Gedung Katarina',
    totalStock: 1,
    availableStock: 1,
    condition: 'baik',
    description: 'Kapasitas 50 orang, LCD proyektor, AC',
  },
  {
    id: 'a8',
    acquisitionYear: "2024/2025",
    name: 'Lab Komputer',
    category: 'ruangan',
    location: 'Gedung Katarina',
    totalStock: 1,
    availableStock: 1,
    condition: 'baik',
    description: '30 unit PC, AC, proyektor',
  },
  {
    id: 'a3',
    acquisitionYear: "2024/2025",
    name: 'Proyektor LCD',
    category: 'fasilitas',
    location: 'Gedung Agustinus',
    totalStock: 15,
    availableStock: 8,
    condition: 'baik',
    description: 'Proyektor portable untuk kegiatan akademik',
  },
  {
    id: 'a4',
    acquisitionYear: "2024/2025",
    name: 'Kursi Lipat',
    category: 'fasilitas',
    location: 'Gedung Josephus',
    totalStock: 200,
    availableStock: 150,
    condition: 'baik',
    description: 'Kursi lipat untuk acara outdoor/indoor',
  },
  {
    id: 'a5',
    name: 'Sound System',
    category: 'fasilitas',
    location: 'Gedung Agustinus',
    totalStock: 5,
    availableStock: 2,
    condition: 'baik',
    description: 'Sound system lengkap dengan mic wireless',
  },
  {
    id: 'a6',
    name: 'Laptop Dell',
    category: 'fasilitas',
    location: 'Gedung Katarina',
    totalStock: 10,
    availableStock: 4,
    condition: 'baik',
    description: 'Laptop untuk presentasi dan keperluan akademik',
  },
  {
    id: 'a9',
    name: 'Mic Wireless',
    category: 'fasilitas',
    location: 'Gedung Josephus',
    totalStock: 20,
    availableStock: 0,
    condition: 'baik',
    description: 'Microphone wireless untuk acara',
  },
  {
    id: 'a10',
    name: 'Kamera DSLR',
    category: 'fasilitas',
    location: 'Gedung Agustinus',
    totalStock: 3,
    availableStock: 2,
    condition: 'baik',
    description: 'Kamera DSLR untuk dokumentasi',
  },
];

export const mockLoans = [
  {
    id: 'l1',
    borrowerId: '4',
    borrowerName: 'Mahasiswa Test',
    academicYear: "2024/2025",
    semester: "ganjil",
    facilities: [{ id: 'a3', name: 'Proyektor LCD', quantity: 2 }],
    startDate: '2025-10-15',
    startTime: '08:00',
    endDate: '2025-10-17', 
    endTime: '17:00',
    status: 'menunggu',
    purpose: 'Untuk seminar proposal skripsi',
    createdAt: '2025-10-13T10:00:00Z',
    updatedAt: '2025-10-13T10:00:00Z',
  },
  {
    id: 'l2',
    borrowerId: '5',
    borrowerName: 'Dosen Test',
    academicYear: "2024/2025",
    semester: "ganjil",
    roomId: 'a1',
    roomName: 'Ruang Seminar A',
    facilities: [],
    startDate: '2025-10-20',
    endDate: '2025-10-20',
    status: 'disetujui',
    purpose: 'Workshop Machine Learning',
    createdAt: '2025-10-10T14:30:00Z',
    updatedAt: '2025-10-10T14:30:00Z',
    approvedBy: 'Admin BUF',
  },
  {
    id: 'l3',
    borrowerId: '4',
    borrowerName: 'Mahasiswa Test',
    academicYear: "2024/2025",
    semester: "ganjil",
    facilities: [{ id: 'a4', name: 'Kursi Lipat', quantity: 50 }],
    startDate: '2025-10-14',
    endDate: '2025-10-14',
    status: 'selesai',
    purpose: 'Acara organisasi mahasiswa',
    createdAt: '2025-10-12T09:00:00Z',
    updatedAt: '2025-10-14T17:00:00Z',
    returnedAt: '2025-10-14T17:00:00Z', 
  },
  {
    id: 'l4',
    borrowerId: '5',
    borrowerName: 'Dosen Test',
    academicYear: "2024/2025",
    semester: "ganjil",
    roomId: 'a1',
    roomName: 'Ruang Seminar A',
    facilities: [{ id: 'a5', name: 'Sound System', quantity: 1 }],
    startDate: '2025-10-08',
    endDate: '2025-10-10',
    status: 'selesai',
    purpose: 'Kuliah tamu',
    createdAt: '2025-10-05T11:00:00Z',
    updatedAt: '2025-10-10T18:00:00Z',
    approvedBy: 'Admin BUF',
  },
];

export const mockDamageReports = [
  {
    id: 'r1',
    assetId: 'a3',
    assetName: 'Proyektor LCD',
    reportedBy: '4',
    reporterName: 'Mahasiswa Test',
    academicYear: "2024/2025",
    semester: "ganjil",
    loanId: 'l4',
    description: 'Lampu proyektor redup, kemungkinan perlu diganti',
    photoUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
    priority: 'sedang',
    status: 'menunggu',
    createdAt: '2025-10-11T15:00:00Z',
    updatedAt: '2025-10-11T15:00:00Z',
  },
  {
    id: 'r2',
    assetId: 'a6',
    assetName: 'Laptop Dell',
    reportedBy: '2',
    reporterName: 'Staf BUF',
    academicYear: "2024/2025",
    semester: "ganjil",
    description: 'Keyboard rusak beberapa tombol tidak berfungsi',
    photoUrl: 'https://images.unsplash.com/photo-1593642532400-2682810df593?w=800&q=80',
    priority: 'tinggi',
    status: 'dalam_perbaikan',
    assignedTo: 'Teknisi IT',
    createdAt: '2025-10-09T10:30:00Z',
    updatedAt: '2025-10-12T08:00:00Z',
  },
  {
    id: 'r3',
    assetId: 'a4',
    assetName: 'Kursi Lipat',
    reportedBy: '1',
    reporterName: 'Admin BUF',
    academicYear: "2024/2025",
    semester: "ganjil",
    description: '5 unit kursi engsel patah',
    priority: 'rendah',
    status: 'selesai',
    assignedTo: 'Teknisi Umum',
    createdAt: '2025-10-05T13:00:00Z',
    updatedAt: '2025-10-10T16:00:00Z',
  },
];

export const getMockDashboardStats = (role) => {
  return {
    totalAssets: mockAssets.length,
    totalLoans: mockLoans.length,
    pendingLoans: mockLoans.filter(l => l.status === 'menunggu').length,
    activeLoans: mockLoans.filter(l => l.status === 'selesai').length,
    totalReports: mockDamageReports.length,
    pendingReports: mockDamageReports.filter(r => r.status === 'menunggu').length,
    lowStockAssets: mockAssets.filter(a => a.availableStock < a.totalStock * 0.2).length,
    overdueLoans: mockLoans.filter(l => l.status === 'overdue').length,
  };
};