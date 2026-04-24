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

        // --- ⭐ SISTEM LIMIT KREDIT (CREDIT SCORE) ⭐ ---
        // Limit dasar pemain baru adalah 10.000 Nexus
        // Setiap 1 poin reputasi akan menaikkan limit pinjaman sebesar 2.000 Nexus
        const reputasiPemain = global.db.player[senderNumber].reputasi || 0;
        const limitKreditMax = 10000 + (reputasiPemain * 2000); 

        let utangSaatIni = 0;
        if (global.db.bank.kredit[senderNumber]) {
            utangSaatIni = global.db.bank.kredit[senderNumber].utang || 0;
        }

        // Sisa jatah pinjaman (Limit Max - Utang yang belum dibayar)
        const sisaLimitPlafon = limitKreditMax - utangSaatIni;

        if (nominal > sisaLimitPlafon) {
            let teksPlafon = `⚠️ Ditolak! Nominal terlalu besar melebihi Limit Kredit kamu.\n\n`;
            teksPlafon += `📊 *Skor Kreditmu:* \n`;
            teksPlafon += `• Reputasi: ${reputasiPemain} ⭐\n`;
            teksPlafon += `• Plafon Maksimal: *${limitKreditMax.toLocaleString('id-ID')} Nexus*\n`;
            teksPlafon += `• Sisa Plafon Tersedia: *${Math.max(0, sisaLimitPlafon).toLocaleString('id-ID')} Nexus*\n\n`;
            teksPlafon += `_Tingkatkan reputasimu (misal: dengan sukses bekerja atau berdagang) untuk mendapatkan limit pinjaman yang lebih besar._`;
            
            return await sock.sendMessage(chatId, { text: teksPlafon }, { quoted: msg });
        }

        // Pengecekan dana Bank Sentral
        if (global.db.bank.brankas < nominal) {
            return await sock.sendMessage(chatId, { text: `⚠️ Ditolak! Brankas Bank Sentral tidak memiliki cukup dana cair untuk pinjaman ini. Tersisa: *${global.db.bank.brankas.toLocaleString('id-ID')} Nexus*.` }, { quoted: msg });
        }

        // --- CEK STATUS UTANG SEBELUMNYA (Syarat 50%) ---
        let utangLama = 0;
        let bungaBaru = Math.floor(nominal * 0.05); // Bunga diturunkan menjadi 5%
        let jatuhTempoBaru = Date.now() + (7 * 24 * 60 * 60 * 1000); 
        
        if (global.db.bank.kredit[senderNumber] && global.db.bank.kredit[senderNumber].utang > 0) {
            const kreditSaatIni = global.db.bank.kredit[senderNumber];
            const sisaUtang = kreditSaatIni.utang;
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
        
        // Asumsi global.MAX_SUPPLY digunakan jika bank belum ada saldo
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

        let teksRincian = `• Pinjaman Baru: ${nominal.toLocaleString('id-ID')} 💠\n• Bunga Bank (5%): ${bungaBaru.toLocaleString('id-ID')} 💠`;
        if (utangLama > 0) {
            teksRincian += `\n• Sisa Utang Lama: ${utangLama.toLocaleString('id-ID')} 💠`;
        }

        const teksHasil = 
`💳 *PINJAMAN DISETUJUI* 💳

Dana segar sebesar *${nominal.toLocaleString('id-ID')} 💠* telah masuk ke dompetmu.

📝 *Rincian Kredit:*
${teksRincian}
━━━━━━━━━━━━━━━━━━
• Total Tagihan: *${totalUtangAkumulasi.toLocaleString('id-ID')} 💠*
• Sisa Plafon: *${(limitKreditMax - totalUtangAkumulasi).toLocaleString('id-ID')} 💠*
• Jatuh Tempo: 7 Hari`;

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};