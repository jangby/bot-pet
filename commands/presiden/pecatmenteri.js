const fs = require('fs');
const path = require('path');
const { isPrivate, isPresiden } = require('../../utils/middleware.js');

module.exports = {
    name: 'pecatmenteri',
    description: 'Mencopot Menteri Negara (Khusus Presiden)',
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

        if (args.length < 1) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nGunakan: `!pecatmenteri [kementerian]`\n\nPilihan kementerian: keuangan, perdagangan, esdm, pertanian, pertahanan' });
        }

        const kementerianInput = args[0].toLowerCase();
        const mapKementerian = {
            'keuangan': 'menteri_keuangan',
            'perdagangan': 'menteri_perdagangan',
            'esdm': 'menteri_esdm',
            'pertanian': 'menteri_pertanian',
            'pertahanan': 'menteri_pertahanan'
        };

        if (!mapKementerian[kementerianInput]) {
            return await sock.sendMessage(chatId, { text: '❌ Kementerian tidak valid! Pilih: keuangan, perdagangan, esdm, pertanian, pertahanan' });
        }

        const key = mapKementerian[kementerianInput];
        const nomorMenteriLama = global.db.kabinet[key].nomor;

        if (!nomorMenteriLama) {
            return await sock.sendMessage(chatId, { text: '❌ Posisi kementerian ini sedang kosong / tidak ada menteri yang menjabat.' });
        }

        global.db.kabinet[key].nomor = '';
        if (global.db.player[nomorMenteriLama]) {
            global.db.player[nomorMenteriLama].jabatan = 'Warga';
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: `✅ *PEMBERHENTIAN MENTERI BERHASIL*\n\nMenteri pada kementerian *${kementerianInput}* telah dicopot dan jabatannya kembali menjadi Warga.` });

        try {
            await sock.sendMessage(`${nomorMenteriLama}@s.whatsapp.net`, { text: `⚠️ *PENGUMUMAN NEGARA* ⚠️\n\nPresiden telah memberhentikan Anda dari jabatan menteri. Status Anda kembali menjadi Warga biasa.` });
        } catch(e) {}
    }
};
