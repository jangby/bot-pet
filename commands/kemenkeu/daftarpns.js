const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'daftarpns',
    description: 'Mendaftar menjadi Pegawai Negeri Sipil (PNS)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        
        const player = global.db.player[senderNumber];
        
        if (player.pekerjaan === 'PNS') {
            return await sock.sendMessage(chatId, { text: '🏛️ Kamu sudah berstatus sebagai PNS terhormat!' }, { quoted: msg });
        }

        // Syarat menjadi PNS:
        const biayaDaftar = 50000; // Biaya sertifikasi 50.000 Nexus
        const syaratReputasi = 10; // Butuh 10 bintang reputasi

        if ((player.reputasi || 0) < syaratReputasi) {
            return await sock.sendMessage(chatId, { text: `⚠️ *DITOLAK!*\nReputasimu belum cukup untuk menjadi Abdi Negara.\n\nSyarat: ${syaratReputasi} 🌟\nReputasimu: ${player.reputasi || 0} 🌟\n\n_Rajinlah bekerja atau memenangkan Raid Boss untuk menaikkan reputasi._` }, { quoted: msg });
        }

        if ((player.saldo || 0) < biayaDaftar) {
            return await sock.sendMessage(chatId, { text: `💰 *SALDO KURANG!*\nBiaya administrasi dan sertifikasi PNS adalah *${biayaDaftar.toLocaleString('id-ID')} Nexus*.\nSaldomu saat ini: ${(player.saldo || 0).toLocaleString('id-ID')} Nexus.` }, { quoted: msg });
        }

        // Lulus menjadi PNS
        player.saldo -= biayaDaftar;
        global.db.bank.brankas = (global.db.bank.brankas || 0) + biayaDaftar; // Uang pendaftaran masuk kas negara
        player.pekerjaan = 'PNS';
        
        // Simpan database
        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
        fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

        await sock.sendMessage(chatId, { text: `🎉 *SELAMAT! KAMU RESMI MENJADI PNS!* 🎉\n\nNegara Republik Nexus telah mengakui dedikasimu.\nStatus di KTP-mu kini berubah menjadi *PNS*.\n\nKamu tidak perlu lagi kerja kasar tebak-tebakan (!kerja). Cukup ketik \`!gajian\` setiap 24 jam sekali untuk mencairkan tunjangan pastimu!` }, { quoted: msg });
    }
};
