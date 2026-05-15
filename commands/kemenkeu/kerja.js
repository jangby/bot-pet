const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'kerja',
    description: 'Bekerja kepada negara untuk mendapatkan uang',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        if (!global.db.player[senderNumber]) global.db.player[senderNumber] = { saldo: 0, reputasi: 0 };
        if (!global.db.sesiKerja) global.db.sesiKerja = {};

        // --- CEK STATUS PENJARA ---
        const player = global.db.player[senderNumber];
        if (player.penjara && Date.now() < player.penjara) {
            const sisaMenit = Math.ceil((player.penjara - Date.now()) / 60000);
            return await sock.sendMessage(chatId, { text: `🚔 *DITOLAK!*\n\nKamu tidak bisa bekerja karena sedang berada di dalam Penjara! Hukumanmu tersisa *${sisaMenit} menit* lagi.` }, { quoted: msg });
        }

        // 1. JIKA PEMAIN SEDANG MENGERJAKAN TUGAS
        if (global.db.sesiKerja[senderNumber]) {
            const sesi = global.db.sesiKerja[senderNumber];
            
            if (args.length > 0) {
                const jawabanUser = args.join(' ').toLowerCase();
                global.db.player[senderNumber].lastKerja = Date.now();
                
                if (jawabanUser === sesi.jawaban) {
                    let gaji = Math.floor(Math.random() * ((sesi.gajiMax || 100) - (sesi.gajiMin || 50) + 1)) + (sesi.gajiMin || 50); 
                    let teksBonus = '';
                    
                    // --- SISTEM KRISIS MONETER NEGARA ---
                    if (global.db.bank.brankas < gaji) {
                        delete global.db.sesiKerja[senderNumber];
                        fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                        return await sock.sendMessage(chatId, { text: `🚨 *KRISIS MONETER NEGARA!*\n\nJawabanmu benar, TAPI Kas Bank Sentral saat ini KOSONG!\nPemerintah tidak bisa memberikan gaji karena semua uang Nexus sedang ditimbun oleh para pemain.\n\n_Pancing uang agar kembali ke Bank dengan cara transaksi toko (!beli) agar kena pajak, atau jual barang ke Bank (!jualitem)._` }, { quoted: msg });
                    }

                    if (global.db.player[senderNumber].pasangan) {
                        gaji += 50; 
                        teksBonus = '\n💖 _(Bonus Semangat dari Pasangan: +50 🪙)_';
                    }

                    global.db.player[senderNumber].saldo = (parseInt(global.db.player[senderNumber].saldo) || 0) + gaji;
                    global.db.bank.brankas -= gaji; // Kas bank dikurangi
                    
                    delete global.db.sesiKerja[senderNumber];
                    
                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
                    
                    return await sock.sendMessage(chatId, { text: `✅ *KERJA KERAS TERBAYAR!*\n\nJawabanmu benar! Negara memberimu upah sebesar *${gaji} Nexus*.${teksBonus}\n\n_Kamu bisa melamar kerja lagi setelah istirahat 1 menit._` }, { quoted: msg });
                } else {
                    delete global.db.sesiKerja[senderNumber];
                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    return await sock.sendMessage(chatId, { text: `❌ *SALAH!*\n\nMandor marah karena pekerjaanmu berantakan. Jawaban yang benar adalah: *${sesi.jawaban}*.\n\nKamu diusir dan tidak dibayar!\n_Tunggu 1 menit sebelum bisa melamar kerja lagi._` }, { quoted: msg });
                }
            } else {
                let teksBantuan = `⚠️ Selesaikan dulu pekerjaanmu yang tertunda!\n\n📋 *Tugas [Level ${sesi.level.toUpperCase()}]:* ${sesi.soal}\n💡 _Jawab dengan: \`!kerja [jawabanmu]\`_`;
                return await sock.sendMessage(chatId, { text: teksBantuan }, { quoted: msg });
            }
        }

        // 2. CEK COOLDOWN
        const waktuTerakhir = global.db.player[senderNumber].lastKerja || 0;
        const cooldownSelesai = waktuTerakhir + (1 * 60 * 1000); 

        if (Date.now() < cooldownSelesai) {
            const sisaWaktu = Math.ceil((cooldownSelesai - Date.now()) / 60000); 
            return await sock.sendMessage(chatId, { text: `⏳ *MANDOR SEDANG ISTIRAHAT*\n\nKamu sudah bekerja dengan giat! Tunggu sekitar *${sisaWaktu} menit* lagi sebelum melamar pekerjaan baru.` }, { quoted: msg });
        }

        const validLevels = ['mudah', 'sedang', 'sulit'];
        const userLevel = args.length > 0 ? args[0].toLowerCase() : null;

        if (!userLevel || !validLevels.includes(userLevel)) {
            return await sock.sendMessage(chatId, { text: '🏢 *KEMENTERIAN TENAGA KERJA*\n\nSilakan pilih tingkat kesulitan pekerjaan yang kamu inginkan:\n\n🟢 `!kerja mudah` (Gaji: 30-80)\n🟡 `!kerja sedang` (Gaji: 80-180)\n🔴 `!kerja sulit` (Gaji: 180-350)' }, { quoted: msg });
        }

        // 3. GENERATE SOAL
        let tipeSoal = 0;
        let gajiMin = 0;
        let gajiMax = 0;

        if (userLevel === 'mudah') {
            const tipeMudah = [0, 1, 5, 8];
            tipeSoal = tipeMudah[Math.floor(Math.random() * tipeMudah.length)];
            gajiMin = 30; gajiMax = 80;
        } else if (userLevel === 'sedang') {
            const tipeSedang = [2, 6, 4];
            tipeSoal = tipeSedang[Math.floor(Math.random() * tipeSedang.length)];
            gajiMin = 80; gajiMax = 180;
        } else if (userLevel === 'sulit') {
            const tipeSulit = [3, 7];
            tipeSoal = tipeSulit[Math.floor(Math.random() * tipeSulit.length)];
            gajiMin = 180; gajiMax = 350;
        }

        let soal = '';
        let jawaban = '';

        switch(tipeSoal) {
            case 0:
                const kali1 = Math.floor(Math.random() * 40) + 10;
                const kali2 = Math.floor(Math.random() * 15) + 3;
                soal = `Berapa hasil dari ${kali1} x ${kali2}?`;
                jawaban = (kali1 * kali2).toString();
                break;
            case 1:
                const bagiHasil = Math.floor(Math.random() * 25) + 5;
                const pembagi = Math.floor(Math.random() * 12) + 2;
                soal = `Berapa hasil dari ${bagiHasil * pembagi} : ${pembagi}?`;
                jawaban = bagiHasil.toString();
                break;
            case 2:
                const a = Math.floor(Math.random() * 20) + 5;
                const b = Math.floor(Math.random() * 10) + 2;
                const c = Math.floor(Math.random() * 10) + 1;
                soal = `Berapa hasil dari (${a} + ${b}) x ${c}?`;
                jawaban = ((a + b) * c).toString();
                break;
            case 3:
                const kataSusah = ['kriptocurrency', 'transparansi', 'infrastruktur', 'bioteknologi', 'laboratorium', 'telekomunikasi', 'kesejahteraan', 'produktivitas', 'implementasi'];
                const kataTerpilih = kataSusah[Math.floor(Math.random() * kataSusah.length)];
                const kataAcak = kataTerpilih.split('').sort(() => 0.5 - Math.random()).join('');
                soal = `Susun huruf acak berikut menjadi kata yang benar: *${kataAcak.toUpperCase()}*`;
                jawaban = kataTerpilih;
                break;
            case 4:
                const sqStart = Math.floor(Math.random() * 5) + 2;
                soal = `Berapa angka selanjutnya dari deret ini: ${sqStart*sqStart}, ${(sqStart+1)*(sqStart+1)}, ${(sqStart+2)*(sqStart+2)}, ...?`;
                jawaban = ((sqStart+3)*(sqStart+3)).toString();
                break;
            case 5:
                const negara = ['Indonesia', 'Jepang', 'Inggris', 'Prancis', 'Jerman', 'Italia', 'Korea Selatan', 'Malaysia', 'Thailand', 'Vietnam'];
                const ibukota = ['jakarta', 'tokyo', 'london', 'paris', 'berlin', 'roma', 'seoul', 'kuala lumpur', 'bangkok', 'hanoi'];
                const idxNegara = Math.floor(Math.random() * negara.length);
                soal = `Apa ibukota dari negara ${negara[idxNegara]}?`;
                jawaban = ibukota[idxNegara];
                break;
            case 6:
                const kataInggris = ['book', 'water', 'fire', 'earth', 'sun', 'moon', 'star', 'tree', 'stone', 'cloud'];
                const kataIndo = ['buku', 'air', 'api', 'bumi', 'matahari', 'bulan', 'bintang', 'pohon', 'batu', 'awan'];
                const idxBahasa = Math.floor(Math.random() * kataInggris.length);
                soal = `Apa terjemahan bahasa Indonesia dari kata "${kataInggris[idxBahasa]}"?`;
                jawaban = kataIndo[idxBahasa];
                break;
            case 7:
                const startFib = Math.floor(Math.random() * 5) + 1;
                let fib = [startFib, startFib];
                for(let i = 2; i < 5; i++) fib.push(fib[i-1] + fib[i-2]);
                soal = `Berapa angka selanjutnya dari deret berikut: ${fib[0]}, ${fib[1]}, ${fib[2]}, ${fib[3]}, ...?`;
                jawaban = fib[4].toString();
                break;
            case 8:
                const peribahasa = [
                    { t: 'Ada gula ada ...', j: 'semut' },
                    { t: 'Besar pasak daripada ...', j: 'tiang' },
                    { t: 'Air susu dibalas dengan air ...', j: 'tuba' },
                    { t: 'Bagai air di daun ...', j: 'talas' },
                    { t: 'Sambil menyelam minum ...', j: 'air' },
                    { t: 'Sedia payung sebelum ...', j: 'hujan' },
                    { t: 'Tak ada gading yang tak ...', j: 'retak' },
                    { t: 'Bagaikan katak dalam ...', j: 'tempurung' }
                ];
                const p = peribahasa[Math.floor(Math.random() * peribahasa.length)];
                soal = `Lengkapi peribahasa berikut: "${p.t}"`;
                jawaban = p.j;
                break;
        }

        global.db.sesiKerja[senderNumber] = { soal: soal, jawaban: jawaban, gajiMin: gajiMin, gajiMax: gajiMax, level: userLevel };

        await sock.sendMessage(chatId, { text: `🏢 *LOWONGAN PEKERJAAN NEGARA [LEVEL ${userLevel.toUpperCase()}]*\n\nSelesaikan tugas ini untuk mendapatkan upah Nexus dari Negara!\n\n📋 *Tugas:* ${soal}\n💡 _Cara menjawab: Ketik !kerja [jawabanmu]_` }, { quoted: msg });
    }
};
