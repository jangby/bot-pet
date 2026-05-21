const { NGROK_URL } = require('../../config');

module.exports = {
    name: 'deskripsi',
    description: 'Menampilkan link panduan lengkap bermain bot',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        const linkPanduan = `${NGROK_URL}/panduan`; 

        const teksPanduan = 
`📖 *PANDUAN LENGKAP NEXUS PET* 📖

Untuk kenyamanan membaca, buku panduan sekarang tersedia dalam versi Web Interaktif! 

Pelajari cara bermain, sistem ekonomi, boss raid, hingga cara berdagang di sini:
👉 ${linkPanduan}

_💡 Buka link di atas menggunakan browser HP kamu untuk pengalaman membaca ala aplikasi native!_`;

        await sock.sendMessage(chatId, { text: teksPanduan }, { quoted: msg });
    }
};
