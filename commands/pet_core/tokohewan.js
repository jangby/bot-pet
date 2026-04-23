module.exports = {
    name: 'tokohewan',
    description: 'Melihat daftar peliharaan yang dijual oleh Bank Sentral',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Katalog Peliharaan Resmi Bank Sentral
        const katalogTeks = 
`🏪 *TOKO HEWAN BANK SENTRAL* 🏪
_Gunakan uang Nexus-mu untuk mengadopsi peliharaan. Semakin langka, perawatannya semakin mahal!_

🟢 *COMMON (Biasa)*
[1] Kelinci 🐇 | Diet: Herbivora | Power: 5 | 💰 500 💠
[2] Kucing 🐱 | Diet: Pescivora | Power: 10 | 💰 800 💠
[3] Ayam 🐓 | Diet: Herbivora | Power: 8 | 💰 600 💠

🔵 *RARE (Langka)*
[4] Anjing 🐶 | Diet: Karnivora | Power: 20 | 💰 1.500 💠
[5] Kuda 🐴 | Diet: Herbivora | Power: 25 | 💰 2.000 💠
[6] Berang-berang 🦦 | Diet: Pescivora | Power: 22 | 💰 1.800 💠

🟣 *EPIC (Epik)*
[7] Serigala 🐺 | Diet: Karnivora | Power: 45 | 💰 4.000 💠
[8] Beruang Es 🐻‍❄️ | Diet: Pescivora | Power: 50 | 💰 5.000 💠
[9] Singa 🦁 | Diet: Karnivora | Power: 60 | 💰 6.000 💠

🟡 *MYTHICAL (Legenda - Diet Kristal/Mana)*
[10] Unicorn 🦄 | Diet: Mythical | Power: 100 | 💰 15.000 💠
[11] Phoenix 🦅 | Diet: Mythical | Power: 120 | 💰 20.000 💠
[12] Naga 🐲 | Diet: Mythical | Power: 150 | 💰 30.000 💠

💡 *Cara Mengadopsi:*
Ketik \`!adopsi [Nomor ID]\`
_Contoh: \`!adopsi 4\` untuk membeli Anjing._`;

        await sock.sendMessage(chatId, { text: katalogTeks }, { quoted: msg });
    }
};