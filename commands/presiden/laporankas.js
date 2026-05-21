const { isPrivate, isPresiden } = require('../../utils/middleware.js');

module.exports = {
    name: 'laporankas',
    description: 'Laporan Kas Negara dan Pajak Kementerian (Khusus Presiden)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!isPrivate(msg)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Command Presiden hanya bisa diakses melalui Private Message (PM)!' }, { quoted: msg });
        }

        console.log(`[DEBUG LAPORAN KAS]`);
        console.log(`- chatId:`, chatId);
        console.log(`- senderId:`, senderId);
        console.log(`- senderNumber parsed:`, senderNumber);
        console.log(`- presiden di database:`, global.db.kabinet?.presiden);
        console.log(`- isPresiden hasil:`, isPresiden(senderNumber));

        if (!isPresiden(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Presiden Republik Nexus!' }, { quoted: msg });
        }

        const kabinet = global.db.kabinet;
        
        let teks = `🏛️ *LAPORAN KAS NEGARA REPUBLIK NEXUS* 🏛️\n\n`;
        teks += `💰 *Total Kas Negara:* ${kabinet.kas_negara.toLocaleString('id-ID')} Nexus\n\n`;
        
        teks += `📊 *Pajak & Kebijakan Aktif:*\n`;
        teks += `1. *Kemenkeu:* Pajak Pendapatan: ${kabinet.menteri_keuangan.pajak_pendapatan}% | Bunga Pinjaman: ${kabinet.menteri_keuangan.bunga_pinjaman}%\n`;
        teks += `2. *Kemendag:* Pajak Transaksi: ${kabinet.menteri_perdagangan.pajak_transaksi}%\n`;
        teks += `3. *Kemenesdm:* Pajak Tambang: ${kabinet.menteri_esdm.pajak_tambang}%\n`;
        teks += `4. *Kementan:* Pajak Kawin: ${kabinet.menteri_pertanian.pajak_kawin}%\n`;
        teks += `5. *Kemenhan:* Denda Rampok: ${kabinet.menteri_pertahanan.denda_rampok}%\n\n`;

        teks += `_Total uang ini digunakan untuk bansos, gaji pegawai, dan subsidi pasar._`;

        await sock.sendMessage(chatId, { text: teks });
    }
};
