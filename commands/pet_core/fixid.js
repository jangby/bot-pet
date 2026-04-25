const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'fixid',
    description: 'Perintah Admin: Mengubah semua ID huruf acak menjadi angka berurutan',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        let totalPeliharaanDiperbaiki = 0;

        // Memeriksa dan mengubah semua data pet di database
        if (global.db.pet) {
            for (const nomorPemain in global.db.pet) {
                const daftarPeliharaan = global.db.pet[nomorPemain];
                
                // Menata ulang ID dari urutan ke-1, ke-2, dst
                daftarPeliharaan.forEach((pet, index) => {
                    pet.id = index + 1; // Memaksa ID menjadi 1, 2, 3...
                    totalPeliharaanDiperbaiki++;
                });
            }
            
            // Menyimpan kembali database yang sudah rapi
            fs.writeFileSync(path.join(process.cwd(), 'data/pet.json'), JSON.stringify(global.db.pet, null, 2));
        }

        let teksHasil = `✅ *DATABASE BERHASIL DIPERBAIKI!*\n\n`;
        teksHasil += `Sebanyak *${totalPeliharaanDiperbaiki}* peliharaan milik seluruh pemain telah ditata ulang.\n`;
        teksHasil += `Semua ID yang berbentuk huruf acak telah diubah menjadi nomor urut (1, 2, 3, dst).\n\n`;
        teksHasil += `_Sekarang perintah seperti mengubah nama, makan, dan berburu sudah 100% normal kembali!_`;

        await sock.sendMessage(chatId, { text: teksHasil }, { quoted: msg });
    }
};