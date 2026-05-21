/**
 * COMMAND: !jadwal [hari] | [kegiatan] (untuk menyimpan)
 *          !jadwal (tanpa argumen, untuk melihat)
 * 
 * Menyimpan dan melihat jadwal kegiatan grup berdasarkan hari.
 * Data disimpan di data/jadwal.json per grup.
 * 
 * Contoh:
 *   !jadwal Senin | Rapat mingguan jam 9 pagi
 *   !jadwal (untuk lihat semua)
 */

const fs = require('fs');
const path = require('path');

const FOLDER_DATA = path.join(process.cwd(), 'data');
const PATH_JADWAL = path.join(FOLDER_DATA, 'jadwal.json');

// Fungsi helper untuk load dan save data jadwal
function loadJadwal() {
    // PERBAIKAN: Pastikan folder 'data' dibuat dulu jika belum ada
    if (!fs.existsSync(FOLDER_DATA)) {
        fs.mkdirSync(FOLDER_DATA, { recursive: true });
    }
    
    if (!fs.existsSync(PATH_JADWAL)) {
        fs.writeFileSync(PATH_JADWAL, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(PATH_JADWAL, 'utf-8'));
}

function saveJadwal(data) {
    fs.writeFileSync(PATH_JADWAL, JSON.stringify(data, null, 2));
}

const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

module.exports = {
    name: 'jadwal',
    description: 'Simpan atau lihat jadwal kegiatan grup',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Jika tidak ada argumen → tampilkan jadwal grup ini
        if (!args || args.length === 0) {
            const semuaJadwal = loadJadwal();
            const jadwalGrup = semuaJadwal[chatId] || {};

            if (Object.keys(jadwalGrup).length === 0) {
                return await sock.sendMessage(chatId, {
                    text: '📅 *Jadwal Grup Kosong*\n\nBelum ada jadwal yang tersimpan.\nTambahkan dengan: `!jadwal [hari] | [kegiatan]`'
                }, { quoted: msg });
            }

            // Tampilkan jadwal diurutkan berdasarkan hari
            let teksJadwal = '📅 *JADWAL KEGIATAN GRUP*\n─────────────────────\n';
            let adaJadwal = false;

            URUTAN_HARI.forEach(hari => {
                if (jadwalGrup[hari] && jadwalGrup[hari].length > 0) {
                    adaJadwal = true;
                    teksJadwal += `\n*${hari}:*\n`;
                    jadwalGrup[hari].forEach((kegiatan, indeks) => {
                        teksJadwal += `  ${indeks + 1}. ${kegiatan}\n`;
                    });
                }
            });

            // Antisipasi jika properti grup ada tapi isinya kosong semua
            if (!adaJadwal) {
                return await sock.sendMessage(chatId, {
                    text: '📅 *Jadwal Grup Kosong*\n\nBelum ada jadwal yang tersimpan.\nTambahkan dengan: `!jadwal [hari] | [kegiatan]`'
                }, { quoted: msg });
            }

            teksJadwal += '\n_Ketik `!jadwal [hari] | [kegiatan]` untuk menambah jadwal._';

            return await sock.sendMessage(chatId, { text: teksJadwal }, { quoted: msg });
        }

        // Jika ada argumen → tambah jadwal baru
        const teksLengkap = args.join(' ');
        const bagian = teksLengkap.split('|');

        if (bagian.length < 2) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Format salah!*\n\nGunakan: `!jadwal [hari] | [kegiatan]`\nContoh: `!jadwal Senin | Rapat mingguan jam 9 pagi`'
            }, { quoted: msg });
        }

        const inputHari = bagian[0].trim();
        const kegiatan = bagian[1].trim();

        // Validasi nama hari
        const hariValid = URUTAN_HARI.find(h => h.toLowerCase() === inputHari.toLowerCase());
        if (!hariValid) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ Nama hari tidak valid!\nGunakan salah satu: *${URUTAN_HARI.join(', ')}*`
            }, { quoted: msg });
        }

        if (!kegiatan) {
            return await sock.sendMessage(chatId, { text: '⚠️ Kegiatan tidak boleh kosong!' }, { quoted: msg });
        }

        // Simpan ke database
        const semuaJadwal = loadJadwal();
        if (!semuaJadwal[chatId]) semuaJadwal[chatId] = {};
        if (!semuaJadwal[chatId][hariValid]) semuaJadwal[chatId][hariValid] = [];

        semuaJadwal[chatId][hariValid].push(kegiatan);
        saveJadwal(semuaJadwal);

        await sock.sendMessage(chatId, {
            text: `✅ *Jadwal Ditambahkan!*\n\n📅 Hari: *${hariValid}*\n📝 Kegiatan: _${kegiatan}_\n\nKetik \`!jadwal\` untuk melihat semua jadwal.`
        }, { quoted: msg });
    }
};