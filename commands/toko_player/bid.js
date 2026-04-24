const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'bid',
    description: 'Memberikan tawaran untuk toko di Balai Lelang',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const penawarNumber = senderId.replace(/:\d+/, '').split('@')[0];

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        let pemilikLamaNumber = '';
        let nominalBid = 0;

        // Mendukung penawaran ke BANK_SENTRAL atau pemain lain
        if (args.length >= 2 && args[0].toUpperCase() === 'BANK_SENTRAL') {
            pemilikLamaNumber = 'BANK_SENTRAL';
            nominalBid = parseInt(args[1].replace(/[^0-9]/g, ''));
        } else if (mentioned.length > 0) {
            pemilikLamaNumber = mentioned[0].replace(/:\d+/, '').split('@')[0];
            nominalBid = parseInt(args[args.length - 1].replace(/[^0-9]/g, ''));
        } else {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nKetik: `!bid BANK_SENTRAL [nominal]` (Untuk lisensi baru)\nAtau: `!bid @PemilikLama [nominal]` (Untuk sitaan pemain)' }, { quoted: msg });
        }

        if (isNaN(nominalBid) || nominalBid <= 0) return await sock.sendMessage(chatId, { text: '⚠️ Nominal tidak valid.' }, { quoted: msg });
        if (penawarNumber === pemilikLamaNumber) return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak bisa menawar tokomu sendiri.' }, { quoted: msg });

        if (!global.db.market.lelang) global.db.market.lelang = {};
        const lelangTarget = global.db.market.lelang[pemilikLamaNumber];
        
        if (!lelangTarget) return await sock.sendMessage(chatId, { text: '⚠️ Toko tersebut tidak ada di Balai Lelang.' }, { quoted: msg });

        if (nominalBid <= lelangTarget.bidTertinggi) {
            return await sock.sendMessage(chatId, { text: `⚠️ Tawaranmu terlalu rendah! Tawaran tertinggi saat ini adalah *${lelangTarget.bidTertinggi.toLocaleString('id-ID')} 💠*.` }, { quoted: msg });
        }

        const saldoPenawar = parseInt(global.db.player[penawarNumber].saldo) || 0;
        if (saldoPenawar < nominalBid) {
            return await sock.sendMessage(chatId, { text: `⚠️ Saldo tidak cukup! Kamu hanya memiliki *${saldoPenawar.toLocaleString('id-ID')} 💠*.` }, { quoted: msg });
        }

        // --- SISTEM REFUND & TAHAN UANG ---
        // Jika sebelumnya sudah ada yang menawar, kembalikan uangnya
        if (lelangTarget.pemenangSementara) {
            const penawarLama = lelangTarget.pemenangSementara;
            global.db.player[penawarLama].saldo = parseInt(global.db.player[penawarLama].saldo) + lelangTarget.bidTertinggi;
        }

        // Tahan uang penawar baru
        global.db.player[penawarNumber].saldo -= nominalBid;
        
        // Update status lelang
        lelangTarget.bidTertinggi = nominalBid;
        lelangTarget.pemenangSementara = penawarNumber;

        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: `🔥 *TAWARAN DITERIMA!*\n\n@${penawarNumber} memimpin lelang untuk toko *${lelangTarget.nama}* dengan tawaran *${nominalBid.toLocaleString('id-ID')} 💠*!\n\n_Ketik !deal ${pemilikLamaNumber === 'BANK_SENTRAL' ? 'BANK_SENTRAL' : '@PemilikLama'} untuk menyetujui tawaran ini._`, mentions: [senderId] }, { quoted: msg });
    }
};