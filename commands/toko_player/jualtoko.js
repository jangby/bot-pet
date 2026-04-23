const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'jualtoko',
    description: 'Menjual toko ke Balai Lelang secara sukarela',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format: `!jualtoko [Harga Buka Lelang]`\nContoh: `!jualtoko 5000`' }, { quoted: msg });
        }

        const hargaBuka = parseInt(args[0].replace(/[^0-9]/g, ''));
        if (isNaN(hargaBuka) || hargaBuka < 1000) {
            return await sock.sendMessage(chatId, { text: '⚠️ Masukkan harga buka minimal 1.000 💠.' }, { quoted: msg });
        }

        if (!global.db.market.tokoPemain[senderNumber]) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu tidak memiliki toko yang aktif.' }, { quoted: msg });
        }

        if (!global.db.market.lelang) global.db.market.lelang = {};

        // Pindahkan toko dari kepemilikan aktif ke balai lelang
        const tokoTarget = global.db.market.tokoPemain[senderNumber];
        
        global.db.market.lelang[senderNumber] = {
            nama: tokoTarget.nama,
            kategori: tokoTarget.kategori,
            etalase: tokoTarget.etalase,
            tokenWeb: tokoTarget.tokenWeb,
            hargaBuka: hargaBuka,
            bidTertinggi: hargaBuka,
            pemenangSementara: null,
            pemilikLama: senderNumber,
            waktuSita: Date.now()
        };

        delete global.db.market.tokoPemain[senderNumber];

        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));

        await sock.sendMessage(chatId, { text: `📢 *TOKO DIJUAL!*\n\n🏢 *${tokoTarget.nama}* resmi masuk Balai Lelang dengan harga buka *${hargaBuka.toLocaleString('id-ID')} 💠*.\n\n_Pemain lain sekarang bisa mengetik !lelang untuk melihatnya dan !bid untuk menawar._` }, { quoted: msg });
    }
};