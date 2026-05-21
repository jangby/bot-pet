/**
 * COMMAND: !vote [pilihan1] | [pilihan2] | [pilihan3] (dst)
 * Membuat voting/polling instan di grup.
 * Anggota grup membalas dengan angka untuk memilih.
 * 
 * Contoh:
 *   !vote Makan Padang | Makan Soto | Makan Warteg
 * 
 * Catatan: Menggunakan global.voteAktif untuk menyimpan status voting sementara.
 * Satu grup hanya bisa ada satu voting aktif sekaligus.
 */

module.exports = {
    name: 'vote',
    description: 'Buat voting/polling instan di grup',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Inisialisasi storage voting global jika belum ada
        if (!global.voteAktif) global.voteAktif = {};

        // Cek apakah ada voting yang sedang aktif di grup ini
        if (global.voteAktif[chatId]) {
            const voteSekarang = global.voteAktif[chatId];
            let teksHasil = '📊 *ADA VOTING AKTIF!*\n\nSilakan balas dengan nomor pilihanmu:\n\n';
            voteSekarang.pilihan.forEach((pilihan, indeks) => {
                const jumlahSuara = voteSekarang.suara.filter(s => s.pilihan === indeks + 1).length;
                teksHasil += `*${indeks + 1}.* ${pilihan} — (${jumlahSuara} suara)\n`;
            });
            teksHasil += '\n_Ketik `!vote tutup` untuk menutup voting._';
            return await sock.sendMessage(chatId, { text: teksHasil });
        }

        const teksLengkap = args.join(' ');

        // Perintah khusus untuk menutup voting
        if (teksLengkap.toLowerCase() === 'tutup') {
            return await sock.sendMessage(chatId, { text: '⚠️ Tidak ada voting yang sedang aktif.' });
        }

        // Pisahkan pilihan berdasarkan "|"
        const daftarPilihan = teksLengkap.split('|').map(p => p.trim()).filter(p => p.length > 0);

        if (daftarPilihan.length < 2) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Format salah!*\n\nMinimal 2 pilihan. Pisahkan dengan ` | `\n\nContoh: `!vote Makan Padang | Makan Soto | Makan Warteg`'
            }, { quoted: msg });
        }

        if (daftarPilihan.length > 8) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Maksimal 8 pilihan dalam satu voting!'
            }, { quoted: msg });
        }

        // Buat voting baru
        global.voteAktif[chatId] = {
            pilihan: daftarPilihan,
            suara: [], // Array of { voter: nomor, pilihan: angka }
            waktuDibuat: Date.now()
        };

        // Buat teks tampilan voting
        const nomorEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
        let teksVoting = '📊 *VOTING DIBUKA!*\n─────────────────────\n\n';
        daftarPilihan.forEach((pilihan, indeks) => {
            teksVoting += `${nomorEmoji[indeks]} *${pilihan}*\n`;
        });
        teksVoting += '\n─────────────────────\n';
        teksVoting += '_Balas pesan ini dengan nomor pilihanmu (1, 2, 3...)_\n';
        teksVoting += '_Ketik `!vote` untuk lihat hasil, `!vote tutup` untuk tutup._';

        const pesanVoting = await sock.sendMessage(chatId, { text: teksVoting });

        // Simpan ID pesan voting agar bisa mendeteksi reply yang valid
        global.voteAktif[chatId].idPesanVoting = pesanVoting.key.id;

        // Auto-close voting setelah 30 menit
        setTimeout(async () => {
            if (!global.voteAktif[chatId]) return;

            const voteSelesai = global.voteAktif[chatId];
            let teksAkhir = '📊 *VOTING DITUTUP OTOMATIS*\n─────────────────────\n\n*HASIL AKHIR:*\n\n';

            let pemenang = { teks: '', jumlah: -1 };
            voteSelesai.pilihan.forEach((pilihan, indeks) => {
                const jumlah = voteSelesai.suara.filter(s => s.pilihan === indeks + 1).length;
                teksAkhir += `*${indeks + 1}.* ${pilihan} — *${jumlah} suara*\n`;
                if (jumlah > pemenang.jumlah) pemenang = { teks: pilihan, jumlah };
            });

            if (pemenang.jumlah > 0) {
                teksAkhir += `\n🏆 *Pemenang: ${pemenang.teks}* dengan ${pemenang.jumlah} suara!`;
            } else {
                teksAkhir += '\n_Tidak ada yang memilih._';
            }

            delete global.voteAktif[chatId];
            await sock.sendMessage(chatId, { text: teksAkhir }).catch(() => {});
        }, 30 * 60 * 1000); // 30 menit
    }
};
