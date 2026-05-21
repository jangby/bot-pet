/**
 * COMMAND: !translate [kode_bahasa] [teks]
 * Menerjemahkan teks ke bahasa lain menggunakan LibreTranslate API.
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API yang direkomendasikan:
 *   A. LibreTranslate (GRATIS self-hosted atau cloud): https://libretranslate.com/
 *      → Tidak perlu API key untuk versi publik (rate limited)
 * 
 *   B. MyMemory (GRATIS 5000 kata/hari): https://mymemory.translated.net/
 *      → Tidak perlu API key untuk basic usage
 * 
 * Kode bahasa: id=Indonesia, en=Inggris, ja=Jepang, ko=Korea, ar=Arab, dll
 * 
 * Contoh:
 *   !translate en Selamat pagi semua
 *   !translate ja Aku cinta kamu
 */

const axios = require('axios'); // npm install axios

const NAMA_BAHASA = {
    id: 'Indonesia', en: 'Inggris', ja: 'Jepang', ko: 'Korea',
    ar: 'Arab', zh: 'Mandarin', fr: 'Prancis', de: 'Jerman',
    es: 'Spanyol', pt: 'Portugis', ru: 'Rusia', th: 'Thailand',
    ms: 'Melayu', nl: 'Belanda', it: 'Italia', tr: 'Turki'
};

module.exports = {
    name: 'translate',
    description: 'Terjemahkan teks. Format: !translate [kode bahasa] [teks]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        if (args.length < 2) {
            const daftarBahasa = Object.entries(NAMA_BAHASA).map(([k, v]) => `\`${k}\`=${v}`).join(', ');
            return await sock.sendMessage(chatId, {
                text: `⚠️ *Cara Pakai:*\n\`!translate [kode bahasa] [teks]\`\n\nContoh: \`!translate en Selamat pagi\`\n\n*Kode Bahasa:*\n${daftarBahasa}`
            }, { quoted: msg });
        }

        const kodeBahasaTujuan = args[0].toLowerCase();
        const teksTerjemah = args.slice(1).join(' ').trim();

        if (!NAMA_BAHASA[kodeBahasaTujuan]) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ Kode bahasa *"${kodeBahasaTujuan}"* tidak dikenali!\n\nGunakan kode seperti: en, ja, ko, ar, fr, dll.`
            }, { quoted: msg });
        }

        try {
            // Menggunakan MyMemory API (gratis tanpa API key)
            // Format: ?q=[teks]&langpair=[dari]|[ke]
            const responAPI = await axios.get('https://api.mymemory.translated.net/get', {
                params: {
                    q: teksTerjemah,
                    langpair: `id|${kodeBahasaTujuan}`, // Deteksi otomatis dari bahasa Indonesia
                    de: 'user@example.com' // Email opsional (meningkatkan limit)
                },
                timeout: 15000
            });

            const hasilTerjemah = responAPI.data?.responseData?.translatedText;
            const skorKepercayaan = responAPI.data?.responseData?.match || 0;

            if (!hasilTerjemah || responAPI.data?.responseStatus !== 200) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Gagal menerjemahkan teks. Coba lagi nanti.'
                }, { quoted: msg });
            }

            const namaBahasaTujuan = NAMA_BAHASA[kodeBahasaTujuan];
            const skorPersen = Math.round(skorKepercayaan * 100);

            await sock.sendMessage(chatId, {
                text: 
`🌐 *TERJEMAHAN*

📝 *Asli (Indonesia):*
_${teksTerjemah}_

🔄 *${namaBahasaTujuan} (${kodeBahasaTujuan.toUpperCase()}):*
*${hasilTerjemah}*

_Akurasi: ${skorPersen}% — MyMemory Translate_`
            });

        } catch (error) {
            console.error('[ERROR] !translate:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mengakses layanan terjemahan. Coba lagi nanti.'
            }, { quoted: msg });
        }
    }
};
