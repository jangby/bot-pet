/**
 * COMMAND: !gempa
 * Menampilkan info gempa bumi terbaru dari BMKG (Badan Meteorologi, Klimatologi, dan Geofisika).
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * Data dari API BMKG resmi (gratis, tanpa API key):
 *   https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json
 * 
 * Tidak perlu API Key.
 * 
 * Contoh: !gempa
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'gempa',
    description: 'Cek info gempa bumi terbaru dari BMKG',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        try {
            await sock.sendMessage(chatId, { text: '🌏 Mengambil data gempa terbaru dari BMKG...' }, { quoted: msg });

            // API BMKG resmi — gratis, tidak perlu API key
            const responAPI = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', {
                timeout: 15000
            });

            const dataGempa = responAPI.data?.Infogempa?.gempa;

            if (!dataGempa) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengambil data gempa dari BMKG. Coba lagi nanti.'
                }, { quoted: msg });
            }

            // Tentukan level bahaya berdasarkan magnitudo
            const magnitudo = parseFloat(dataGempa.Magnitude);
            let levelBahaya, emojiBahaya;
            if (magnitudo >= 7) { levelBahaya = 'SANGAT KUAT ⚠️'; emojiBahaya = '🚨'; }
            else if (magnitudo >= 6) { levelBahaya = 'KUAT'; emojiBahaya = '🔴'; }
            else if (magnitudo >= 5) { levelBahaya = 'SEDANG'; emojiBahaya = '🟡'; }
            else if (magnitudo >= 4) { levelBahaya = 'RINGAN'; emojiBahaya = '🟢'; }
            else { levelBahaya = 'SANGAT RINGAN'; emojiBahaya = '⚪'; }

            await sock.sendMessage(chatId, {
                text: 
`🌏 *GEMPA BUMI TERBARU — BMKG*
─────────────────────────────

${emojiBahaya} *Level:* ${levelBahaya}
📅 *Tanggal:* ${dataGempa.Tanggal}
⏰ *Waktu:* ${dataGempa.Jam} WIB
💥 *Magnitudo:* ${dataGempa.Magnitude} SR
📍 *Lokasi:* ${dataGempa.Wilayah}
🗺️ *Koordinat:* ${dataGempa.Lintang}, ${dataGempa.Bujur}
⬇️ *Kedalaman:* ${dataGempa.Kedalaman}
🌊 *Potensi Tsunami:* ${dataGempa.Potensi}

─────────────────────────────
_Sumber: BMKG Indonesia — data.bmkg.go.id_`
            });

        } catch (error) {
            console.error('[ERROR] !gempa:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal mengambil data gempa dari BMKG. Server mungkin sedang sibuk, coba lagi nanti.'
            }, { quoted: msg });
        }
    }
};
