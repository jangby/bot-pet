/**
 * COMMAND: !vn [teks]
 * Mengubah teks menjadi pesan suara (Voice Note) menggunakan Text-to-Speech.
 * 
 * Library yang dibutuhkan:
 *   npm install axios
 * 
 * API yang direkomendasikan:
 *   A. VoiceRSS (GRATIS 350 req/hari): http://www.voicerss.org/api/
 *      → Set: process.env.VOICERSS_API_KEY
 * 
 *   B. Google Cloud Text-to-Speech: https://cloud.google.com/text-to-speech
 *      → Lebih canggih, berbayar setelah free tier
 * 
 * Contoh: !vn Halo semuanya, selamat pagi!
 */

const axios = require('axios'); // npm install axios

module.exports = {
    name: 'vn',
    description: 'Ubah teks jadi Voice Note. Format: !vn [teks]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        const teksVN = args.join(' ').trim();
        if (!teksVN) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!vn [teks yang ingin diucapkan]`\n\nContoh: `!vn Halo semua, apa kabar?`'
            }, { quoted: msg });
        }

        if (teksVN.length > 300) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Teks terlalu panjang! Maksimal 300 karakter.'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '🎙️ Sedang membuat Voice Note...' }, { quoted: msg });

            // ==========================================
            // KONFIGURASI VOICERSS API
            // Daftar gratis di http://www.voicerss.org/
            // ==========================================
            const API_KEY_VN = process.env.VOICERSS_API_KEY || 'MASUKKAN_VOICERSS_API_KEY';

            const responAPI = await axios.get('https://api.voicerss.org/', {
                params: {
                    key: API_KEY_VN,
                    src: teksVN,
                    hl: 'id-id',  // Bahasa Indonesia
                    v: 'Lena',    // Voice yang tersedia (cek voicerss.org)
                    r: '0',       // Kecepatan bicara (-10 sampai 10)
                    c: 'MP3',     // Format output
                    f: '44khz_16bit_stereo', // Kualitas audio
                    ssml: 'false',
                    b64: 'false'
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const bufferAudio = Buffer.from(responAPI.data);

            // Cek apakah respons adalah audio valid (bukan error teks)
            const cekError = bufferAudio.toString('utf-8', 0, 50);
            if (cekError.startsWith('ERROR')) {
                throw new Error(cekError);
            }

            // Kirim sebagai audio/voice note
            await sock.sendMessage(chatId, {
                audio: bufferAudio,
                mimetype: 'audio/mpeg',
                ptt: true // ptt = Push To Talk (tampil sebagai Voice Note, bukan audio biasa)
            });

        } catch (error) {
            console.error('[ERROR] !vn:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Gagal membuat Voice Note. Cek API Key VoiceRSS atau coba lagi nanti.'
            }, { quoted: msg });
        }
    }
};
