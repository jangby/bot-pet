const axios = require('axios');

module.exports = [
    {
        name: 'rincianspmb',
        description: 'Melihat rincian pendaftar dan progres target secara rapi',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;

            try {
                await sock.sendMessage(chatId, { 
                    text: '🔄 _Menarik data rincian pendaftar terbaru..._' 
                }, { quoted: msg });

                const apiUrl = 'https://ppdb.ponpesassaadah.com/api/ppdb/rincian'; 
                const response = await axios.get(apiUrl);
                
                if (!response.data.success) {
                    return await sock.sendMessage(chatId, { 
                        text: '❌ *GAGAL*\nTidak dapat membaca data rincian dari server.' 
                    }, { quoted: msg });
                }

                const data = response.data.data;
                const santri = data.santri;
                const santriyah = data.santriyah;

                // Mendapatkan Waktu Saat Ini
                const waktuUpdate = new Date().toLocaleString('id-ID', { 
                    timeZone: 'Asia/Jakarta', 
                    dateStyle: 'full', 
                    timeStyle: 'short' 
                });

                // Fungsi Progress Bar dibungkus Monospace (```) agar sejajar rapi
                const createProgressBar = (percent) => {
                    const totalBars = 10;
                    const filledBars = Math.round((percent / 100) * totalBars);
                    const emptyBars = totalBars - filledBars;
                    const fill = Math.max(0, filledBars);
                    const empty = Math.max(0, emptyBars);
                    return `\`\`\`[${'█'.repeat(fill)}${'░'.repeat(empty)}]\`\`\``;
                };

                // Menyusun daftar nama agar presisi dengan garis pinggir tabel (│)
                const listSantri = santri.list.length > 0 
                    ? santri.list.map((nama, i) => `│ ${i + 1}. ${nama}`).join('\n') 
                    : '│ _(Belum ada pendaftar)_';

                const listSantriyah = santriyah.list.length > 0 
                    ? santriyah.list.map((nama, i) => `│ ${i + 1}. ${nama}`).join('\n') 
                    : '│ _(Belum ada pendaftar)_';

                // Menyusun layout Dashboard Final
                const replyMsg = `🎓 *DASHBOARD RINCIAN PPDB* 🎓\n` +
                                 `⏱️ _Update: ${waktuUpdate} WIB_\n\n` +
                                 `╭─── *📊 PROGRES KUOTA* \n` +
                                 `│ (Target: ${santri.target} Putra | ${santriyah.target} Putri)\n` +
                                 `│ *Catatan:* SMA Lanjutan tidak dihitung\n` +
                                 `├───────────────\n` +
                                 `│ 👨‍🎓 *SANTRI (PUTRA)*\n` +
                                 `│ Terisi: *${santri.progres}* Santri (${santri.persentase}%)\n` +
                                 `│ ${createProgressBar(santri.persentase)}\n` +
                                 `├───────────────\n` +
                                 `│ 👩‍🎓 *SANTRIYAH (PUTRI)*\n` +
                                 `│ Terisi: *${santriyah.progres}* Santriyah (${santriyah.persentase}%)\n` +
                                 `│ ${createProgressBar(santriyah.persentase)}\n` +
                                 `╰───────────────\n\n` +
                                 `╭─── *📝 DAFTAR SANTRI* \n` +
                                 `${listSantri}\n` +
                                 `╰───────────────\n\n` +
                                 `╭─── *📝 DAFTAR SANTRIYAH* \n` +
                                 `${listSantriyah}\n` +
                                 `╰───────────────`;

                await sock.sendMessage(chatId, { text: replyMsg }, { quoted: msg });

            } catch (error) {
                console.error('Error fetch rincian PPDB:', error);
                await sock.sendMessage(chatId, { 
                    text: '🚨 *Sistem Offline*\nTerjadi kesalahan koneksi ke server.' 
                }, { quoted: msg });
            }
        }
    }
];