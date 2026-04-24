const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'transfer',
    description: 'Mengirim uang Nexus ke pemain lain',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // Validasi format
        if (mentioned.length === 0 || args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ *Format salah!*\nContoh: `!transfer @tag_pemain 5000`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const targetNumber = targetId.replace(/:\d+/, '').split('@')[0];

        // Validasi tidak boleh transfer ke diri sendiri
        if (senderNumber === targetNumber) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak bisa mentransfer uang ke dompetmu sendiri!' }, { quoted: msg });
        }

        // Mencari argumen angka di posisi mana saja (menghindari error jika user mengetik: !transfer 5000 @tag)
        const argAngka = args.find(a => !a.includes('@') && !isNaN(parseInt(a.replace(/[^0-9]/g, ''))));
        
        if (!argAngka) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masukkan nominal uang yang ingin ditransfer.\nContoh: `!transfer @tag 5000`' }, { quoted: msg });
        }

        const nominal = parseInt(argAngka.replace(/[^0-9]/g, ''));

        if (nominal <= 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Nominal transfer tidak valid! Minimal transfer adalah 1 💠.' }, { quoted: msg });
        }

        // Inisialisasi database jika pemain pengirim atau target belum pernah bermain
        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.player[targetNumber]) global.db.player[targetNumber] = { saldo: 0, reputasi: 0 };

        const saldoPengirim = parseInt(global.db.player[senderNumber].saldo) || 0;

        // Cek saldo cukup atau tidak
        if (saldoPengirim < nominal) {
            return await sock.sendMessage(chatId, { text: `⚠️ Saldo tidak cukup!\nUangmu saat ini: *${saldoPengirim.toLocaleString('id-ID')} 💠*\nKamu mencoba mengirim: *${nominal.toLocaleString('id-ID')} 💠*` }, { quoted: msg });
        }

        // --- EKSEKUSI TRANSFER ---
        global.db.player[senderNumber].saldo -= nominal;
        global.db.player[targetNumber].saldo = (parseInt(global.db.player[targetNumber].saldo) || 0) + nominal;

        // Simpan pembaruan ke database
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        // Resi Transfer
        const teksStruk = 
`💸 *TRANSFER BERHASIL* 💸

Dana telah berhasil dikirimkan kepada @${targetNumber}!

📝 *Rincian Transaksi:*
• Nominal: *${nominal.toLocaleString('id-ID')} 💠*
• Sisa Saldo Kamu: *${global.db.player[senderNumber].saldo.toLocaleString('id-ID')} 💠*

_Terima kasih telah menggunakan layanan antar jemput dana Nexus._`;

        await sock.sendMessage(chatId, { text: teksStruk, mentions: [targetId] }, { quoted: msg });
    }
};