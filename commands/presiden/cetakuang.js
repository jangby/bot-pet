const fs = require('fs');
const path = require('path');
const { isPrivate, isPresiden } = require('../../utils/middleware.js');

module.exports = {
    name: 'cetakuang',
    description: 'Mencetak Uang Nexus ke Kas Negara (Khusus Presiden)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!isPrivate(msg)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Command Presiden hanya bisa diakses melalui Private Message (PM)!' }, { quoted: msg });
        }

        if (!isPresiden(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Presiden Republik Nexus!' }, { quoted: msg });
        }

        if (args.length < 1 || isNaN(args[0])) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nGunakan: `!cetakuang [jumlah]`' });
        }

        const jumlah = parseInt(args[0]);
        if (jumlah <= 0) {
            return await sock.sendMessage(chatId, { text: '❌ Jumlah uang yang dicetak harus lebih dari 0!' });
        }

        global.db.kabinet.kas_negara += jumlah;
        
        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));

        await sock.sendMessage(chatId, { text: `🖨️ *UANG BERHASIL DICETAK*\n\nPresiden telah mencetak uang sebesar *${jumlah.toLocaleString('id-ID')} Nexus* dan dimasukkan langsung ke Kas Negara!\n\nKas Negara saat ini: *${global.db.kabinet.kas_negara.toLocaleString('id-ID')} Nexus*` });
    }
};
