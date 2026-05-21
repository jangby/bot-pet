const fs = require('fs');
const path = require('path');
const { isPrivate, isMenteri } = require('../../utils/middleware.js');

module.exports = {
    name: 'intel',
    description: 'Mengintip saldo dan inventory target menggunakan Kas Negara (Khusus Kemenhan)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!isPrivate(msg)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Command Menteri hanya bisa diakses melalui Private Message (PM)!' }, { quoted: msg });
        }

        if (!isMenteri(senderNumber, 'pertahanan')) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Menteri Pertahanan!' }, { quoted: msg });
        }

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nGunakan: `!intel [nomor_wa]` atau reply pesan target dengan `!intel`' });
        }

        let targetNumber = '';
        if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.participant) {
            targetNumber = msg.message.extendedTextMessage.contextInfo.participant.replace(/:\d+/, '').split('@')[0];
        } else {
            targetNumber = args[0].replace(/[^0-9]/g, '');
            if (targetNumber.startsWith('0')) {
                targetNumber = '62' + targetNumber.slice(1);
            }
        }

        const biayaIntel = 50000;

        if (global.db.kabinet.kas_negara < biayaIntel) {
            return await sock.sendMessage(chatId, { text: `❌ Dana operasional BIN (Badan Intelijen Nexus) tidak cukup!\nDibutuhkan: ${biayaIntel.toLocaleString('id-ID')} Nexus dari Kas Negara.` });
        }

        if (!global.db.player[targetNumber]) {
            return await sock.sendMessage(chatId, { text: '❌ Nomor tersebut belum terdaftar di database kependudukan Nexus!' });
        }

        // Potong dana operasional dari kas negara
        global.db.kabinet.kas_negara -= biayaIntel;
        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));

        const playerTarget = global.db.player[targetNumber];
        const invTarget = global.db.inventory[targetNumber] || {};

        let infoTeks = `🕵️‍♂️ *LAPORAN INTELIJEN RAHASIA* 🕵️‍♂️\n\n`;
        infoTeks += `🎯 *Target:* ${targetNumber}\n`;
        infoTeks += `💼 *Jabatan:* ${playerTarget.jabatan || 'Warga'}\n`;
        infoTeks += `💰 *Saldo Kas:* ${playerTarget.saldo ? playerTarget.saldo.toLocaleString('id-ID') : 0} Nexus\n`;
        infoTeks += `⭐ *Reputasi:* ${playerTarget.reputasi || 0}\n\n`;
        
        infoTeks += `📦 *Inventory Target:*\n`;
        if (Object.keys(invTarget).length === 0) {
            infoTeks += `(Kosong)\n`;
        } else {
            for (const item in invTarget) {
                infoTeks += `- ${item}: ${invTarget[item]}\n`;
            }
        }

        await sock.sendMessage(chatId, { text: infoTeks });
    }
};
