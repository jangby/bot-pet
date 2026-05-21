const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'putus',
    description: 'Memutuskan hubungan dengan pasangan',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        const player = global.db.player[senderNumber];

        if (!player.pasangan) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu sedang jomblo, tidak ada yang bisa diputuskan.' }, { quoted: msg });
        }

        const mantanNumber = player.pasangan;
        
        // Hapus status pasangan
        player.pasangan = null;
        if (global.db.player[mantanNumber]) {
            global.db.player[mantanNumber].pasangan = null;
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        const tagMantan = mantanNumber.length > 14 ? `${mantanNumber}@lid` : `${mantanNumber}@s.whatsapp.net`;
        const tagSender = senderNumber.length > 14 ? `${senderNumber}@lid` : `${senderNumber}@s.whatsapp.net`;

        return await sock.sendMessage(chatId, { 
            text: `💔 *HUBUNGAN BERAKHIR*\n\n@${senderNumber} telah memutuskan hubungan dengan @${mantanNumber}.\nKalian sekarang kembali menjadi jomblo.`,
            mentions: [tagSender, tagMantan]
        }, { quoted: msg });
    }
};
