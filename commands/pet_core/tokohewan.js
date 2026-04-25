module.exports = {
    name: 'tokohewan',
    description: 'Membuka katalog hewan peliharaan via Web',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        
        // Ganti URL di bawah dengan alamat domain/IP web server milikmu
        const linkWebToko = "https://d687-180-241-241-59.ngrok-free.app/tokohewan.html";

        let teksToko = `🏪 *NEXUS PET SHOP* 🏪\n\n`;
        teksToko += `Kami telah memindahkan toko kami ke dalam aplikasi web agar lebih nyaman!\n\n`;
        teksToko += `👉 *KLIK LINK DI BAWAH UNTUK MASUK KE TOKO:*\n`;
        teksToko += `🌐 ${linkWebToko}\n\n`;
        teksToko += `_Pilih peliharaan incaranmu di web, lalu klik tombol Adopsi. Kamu akan otomatis diarahkan kembali ke sini!_`;

        await sock.sendMessage(chatId, { text: teksToko }, { quoted: msg });
    }
};