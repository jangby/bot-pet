const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'bayarutang',
    description: 'Membayar cicilan/lunas utang ke bank',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const statusKredit = global.db.bank.kredit[senderNumber];

        // 1. Validasi apakah punya utang
        if (!statusKredit || statusKredit.utang <= 0) {
            return await sock.sendMessage(chatId, { text: '✅ Kamu tidak memiliki tagihan utang di Bank Sentral.' }, { quoted: msg });
        }

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: `⚠️ Masukkan nominal yang ingin dibayar.\nUtangmu: *${statusKredit.utang.toLocaleString('id-ID')}*\nContoh: \`!bayarutang 5000\`` }, { quoted: msg });
        }

        let nominalBayar = parseInt(args[0].replace(/[^0-9]/g, ''));
        if (isNaN(nominalBayar) || nominalBayar <= 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masukkan angka nominal yang valid.' }, { quoted: msg });
        }

        const saldoPemain = global.db.player[senderNumber].saldo || 0;

        // 2. Cek apakah saldo cukup
        if (saldoPemain < nominalBayar) {
            return await sock.sendMessage(chatId, { text: `⚠️ Uang tunaimu tidak cukup! Saldomu hanya *${saldoPemain.toLocaleString('id-ID')}*.` }, { quoted: msg });
        }

        // 3. Mencegah bayar lebih dari sisa utang
        if (nominalBayar > statusKredit.utang) {
            nominalBayar = statusKredit.utang; // Paskan dengan sisa utang
        }

        // --- PROSES PEMBAYARAN ---
        global.db.player[senderNumber].saldo -= nominalBayar;
        statusKredit.utang -= nominalBayar;
        global.db.bank.brankas += nominalBayar; 

        let teksHasil = `✅ *PEMBAYARAN BERHASIL*\n\nKamu telah membayar sebesar *${nominalBayar.toLocaleString('id-ID')} ${global.mataUang}* ke Bank Sentral.\n`;

        // Jika utang lunas
        if (statusKredit.utang <= 0) {
            delete global.db.bank.kredit[senderNumber]; // Hapus data utang
            teksHasil += `🎉 *SELAMAT!* Seluruh utangmu telah lunas. Kamu sekarang bebas finansial.`;
        } else {
            teksHasil += `📝 Sisa Utangmu: *${statusKredit.utang.toLocaleString('id-ID')}*`;
        }

        // Simpan ke database
        fs.promises.writeFile(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
        fs.promises.writeFile(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};