/**
 * COMMAND: !wiki [kata kunci]
 * Mencari ringkasan artikel dari Wikipedia (versi Indonesia).
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * Menggunakan Wikipedia REST API (gratis, tidak perlu API key).
 * 
 * Contoh: !wiki Albert Einstein
 *         !wiki Gunung Krakatau
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'wiki',
    description: 'Cari ringkasan Wikipedia. Format: !wiki [kata kunci]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const kataCari = args.join(' ').trim();
        if (!kataCari) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!wiki [kata kunci]`\n\nContoh: `!wiki Gunung Merapi`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: `🔍 Mencari "${kataCari}" di Wikipedia...` }, { quoted: msg });

            // Gunakan Wikipedia REST API (bahasa Indonesia)
            const responAPI = await axios.get(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kataCari)}`, {
                timeout: 15000
            });

            const data = responAPI.data;
            const judul = data.title;
            const ringkasan = data.extract || 'Tidak ada ringkasan tersedia.';
            const linkWiki = data.content_urls?.desktop?.page || `https://id.wikipedia.org/wiki/${encodeURIComponent(kataCari)}`;

            // Potong ringkasan jika terlalu panjang
            const ringkasanSingkat = ringkasan.length > 1500
                ? ringkasan.substring(0, 1500) + '...'
                : ringkasan;

            await sock.sendMessage(chatId, {
                text: `📖 *WIKIPEDIA*\n\n*${judul}*\n─────────────────────\n\n${ringkasanSingkat}\n\n🔗 *Baca selengkapnya:*\n${linkWiki}`
            });

        } catch (error) {
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: `❌ Artikel *"${kataCari}"* tidak ditemukan di Wikipedia.\n\nCoba dengan kata kunci lain atau gunakan ejaan yang berbeda.`
                }, { quoted: msg });
            } else {
                console.error('[ERROR] !wiki:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengakses Wikipedia. Coba lagi nanti.'
                }, { quoted: msg });
            }
        }
    }
};
