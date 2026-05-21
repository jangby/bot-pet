/**
 * COMMAND: !ingatkan [waktu] | [pesan]
 * Membuat pengingat/alarm untuk grup.
 * Contoh: !ingatkan 10m | Saatnya sholat Maghrib!
 *         !ingatkan 2j | Meeting tim jam 7 malam
 *         !ingatkan 30d | Bayar tagihan listrik
 * 
 * Satuan waktu:
 *   d = detik | m = menit | j = jam
 * 
 * Catatan: Pengingat menggunakan setTimeout, akan hilang jika bot restart.
 * Untuk pengingat permanen, gunakan node-cron + simpan ke JSON.
 */

module.exports = {
    name: 'ingatkan',
    description: 'Buat pengingat/alarm grup. Format: !ingatkan [waktu] | [pesan]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderRawJid = msg.key.participant || msg.key.remoteJid;
        const senderId = senderRawJid.replace(/:\d+/, '').split('@')[0];

        // Resolve LID ke JID asli
        let realSenderJid = senderRawJid;
        if (chatId.endsWith('@g.us')) {
            try {
                const metaGrup = await sock.groupMetadata(chatId);
                const part = metaGrup.participants.find(p =>
                    (p.id && p.id.includes(senderId)) || (p.lid && p.lid.includes(senderId))
                );
                if (part && part.id.endsWith('@s.whatsapp.net')) realSenderJid = part.id;
            } catch(e) {}
        }

        // Gabungkan semua argumen lalu pisah berdasarkan karakter "|"
        const teksLengkap = args.join(' ');
        const bagian = teksLengkap.split('|');

        if (bagian.length < 2) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Format salah!*\n\nContoh penggunaan:\n• `!ingatkan 10m | Saatnya sholat!`\n• `!ingatkan 2j | Meeting tim`\n• `!ingatkan 30d | Cek tugas`\n\n_Satuan: `d`=detik, `m`=menit, `j`=jam_'
            }, { quoted: msg });
        }

        const inputWaktu = bagian[0].trim().toLowerCase();
        const pesanPengingat = bagian[1].trim();

        if (!pesanPengingat) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Pesan pengingat tidak boleh kosong!'
            }, { quoted: msg });
        }

        // Parsing waktu (contoh: "10m", "2j", "30d")
        const cocokWaktu = inputWaktu.match(/^(\d+)(d|m|j)$/);
        if (!cocokWaktu) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Format waktu tidak valid!\nGunakan: `angka + satuan` (contoh: `10m`, `2j`, `30d`)'
            }, { quoted: msg });
        }

        const angkaWaktu = parseInt(cocokWaktu[1]);
        const satuanWaktu = cocokWaktu[2];

        // Konversi ke milidetik
        const konversiMilidetik = { d: 1000, m: 60 * 1000, j: 60 * 60 * 1000 };
        const durasiMs = angkaWaktu * konversiMilidetik[satuanWaktu];

        // Batas maksimum 24 jam
        const BATAS_MAKS_MS = 24 * 60 * 60 * 1000;
        if (durasiMs > BATAS_MAKS_MS) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Maksimal pengingat adalah 24 jam!'
            }, { quoted: msg });
        }

        const labelSatuan = { d: 'detik', m: 'menit', j: 'jam' };

        // Konfirmasi ke grup bahwa pengingat sudah dibuat
        await sock.sendMessage(chatId, {
            text: `⏰ *PENGINGAT DIBUAT!*\n\n📝 Pesan: _"${pesanPengingat}"_\n⏱️ Akan berbunyi dalam: *${angkaWaktu} ${labelSatuan[satuanWaktu]}*\n\n_Dibuat oleh @${senderId}_`,
            mentions: [realSenderJid]
        });

        // Set timer untuk mengirim pengingat setelah durasi berlalu
        setTimeout(async () => {
            try {
                await sock.sendMessage(chatId, {
                    text: `⏰ *🔔 PENGINGAT!*\n\n_"${pesanPengingat}"_\n\n_Pengingat dari @${senderId}_`,
                    mentions: [realSenderJid]
                });
            } catch (err) {
                console.error('[ERROR] Pengingat gagal terkirim:', err);
            }
        }, durasiMs);
    }
};
