/**
 * COMMAND: !cuaca [kota]
 * Menampilkan info cuaca hari ini berdasarkan nama kota.
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API: OpenWeatherMap (GRATIS 1000 req/hari)
 *   Daftar di: https://openweathermap.org/api
 *   Set: process.env.WEATHER_API_KEY
 * 
 * Contoh: !cuaca Jakarta
 *         !cuaca Surabaya
 */

const axios = require('axios'); // npm install axios

// Mapping kode cuaca ke emoji dan deskripsi Indonesia
const DESKRIPSI_CUACA = {
    '01': { emoji: '☀️', teks: 'Cerah' },
    '02': { emoji: '⛅', teks: 'Cerah Berawan' },
    '03': { emoji: '🌥️', teks: 'Berawan' },
    '04': { emoji: '☁️', teks: 'Sangat Berawan' },
    '09': { emoji: '🌧️', teks: 'Hujan Ringan' },
    '10': { emoji: '🌦️', teks: 'Hujan' },
    '11': { emoji: '⛈️', teks: 'Badai Petir' },
    '13': { emoji: '❄️', teks: 'Bersalju' },
    '50': { emoji: '🌫️', teks: 'Berkabut' }
};

module.exports = {
    name: 'cuaca',
    description: 'Cek info cuaca hari ini. Format: !cuaca [kota]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const namaKota = args.join(' ').trim();
        if (!namaKota) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!cuaca [nama kota]`\n\nContoh: `!cuaca Jakarta`'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: `🌤️ Mengambil data cuaca untuk *${namaKota}*...` }, { quoted: msg });

            // ==========================================
            // KONFIGURASI OPENWEATHERMAP API
            // Daftar gratis di https://openweathermap.org/api
            // ==========================================
            const API_KEY_CUACA = process.env.WEATHER_API_KEY || 'MASUKKAN_WEATHER_API_KEY';

            const responAPI = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    q: namaKota,
                    appid: API_KEY_CUACA,
                    units: 'metric',   // Celsius
                    lang: 'id'         // Deskripsi dalam bahasa Indonesia
                },
                timeout: 15000
            });

            const data = responAPI.data;

            // Ekstrak data cuaca
            const kotaLengkap = `${data.name}, ${data.sys.country}`;
            const suhu = Math.round(data.main.temp);
            const suhuRasa = Math.round(data.main.feels_like);
            const suhuMin = Math.round(data.main.temp_min);
            const suhuMaks = Math.round(data.main.temp_max);
            const kelembaban = data.main.humidity;
            const kecepatanAngin = (data.wind.speed * 3.6).toFixed(1); // m/s ke km/h
            const deskripsiCuaca = data.weather[0].description;
            const kodeCuaca = data.weather[0].icon.substring(0, 2);
            const infoCuaca = DESKRIPSI_CUACA[kodeCuaca] || { emoji: '🌡️', teks: deskripsiCuaca };
            const visibilitas = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';

            await sock.sendMessage(chatId, {
                text: 
`🌍 *CUACA ${kotaLengkap.toUpperCase()}*
─────────────────────────

${infoCuaca.emoji} *Kondisi:* ${infoCuaca.teks} _(${deskripsiCuaca})_

🌡️ *Suhu:* ${suhu}°C _(terasa seperti ${suhuRasa}°C)_
🔽 *Min:* ${suhuMin}°C  🔼 *Maks:* ${suhuMaks}°C
💧 *Kelembaban:* ${kelembaban}%
💨 *Angin:* ${kecepatanAngin} km/jam
👁️ *Visibilitas:* ${visibilitas}

_Data dari OpenWeatherMap_`
            });

        } catch (error) {
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: `❌ Kota *"${namaKota}"* tidak ditemukan.\nCoba nama kota dalam bahasa Inggris atau gunakan ejaan yang benar.`
                }, { quoted: msg });
            } else {
                console.error('[ERROR] !cuaca:', error);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengambil data cuaca. Cek API Key atau coba lagi.'
                }, { quoted: msg });
            }
        }
    }
};
