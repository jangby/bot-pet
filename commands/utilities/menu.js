/**
 * COMMAND: !menu
 * Menampilkan daftar semua fitur baru yang tersedia di bot.
 * Dibagi menjadi 6 kategori utama dengan deskripsi singkat setiap perintah.
 * 
 * Tidak memerlukan library tambahan.
 * 
 * Contoh: !menu
 *         !menu utilitas
 *         !menu moderasi
 *         !menu sosial
 *         !menu ai
 *         !menu download
 *         !menu hiburan
 */

// ──────────────────────────────────────────────────────────────────
// DATA MENU PER KATEGORI
// ──────────────────────────────────────────────────────────────────

const MENU_DATA = {
    utilitas: {
        emoji: '🔧',
        judul: 'UTILITAS',
        warna: '━',
        daftar: [
            ['!stiker / !sticker', 'Ubah gambar/GIF/video jadi stiker WA'],
            ['!toimg',             'Ubah stiker jadi gambar biasa (PNG)'],
            ['!hd',               'Tingkatkan kualitas gambar via AI Upscaler'],
            ['!nulis [teks]',     'Ubah teks jadi gambar tulisan tangan'],
            ['!gdrive',           'Upload media ke Google Drive'],
            ['!ingatkan [waktu] | [pesan]', 'Buat alarm/pengingat di grup'],
            ['!jadwal [hari] | [kegiatan]', 'Simpan & lihat jadwal grup'],
            ['!vote [A] | [B]',  'Buat polling/voting instan'],
            ['!ss [link]',        'Screenshot halaman website'],
            ['!qr [teks/link]',   'Buat QR Code dari teks atau link'],
            ['!ruler [angka] [dari] ke [ke]', 'Konversi satuan (panjang/berat/suhu/kecepatan)'],
        ]
    },
    moderasi: {
        emoji: '🛡️',
        judul: 'MODERASI ADMIN',
        daftar: [
            ['!tutup',           'Kunci grup — hanya admin bisa chat'],
            ['!buka',            'Buka kunci — semua anggota bisa chat'],
            ['!kick [@tag]',     'Tendang anggota dari grup'],
            ['!add [nomor]',     'Tambah anggota baru ke grup'],
            ['!tagall / !everyone', 'Tag/sebut semua anggota sekaligus'],
            ['!antilink on/off', 'Aktifkan/matikan auto-kick pengirim link'],
        ]
    },
    sosial: {
        emoji: '💬',
        judul: 'SOSIAL GRUP',
        daftar: [
            ['!intro',              'Kirim template perkenalan anggota baru'],
            ['!absen [judul]',      'Buka sesi absensi grup'],
            ['!hadir',              'Daftar hadir di sesi absensi aktif'],
            ['!jodoh [@A] | [@B]',  'Cek persentase kecocokan dua orang'],
            ['!ganteng [@tag]',     'Cek persentase kegantengan (random)'],
            ['!cantik [@tag]',      'Cek persentase kecantikan (random)'],
            ['!confess [no] | [pesan]', 'Kirim pesan anonim via PM ke tujuan'],
        ]
    },
    ai: {
        emoji: '🤖',
        judul: 'AI & MANIPULASI MEDIA',
        daftar: [
            ['!ai [pertanyaan]',        'Tanya jawab dengan AI (Gemini/ChatGPT)'],
            ['!wiki [kata kunci]',      'Cari ringkasan Wikipedia Indonesia'],
            ['!cuaca [kota]',           'Info cuaca hari ini berdasarkan kota'],
            ['!gempa',                  'Info gempa terbaru dari BMKG (gratis!)'],
            ['!translate [bahasa] [teks]', 'Terjemahkan teks ke bahasa lain'],
            ['!rembg',                  'Hapus background gambar via AI'],
            ['!stickerbg',              'Buat stiker tanpa background via AI'],
            ['!vn [teks]',              'Ubah teks jadi pesan suara (Voice Note)'],
            ['!anime',                  'Ubah foto wajah jadi karakter anime'],
            ['!lirik [artis - judul]',  'Cari lirik lagu'],
        ]
    },
    download: {
        emoji: '⬇️',
        judul: 'MEDIA DOWNLOADER',
        daftar: [
            ['!tt [link]',    'Download video TikTok tanpa watermark'],
            ['!ytmp3 [link]', 'Download audio YouTube jadi MP3'],
            ['!ig [link]',    'Download Instagram Reels/Foto'],
            ['!fb [link]',    'Download video Facebook'],
            ['!pin [link]',   'Download media Pinterest'],
            ['!twit [link]',  'Download video Twitter/X'],
        ]
    },
    hiburan: {
        emoji: '🎉',
        judul: 'HIBURAN & RANDOM',
        daftar: [
            ['!quotes / !kata', 'Tampilkan kata bijak/quotes acak'],
            ['!pantun',         'Tampilkan pantun jenaka acak'],
            ['!fakta',          'Tampilkan fakta unik dunia'],
            ['!memeindo',       'Tampilkan meme random lokal'],
            ['!joke / !bapak2', 'Tampilkan jokes receh bapak-bapak'],
        ]
    }
};

