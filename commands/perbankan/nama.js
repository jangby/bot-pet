const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'nama',
    description: 'Mendaftarkan nama pemain ke dalam database',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (args.length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\n👉 Ketik: `!nama [Nama Kamu]`\nContoh: `!nama Robay`' }, { quoted: msg });
        }

        const namaBaru = args.join(' ');

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0 };
        
        global.db.player[senderNumber].nama = namaBaru;

        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: `✅ *REGISTRASI BERHASIL!*\n\nSelamat datang, *${namaBaru}*!\nNamamu telah resmi terdaftar di dalam sistem bot.` }, { quoted: msg });
    }
};