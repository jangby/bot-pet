const fs = require('fs');
const path = require('path');
const { isPrivate, isMenteri } = require('../../utils/middleware.js');

module.exports = {
    name: 'bagibansos',
    description: 'Membagikan uang dari Kas Negara ke seluruh rakyat (Khusus Kemenkeu)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!isPrivate(msg)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Command Menteri hanya bisa diakses melalui Private Message (PM)!' }, { quoted: msg });
        }

        if (!isMenteri(senderNumber, 'keuangan')) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Menteri Keuangan!' }, { quoted: msg });
        }

        if (args.length < 1 || isNaN(args[0])) {
            return await sock.sendMessage(chatId, { text: '⚠️ Format salah!\nGunakan: `!bagibansos [jumlah uang dari kas_negara]`\nContoh: `!bagibansos 100000`' });
        }

        const jumlahBansos = parseInt(args[0]);
        if (jumlahBansos <= 0) {
            return await sock.sendMessage(chatId, { text: '❌ Jumlah bansos harus lebih dari 0!' });
        }

        if (global.db.kabinet.kas_negara < jumlahBansos) {
            return await sock.sendMessage(chatId, { text: `❌ Kas Negara tidak mencukupi!\nSisa Kas Negara: *${global.db.kabinet.kas_negara.toLocaleString('id-ID')} Nexus*` });
        }

        const players = Object.keys(global.db.player);
        const jumlahPenerima = players.length;

        if (jumlahPenerima === 0) {
            return await sock.sendMessage(chatId, { text: '❌ Belum ada penduduk terdaftar!' });
        }

        const jatahPerOrang = Math.floor(jumlahBansos / jumlahPenerima);

        // Potong kas negara
        global.db.kabinet.kas_negara -= (jatahPerOrang * jumlahPenerima);

        // Bagikan ke setiap player
        for (const no of players) {
            global.db.player[no].saldo = (global.db.player[no].saldo || 0) + jatahPerOrang;
        }

        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));

        await sock.sendMessage(chatId, { text: `✅ *BANSOS BERHASIL DISALURKAN*\n\nDana sebesar *${(jatahPerOrang * jumlahPenerima).toLocaleString('id-ID')} Nexus* telah dibagikan ke ${jumlahPenerima} rakyat.\nMasing-masing mendapatkan *${jatahPerOrang.toLocaleString('id-ID')} Nexus*.` });

        // Broadcast ke semua grup yang bot ada di dalamnya
        try {
            const groups = Object.keys(await sock.groupFetchAllParticipating());
            for (const group of groups) {
                await sock.sendMessage(group, { text: `📢 *BANSOS CAIR!* 📢\n\nPemerintah melalui Kementerian Keuangan telah menyalurkan Bantuan Sosial.\nSetiap warga menerima kucuran dana sebesar *${jatahPerOrang.toLocaleString('id-ID')} Nexus*!\n\n_Silakan cek dompet masing-masing (!saldo)._` });
            }
        } catch(e) {
            console.log("Gagal broadcast bansos: ", e);
        }
    }
};
