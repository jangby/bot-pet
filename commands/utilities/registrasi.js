const axios = require('axios');

if (!global.sesiPendaftaran) {
    global.sesiPendaftaran = {};
}
const sesiPendaftaran = global.sesiPendaftaran;

// Fungsi penanganan tanya-jawab langkah demi langkah
async function handleSession(sock, msg, chatId, senderNumber, teksPesan) {
    const sesi = global.sesiPendaftaran[senderNumber];
    const step = sesi.step;
    const isUlang = teksPesan.toUpperCase() === 'ULANG';

    try {
        // Jika user minta reset di tengah jalan
        if (isUlang && step > 1) {
            sesi.step = 1;
            // Tambahkan penghasilan_ayah dan penghasilan_ibu ke dalam format data:
sesi.data = { 
    nama_lengkap: "", jenjang: "", jenis_kelamin: "", tempat_lahir: "", tanggal_lahir: "",
    nik: "", nisn: "", asal_sekolah: "", no_kk: "", 
    alamat: "", rt: "", rw: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "",
    nama_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "", no_hp_ayah: "",
    nama_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "", no_hp_ibu: "" 
};
            return await sock.sendMessage(chatId, { text: '🔄 _Data direset._\n\n👉 *LANGKAH 1:* Ketik *NAMA LENGKAP* calon santri:' });
        }

        if (step === 1) {
            sesi.data.nama_lengkap = teksPesan;
            sesi.step = 2;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 2:* Pilih *JENJANG* pendaftaran (Balas Angka):\n1. SMP\n2. SMA\n3. SMK\n4. SMA Lanjutan` });
        }

        if (step === 2) {
            const map = {'1': 'SMP', '2': 'SMA', '3': 'SMK', '4': 'SMA Lanjutan'};
            if (!map[teksPesan]) return await sock.sendMessage(chatId, { text: '❌ Balas dengan angka 1, 2, 3, atau 4.' });
            sesi.data.jenjang = map[teksPesan];
            sesi.step = 3;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 3:* Pilih *JENIS KELAMIN* (Balas Angka):\n1. Laki-laki\n2. Perempuan` });
        }

        if (step === 3) {
            if (teksPesan === '1') sesi.data.jenis_kelamin = 'L';
            else if (teksPesan === '2') sesi.data.jenis_kelamin = 'P';
            else return await sock.sendMessage(chatId, { text: '❌ Balas dengan angka 1 atau 2.' });
            sesi.step = 4;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 4:* Ketik *TEMPAT LAHIR* (Contoh: Bandung):` });
        }

        if (step === 4) {
            sesi.data.tempat_lahir = teksPesan;
            sesi.step = 5;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 5:* Ketik *TANGGAL LAHIR*\nGunakan format strip (-). Contoh: *17-08-2010*:` });
        }

        if (step === 5) {
            const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/;
            if (!dateRegex.test(teksPesan)) return await sock.sendMessage(chatId, { text: '❌ Format salah. Contoh yang benar: *17-08-2010*\nSilakan ketik ulang:' });
            sesi.data.tanggal_lahir = teksPesan;
            sesi.step = 6;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 6:* Ketik *16 Digit NIK* Santri:` });
        }

        if (step === 6) {
            const nikClean = teksPesan.replace(/[^0-9]/g, '');
            if (nikClean.length !== 16) return await sock.sendMessage(chatId, { text: `❌ NIK harus persis 16 angka (Anda mengetik ${nikClean.length}). Ketik ulang:` });
            sesi.data.nik = nikClean;
            sesi.step = 7;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 7:* Ketik *NISN* Santri (10-12 angka).\n_Jika belum ada/tidak tahu, balas dengan tanda strip (*-*)_` });
        }

        if (step === 7) {
            const nisnClean = teksPesan.replace(/[^0-9]/g, '');
            if (teksPesan !== '-' && (nisnClean.length < 10 || nisnClean.length > 12)) return await sock.sendMessage(chatId, { text: `❌ NISN harus 10-12 angka. Ketik (-) jika tidak ada.` });
            sesi.data.nisn = teksPesan === '-' ? '' : nisnClean;
            sesi.step = 8;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 8:* Ketik nama *ASAL SEKOLAH* (Contoh: SDN 1 Bandung):` });
        }

        if (step === 8) {
            sesi.data.asal_sekolah = teksPesan;
            sesi.step = 9;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 9:* Ketik *No. Kartu Keluarga (KK)* (16 angka):` });
        }

        if (step === 9) {
            const kkClean = teksPesan.replace(/[^0-9]/g, '');
            if (kkClean.length < 15) return await sock.sendMessage(chatId, { text: `❌ Nomor KK tidak valid. Ketik ulang:` });
            sesi.data.no_kk = kkClean;
            sesi.step = 10;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 10:* Ketik nama *Jalan / Kampung / Perumahan*:` });
        }

        if (step === 10) {
            sesi.data.alamat = teksPesan;
            sesi.step = 11;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 11:* Ketik angka *RT* (Contoh: 01):` });
        }

        if (step === 11) {
            sesi.data.rt = teksPesan.replace(/[^0-9]/g, '');
            sesi.step = 12;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 12:* Ketik angka *RW* (Contoh: 02):` });
        }

        if (step === 12) {
            sesi.data.rw = teksPesan.replace(/[^0-9]/g, '');
            sesi.step = 13;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 13:* Ketik nama *Desa / Kelurahan*:` });
        }

        if (step === 13) {
            sesi.data.desa = teksPesan;
            sesi.step = 14;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 14:* Ketik nama *Kecamatan*:` });
        }

        if (step === 14) {
            sesi.data.kecamatan = teksPesan;
            sesi.step = 15;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 15:* Ketik nama *Kabupaten / Kota*:` });
        }

        if (step === 15) {
            sesi.data.kabupaten = teksPesan;
            sesi.step = 16;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 16:* Ketik nama *Provinsi*:` });
        }

        if (step === 16) {
            sesi.data.provinsi = teksPesan;
            sesi.step = 17;
            return await sock.sendMessage(chatId, { text: `✅ Alamat lengkap tersimpan!\n\n👉 *LANGKAH 17:* Ketik *Nama Lengkap Ayah*:` });
        }

        if (step === 17) {
            sesi.data.nama_ayah = teksPesan;
            sesi.step = 18;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 18:* Ketik *Pekerjaan Ayah* (Contoh: Wiraswasta / Buruh):` });
        }

        if (step === 18) {
            sesi.data.pekerjaan_ayah = teksPesan;
            sesi.step = 19;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 19:* Ketik *No. WA / HP Ayah* (Dimulai dengan 08 / 62):` });
        }

        // --- 19. NO HP AYAH ---
        if (step === 19) {
            const hpClean = teksPesan.replace(/[^0-9]/g, '');
            if (hpClean.length < 10) return await sock.sendMessage(chatId, { text: '❌ Nomor HP terlalu pendek. Ketik ulang:' });
            sesi.data.no_hp_ayah = hpClean;
            sesi.step = 20;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 20:* Ketik rata-rata *Penghasilan Ayah* per bulan (Hanya angka, contoh: 3000000) atau ketik 0 jika tidak ada:` });
        }

        // --- 20. PENGHASILAN AYAH ---
        if (step === 20) {
            sesi.data.penghasilan_ayah = teksPesan.replace(/[^0-9]/g, ''); // Hanya ambil angka
            sesi.step = 21;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 21:* Ketik *Nama Lengkap Ibu*:` });
        }

        // --- 21. NAMA IBU ---
        if (step === 21) {
            sesi.data.nama_ibu = teksPesan;
            sesi.step = 22;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 22:* Ketik *Pekerjaan Ibu* (Contoh: Ibu Rumah Tangga):` });
        }

        // --- 22. PEKERJAAN IBU ---
        if (step === 22) {
            sesi.data.pekerjaan_ibu = teksPesan;
            sesi.step = 23;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 23:* Ketik *No. WA / HP Ibu*:` });
        }

        // --- 23. NO HP IBU ---
        if (step === 23) {
            const hpClean2 = teksPesan.replace(/[^0-9]/g, '');
            if (hpClean2.length < 10) return await sock.sendMessage(chatId, { text: '❌ Nomor HP terlalu pendek. Ketik ulang:' });
            sesi.data.no_hp_ibu = hpClean2;
            sesi.step = 24;
            return await sock.sendMessage(chatId, { text: `✅ Disimpan.\n\n👉 *LANGKAH 24:* Terakhir, ketik rata-rata *Penghasilan Ibu* per bulan (Hanya angka, contoh: 2000000) atau ketik 0 jika tidak ada:` });
        }

        // --- 24. PENGHASILAN IBU & PREVIEW ---
        if (step === 24) {
            sesi.data.penghasilan_ibu = teksPesan.replace(/[^0-9]/g, '');
            sesi.step = 25;

            // Format uang menjadi Rupiah yang rapi (Opsional untuk pratinjau)
            const formatRp = (angka) => 'Rp ' + Number(angka).toLocaleString('id-ID');

            const reviewText = `📋 *KONFIRMASI AKHIR PENDAFTARAN*\n\n` +
                               `*A. DATA SANTRI*\n` +
                               `• Nama: ${sesi.data.nama_lengkap}\n` +
                               `• Jenjang: ${sesi.data.jenjang}\n` +
                               `• NIK: ${sesi.data.nik}\n` +
                               `• TTL: ${sesi.data.tempat_lahir}, ${sesi.data.tanggal_lahir}\n\n` +
                               `*B. ALAMAT*\n` +
                               `• ${sesi.data.alamat} RT ${sesi.data.rt} RW ${sesi.data.rw}\n` +
                               `• Desa ${sesi.data.desa}, Kec. ${sesi.data.kecamatan}\n` +
                               `• Kab. ${sesi.data.kabupaten}, Prov. ${sesi.data.provinsi}\n\n` +
                               `*C. ORANG TUA*\n` +
                               `• Ayah: ${sesi.data.nama_ayah} (${sesi.data.no_hp_ayah})\n` +
                               `  └ Gaji: ${formatRp(sesi.data.penghasilan_ayah)}\n` +
                               `• Ibu: ${sesi.data.nama_ibu} (${sesi.data.no_hp_ibu})\n` +
                               `  └ Gaji: ${formatRp(sesi.data.penghasilan_ibu)}\n\n` +
                               `Apakah seluruh data di atas sudah *BENAR*?\nSilakan balas:\n*YA* (Untuk menyimpan permanen)\n*ULANG* (Untuk mengulangi isian dari awal)`;

            return await sock.sendMessage(chatId, { text: reviewText });
        }

        // --- 25. FINALISASI (SUBMIT KE LARAVEL) ---
        if (step === 25) {
            if (teksPesan.toUpperCase() === 'YA') {
                await sock.sendMessage(chatId, { text: '⏳ _Menyimpan data ke server..._' });
                
                const apiUrl = `https://ppdb.ponpesassaadah.com/api/ppdb/wa-submit-daftar`; 
                const payload = { token: sesi.token, ...sesi.data };

                try {
                    const response = await axios.post(apiUrl, payload);
                    if (response.data.success) {
                        delete sesiPendaftaran[senderNumber]; 
                        return await sock.sendMessage(chatId, { 
                            text: `🎉 *PENDAFTARAN SELESAI!*\n\nData atas nama *${response.data.data.nama}* telah berhasil disimpan ke database Pesantren.\n\n🔖 Nomor Registrasi: *${response.data.data.no_daftar}*\n\nTerima kasih, silakan simpan nomor di atas.` 
                        });
                    }
                } catch (err) {
                    console.log("DEBUG ERROR LARAVEL:", err.response?.data); 
                    const errorMsg = err.response?.data?.message || err.message;
                    const detailError = err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : "";
                    return await sock.sendMessage(chatId, { text: `❌ *GAGAL MENYIMPAN*\nPesan: ${errorMsg}\nDetail: ${detailError}\n\nKetik *ULANG* untuk memperbaiki.` });
                }
            } else {
                return await sock.sendMessage(chatId, { text: '❌ Mohon balas dengan kata *YA* atau *ULANG*.' });
            }
        }
    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { text: '🚨 *Error Server*\nTerjadi gangguan. Ketik *BATAL* lalu ulangi perintah pendaftaran.' });
    }
} // <--- INI ADALAH PENUTUP DARI FUNGSI handleSession (PENTING!)

