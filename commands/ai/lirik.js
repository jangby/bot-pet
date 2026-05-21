/**
 * COMMAND: !lirik [judul lagu]
 * Mencari lirik lagu berdasarkan judul.
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API yang digunakan (GRATIS tanpa API key):
 *   - lyrics.ovh: https://lyrics.ovh/
 *   - Format: https://api.lyrics.ovh/v1/[artis]/[judul]
 * 
 * Contoh:
 *   !lirik Sheila On 7 - Sahabat
 *   !lirik Coldplay - Yellow
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'lirik',
    description: 'Cari lirik lagu. Format: !lirik [artis - judul] atau !lirik [judul]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const inputLagu = args.join(' ').trim();
        if (!inputLagu) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!lirik [artis - judul lagu]`\n\nContoh:\n• `!lirik Sheila On 7 - Sahabat`\n• `!lirik Coldplay - Yellow`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: `🎵 Mencari lirik "${inputLagu}"...` }, { quoted: msg });

            let artis, judul;

            // Pisah artis dan judul jika ada " - "
            if (inputLagu.includes(' - ')) {
                const bagian = inputLagu.split(' - ');
                artis = bagian[0].trim();
                judul = bagian.slice(1).join(' - ').trim();
            } else {
                // Jika tidak ada pemisah, gunakan kata pertama sebagai artis
                artis = inputLagu.split(' ')[0];
                judul = inputLagu;
            }

            const responAPI = await axios.get(
                `https://api.lyrics.ovh/v1/${encodeURIComponent(artis)}/${encodeURIComponent(judul)}`,
                { timeout: 15000 }
            );

            let lirik = responAPI.data?.lyrics;
            if (!lirik) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Lirik untuk *"${inputLagu}"* tidak ditemukan.\n\nCoba format: \`!lirik [Artis] - [Judul]\``
                }, { quoted: msg });
            }

            // Batasi panjang lirik
            if (lirik.length > 3000) {
                lirik = lirik.substring(0, 3000) + '\n\n_...lirik terpotong karena terlalu panjang_';
            }

            await sock.sendMessage(chatId, {
                text: `🎵 *${judul.toUpperCase()}*\n_oleh ${artis}_\n\n─────────────────────\n\n${lirik}\n\n─────────────────────\n_lyrics.ovh_`
            });

        } catch (error) {
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: `❌ Lirik untuk *"${inputLagu}"* tidak ditemukan.\n\nCoba gunakan format:\n\`!lirik [Nama Artis] - [Judul Lagu]\``
                }, { quoted: msg });
            } else {
                console.error('[ERROR] !lirik:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mencari lirik. Coba lagi nanti.'
                }, { quoted: msg });
            }
        }
    }
};
