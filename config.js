// ============================================================
//  CONFIG UTAMA — ubah hanya di sini kalau ngrok ganti link!
// ============================================================

const NGROK_URL = 'https://3914-180-241-240-100.ngrok-free.app';

// Daftar nomor WhatsApp yang diizinkan mengakses perintah rahasia PPDB
// Gunakan format angka berawalan kode negara (contoh: 62) tanpa karakter lain
const ADMIN_PPDB = [
    '6281313972866', // Ganti dengan nomor Anda
    '6289876543210'  // Tambahkan nomor admin lain jika ada, pisahkan dengan koma
];

module.exports = { NGROK_URL, ADMIN_PPDB };