// Module Exports Command Bot
module.exports = [
    {
        name: 'daftar',
        description: 'Mengisi biodata santri via WhatsApp secara interaktif',
        async execute(sock, msg, args) {
            const chatId = msg.key.remoteJid;
            
            const senderRaw = msg.key.remoteJidAlt || msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderRaw ? String(senderRaw).split('@')[0].split(':')[0] : '';
            const teksPesan = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

            console.log("[DEBUG] Membuat sesi baru untuk:", senderNumber);
            // 1. Jika User Sudah Memiliki Sesi (Lanjut Tanya Jawab)
            if (sesiPendaftaran[senderNumber]) {
                if (teksPesan.toUpperCase() === 'BATAL') {
                    delete sesiPendaftaran[senderNumber];
                    return await sock.sendMessage(chatId, { text: '🚫 _Proses pendaftaran dibatalkan._' }, { quoted: msg });
                }
                return await handleSession(sock, msg, chatId, senderNumber, teksPesan);
            }
            console.log("[DEBUG] Sesi saat ini:", sesiPendaftaran);

            // 2. Jika Belum Ada Sesi (Awal Command)
            const token = args[0];
            if (!token) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ Format salah. Gunakan perintah:\n*!daftar [TOKEN_ANDA]*' 
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(chatId, { text: '🔄 _Memeriksa token pendaftaran..._' });
                const apiUrl = `https://ppdb.ponpesassaadah.com/api/ppdb/wa-check-token/${token}`; 
                const response = await axios.get(apiUrl);
                const resData = response.data;

                // Proteksi Data Ganda
                if (resData.is_completed) {
                    return await sock.sendMessage(chatId, { 
                        text: `⚠️ Pendaftaran atas nama *${resData.data.nama}* sudah berstatus SELESAI.\nNomor Registrasi: *${resData.data.no_daftar}*\n\nTidak perlu mendaftar ulang.` 
                    });
                }

                // Inisialisasi Sesi Baru
                sesiPendaftaran[senderNumber] = {
                    token: token,
                    step: resData.is_admin_filled ? 4 : 1, // Fitur "Smart Skip" jika admin sudah mengisi
                    data: {
                        nama_lengkap: resData.data.nama || "", jenjang: resData.data.jenjang || "", jenis_kelamin: resData.data.jenis_kelamin || "",
                        tempat_lahir: "", tanggal_lahir: "", nik: "", nisn: "", asal_sekolah: "", no_kk: "", 
                        alamat: "", rt: "", rw: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "",
                        nama_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "", no_hp_ayah: "", nama_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "", no_hp_ibu: ""
                    }
                };

                // Sambutan Awal
                let replyText = `📝 *SESI PENDAFTARAN DIMULAI*\n\n`;
                if (resData.is_admin_filled) {
                    replyText += `Data awal Anda ditemukan:\n👤 Nama: *${resData.data.nama}*\n🎓 Jenjang: *${resData.data.jenjang}*\n🚻 JK: *${resData.data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}*\n\n`;
                    replyText += `👉 *LANGKAH 4:* Ketik *TEMPAT LAHIR* (Contoh: Bandung):`;
                } else {
                    replyText += `👉 *LANGKAH 1:* Ketik *NAMA LENGKAP* calon santri:`;
                }
                replyText += `\n\n_(Ketik *BATAL* kapan saja untuk membatalkan)_`;

                await sock.sendMessage(chatId, { text: replyText });

            } catch (error) {
                console.error(error);
                await sock.sendMessage(chatId, { text: '❌ *GAGAL*\nToken tidak valid, kadaluarsa, atau server sedang sibuk.' });
            }
        }
    }
];

// EKSPOR TAMBAHAN UNTUK INDEX.JS
module.exports.sesiPendaftaran = sesiPendaftaran;
module.exports.handleSession = handleSession;