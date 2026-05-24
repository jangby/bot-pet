const axios = require('axios');

module.exports = [
    {
        name: 'rincianspmb',
        description: 'Melihat rincian pendaftar dan progres target',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;

            try {
                await sock.sendMessage(chatId, { 
                    text: '🔄 _Mengunduh rincian pendaftar..._' 
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

                // Fungsi membuat Progress Bar Visual (Panjang 10 Kotak)
                const createProgressBar = (percent) => {
                    const totalBars = 10;
                    const filledBars = Math.round((percent / 100) * totalBars);
                    const emptyBars = totalBars - filledBars;
                    // Mencegah nilai minus jika ada error perhitungan
                    const fill = Math.max(0, filledBars);
                    const empty = Math.max(0, emptyBars);
                    return `[${'█'.repeat(fill)}${'░'.repeat(empty)}]`;
                };

                // Menyusun daftar nama (beri label khusus jika belum ada)
                const listSantri = santri.list.length > 0 
                    ? santri.list.map((nama, i) => `  ${i + 1}. ${nama}`).join('\n') 
                    : '  _(Belum ada pendaftar)_';

                const listSantriyah = santriyah.list.length > 0 
                    ? santriyah.list.map((nama, i) => `  ${i + 1}. ${nama}`).join('\n') 
                    : '  _(Belum ada pendaftar)_';

                const replyMsg = `📊 *RINCIAN PENDAFTAR SPMB* 📊\n\n` +
                                 `🎯 *PROGRES KUOTA PENERIMAAN*\n` +
                                 `_(*Catatan:* Jenjang SMA Lanjutan tidak dihitung ke dalam progres)_\n\n` +
                                 `👨‍🎓 *Santri (Putra)*\n` +
                                 `Progress: ${santri.progres} / ${santri.target} (${santri.persentase}%)\n` +
                                 `${createProgressBar(santri.persentase)}\n\n` +
                                 `👩‍🎓 *Santriyah (Putri)*\n` +
                                 `Progress: ${santriyah.progres} / ${santriyah.target} (${santriyah.persentase}%)\n` +
                                 `${createProgressBar(santriyah.persentase)}\n\n` +
                                 `─────────────────────\n\n` +
                                 `📝 *DAFTAR NAMA SANTRI*\n` +
                                 `${listSantri}\n\n` +
                                 `📝 *DAFTAR NAMA SANTRIYAH*\n` +
                                 `${listSantriyah}`;

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