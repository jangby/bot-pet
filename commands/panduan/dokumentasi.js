module.exports = {
    name: 'dokumentasi',
    description: 'Menampilkan buku panduan lengkap fitur bot Nexus Pet',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const teksDokumentasi = `
📚 *Buku Panduan Resmi Republik Nexus* 📚
_Berikut adalah daftar lengkap perintah dan sistem yang ada di bot ini._

=== 1. DASAR & KEPENDUDUKAN ===
👤 \`!ktp\` : Melihat kartu identitas, status, reputasi, dan profesi Anda.
👤 \`!nama [nama_baru]\` : Mengganti nama karakter Anda.
👤 \`!saldo\` : Mengecek jumlah uang (Nexus), limit kredit, dan reputasi.
💸 \`!transfer @tag [jumlah]\` : Mengirim uang ke pemain lain.
🤝 \`!couple @tag\` : Mengajak pemain lain untuk berpasangan (memberikan bonus kerja).

=== 2. PEKERJAAN & EKONOMI DASAR ===
🏢 \`!kerja\` : Mengambil pekerjaan harian (menyelesaikan soal/kuis) untuk mendapatkan uang. Ada potongan pajak yang masuk ke Kas Negara.
🏢 \`!kerja [mudah/sedang/sulit]\` : Memilih tingkat kesulitan kerja.
🏦 \`!gajian\` : Mengambil gaji harian (Khusus profesi PNS).
⛏️ \`!tambang\` : Menyuruh pet menggali untuk mendapatkan mineral berharga (batu bara, besi, emas).
⛏️ \`!tambang grup\` : Ekspedisi tambang bersama (butuh 2 orang lain mengetik \`!gali\`).
📦 \`!jualitem [jumlah] [nama]\` : Menjual hasil tambang atau barang inventory ke Bank Sentral. Dikenakan pajak transaksi.

=== 3. PET (PELIHARAAN) ===
🐾 \`!tokohewan\` : Melihat daftar pet yang bisa dibeli.
🐾 \`!adopsi [nomor]\` : Membeli pet baru.
🐾 \`!mypet\` : Melihat daftar dan status pet yang kamu miliki.
🐾 \`!namapet [ID_Pet] [Nama]\` : Mengubah nama peliharaanmu.
🍖 \`!feed [ID_Pet] [Nama Makanan]\` : Memberi makan peliharaan (makanan dibeli dari toko pemain).
🩹 \`!obati [ID_Pet] [Nama Obat]\` : Mengobati pet yang sakit.
🐾 \`!jualpet [ID_Pet]\` : Menjual pet kembali ke Bank.
💕 \`!kawin [ID_Pet_Mu]\` (Reply pesan orang) : Mengawinkan petmu dengan pet target untuk menghasilkan keturunan langka.

=== 4. PERTARUNGAN & GEAR ===
⚔️ \`!duelpet [ID_Mu] [ID_Lawan]\` : Menantang pet pemain lain (Target harus reply "gas").
👹 \`!boss\` : Melihat status Boss Raid saat ini.
🗡️ \`!serangboss [ID_Pet]\` : Mengirim pet menyerang Boss Raid (Hadiah jika boss mati).
🌲 \`!berburu [ID_Pet]\` : Menyuruh pet mencari EXP dan item di alam liar.
🛡️ \`!tokogear\` : Membeli senjata atau armor untuk pet.
🛡️ \`!pakai [ID_Pet] [ID_Gear]\` : Memasang perlengkapan ke pet untuk menambah damage/HP.

=== 5. BANK & PASAR LELANG ===
🏦 \`!cekbank\` : Mengecek kas Bank Sentral.
💳 \`!pinjam [jumlah]\` : Meminjam uang dari bank (maksimal pinjaman diatur oleh reputasi).
💳 \`!bayarutang [jumlah]\` : Melunasi cicilan ke bank.
📢 \`!lelang\` : Melihat toko atau item yang sedang dilelang.
📢 \`!bid [Nama_Lelang] [Harga]\` : Menawar lelang toko/item.
🏪 \`!beli @TagPemilik [jumlah] [item]\` : Membeli barang dari toko pemain.
🏪 \`!jualtoko [harga]\` : Menjual tokomu ke Balai Lelang.

=== 6. PEMERINTAHAN (KHUSUS JAPRI/PM) ===
🏛️ \`!laporankas\` (Presiden) : Melihat total Kas Negara & pajak.
🏛️ \`!angkatmenteri [jabatan] @tag\` (Presiden) : Melantik menteri.
🏛️ \`!pecatmenteri [jabatan]\` (Presiden) : Memberhentikan menteri.
🏛️ \`!cetakuang [jumlah]\` (Presiden) : Mencetak uang ke Kas Negara.
⚖️ \`!ubahpajak [persen]\` (Kemenkeu) : Mengubah tarif pajak pendapatan.
🎁 \`!bagibansos [jumlah]\` (Kemenkeu) : Membagikan uang negara ke warga.
📦 \`!suntikpasar [item] [jumlah]\` (Kemendag) : Memasok barang ke pasar.
🕵️ \`!intel [nomor_target]\` (Kemenhan) : Mengintip saldo dan tas orang lain.

_💡 Tips: Selalu ingat untuk memberi makan peliharaanmu secara rutin agar tidak sakit. Pantau terus pajak yang ditetapkan pemerintah!_
        `;

        await sock.sendMessage(chatId, { text: teksDokumentasi.trim() }, { quoted: msg });
    }
};
