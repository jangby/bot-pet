const axios = require('axios');
// Import array ADMIN_PPDB dari config.js
// Sesuaikan path '../../' jika letak folder config.js berbeda
const { ADMIN_PPDB } = require('../../config.js'); 

module.exports = [
    {
        name: 'rincianspmb',
        description: 'Melihat rincian pendaftar dan progres target secara rapi',
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
            // Mengambil nomor pengirim murni berupa angka
            const senderRaw = msg.key.remoteJidAlt || msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderRaw ? String(senderRaw).split('@')[0].split(':')[0] : '';

            // --- TAMBAHKAN DUA BARIS INI UNTUK DEBUGGING ---
            console.log('Nomor pengirim yang terbaca:', senderNumber);
            console.log('Isi daftar ADMIN_PPDB:', ADMIN_PPDB);
            // -----------------------------------------------

            // Mengecek apakah nomor pengirim ADA di dalam array ADMIN_PPDB
            if (!ADMIN_PPDB.includes(senderNumber)) {
                return await sock.sendMessage(chatId, { 
                    text: '⛔ *Akses Ditolak*\nNomor Anda tidak terdaftar sebagai Admin PPDB. Anda tidak memiliki izin untuk melihat rincian ini.' 
                }, { quoted: msg });
            }

            // ==========================================
            // JIKA LOLOS VALIDASI, JALANKAN PERINTAH
            // ==========================================
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

                const createProgressBar = (percent) => {
                    const totalBars = 10;
                    const filledBars = Math.round((percent / 100) * totalBars);
                    const emptyBars = totalBars - filledBars;
                    const fill = Math.max(0, filledBars);
                    const empty = Math.max(0, emptyBars);
                    return `[${'█'.repeat(fill)}${'░'.repeat(empty)}]`;
                };

                // Fungsi untuk mengekstrak dan merender list berdasarkan jenjang & alamat
                const formatGroupedList = (dataList) => {
                    if (!Array.isArray(dataList) || dataList.length === 0) {
                        return '_(Belum ada pendaftar)_';
                    }

                    const groups = {};
                    
                    dataList.forEach(item => {
                        const match = item.match(/^(.*?)\s*\(([^)]+)\)$/);
                        let namaLengkap, jenjang, alamatTeks = "";
                        
                        if (match) {
                            let namaDanAlamat = match[1].trim();
                            jenjang = match[2].trim();
                            
                            if (namaDanAlamat.includes('#')) {
                                const splitData = namaDanAlamat.split('#');
                                namaLengkap = splitData[0].trim();
                                alamatTeks = splitData[1].trim(); 
                            } else {
                                namaLengkap = namaDanAlamat;
                            }
                        } else {
                            namaLengkap = item.trim();
                            jenjang = "Lainnya"; 
                        }

                        if (!groups[jenjang]) {
                            groups[jenjang] = [];
                        }
                        
                        groups[jenjang].push({ nama: namaLengkap, alamat: alamatTeks });
                    });

                    // Proses Render Text ke WhatsApp dengan Layout Responsif
                    let formattedText = '';
                    
                    for (const jenjang in groups) {
                        // Header jenjang dirapatkan ke kiri
                        formattedText += `*➤ JENJANG ${jenjang.toUpperCase()}*\n`;
                        
                        groups[jenjang].forEach((santri, i) => {
                            if (santri.alamat) {
                                // FORMAT 1 (JIKA ADA ALAMAT): 
                                // Nama di-bold, alamat pakai blockquote (>) bawaan WhatsApp
                                formattedText += `${i + 1}. *${santri.nama}*\n`;
                                formattedText += `> 🏠 _${santri.alamat}_\n\n`; // Ada jarak enter antar santri
                            } else {
                                // FORMAT 2 (JIKA TIDAK ADA ALAMAT / SMA Lanjutan): 
                                // Format rapat dan padat seperti biasa
                                formattedText += `${i + 1}. ${santri.nama}\n`;
                            }
                        });
                        
                        // Merapikan sisa spasi kosong di akhir setiap jenjang 
                        // lalu menambah jarak 1 enter sebelum jenjang berikutnya
                        formattedText = formattedText.trimEnd() + '\n\n'; 
                    }
                    
                    return formattedText.trimEnd(); 
                };

                const listSantri = formatGroupedList(santri.list);
                const listSantriyah = formatGroupedList(santriyah.list);

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