const axios = require('axios');
// Mengambil daftar nomor admin dari file config.js
const { ADMIN_PPDB } = require('../../config.js'); 

module.exports = [
    {
        name: 'spmbstat',
        description: 'Melihat statistik pendaftar PPDB secara real-time',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;

            // ==========================================
            // 1. VALIDASI PRIVATE MESSAGE (PM) ONLY
            // ==========================================
            const isGroup = chatId.endsWith('@g.us');
            if (isGroup) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ *Akses Ditolak*\nPerintah ini bersifat rahasia dan hanya dapat digunakan melalui Private Message (Japri) langsung ke bot.' 
                }, { quoted: msg });
            }

            // ==========================================
            // 2. VALIDASI NOMOR DARI CONFIG.JS
            // ==========================================
            // Prioritaskan remoteJidAlt untuk mendapatkan nomor asli (bypass LID)
            const senderRaw = msg.key.remoteJidAlt || msg.key.participant || msg.key.remoteJid;
            
            // Memotong string untuk mengambil angka SEBELUM tanda '@' dan ':'
            const senderNumber = senderRaw ? String(senderRaw).split('@')[0].split(':')[0] : '';

            // Mengecek apakah nomor pengirim ADA di dalam array ADMIN_PPDB
            if (!ADMIN_PPDB.includes(senderNumber)) {
                return await sock.sendMessage(chatId, { 
                    text: '⛔ *Akses Ditolak*\nNomor Anda tidak terdaftar sebagai Admin PPDB. Anda tidak memiliki izin untuk melihat statistik ini.' 
                }, { quoted: msg });
            }

            // ==========================================
            // JIKA LOLOS VALIDASI, JALANKAN PERINTAH
            // ==========================================
            try {
                // 1. Pesan Loading (Bisa gunakan emoji bergerak/menunggu)
                await sock.sendMessage(chatId, { 
                    text: '🔄 _Menyinkronkan data dengan sistem SPMB..._' 
                }, { quoted: msg });

                // 2. Tentukan URL API Laravel
                const apiUrl = 'https://ppdb.ponpesassaadah.com/api/ppdb/stat'; 
                
                const response = await axios.get(apiUrl);
                
                if (!response.data.success) {
                    return await sock.sendMessage(chatId, { 
                        text: '❌ *GAGAL*\nTidak dapat membaca data dari server PPDB.' 
                    }, { quoted: msg });
                }

                const data = response.data.data;

                // Mendapatkan Waktu Saat Ini (WIB)
                const waktuUpdate = new Date().toLocaleString('id-ID', { 
                    timeZone: 'Asia/Jakarta', 
                    dateStyle: 'full', 
                    timeStyle: 'short' 
                });

                // 3. Rangkai teks untuk Jenjang (Dinamis)
                let jenjangText = '📊 *Rincian per Jenjang*\n╭───────────────\n';
                for (const [key, value] of Object.entries(data.jenjang)) {
                    jenjangText += `│ 🔹 *${key}* : ${value} Santri\n`;
                }
                jenjangText += '╰───────────────\n';

                // 4. Rangkai teks untuk Status (Dinamis)
                let statusText = '📋 *Progress Pendaftaran*\n╭───────────────\n';
                for (const [key, value] of Object.entries(data.status)) {
                    // Gunakan emoji berbeda berdasarkan keyword status jika memungkinkan
                    let icon = '🔸';
                    if (key.toLowerCase().includes('verifikasi')) icon = '✅';
                    if (key.toLowerCase().includes('tunggu')) icon = '⏳';
                    if (key.toLowerCase().includes('tolak') || key.toLowerCase().includes('batal')) icon = '❌';

                    statusText += `│ ${icon} *${key}* : ${value} Santri\n`;
                }
                statusText += '╰───────────────';

                // 5. Gabungkan menjadi satu pesan utuh yang Estetik
                const replyMsg = `🎓 *STATISTIK SPMB PONDOK* 🎓\n` +
                                 `_Update: ${waktuUpdate} WIB_\n\n` +
                                 `╭─── *TOTAL PENDAFTAR* ──\n` +
                                 `│ 👥 *${data.total}* Santri\n` +
                                 `╰───────────────\n\n` +
                                 `${jenjangText}\n` +
                                 `${statusText}\n\n` +
                                 `💡 _Data diambil secara real-time dari website._`;

                // 6. Kirim balasan akhir ke WhatsApp
                await sock.sendMessage(chatId, { text: replyMsg }, { quoted: msg });

            } catch (error) {
                console.error('Error fetch data PPDB:', error);
                await sock.sendMessage(chatId, { 
                    text: '🚨 *Sistem Offline*\n\nTerjadi kesalahan saat menghubungi server PPDB. Pastikan web PPDB sedang menyala.' 
                }, { quoted: msg });
            }
        }
    }
];