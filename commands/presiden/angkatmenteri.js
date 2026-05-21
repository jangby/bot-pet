const fs = require('fs');
const path = require('path');
const { isPrivate, isPresiden } = require('../../utils/middleware.js');

module.exports = {
    name: 'angkatmenteri',
    description: 'Mengangkat Menteri Negara (Khusus Presiden)',
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

        if (args.length < 2) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nGunakan: `!angkatmenteri [kementerian] @tag/nomor`\n\nPilihan kementerian: keuangan, perdagangan, esdm, pertanian, pertahanan' });
        }

        const kementerianInput = args[0].toLowerCase();
        let targetNumber = args[1].replace(/[^0-9]/g, '');

        if (targetNumber.startsWith('0')) {
            targetNumber = '62' + targetNumber.slice(1);
        }

        const mapKementerian = {
            'keuangan': { key: 'menteri_keuangan', nama: 'Menteri Keuangan' },
            'perdagangan': { key: 'menteri_perdagangan', nama: 'Menteri Perdagangan' },
            'esdm': { key: 'menteri_esdm', nama: 'Menteri ESDM' },
            'pertanian': { key: 'menteri_pertanian', nama: 'Menteri Pertanian' },
            'pertahanan': { key: 'menteri_pertahanan', nama: 'Menteri Pertahanan' }
        };

        if (!mapKementerian[kementerianInput]) {
            return await sock.sendMessage(chatId, { text: '❌ Kementerian tidak valid! Pilih: keuangan, perdagangan, esdm, pertanian, pertahanan' });
        }

        if (!global.db.player[targetNumber]) {
            return await sock.sendMessage(chatId, { text: '❌ Nomor tersebut belum terdaftar sebagai pemain di database!' });
        }

        const { key, nama } = mapKementerian[kementerianInput];

        // Copot jabatan lama jika sebelumnya target adalah menteri lain
        const jabatanLama = global.db.player[targetNumber].jabatan;
        if (jabatanLama && jabatanLama !== 'Warga' && jabatanLama !== nama) {
            for (let k in global.db.kabinet) {
                if (k.startsWith('menteri_') && global.db.kabinet[k].nomor === targetNumber) {
                    global.db.kabinet[k].nomor = '';
                }
            }
        }

        // Jika ada menteri lama di posisi ini, turunkan jadi Warga
        const nomorMenteriLama = global.db.kabinet[key].nomor;
        if (nomorMenteriLama && global.db.player[nomorMenteriLama]) {
            global.db.player[nomorMenteriLama].jabatan = 'Warga';
        }

        // Angkat menteri baru
        global.db.kabinet[key].nomor = targetNumber;
        global.db.player[targetNumber].jabatan = nama;

        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: `✅ *PELANTIKAN MENTERI BERHASIL*\n\nPresiden telah resmi mengangkat nomor *${targetNumber}* sebagai *${nama}*.\nRole pada \`player.json\` dan \`kabinet.json\` telah diperbarui.` });

        // Kirim info pelantikan ke menteri baru
        try {
            await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, { text: `🏛️ *SELAMAT!* 🏛️\n\nAnda telah ditunjuk oleh Presiden sebagai *${nama}* Republik Nexus.\nGunakan bot melalui PM untuk menjalankan tugas kementerian Anda.` });
        } catch(e) {}
    }
};
