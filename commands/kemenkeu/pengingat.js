let pengingatInterval = null;

module.exports = {
    name: 'pengingat',
    description: 'Admin: Menyalakan pengingat registrasi nama setiap 5 menit',
    
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        if (args[0] === 'off') {
            if (pengingatInterval) clearInterval(pengingatInterval);
            return await sock.sendMessage(chatId, { text: '✅ Alarm pengingat 5 menit telah dimatikan secara manual.' });
        }

        await sock.sendMessage(chatId, { text: '🚨 *ALARM PENGINGAT AKTIF!* 🚨\n\nBot akan memeriksa anggota grup dan men-tag semua orang yang belum daftar setiap 5 menit sampai 100% member terdaftar!\n\n_Ketik `!pengingat off` jika ingin mematikannya secara paksa._' });

        pengingatInterval = setInterval(async () => {
            try {
                const metadata = await sock.groupMetadata(chatId);
                const participants = metadata.participants;
                
                let belumDaftar = [];  // { jid: string, nomor: string }
                
                // Bangun mapping LID → nomor WA asli
                // p.id  = nomor WA asli (628xxx@s.whatsapp.net) ATAU LID (xxx@lid)
                // p.lid = LID pendek (jika tersedia)
                // Kunci di global.db.player bisa berupa nomor asli atau LID pendek
                participants.forEach(p => {
                    const botNumber = sock.user.id.split(':')[0];

                    // Tentukan JID yang benar untuk mention (harus @s.whatsapp.net)
                    // Kalau p.id sudah @s.whatsapp.net → pakai langsung
                    // Kalau p.id masih @lid → coba cari dari participant lain yang cocok (fallback ke p.id)
                    let realJid = p.id;
                    if (p.id.endsWith('@lid')) {
                        // Cari participant lain yang lid-nya sama dengan p.id ini
                        const match = participants.find(q =>
                            q.id && q.id.endsWith('@s.whatsapp.net') &&
                            q.lid && q.lid === p.id
                        );
                        if (match) realJid = match.id;
                    }

                    const nomorBersih = realJid.split('@')[0]; // Nomor tanpa @...

                    if (nomorBersih === botNumber) return;

                    // Cek apakah sudah daftar —
                    // key di db bisa berupa nomor asli ATAU LID pendek
                    const lidPendek = p.lid ? p.lid.split('@')[0] : null;
                    const sudahDaftar =
                        (global.db.player[nomorBersih] && global.db.player[nomorBersih].nama) ||
                        (lidPendek && global.db.player[lidPendek] && global.db.player[lidPendek].nama);

                    if (!sudahDaftar) {
                        belumDaftar.push({ jid: realJid, nomor: nomorBersih });
                    }
                });

                if (belumDaftar.length === 0) {
                    clearInterval(pengingatInterval);
                    return await sock.sendMessage(chatId, { text: '🎉 *LUAR BIASA!* 🎉\n\nSeluruh member di grup ini telah mendaftarkan namanya! Sistem alarm 5 menit otomatis dimatikan.' });
                }

                let teks = `🔔 *PENGINGAT REGISTRASI NAMA!* 🔔\n\n`;
                teks += `Sistem mendeteksi masih ada *${belumDaftar.length} member* yang belum terdaftar di database!\n\n`;
                teks += `Pendaftaran bersifat WAJIB agar sistem Klasemen, Toko, dan Pet bisa berjalan lancar.\n\n`;
                teks += `👉 *CARA DAFTAR:*\n`;
                teks += `Ketik di grup ini:\n`;
                teks += `\`!nama [Nama Kamu]\`\n`;
                teks += `Contoh: \`!nama Budi Santoso\`\n\n`;
                teks += `_Mohon kerjasamanya semuanya! Pesan ini akan terus muncul mengganggu tiap 5 menit jika masih ada yang belum mendaftar._\n\n`;
                
                teks += `MOHON PERHATIAN:\n`;
                belumDaftar.forEach(({ nomor }) => {
                    teks += `@${nomor} `;
                });

                const mentionsJid = belumDaftar.map(({ jid }) => jid);
                await sock.sendMessage(chatId, { text: teks, mentions: mentionsJid });

            } catch (err) {
                console.error("Gagal mengirim pengingat:", err);
            }
        }, 5 * 60 * 1000); 
    }
};
