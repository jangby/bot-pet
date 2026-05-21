/**
 * COMMAND: !gdrive
 * Upload media yang dikirim ke Google Drive.
 * 
 * Library yang dibutuhkan:
 *   npm install googleapis
 * 
 * Setup Google Drive API:
 *   1. Buka https://console.cloud.google.com/
 *   2. Buat project baru → Enable "Google Drive API"
 *   3. Buat Service Account → Download credentials.json
 *   4. Simpan credentials.json di root folder bot
 *   5. Share folder Google Drive kamu ke email Service Account
 * 
 * Contoh: Kirim gambar/file lalu ketik !gdrive
 *         Atau balas media dengan !gdrive
 */

// CATATAN: googleapis di-require secara lazy (di dalam execute)
// agar bot tidak crash saat library belum terinstall.
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// ==========================================
// KONFIGURASI GOOGLE DRIVE
// ==========================================
const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID || 'MASUKKAN_FOLDER_ID_GOOGLE_DRIVE';
const GDRIVE_CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

function getGDriveClient() {
    // Lazy require: googleapis hanya di-load saat perintah !gdrive digunakan
    // Sehingga bot tidak crash walaupun library belum terinstall
    let google;
    try {
        google = require('googleapis').google;
    } catch {
        throw new Error('Library googleapis belum terinstall!\nJalankan: npm install googleapis');
    }

    if (!fs.existsSync(GDRIVE_CREDENTIALS_PATH)) {
        throw new Error('File credentials.json tidak ditemukan!');
    }
    const auth = new google.auth.GoogleAuth({
        keyFile: GDRIVE_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return google.drive({ version: 'v3', auth });
}


module.exports = {
    name: 'gdrive',
    description: 'Upload media ke Google Drive',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderNumber = (msg.key.participant || msg.key.remoteJid).replace(/:\d+/, '').split('@')[0];

        // Deteksi media dari reply atau pesan langsung
        const pesanDikutip = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const pesanMedia = pesanDikutip || msg.message;

        const adaGambar = pesanMedia?.imageMessage;
        const adaVideo = pesanMedia?.videoMessage;
        const adaDokumen = pesanMedia?.documentMessage;
        const adaAudio = pesanMedia?.audioMessage;

        if (!adaGambar && !adaVideo && !adaDokumen && !adaAudio) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\nKirim media (gambar/video/dokumen) lalu ketik `!gdrive`, atau balas media dengan `!gdrive`.'
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(chatId, { text: '☁️ Mengupload ke Google Drive...' }, { quoted: msg });

            // Download media sebagai buffer
            const bufferMedia = await sock.downloadMediaMessage(
                pesanDikutip
                    ? { message: pesanDikutip, key: msg.key }
                    : msg
            );

            // Tentukan nama file dan tipe MIME
            let namaFile, mimeType;
            const timestamp = Date.now();
            if (adaGambar) { namaFile = `gambar_${timestamp}.jpg`; mimeType = 'image/jpeg'; }
            else if (adaVideo) { namaFile = `video_${timestamp}.mp4`; mimeType = 'video/mp4'; }
            else if (adaDokumen) {
                namaFile = adaDokumen.fileName || `dokumen_${timestamp}`;
                mimeType = adaDokumen.mimetype || 'application/octet-stream';
            }
            else if (adaAudio) { namaFile = `audio_${timestamp}.ogg`; mimeType = 'audio/ogg'; }

            // Konversi Buffer ke Readable Stream untuk Google Drive API
            const streamMedia = new Readable();
            streamMedia.push(bufferMedia);
            streamMedia.push(null);

            // Upload ke Google Drive
            const driveClient = getGDriveClient();
            const responUpload = await driveClient.files.create({
                requestBody: {
                    name: namaFile,
                    parents: [GDRIVE_FOLDER_ID]
                },
                media: {
                    mimeType: mimeType,
                    body: streamMedia
                },
                fields: 'id, name, webViewLink'
            });

            const fileId = responUpload.data.id;
            const linkFile = responUpload.data.webViewLink;

            // Jadikan file bisa diakses publik
            await driveClient.permissions.create({
                fileId: fileId,
                requestBody: { role: 'reader', type: 'anyone' }
            });

            await sock.sendMessage(chatId, {
                text: `☁️ *UPLOAD BERHASIL!*\n\n📁 Nama File: ${namaFile}\n🔗 Link: ${linkFile}\n\n_File berhasil diupload ke Google Drive._`
            }, { quoted: msg });

        } catch (error) {
            console.error('[ERROR] !gdrive:', error);
            const pesanError = error.message.includes('credentials')
                ? '❌ File `credentials.json` tidak ditemukan atau tidak valid.\nSetup Google Drive API terlebih dahulu.'
                : '❌ Gagal upload ke Google Drive. Cek konfigurasi API.';
            await sock.sendMessage(chatId, { text: pesanError }, { quoted: msg });
        }
    }
};
