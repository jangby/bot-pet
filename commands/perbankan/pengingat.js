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
                
                let belumDaftar = [];
                let tagSemua = [];
                
                participants.forEach(p => {
                    const nomor = p.id.split('@')[0];
                    const botNumber = sock.user.id.split(':')[0];
                    
                    if (nomor !== botNumber) {
                        if (!global.db.player[nomor] || !global.db.player[nomor].nama) {
                            belumDaftar.push(nomor); // Simpan nomor yang belum daftar
                            tagSemua.push(p.id);     // Simpan ID lengkap untuk mentions array
                        }
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
                
                // ✨ FIX TAG ALL: Kita tulis @nomor nya di dalam teks agar warnanya biru/hijau ✨
                teks += `MOHON PERHATIAN:\n`;
                belumDaftar.forEach(n => {
                    teks += `@${n} `;
                });

                await sock.sendMessage(chatId, { text: teks, mentions: tagSemua });

            } catch (err) {
                console.error("Gagal mengirim pengingat:", err);
            }
        }, 5 * 60 * 1000); 
    }
};