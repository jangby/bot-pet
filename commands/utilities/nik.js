const fs = require('fs');
const path = require('path');
const { isPrivate } = require('../../utils/middleware.js');

module.exports = {
    name: 'nik',
    description: 'Menginputkan NIK Anda untuk sesi pengumpulan aktif (Hanya PM)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Harus PM untuk keamanan privasi data
        if (!isPrivate(msg)) {
            // Hapus pesan di grup demi keamanan jika bot admin? 
            // Minimal beri tahu untuk PM bot.
            await sock.sendMessage(chatId, { text: '⚠️ Demi keamanan data Anda, mohon kirimkan NIK Anda melalui *Private Message (PM)* ke bot!' }, { quoted: msg });
            return;
        }

        // 2. Cek apakah ada sesi aktif
        if (!global.db.nik || !global.db.nik.session || !global.db.nik.session.active) {
            return await sock.sendMessage(chatId, { text: '❌ Saat ini tidak ada sesi pengumpulan NIK yang aktif dari Presiden.' });
        }

        // 3. Ekstrak data NIK menggunakan Regex
        const fullText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const match = fullText.match(/^!nik\s*\|([^|]+)\|\s*(\d+)$/i);

        if (!match) {
            // Analisis kesalahan umum untuk memberikan feedback detail
            let errorFeedback = "⚠️ *FORMAT PENGIRIMAN NIK SALAH* ⚠️\n\n";
            
            if (fullText.includes('[') || fullText.includes(']')) {
                errorFeedback += "❌ *Kesalahan:* Anda menggunakan tanda kurung siku `[]`. Mohon gunakan tanda pipa `|`.\n\n";
            } else if (!fullText.includes('|')) {
                errorFeedback += "❌ *Kesalahan:* Anda tidak menggunakan tanda pembatas `|`.\n\n";
            } else if (fullText.split('|').length < 3) {
                errorFeedback += "❌ *Kesalahan:* Kurang tanda pipa penutup. Pastikan formatnya `!nik |Nama| NIK`.\n\n";
            }

            const petunjukTeks = `${errorFeedback}` +
                `Pengumpulan NIK ini sangat penting untuk kebutuhan *Data MBG Santri*. Agar data Anda dapat direkam oleh sistem, mohon kirimkan ulang dengan format berikut:\n\n` +
                `📋 *Format Penulisan yang Benar:*\n` +
                `\`\`\`!nik |Nama Lengkap Sesuai KK| Nomor NIK\`\`\`\n\n` +
                `💡 *Aturan Penting:*\n` +
                `1. Gunakan garis tegak *pipa* (\`|\`) untuk mengapit nama.\n` +
                `2. *Nama Lengkap:* Tulis sesuai ejaan di Kartu Keluarga.\n` +
                `3. *Nomor NIK:* Tulis 16 digit angka tanpa spasi setelah tanda pipa.\n\n` +
                `✍️ *Contoh:* \`!nik |Budi Santoso| 3201234567890123\`\n\n` +
                `Pastikan NIK terdiri dari *16 digit angka*. Silakan ulangi pengiriman pesan Anda.`;
            
            return await sock.sendMessage(chatId, { text: petunjukTeks });
        }

        const namaKk = match[1].trim();
        const nikNum = match[2].trim();

        // 4. Validasi 16 Digit NIK
        if (nikNum.length !== 16) {
            return await sock.sendMessage(chatId, { text: '⚠️ *Validasi Gagal*\n\nNomor NIK harus terdiri dari *16 digit angka*!' });
        }

        try {
            // 5. Simpan ke database
            if (!global.db.nik.records) {
                global.db.nik.records = {};
            }
            global.db.nik.records[senderNumber] = {
                nama: namaKk,
                nik: nikNum,
                submittedAt: Date.now()
            };

            // Hapus dari list pending (menggunakan pencocokan nomor telepon)
            if (global.db.nik.pending) {
                global.db.nik.pending = global.db.nik.pending.filter(jid => {
                    const num = jid.split('@')[0];
                    return num !== senderNumber;
                });
            }

            // Simpan file
            fs.writeFileSync(path.join(process.cwd(), 'data/nik.json'), JSON.stringify(global.db.nik, null, 2));

            await sock.sendMessage(chatId, { 
                text: `✅ *PENGIRIMAN NIK BERHASIL*\n\nData Anda telah berhasil direkam:\n📝 *Nama KK:* ${namaKk}\n💳 *NIK:* ${nikNum}\n\nTerima kasih atas partisipasi Anda!` 
            });

        } catch (error) {
            console.error('[ERROR] !nik:', error);
            await sock.sendMessage(chatId, { text: '❌ Terjadi kesalahan saat menyimpan data NIK Anda. Silakan coba lagi.' });
        }
    }
};
