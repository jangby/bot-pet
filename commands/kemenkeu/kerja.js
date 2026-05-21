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

                    // --- SISTEM PAJAK PENDAPATAN (KEMENKEU) ---
                    const persentasePajak = global.db.kabinet?.menteri_keuangan?.pajak_pendapatan || 0;
                    const nilaiPajak = Math.floor(gaji * (persentasePajak / 100));
                    const gajiBersih = gaji - nilaiPajak;

                    if (global.db.player[senderNumber].pasangan) {
                        gaji += 50; 
                        teksBonus = '\n💖 _(Bonus Semangat dari Pasangan: +50 💠)_';
                    }

                    let reputasiTambahan = 1;
                    if (sesi.level === 'sedang') reputasiTambahan = 2;
                    else if (sesi.level === 'sulit') reputasiTambahan = 3;

                    global.db.player[senderNumber].saldo = (parseInt(global.db.player[senderNumber].saldo) || 0) + gajiBersih;
                    global.db.player[senderNumber].reputasi = (parseInt(global.db.player[senderNumber].reputasi) || 0) + reputasiTambahan;
                    
                    global.db.bank.brankas -= gaji; // Kas bank dikurangi
                    
                    if (global.db.kabinet) {
                        global.db.kabinet.kas_negara = (global.db.kabinet.kas_negara || 0) + nilaiPajak;
                        fs.writeFileSync(path.join(process.cwd(), 'data/kabinet.json'), JSON.stringify(global.db.kabinet, null, 2));
                    }
                    
                    delete global.db.sesiKerja[senderNumber];

                    // --- UPDATE KUOTA KERJA ---
                    if (!player.kuotaKerja) player.kuotaKerja = {};
                    const _sekarang = Date.now();
                    const _KUOTA_DURASI = 15 * 60 * 1000;
                    if (!player.kuotaKerja[sesi.level] || _sekarang >= player.kuotaKerja[sesi.level].resetAt) {
                        player.kuotaKerja[sesi.level] = { jumlah: 1, resetAt: _sekarang + _KUOTA_DURASI };
                    } else {
                        player.kuotaKerja[sesi.level].jumlah += 1;
                    }

                    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
                    fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));
                    
                    return await sock.sendMessage(chatId, { text: `✅ *KERJA KERAS TERBAYAR!*\n\nJawabanmu benar! Negara memberimu upah sebesar *${gaji} Nexus*.${teksBonus}\n🌟 _Reputasi meningkat +${reputasiTambahan}_\n\n🏛️ _Potongan Pajak PPh (${persentasePajak}%): -${nilaiPajak} Nexus_\n💰 *Gaji Bersih Diterima:* ${gajiBersih} Nexus\n\n_Kamu bisa melamar kerja lagi setelah istirahat 1 menit._` }, { quoted: msg });
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

        // --- CEK & TAMPILKAN KUOTA JIKA TIDAK ADA ARGUMEN ---
        const KUOTA_MAX = 5;
        const KUOTA_DURASI = 15 * 60 * 1000; // 15 menit dalam ms
        const sekarang = Date.now();

        if (!player.kuotaKerja) player.kuotaKerja = {};

        // Reset kuota level yang sudah lewat 15 menit
        for (const lvl of validLevels) {
            if (player.kuotaKerja[lvl] && sekarang >= player.kuotaKerja[lvl].resetAt) {
                delete player.kuotaKerja[lvl];
            }
        }

        // Helper: info sisa kuota per level
        const infoKuota = () => {
            const emoji = { mudah: '🟢', sedang: '🟡', sulit: '🔴' };
            const gaji  = { mudah: '30-80', sedang: '80-180', sulit: '180-350' };
            return validLevels.map(lvl => {
                const k = player.kuotaKerja[lvl];
                const sisa = k ? Math.max(0, KUOTA_MAX - k.jumlah) : KUOTA_MAX;
                const sisaResetMenit = k ? Math.ceil((k.resetAt - sekarang) / 60000) : 0;
                const resetInfo = sisa === 0 ? ` _(reset ~${sisaResetMenit} mnt)_` : '';
                return `${emoji[lvl]} \`!kerja ${lvl}\` (Gaji: ${gaji[lvl]}) — Kuota: *${sisa}/${KUOTA_MAX}*${resetInfo}`;
            }).join('\n');
        };

        if (!userLevel || !validLevels.includes(userLevel)) {
            return await sock.sendMessage(chatId, {
                text: `🏢 *KEMENTERIAN TENAGA KERJA*\n\nSilakan pilih tingkat kesulitan pekerjaan:\n\n${infoKuota()}\n\n_⏱ Kuota reset setiap 15 menit._`
            }, { quoted: msg });
        }

        // --- CEK KUOTA LEVEL YANG DIPILIH ---
        const kuotaLevel = player.kuotaKerja[userLevel];
        if (kuotaLevel && kuotaLevel.jumlah >= KUOTA_MAX) {
            const sisaResetMenit = Math.ceil((kuotaLevel.resetAt - sekarang) / 60000);
            const levelLabel = { mudah: '🟢 Mudah', sedang: '🟡 Sedang', sulit: '🔴 Sulit' };

            // Cari level lain yang masih ada kuota
            const levelTersedia = validLevels.filter(lvl => {
                const k = player.kuotaKerja[lvl];
                return !k || k.jumlah < KUOTA_MAX;
            });

            let teksSaran = '';
            if (levelTersedia.length > 0) {
                const emojiLvl = { mudah: '🟢', sedang: '🟡', sulit: '🔴' };
                teksSaran = `\n\n✅ *Tingkat yang masih tersedia:*\n${levelTersedia.map(lvl => `${emojiLvl[lvl]} \`!kerja ${lvl}\``).join('\n')}`;
            } else {
                teksSaran = '\n\n😴 Semua tingkat kerja sudah habis kuotanya. Istirahat dulu ya!';
            }

            return await sock.sendMessage(chatId, {
                text: `🚫 *KUOTA KERJA HABIS!*\n\nKamu sudah bekerja *${KUOTA_MAX}x* di level *${levelLabel[userLevel]}* dalam 15 menit terakhir.\nKuota akan reset dalam *${sisaResetMenit} menit*.${teksSaran}`
            }, { quoted: msg });
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
