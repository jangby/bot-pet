const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'gajian',
    description: 'Mencairkan gaji harian khusus PNS',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const player = global.db.player[senderNumber];

        if (!player || player.pekerjaan !== 'PNS') {
            return await sock.sendMessage(chatId, { text: '❌ *Akses Ditolak!*\nCommand ini khusus untuk Pegawai Negeri Sipil (PNS). Rakyat biasa silakan cari lowongan melalui `!kerja`.' }, { quoted: msg });
        }

        const waktuTerakhir = player.lastGajian || 0;
        const cooldownSelesai = waktuTerakhir + (24 * 60 * 60 * 1000); // Cooldown 24 Jam

        if (Date.now() < cooldownSelesai) {
            const sisaTotalMenit = Math.ceil((cooldownSelesai - Date.now()) / 60000);
            const sisaJam = Math.floor(sisaTotalMenit / 60);
            const sisaMenit = sisaTotalMenit % 60;
            return await sock.sendMessage(chatId, { text: `⏳ *SABAR PAK/BU PNS*\n\nGajimu untuk siklus ini sudah cair. Silakan kembali ke kantor dalam *${sisaJam} Jam ${sisaMenit} Menit* untuk pencairan berikutnya.` }, { quoted: msg });
        }

        let gajiPNS = 20000; // Gaji harian PNS (Bisa disesuaikan nanti)
        let teksTunjangan = '';

        if (player.pasangan) {
            gajiPNS += 2000;
            teksTunjangan = '\n💖 _(Termasuk Tunjangan Keluarga: +2.000 Nexus)_';
        }

        // Cek Kas Negara (Krisis Moneter)
        if (global.db.bank.brankas < gajiPNS) {
            return await sock.sendMessage(chatId, { text: `🚨 *KRISIS MONETER NEGARA!*\n\nMohon maaf, Kas Negara sedang kosong! Pemerintah terpaksa menunda pencairan gaji PNS hari ini.\n\n_Pancing perputaran ekonomi dengan berbelanja atau berjualan agar kas negara terisi pajak._` }, { quoted: msg });
        }

        // --- SISTEM PAJAK PENDAPATAN (KEMENKEU) ---
        const persentasePajak = global.db.kabinet?.menteri_keuangan?.pajak_pendapatan || 0;
        const nilaiPajak = Math.floor(gajiPNS * (persentasePajak / 100));
        const gajiBersih = gajiPNS - nilaiPajak;

        // Cairkan gaji
        player.saldo += gajiBersih;
        global.db.bank.brankas -= gajiPNS;
        player.lastGajian = Date.now();

        if (global.db.kabinet) {
            global.db.kabinet.kas_negara = (global.db.kabinet.kas_negara || 0) + nilaiPajak;
            fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        await sock.sendMessage(chatId, { text: `🏦 *GAJI PNS CAIR!* 🏦\n\nTerima kasih atas pengabdianmu kepada Republik Nexus!\nUang tunjangan kotor sebesar *${gajiPNS.toLocaleString('id-ID')} Nexus* telah diturunkan.${teksTunjangan}\n\n🏛️ _Potongan Pajak PPh (${persentasePajak}%): -${nilaiPajak.toLocaleString('id-ID')} Nexus_\n💰 *Gaji Bersih Diterima:* ${gajiBersih.toLocaleString('id-ID')} Nexus\n\n_Cek dompetmu menggunakan !saldo_` }, { quoted: msg });
    }
};
