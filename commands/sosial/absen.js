/**
 * COMMAND: !absen / !hadir
 * Membuat daftar absensi di grup.
 * 
 * !absen → Buka sesi absensi baru / Cek status absen
 * !absen tutup → Menutup sesi absensi aktif dan melihat rekap
 * !hadir → Daftarkan diri ke sesi absensi yang sedang aktif
 * 
 * Data absensi disimpan di global.absensiAktif (sementara/RAM).
 */

module.exports = [
    // ─── COMMAND !absen ───
    {
        name: 'absen',
        description: 'Buka atau tutup sesi absensi di grup',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderJid.replace(/:\d+/, '').split('@')[0];

            // Resolve LID ke JID asli
            let realSenderJid = senderJid;
            if (chatId.endsWith('@g.us')) {
                try {
                    const metaGrup = await sock.groupMetadata(chatId);
                    const part = metaGrup.participants.find(p =>
                        (p.id && p.id.includes(senderNumber)) || (p.lid && p.lid.includes(senderNumber))
                    );
                    if (part && part.id.endsWith('@s.whatsapp.net')) realSenderJid = part.id;
                } catch(e) {}
            }

            // Inisialisasi storage absensi global jika belum ada
            if (!global.absensiAktif) global.absensiAktif = {};

            const subCommand = args[0]?.toLowerCase();

            // PERBAIKAN LOGIKA 1: Cek perintah 'tutup' terlebih dahulu
            if (subCommand === 'tutup') {
                if (!global.absensiAktif[chatId]) {
                    return await sock.sendMessage(chatId, { 
                        text: '⚠️ Tidak ada sesi absensi yang sedang aktif di grup ini.' 
                    }, { quoted: msg });
                }

                const sesiSelesai = global.absensiAktif[chatId];
                let teksRekap = `📋 *SESI ABSENSI RESMI DITUTUP*\n\n📝 *${sesiSelesai.judul}*\n\n*Total Hadir: ${sesiSelesai.daftarHadir.length} orang*\n─────────────────────\n`;
                
                const semuaMentions = [];
                sesiSelesai.daftarHadir.forEach((data, idx) => {
                    teksRekap += `${idx + 1}. @${data.number}\n`;
                    semuaMentions.push(data.jid);
                });

                if (sesiSelesai.daftarHadir.length === 0) teksRekap += '_Tidak ada anggota yang absen._\n';
                teksRekap += `\n_Ditutup oleh @${senderNumber}_`;
                semuaMentions.push(realSenderJid);

                // Hapus sesi dari RAM
                delete global.absensiAktif[chatId];

                return await sock.sendMessage(chatId, { 
                    text: teksRekap, 
                    mentions: semuaMentions 
                }, { quoted: msg });
            }

            // PERBAIKAN LOGIKA 2: Jika sesi aktif dan TIDAK sedang mengetik '!absen tutup' -> Tampilkan Status Saat Ini
            if (global.absensiAktif[chatId]) {
                const sesiAktif = global.absensiAktif[chatId];
                let teksHadir = `📋 *SESI ABSENSI SEDANG AKTIF!*\n\n📝 *${sesiAktif.judul}*\n\n*Daftar Hadir:*\n`;
                
                const semuaMentions = [];
                sesiAktif.daftarHadir.forEach((data, idx) => {
                    teksHadir += `${idx + 1}. @${data.number}\n`;
                    semuaMentions.push(data.jid);
                });

                if (sesiAktif.daftarHadir.length === 0) teksHadir += '_Belum ada yang mengisi._\n';
                teksHadir += '\n_Ketik `!hadir` untuk absen, atau `!absen tutup` untuk menyudahi sesi._';
                
                return await sock.sendMessage(chatId, { 
                    text: teksHadir, 
                    mentions: semuaMentions 
                }, { quoted: msg });
            }

            // Jika sesi belum ada -> Buat sesi absensi baru
            const judulAbsensi = args.join(' ').trim() || 'Absensi Hari Ini';
            global.absensiAktif[chatId] = {
                judul: judulAbsensi,
                pembuat: senderNumber,
                daftarHadir: [], // Menyimpan objek { jid, number } agar bisa di-mention
                waktuDibuat: Date.now()
            };

            await sock.sendMessage(chatId, {
                text: `📋 *SESI ABSENSI DIBUKA!*\n\n📝 *${judulAbsensi}*\n\nKetik *!hadir* untuk mendaftarkan kehadiranmu!\n\n_Dibuat oleh @${senderNumber}_\n_Ketik \`!absen tutup\` untuk menutup dan melihat rekapan._`,
                mentions: [realSenderJid]
            }, { quoted: msg });

            // Auto-close setelah 2 jam
            setTimeout(async () => {
                if (!global.absensiAktif[chatId]) return;
                const sesiSelesai = global.absensiAktif[chatId];
                
                let teksRekap = `📋 *ABSENSI DITUTUP OTOMATIS (TIMEOUT)*\n\n📝 *${sesiSelesai.judul}*\n\n*Total Hadir: ${sesiSelesai.daftarHadir.length} orang*\n─────────────────────\n`;
                const semuaMentions = [];
                
                sesiSelesai.daftarHadir.forEach((data, idx) => { 
                    teksRekap += `${idx + 1}. @${data.number}\n`; 
                    semuaMentions.push(data.jid);
                });
                
                delete global.absensiAktif[chatId];
                await sock.sendMessage(chatId, { text: teksRekap, mentions: semuaMentions }).catch(() => {});
            }, 2 * 60 * 60 * 1000); // 2 jam
        }
    },

    // ─── COMMAND !hadir ───
    {
        name: 'hadir',
        description: 'Daftarkan diri ke sesi absensi yang sedang aktif',

        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderJid.replace(/:\d+/, '').split('@')[0];

            if (!global.absensiAktif) global.absensiAktif = {};

            const sesiAktif = global.absensiAktif[chatId];

            if (!sesiAktif) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ Tidak ada sesi absensi yang sedang aktif!\nKamu bisa membuka sesi baru dengan ketik: `!absen [judul]`.'
                }, { quoted: msg });
            }

            // PERBAIKAN DATA: Validasi data duplikat berdasarkan nomor HP murni
            const sudahHadir = sesiAktif.daftarHadir.some(item => item.number === senderNumber);
            if (sudahHadir) {
                return await sock.sendMessage(chatId, {
                    text: `✅ @${senderNumber}, kamu sudah tercatat hadir sebelumnya!`,
                    mentions: [senderJid]
                }, { quoted: msg });
            }

            // Simpan data berupa Objek agar lebih mudah mengurus Mentions Biru di WA
            sesiAktif.daftarHadir.push({
                jid: senderJid,
                number: senderNumber
            });

            const nomorUrut = sesiAktif.daftarHadir.length;

            await sock.sendMessage(chatId, {
                text: `✅ @${senderNumber} telah tercatat hadir! *(No. ${nomorUrut})*`,
                mentions: [senderJid]
            }, { quoted: msg });
        }
    }
];