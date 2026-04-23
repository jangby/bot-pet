const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'cekbank',
    description: 'Melihat status keuangan Bank Sentral',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        let uangDiPemain = 0;
        // Menghitung semua saldo yang beredar di pemain
        for (const nomor in global.db.player) {
            uangDiPemain += (global.db.player[nomor].saldo || 0);
        }
        
        const uangDiBank = global.db.bank.brankas;
        const totalSistem = uangDiPemain + uangDiBank;

        const teks = 
`🏦 *BANK SENTRAL NEXUS* 🏦

Kondisi Perekonomian Saat Ini:
💠 Pasokan Maksimal: *${totalSistem.toLocaleString('id-ID')}*
💼 Beredar di Pemain: *${uangDiPemain.toLocaleString('id-ID')}*
🏦 Sisa di Brankas: *${uangDiBank.toLocaleString('id-ID')}*

_Bank Sentral mengawasi sirkulasi dana dengan ketat untuk mencegah inflasi._`;

        await sock.sendMessage(chatId, { text: teks }, { quoted: msg });
    }
};