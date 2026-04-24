const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'kerja',
    description: 'Bekerja kasar sebagai buruh untuk mendapatkan modal awal',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.sesiKerja) global.db.sesiKerja = {}; 

        // 1. JIKA PEMAIN SEDANG MENGERJAKAN TUGAS
        if (global.db.sesiKerja[senderNumber]) {
            const sesi = global.db.sesiKerja[senderNumber];

            if (args.length > 0) {
                const jawabanUser = args.join(' ').toLowerCase();

                // Catat waktu selesai bekerja (Mulai Cooldown 3 Menit)
                global.db.player[senderNumber].lastKerja = Date.now();

                if (jawabanUser === sesi.jawaban) {
                    // ✅ JAWABAN BENAR
                    let gaji = Math.floor(Math.random() * 200) + 150; // Gaji naik jadi 150 - 350 Nexus
                    
                    let teksBonus = '';
                    // 💖 INTEGRASI BONUS COUPLE
                    if (global.db.player[senderNumber].pasangan) {
                        gaji += 50;
                        teksBonus = '\n💕 _(Bonus Semangat dari Pasangan: +50 💠)_';
                    }

                    global.db.player[senderNumber].saldo = (parseInt(global.db.player[senderNumber].saldo) || 0) + gaji;

                    if (global.db.bank.brankas >= gaji) {
                        global.db.bank.brankas -= gaji;
                    }

                    delete global.db.sesiKerja[senderNumber];

                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

                    return await sock.sendMessage(chatId, { text: `✅ *KERJA KERAS TERBAYAR!*\n\nJawabanmu benar! Mandor memberimu upah sebesar *${gaji} 💠*.${teksBonus}\n\n_Kamu bisa melamar kerja lagi setelah istirahat 3 menit._` }, { quoted: msg });
                } else {
                    // ❌ JAWABAN SALAH
                    delete global.db.sesiKerja[senderNumber];
                    
                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    return await sock.sendMessage(chatId, { text: `❌ *SALAH!*\n\nMandor marah karena pekerjaanmu berantakan. Kamu diusir dan tidak dibayar!\n_Kamu harus menunggu 3 menit sebelum bisa melamar kerja lagi._` }, { quoted: msg });
                }
            } else {
                return await sock.sendMessage(chatId, { text: `⚠️ Selesaikan dulu pekerjaanmu yang tertunda!\n\n📝 *Tugas:* ${sesi.soal}\n💡 _Jawab dengan: \`!kerja [jawabanmu]\`_` }, { quoted: msg });
            }
        }

        // 2. CEK COOLDOWN SEBELUM MEMBERIKAN PEKERJAAN BARU
        const waktuTerakhir = global.db.player[senderNumber].lastKerja || 0;
        const cooldownSelesai = waktuTerakhir + (3 * 60 * 1000); // 3 Menit dalam milidetik

        if (Date.now() < cooldownSelesai) {
            const sisaWaktu = Math.ceil((cooldownSelesai - Date.now()) / 60000); // Konversi ke menit
            return await sock.sendMessage(chatId, { 
                text: `⏳ *MANDOR SEDANG ISTIRAHAT*\n\nKamu sudah bekerja dengan giat, tapi kita tidak ingin melakukan *spam* di grup ini!\nTunggu sekitar *${sisaWaktu} menit* lagi sebelum melamar pekerjaan baru.` 
            }, { quoted: msg });
        }

        if (args.length > 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kamu belum melamar pekerjaan. Ketik `!kerja` saja terlebih dahulu.' }, { quoted: msg });
        }

        // --- SISTEM PEMBUATAN SOAL ACAK (DIBUAT LEBIH SUSAH) ---
        const tipeSoal = Math.random();
        let soal = '';
        let jawaban = '';

        if (tipeSoal < 0.33) {
            // Soal Matematika (Perkalian)
            const angka1 = Math.floor(Math.random() * 12) + 2;
            const angka2 = Math.floor(Math.random() * 12) + 2;
            soal = `Berapa hasil dari ${angka1} x ${angka2}?`;
            jawaban = (angka1 * angka2).toString();
        } else if (tipeSoal < 0.66) {
            // Soal Matematika (Penjumlahan Angka Besar)
            const angka1 = Math.floor(Math.random() * 500) + 100;
            const angka2 = Math.floor(Math.random() * 500) + 100;
            soal = `Berapa hasil dari ${angka1} + ${angka2}?`;
            jawaban = (angka1 + angka2).toString();
        } else {
            // Susun Huruf (Kata lebih panjang)
            const kataKata = ['peternakan', 'karnivora', 'legendaris', 'investasi', 'brankas', 'kristal', 'herbivora'];
            const kataTerpilih = kataKata[Math.floor(Math.random() * kataKata.length)];
            const kataAcak = kataTerpilih.split('').sort(() => 0.5 - Math.random()).join('');
            
            soal = `Susun huruf acak berikut menjadi kata yang benar: *${kataAcak.toUpperCase()}*`;
            jawaban = kataTerpilih;
        }

        global.db.sesiKerja[senderNumber] = {
            soal: soal,
            jawaban: jawaban
        };

        const teksTugas = 
`👷 *LOWONGAN PEKERJAAN* 👷

Mandor memberikanmu tugas. Selesaikan dengan cepat dan tepat untuk mendapatkan upah Nexus!

📝 *Tugas:* ${soal}

💡 _Cara menjawab: Ketik !kerja [jawabanmu]_`;

        await sock.sendMessage(chatId, { text: teksTugas }, { quoted: msg });
    }
};