// ──────────────────────────────────────────────────────────────────
// HELPER: Bangun teks menu per kategori
// ──────────────────────────────────────────────────────────────────

function buatTeksMenu(kunciKategori) {
    const kategori = MENU_DATA[kunciKategori];
    if (!kategori) return null;

    let teks = `${kategori.emoji} *${kategori.judul}*\n`;
    teks += `${'─'.repeat(28)}\n`;
    kategori.daftar.forEach(([cmd, deskripsi]) => {
        teks += `• \`${cmd}\`\n  _${deskripsi}_\n`;
    });
    return teks;
}

function buatMenuLengkap(namaBot, namaGrup, jumlahCommand) {
    const sekarang = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    let teks = '';

    // ─── HEADER ───
    teks += `╔══════════════════════════╗\n`;
    teks += `║  🌟 *NEXUS BOT — MENU*  🌟  ║\n`;
    teks += `╚══════════════════════════╝\n\n`;
    teks += `👥 Grup: _${namaGrup}_\n`;
    teks += `🕐 ${sekarang} WIB\n`;
    teks += `📦 Total Fitur: *${jumlahCommand} perintah*\n\n`;

    // ─── DAFTAR KATEGORI ───
    teks += `*Ketik perintah di bawah untuk info lengkap:*\n`;
    teks += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    Object.entries(MENU_DATA).forEach(([kunci, kat]) => {
        const jumlahFitur = kat.daftar.length;
        teks += `${kat.emoji} *!menu ${kunci}*  `;
        teks += `_(${jumlahFitur} fitur)_\n`;
    });

    teks += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // ─── FOOTER ───
    teks += `💡 *Tips:* Ketik \`!menu [kategori]\` untuk melihat detail.\n`;
    teks += `Contoh: \`!menu ai\` atau \`!menu download\`\n\n`;
    teks += `_Nexus Bot • Made with ❤️ in Indonesia_`;

    return teks;
}

// ──────────────────────────────────────────────────────────────────
// MAIN COMMAND
// ──────────────────────────────────────────────────────────────────

module.exports = {
    name: 'menu',
    description: 'Tampilkan daftar semua fitur bot yang tersedia',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderJid.replace(/:\d+/, '').split('@')[0];

        // Hitung total command dari semua kategori
        const totalCommand = Object.values(MENU_DATA)
            .reduce((total, kat) => total + kat.daftar.length, 0);

        // Ambil nama grup (jika di dalam grup)
        let namaGrup = 'Chat Pribadi';
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                namaGrup = metadata.subject || 'Grup';
            } catch (_) {
                namaGrup = 'Grup';
            }
        }

        // Cek apakah ada argumen kategori
        const kunciKategori = args[0]?.toLowerCase();

        if (kunciKategori && MENU_DATA[kunciKategori]) {
            // ─── Tampilkan menu satu kategori spesifik ───
            const teksKategori = buatTeksMenu(kunciKategori);
            const jumlahFitur = MENU_DATA[kunciKategori].daftar.length;

            return await sock.sendMessage(chatId, {
                text:
`${teksKategori}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_${jumlahFitur} fitur tersedia di kategori ini._
_Ketik \`!menu\` untuk kembali ke menu utama._`
            }, { quoted: msg });
        }

        if (kunciKategori && !MENU_DATA[kunciKategori]) {
            // Kategori tidak ditemukan
            return await sock.sendMessage(chatId, {
                text:
`❓ Kategori *"${kunciKategori}"* tidak ditemukan.

Kategori yang tersedia:
• \`!menu utilitas\`
• \`!menu moderasi\`
• \`!menu sosial\`
• \`!menu ai\`
• \`!menu download\`
• \`!menu hiburan\``
            }, { quoted: msg });
        }

        // ─── Tampilkan menu utama (semua kategori ringkas) ───
        const teksMenu = buatMenuLengkap('Nexus Bot', namaGrup, totalCommand);
        await sock.sendMessage(chatId, { text: teksMenu }, { quoted: msg });
    }
};
