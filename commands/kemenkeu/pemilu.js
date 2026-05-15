const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'pemilu',
    description: 'Kendali Pemilihan Umum (Hanya Presiden)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        let senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // Konversi LID jika di dalam grup
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                const participant = metadata.participants.find(p => (p.id && p.id.includes(senderNumber)) || (p.lid && p.lid.includes(senderNumber)));
                if (participant) senderNumber = participant.id.split('@')[0];
            } catch (err) {}
        }

        // GANTI DENGAN NOMOR PRESIDEN
        const daftarPresiden = ["6285188427706", "168032676651233"]; 
        if (!daftarPresiden.includes(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '🚨 Hanya Presiden yang dapat mengendalikan Pemilu!' }, { quoted: msg });
        }

        if (!global.db.pemilu) global.db.pemilu = { status: 'idle', kandidat: [], pemilih: [], fee: 10000, chatId: '', timer: null };
        const p = global.db.pemilu;
        const subCommand = args[0] ? args[0].toLowerCase() : '';

        // --- 1. MEMBUKA PEMILU (Mute Grup + Penjelasan) ---
        if (subCommand === 'buka') {
            if (p.status !== 'idle') return await sock.sendMessage(chatId, { text: '⚠️ Pemilu sudah sedang berjalan!' });
            if (!chatId.endsWith('@g.us')) return await sock.sendMessage(chatId, { text: '⚠️ Command ini harus diketik di dalam grup!' });

            p.status = 'penjelasan';
            p.kandidat = [];
            p.pemilih = [];
            p.chatId = chatId;

            // KUNCI GRUP (Hanya Admin yang bisa chat)
            await sock.groupSettingUpdate(chatId, 'announcement');

            let teksAturan = `🏛️ *PENGUMUMAN PEMILU MENTERI EKONOMI* 🏛️\n\n`;
            teksAturan += `Presiden telah menetapkan hari ini sebagai *Hari Libur Nasional*!\nSemua aktivitas bekerja, berburu, dan berdagang ditutup sementara.\n\n`;
            teksAturan += `📖 *ATURAN MAIN:*\n`;
            teksAturan += `1️⃣ Grup saat ini *DITUTUP (Mute)* selama 3 Menit agar semua warga bisa membaca aturan ini.\n`;
            teksAturan += `2️⃣ Setelah itu, pendaftaran Calon Menteri akan dibuka selama *15 Menit*. Syarat nyaleg: Saldo 10.000 Nexus.\n`;
            teksAturan += `3️⃣ Jika sudah mendaftar, grup akan dikunci lagi untuk pengumuman, lalu dibuka *15 Menit* untuk masa Kampanye & Debat.\n`;
            teksAturan += `4️⃣ Terakhir, pencoblosan (*Voting*) dilakukan secara **RAHASIA via Chat Pribadi (PM) Bot**.\n\n`;
            teksAturan += `_Siapkan visi misimu, dan tunggu grup dibuka dalam 3 menit!_`;

            await sock.sendMessage(chatId, { text: teksAturan });

            // TIMER 1: Buka pendaftaran setelah 3 Menit (180.000 ms)
            // (Untuk percobaan, Anda bisa ganti angkanya jadi lebih cepat, misal 30 detik / 30000 ms)
            p.timer = setTimeout(async () => {
                p.status = 'pendaftaran';
                await sock.groupSettingUpdate(chatId, 'not_announcement'); // Buka grup
                await sock.sendMessage(chatId, { text: `📢 *PENDAFTARAN DIBUKA!* (Waktu: 15 Menit)\n\nSilakan daftarkan dirimu dengan mengetik:\n\`!nyaleg [Visi Misi Singkatmu]\`\n\nContoh: \`!nyaleg Menurunkan pajak dan bagi-bagi bansos!\`\n_Biaya pendaftaran: 10.000 Nexus._` });

                // TIMER 2: Tutup pendaftaran & Mulai Kampanye (15 Menit)
                p.timer = setTimeout(async () => {
                    await sock.groupSettingUpdate(chatId, 'announcement'); // Tutup grup
                    p.status = 'kampanye';

                    if (p.kandidat.length === 0) {
                        p.status = 'idle';
                        await sock.groupSettingUpdate(chatId, 'not_announcement');
                        return await sock.sendMessage(chatId, { text: `📉 *PEMILU BATAL*\n\nTidak ada satupun warga yang mendaftar menjadi Menteri. Grup dan aktivitas dibuka kembali.` });
                    }

                    let teksKandidat = `⚖️ *PENDAFTARAN DITUTUP!* ⚖️\n\nBerikut adalah Daftar Calon Menteri Ekonomi kita:\n\n`;
                    p.kandidat.forEach((c, i) => {
                        teksKandidat += `*No Urut ${i + 1}: ${c.nama}*\n💬 Visi: _"${c.visi}"_\n\n`;
                    });
                    teksKandidat += `Grup akan dibuka kembali untuk *MASA KAMPANYE* (Waktu: 15 Menit)!\nSilakan berdebat dan cari dukungan!`;
                    
                    await sock.sendMessage(chatId, { text: teksKandidat });
                    await sock.groupSettingUpdate(chatId, 'not_announcement'); // Buka grup

                    // TIMER 3: Tutup Kampanye & Mulai Voting (15 Menit)
                    p.timer = setTimeout(async () => {
                        p.status = 'voting';
                        await sock.groupSettingUpdate(chatId, 'announcement'); // Tutup grup sampai pemilu selesai

                        let teksVote = `🗳️ *MASA KAMPANYE HABIS - KOTAK SUARA DIBUKA!* 🗳️\n\nGrup *DITUTUP* selama masa pencoblosan.\n\n*DAFTAR KANDIDAT:*\n`;
                        p.kandidat.forEach((c, i) => {
                            teksVote += `*[ ${i + 1} ]* - ${c.nama}\n`;
                        });
                        teksVote += `\n🚨 *CARA MENGAMBIL SUARA (RAHASIA):*\n`;
                        teksVote += `1. Buka Chat Pribadi (PM/Japri) dengan bot ini.\n`;
                        teksVote += `2. Ketik: \`!coblos [Nomor_Urut]\` (Contoh: \`!coblos 1\`)\n\n`;
                        teksVote += `_Silakan mencoblos di PM sekarang. Presiden akan mengetik !pemilu tutup jika dirasa suara sudah terkumpul._`;

                        await sock.sendMessage(chatId, { text: teksVote });

                    }, 15 * 60 * 1000); // 15 Menit Kampanye

                }, 15 * 60 * 1000); // 15 Menit Pendaftaran

            }, 3 * 60 * 1000); // 3 Menit Baca Aturan
        }

        // --- 2. MENUTUP PEMILU & HITUNG SUARA ---
        else if (subCommand === 'tutup') {
            if (p.status !== 'voting') return await sock.sendMessage(chatId, { text: '⚠️ Pemilu belum mencapai tahap Voting!' });

            // Cari peraih suara terbanyak
            let pemenang = null;
            let maxVotes = -1;
            let seri = false;

            p.kandidat.forEach(c => {
                if (c.votes > maxVotes) {
                    maxVotes = c.votes;
                    pemenang = c;
                    seri = false;
                } else if (c.votes === maxVotes) {
                    seri = true; // Jika ada yang suaranya sama persis
                }
            });

            await sock.groupSettingUpdate(chatId, 'not_announcement'); // Buka grup
            p.status = 'idle';
            clearTimeout(p.timer);

            if (!pemenang || maxVotes === 0) {
                return await sock.sendMessage(chatId, { text: `📉 *PEMILU SELESAI!*\n\nTetapi golput menang! Tidak ada satupun suara yang masuk. Posisi Menteri dibiarkan kosong.` });
            }

            if (seri) {
                return await sock.sendMessage(chatId, { text: `⚖️ *PEMILU SELESAI (SERI)!*\n\nSuara berimbang! Presiden harus turun tangan untuk memilih atau mengadakan pemilu ulang.` });
            }

            // Lantik Pemenang jadi Menteri
            if (global.db.player[pemenang.id]) {
                global.db.player[pemenang.id].pekerjaan = 'Menteri Ekonomi';
                fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
            }

            let teksMenang = `🎆 *PEMILU TELAH BERAKHIR!* 🎆\n\nBerdasarkan hasil perhitungan suara dari bilik rahasia, Warga Republik Nexus telah menentukan pilihannya!\n\n`;
            teksMenang += `Terpilih sebagai Menteri Ekonomi Baru:\n👑 *${pemenang.nama}* (Total: ${maxVotes} Suara)\n\n`;
            teksMenang += `_Selamat bertugas! Grup dan semua aktivitas ekonomi (Hari Libur) telah dibuka kembali._`;

            await sock.sendMessage(chatId, { text: teksMenang });
        }

        // --- 3. MEMBATALKAN PEMILU DARURAT (Refund Uang Nyaleg) ---
        else if (subCommand === 'batal') {
            if (p.status === 'idle') return await sock.sendMessage(chatId, { text: '⚠️ Tidak ada pemilu yang sedang berjalan.' });

            clearTimeout(p.timer);
            let totalRefund = 0;

            // Kembalikan uang pendaftaran
            p.kandidat.forEach(c => {
                if (global.db.player[c.id]) {
                    global.db.player[c.id].saldo += p.fee;
                    totalRefund++;
                }
            });

            p.status = 'idle';
            fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
            
            try { await sock.groupSettingUpdate(chatId, 'not_announcement'); } catch(e) {} // Pastikan grup tidak terkunci
            
            await sock.sendMessage(chatId, { text: `🚨 *PEMILU DIBATALKAN SECARA DARURAT!* 🚨\n\nPresiden telah membatalkan Pemilu. Semua aktivitas (Hari Libur) dihentikan.\nBiaya pendaftaran sebesar ${p.fee} Nexus telah dikembalikan utuh ke rekening ${totalRefund} Calon Menteri.` });
        }

        else {
            await sock.sendMessage(chatId, { text: '⚠️ Command Pemilu Presiden: `!pemilu buka`, `!pemilu tutup`, `!pemilu batal`' });
        }
    }
};
