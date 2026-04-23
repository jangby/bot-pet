const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'pinjam',
    description: 'Meminjam modal dari Bank Sentral',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nContoh: `!pinjam 10000`' }, { quoted: msg });
        }

        const nominal = parseInt(args[0].replace(/[^0-9]/g, ''));
        if (isNaN(nominal) || nominal <= 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masukkan angka nominal yang valid.' }, { quoted: msg });
        }

        // --- 🛡️ PENGAMAN DATABASE 🛡️ ---
        if (!global.db.bank.kredit) global.db.bank.kredit = {};
        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (isNaN(global.db.player[senderNumber].saldo) || global.db.player[senderNumber].saldo === undefined) {
            global.db.player[senderNumber].saldo = 0;
        }

        // Pengecekan dana Bank Sentral
        if (global.db.bank.brankas < nominal) {
            return await sock.sendMessage(chatId, { text: `⚠️ Ditolak! Brankas Bank Sentral kehabisan dana cair. Tersisa: *${global.db.bank.brankas.toLocaleString('id-ID')} Nexus*.` }, { quoted: msg });
        }

        // --- CEK STATUS UTANG SEBELUMNYA ---
        let utangLama = 0;
        let bungaBaru = Math.floor(nominal * 0.05); // Bunga diturunkan menjadi 5%
        let jatuhTempoBaru = Date.now() + (7 * 24 * 60 * 60 * 1000); 
        
        if (global.db.bank.kredit[senderNumber] && global.db.bank.kredit[senderNumber].utang > 0) {
            const kreditSaatIni = global.db.bank.kredit[senderNumber];
            const sisaUtang = kreditSaatIni.utang;
            
            // Mengambil data utang awal (jika belum ada, set sama dengan sisa utang)
            const utangAwal = kreditSaatIni.utangAwal || sisaUtang; 
            
            // Validasi: Harus lunas minimal 50%
            const batasBolehPinjam = Math.floor(utangAwal * 0.5);

            if (sisaUtang > batasBolehPinjam) {
                return await sock.sendMessage(chatId, { 
                    text: `⚠️ Ditolak! Kamu masih memiliki tunggakan sebesar *${sisaUtang.toLocaleString('id-ID')} Nexus*.\n\nLunasi minimal 50% dari total utang awalmu untuk bisa meminjam lagi secara akumulatif.` 
                }, { quoted: msg });
            }

            utangLama = sisaUtang;
        }

        // --- PROSES PEMINJAMAN AKUMULATIF ---
        const totalPinjamanBaru = nominal + bungaBaru;
        const totalUtangAkumulasi = utangLama + totalPinjamanBaru;
        
        global.db.bank.brankas = (global.db.bank.brankas || global.MAX_SUPPLY) - nominal;
        global.db.player[senderNumber].saldo = (global.db.player[senderNumber].saldo || 0) + nominal;

        // Mencatat utang dan me-reset patokan utangAwal untuk validasi berikutnya
        global.db.bank.kredit[senderNumber] = {
            utang: totalUtangAkumulasi,
            utangAwal: totalUtangAkumulasi, 
            jatuhTempo: jatuhTempoBaru
        };

        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        let teksRincian = `• Pinjaman Baru: ${nominal.toLocaleString('id-ID')}\n• Bunga (5%): ${bungaBaru.toLocaleString('id-ID')}`;
        if (utangLama > 0) {
            teksRincian += `\n• Sisa Utang Lama: ${utangLama.toLocaleString('id-ID')}`;
        }

        const teksHasil = 
`💳 *PINJAMAN DISETUJUI* 💳

Dana segar sebesar *${nominal.toLocaleString('id-ID')} ${global.mataUang}* telah masuk ke dompetmu.

📝 *Rincian Kredit:*
${teksRincian}
• Total Tagihan Akumulasi: *${totalUtangAkumulasi.toLocaleString('id-ID')}*
• Jatuh Tempo: 7 Hari`;

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};