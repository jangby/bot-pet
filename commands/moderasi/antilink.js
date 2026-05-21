/**
 * COMMAND: !antilink [on/off]
 * Mengaktifkan/menonaktifkan perlindungan anti-link.
 * Jika aktif: non-admin yang mengirim link grup WhatsApp akan otomatis ditendang.
 * 
 * Tidak memerlukan library tambahan.
 * Data anti-link disimpan di data/antilink.json per grup.
 * 
 * PENTING: Handler pesan (messages.upsert) di index.js perlu memanggil
 * fungsi cekAntilink() yang ada di file ini setiap ada pesan masuk.
 * Lihat bagian INTEGRASI di bawah.
 * 
 * Contoh:
 *   !antilink on   → aktifkan
 *   !antilink off  → nonaktifkan
 */

const fs = require('fs');
const path = require('path');

const PATH_ANTILINK = path.join(process.cwd(), 'data/antilink.json');

function loadAntilink() {
    if (!fs.existsSync(PATH_ANTILINK)) {
        fs.writeFileSync(PATH_ANTILINK, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(PATH_ANTILINK, 'utf-8'));
}

function saveAntilink(data) {
    fs.writeFileSync(PATH_ANTILINK, JSON.stringify(data, null, 2));
}

// Regex untuk mendeteksi link WhatsApp grup
const REGEX_LINK_GRUP = /chat\.whatsapp\.com\/[A-Za-z0-9]+/i;

/**
 * Fungsi yang dipanggil dari index.js untuk setiap pesan masuk.
 * Tambahkan di handler messages.upsert, SEBELUM command handler:
 *
 *   const { cekAntilink } = require('./commands/moderasi/antilink.js');
 *   await cekAntilink(sock, msg);
 */
async function cekAntilink(sock, msg) {
    const chatId = msg.key.remoteJid;

    // Hanya proses pesan dari grup
    if (!chatId?.endsWith('@g.us')) return;

    const dataAntilink = loadAntilink();
    if (!dataAntilink[chatId]?.aktif) return; // Antilink tidak aktif di grup ini

    const tekspesan = msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || '';

    // Jika tidak ada link, tidak perlu diproses
    if (!REGEX_LINK_GRUP.test(tekspesan)) return;

    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.replace(/:\d+/, '').split('@')[0];

    try {
        const metadataGrup = await sock.groupMetadata(chatId);
        const daftarAdmin = metadataGrup.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id.split('@')[0].replace(/:\d+/, ''));

        // Admin diizinkan mengirim link
        if (daftarAdmin.includes(senderNumber)) return;

        // Hapus pesan yang mengandung link
        await sock.sendMessage(chatId, { delete: msg.key });

        // Tendang pengirim
        await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');

        await sock.sendMessage(chatId, {
            text: `🚫 @${senderNumber} telah dikeluarkan karena mengirim link grup!\n\n_Anti-Link aktif. Hanya admin yang boleh mengirim invite link._`,
            mentions: [senderJid]
        });

    } catch (err) {
        console.error('[ERROR] cekAntilink:', err);
    }
}

module.exports = {
    name: 'antilink',
    description: 'Aktifkan/matikan anti-link otomatis. Format: !antilink [on/off]',
    cekAntilink, // Ekspor fungsi ini untuk dipakai di index.js

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ Perintah ini hanya bisa digunakan di dalam *Grup*!'
            }, { quoted: msg });
        }

        const statusInput = args[0]?.toLowerCase();
        if (!statusInput || !['on', 'off'].includes(statusInput)) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n• `!antilink on` — Aktifkan perlindungan\n• `!antilink off` — Nonaktifkan perlindungan'
            }, { quoted: msg });
        }

        try {
            const metadataGrup = await sock.groupMetadata(chatId);
            const daftarAdmin = metadataGrup.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id.split('@')[0].replace(/:\d+/, ''));

            if (!daftarAdmin.includes(senderNumber)) {
                return await sock.sendMessage(chatId, {
                    text: '⛔ Hanya *Admin Grup* yang bisa mengubah pengaturan Anti-Link!'
                }, { quoted: msg });
            }

            const dataAntilink = loadAntilink();
            if (!dataAntilink[chatId]) dataAntilink[chatId] = {};
            dataAntilink[chatId].aktif = statusInput === 'on';
            saveAntilink(dataAntilink);

            const statusEmoji = statusInput === 'on' ? '🔴 AKTIF' : '🟢 NONAKTIF';
            await sock.sendMessage(chatId, {
                text: `🛡️ *ANTI-LINK ${statusEmoji}*\n\n${statusInput === 'on'
                    ? 'Setiap non-admin yang mengirim link grup WhatsApp akan otomatis dikeluarkan!'
                    : 'Semua anggota kini boleh mengirim link.'}`
            });

        } catch (error) {
            console.error('[ERROR] !antilink:', error);
            await sock.sendMessage(chatId, { text: '❌ Gagal mengubah pengaturan Anti-Link.' }, { quoted: msg });
        }
    }
};
