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
        if (mentioned.length === 0 || args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format: `!bid @PemilikLama [nominal]`\nContoh: `!bid @nomor 6000`' }, { quoted: msg });
        }

        const targetId = mentioned[0];
        const pemilikLamaNumber = targetId.replace(/:\d+/, '').split('@')[0];
        
        const nominalBid = parseInt(args[args.length - 1].replace(/[^0-9]/g, ''));

        if (isNaN(nominalBid) || nominalBid <= 0) return await sock.sendMessage(chatId, { text: '⚠️ Nominal tidak valid.' }, { quoted: msg });
        if (penawarNumber === pemilikLamaNumber) return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak bisa menawar tokomu sendiri.' }, { quoted: msg });

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

        await sock.sendMessage(chatId, { text: `🔥 *TAWARAN DITERIMA!*\n\n@${penawarNumber} memimpin lelang untuk toko *${lelangTarget.nama}* dengan tawaran *${nominalBid.toLocaleString('id-ID')} 💠*!\n\n_Ketik !deal bagi pemilik lama (atau bank) untuk menerima tawaran ini._`, mentions: [senderId] }, { quoted: msg });
    }
};