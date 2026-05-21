const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { isPrivate, isPresiden } = require('../../utils/middleware.js');

module.exports = {
    name: 'datanik',
    description: 'Mengunduh laporan data NIK yang terkumpul dalam format Excel (Khusus Presiden & PM)',
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const senderNumber = senderId.replace(/:\d+/, '').split('@')[0];

        // 1. Validasi PM
        if (!isPrivate(msg)) {
            return await sock.sendMessage(chatId, { text: '⚠️ Command Presiden hanya bisa diakses melalui Private Message (PM)!' }, { quoted: msg });
        }

        // 2. Validasi Presiden
        if (!isPresiden(senderNumber)) {
            return await sock.sendMessage(chatId, { text: '⛔ Anda bukan Presiden Republik Nexus!' }, { quoted: msg });
        }

        // 3. Validasi apakah ada data NIK
        if (!global.db.nik || !global.db.nik.records || Object.keys(global.db.nik.records).length === 0) {
            return await sock.sendMessage(chatId, { text: '⚠️ Belum ada data NIK yang berhasil dikumpulkan dalam database.' });
        }

        let tempPath = '';
        try {
            const records = global.db.nik.records;
            
            // Format data untuk Excel
            const excelData = Object.entries(records).map(([nomor, item], index) => {
                return {
                    'No': index + 1,
                    'Nomor WhatsApp': nomor,
                    'Nama Lengkap Sesuai KK': item.nama,
                    'Nomor NIK': `'${item.nik}`, // Tambahkan kutip satu agar NIK dibaca sebagai teks di Excel (tidak memotong angka 0 di depan atau berantakan formatnya)
                    'Tanggal Submit': new Date(item.submittedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                };
            });

            // Buat workbook & worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data NIK');

            // Atur lebar kolom agar rapi
            const colWidths = [
                { wch: 5 },  // No
                { wch: 20 }, // Nomor WhatsApp
                { wch: 30 }, // Nama Lengkap Sesuai KK
                { wch: 25 }, // Nomor NIK
                { wch: 25 }  // Tanggal Submit
            ];
            worksheet['!cols'] = colWidths;

            // Simpan sementara ke file
            tempPath = path.join(process.cwd(), 'data', `Data_NIK_Nexus_${Date.now()}.xlsx`);
            XLSX.writeFile(workbook, tempPath);

            // Kirim file xlsx ke Presiden
            const fileBuffer = fs.readFileSync(tempPath);
            await sock.sendMessage(chatId, {
                document: fileBuffer,
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                fileName: 'Data_NIK_Republik_Nexus.xlsx'
            });

        } catch (error) {
            console.error('[ERROR] !datanik:', error);
            await sock.sendMessage(chatId, { text: '❌ Gagal menghasilkan file laporan Excel data NIK.' });
        } finally {
            // Hapus file temporary
            if (tempPath && fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                } catch (e) {
                    console.error('[ERROR] Gagal menghapus file temporary:', e);
                }
            }
        }
    }
};
