module.exports = {
    name: 'deskripsi',
    description: 'Buku Panduan Lengkap Nexus RPG terbagi per bab',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Jika pemain hanya mengetik !deskripsi tanpa angka, tampilkan Daftar Isi
        if (args.length === 0) {
            const daftarIsi = 
`📖 *BUKU PANDUAN NEXUS RPG* 📖

Selamat datang di dunia Nexus! Pilih bab panduan yang ingin kamu baca dengan mengetik angka di sebelahnya.

*DAFTAR ISI:*
📘 \`!deskripsi 1\` - Bab 1: Ekonomi & Cari Uang
🏪 \`!deskripsi 2\` - Bab 2: Bisnis & Perdagangan
🐾 \`!deskripsi 3\` - Bab 3: Peternakan & Adopsi
⚔️ \`!deskripsi 4\` - Bab 4: Duel PvP & Breeding (Kawin)

_Ketik perintah di atas untuk membaca detailnya!_`;
            
            return await sock.sendMessage(chatId, { text: daftarIsi }, { quoted: msg });
        }

        const bab = args[0];
        let konten = '';

        if (bab === '1') {
            konten = 
`🏦 *BAB 1: EKONOMI & CARI UANG* 🏦
Semua pemain memulai dari NOL. Kamu butuh modal untuk bertahan hidup!

• \`!kerja\` : (Tanpa Limit) Bekerja sebagai buruh, jawab soal dari mandor, dapat uang instan. (Cooldown 3 menit).
• \`!pinjam [nominal]\` : Meminjam modal tanpa batas ke Bank Sentral (Bunga 5%).
• \`!saldo\` : Cek isi dompet & tagihan utangmu.
• \`!bayarutang [nominal]\` : Melunasi utang ke Bank. _Syarat pinjam lagi harus lunas minimal 50%._
• \`!cekbank\` : Mengecek brankas uang dunia (Maksimal 100.000 Nexus yang beredar).`;

        } else if (bab === '2') {
            konten = 
`🏪 *BAB 2: BISNIS & PERDAGANGAN* 🏪
Putar uangmu dengan membuka toko. Target pasarmu adalah pemain yang butuh barang untuk pet!

• \`!daftartoko [kategori] [NamaToko]\` : Beli lisensi (2.000 💠). Kategori dibatasi maksimal 2 toko. (karnivora/herbivora/pescivora/mythical/apotek).
• \`!mytoko\` : Tampilkan etalase ke grup.
• \`!ubahnamatoko [NamaBaru]\` : Mengganti identitas tokomu.
• \`!beli @tagLawan [jumlah] [namaBarang]\` : Beli barang dari pemain lain.
• \`!inv\` : Cek isi tas (inventory).

⚖️ *Sistem Lelang Toko:*
Toko yang 2 hari tidak laku otomatis disita Bank!
• \`!lelang\` : Melihat daftar toko sitaan Bank.
• \`!jualtoko [Harga]\` : Jual paksa tokomu ke Balai Lelang.
• \`!bid @PemilikLama [nominal]\` : Menawar toko yang dilelang.
• \`!deal @PemilikLama\` : (Hanya pemilik/bank) Menyetujui tawaran uang tertinggi.`;

        } else if (bab === '3') {
            konten = 
`🐾 *BAB 3: PETERNAKAN & ADOPSI* 🐾
Beli peliharaan, beri makan yang benar, atau suruh mereka mencari uang!

• \`!tokohewan\` : Lihat katalog peliharaan Bank Sentral.
• \`!adopsi [ID]\` : Beli peliharaan impianmu (Common - Legendary).
• \`!mypet\` : Cek daftar peliharaan, status lapar & kesehatannya.
• \`!namapet [ID] [NamaBaru]\` : Beri nama kesayangan untuk pet.
• \`!feed [ID] [nama makanan]\` : Beri makan. _(Awas, salah diet atau paksa makan bikin muntah & sakit!)_
• \`!obati [ID] [nama obat]\` : Sembuhkan pet. _(Pencernaan pakai pil/antibiotik, Luka fisik pakai perban/salep)._
• \`!berburu [ID]\` : Kirim pet cari barang/uang. _(Bebas tanpa limit, tapi menguras 40% rasa kenyang)._`;

        } else if (bab === '4') {
            konten = 
`⚔️ *BAB 4: DUEL & BREEDING* 💞
Jadilah yang terkuat atau kembangkan garis keturunan bersama pasangan!

🔥 *PVP DUEL:*
• \`!duelpet @tagLawan [ID_Pet_Kamu]\` : Tantang pet lawan.
👉 _Target harus membalas (REPLY) pesan bot dengan ketik "gas" untuk menerima tantangan._ Menang dapat XP & rampas uang, kalah terluka!

💞 *BREEDING (KAWIN SILANG):*
• \`!kawin @pasangan [ID_Pet_Kamu]\` : Lamar pet pasangan _(Spesies harus sama, Sehat, Min Lv. 10)._
👉 _Pasangan harus membalas (REPLY) pesan bot dengan ketik "gas" untuk merestui._
Bayi akan lahir sebagai *Hewan Bersama* (ID khusus diawali huruf B) dan tampil di \`!mypet\` kalian berdua untuk dirawat secara bergantian!`;

        } else {
            return await sock.sendMessage(chatId, { text: '⚠️ Bab tidak ditemukan. Ketik `!deskripsi` untuk melihat Daftar Isi.' }, { quoted: msg });
        }

        // Tambahkan footer navigasi
        konten += `\n\n💡 _Ketik !deskripsi untuk kembali ke Daftar Isi_`;

        await sock.sendMessage(chatId, { text: konten }, { quoted: msg });
    }
};