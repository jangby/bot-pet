/**
 * COMMAND: !ruler [angka] [dari_satuan] ke [ke_satuan]
 * Konversi satuan panjang, berat, suhu, dan kecepatan.
 * 
 * Tidak memerlukan library tambahan (pure JavaScript).
 * 
 * Contoh:
 *   !ruler 100 km ke m
 *   !ruler 1 kg ke gram
 *   !ruler 30 c ke f  (Celsius ke Fahrenheit)
 *   !ruler 60 mph ke kph
 */

// Definisi faktor konversi ke satuan dasar
const FAKTOR_KONVERSI = {
    // PANJANG (basis: meter)
    km: { basis: 'panjang', ke_meter: 1000 },
    m: { basis: 'panjang', ke_meter: 1 },
    cm: { basis: 'panjang', ke_meter: 0.01 },
    mm: { basis: 'panjang', ke_meter: 0.001 },
    mi: { basis: 'panjang', ke_meter: 1609.344, label: 'mil' },
    yard: { basis: 'panjang', ke_meter: 0.9144 },
    ft: { basis: 'panjang', ke_meter: 0.3048, label: 'kaki' },
    inch: { basis: 'panjang', ke_meter: 0.0254, label: 'inci' },

    // BERAT (basis: gram)
    ton: { basis: 'berat', ke_gram: 1000000 },
    kg: { basis: 'berat', ke_gram: 1000 },
    gram: { basis: 'berat', ke_gram: 1 },
    mg: { basis: 'berat', ke_gram: 0.001 },
    pon: { basis: 'berat', ke_gram: 453.592, label: 'pon (lb)' },
    ons: { basis: 'berat', ke_gram: 28.3495, label: 'ons (oz)' },

    // KECEPATAN (basis: m/s)
    ms: { basis: 'kecepatan', ke_ms: 1, label: 'm/s' },
    kph: { basis: 'kecepatan', ke_ms: 0.277778, label: 'km/jam' },
    mph: { basis: 'kecepatan', ke_ms: 0.44704, label: 'mil/jam' },
    knot: { basis: 'kecepatan', ke_ms: 0.514444 }
};

function konversiSuhu(nilai, dari, ke) {
    // Konversi suhu (C, F, K)
    let celsius;
    if (dari === 'c') celsius = nilai;
    else if (dari === 'f') celsius = (nilai - 32) * 5 / 9;
    else if (dari === 'k') celsius = nilai - 273.15;
    else return null;

    if (ke === 'c') return celsius;
    if (ke === 'f') return (celsius * 9 / 5) + 32;
    if (ke === 'k') return celsius + 273.15;
    return null;
}

module.exports = {
    name: 'ruler',
    description: 'Konversi satuan. Format: !ruler [angka] [dari] ke [satuan]',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;

        // Format: !ruler 100 km ke m
        const teks = args.join(' ').toLowerCase();
        const cocok = teks.match(/^([\d.]+)\s+(\w+)\s+ke\s+(\w+)$/);

        if (!cocok) {
            return await sock.sendMessage(chatId, {
                text: '⚠️ *Cara Pakai:*\n`!ruler [angka] [satuan_asal] ke [satuan_tujuan]`\n\n*Contoh:*\n• `!ruler 100 km ke m`\n• `!ruler 5 kg ke gram`\n• `!ruler 37 c ke f` _(suhu)_\n• `!ruler 60 mph ke kph`'
            }, { quoted: msg });
        }

        const nilaiAwal = parseFloat(cocok[1]);
        const satuanDari = cocok[2];
        const satuanKe = cocok[3];

        // Cek apakah konversi suhu
        if (['c', 'f', 'k'].includes(satuanDari) && ['c', 'f', 'k'].includes(satuanKe)) {
            const hasil = konversiSuhu(nilaiAwal, satuanDari, satuanKe);
            if (hasil === null) {
                return await sock.sendMessage(chatId, { text: '❌ Satuan suhu tidak valid!' }, { quoted: msg });
            }
            const labelSuhu = { c: 'Celsius (°C)', f: 'Fahrenheit (°F)', k: 'Kelvin (K)' };
            return await sock.sendMessage(chatId, {
                text: `🌡️ *Konversi Suhu*\n\n${nilaiAwal} ${labelSuhu[satuanDari]}\n= *${hasil.toFixed(2)} ${labelSuhu[satuanKe]}*`
            });
        }

        // Cek konversi satuan lainnya
        const infoSatuanDari = FAKTOR_KONVERSI[satuanDari];
        const infoSatuanKe = FAKTOR_KONVERSI[satuanKe];

        if (!infoSatuanDari || !infoSatuanKe) {
            return await sock.sendMessage(chatId, {
                text: '❌ Satuan tidak dikenali!\n\nSatuan yang tersedia:\n*Panjang:* km, m, cm, mm, mi, yard, ft, inch\n*Berat:* ton, kg, gram, mg, pon, ons\n*Kecepatan:* ms, kph, mph, knot\n*Suhu:* c, f, k'
            }, { quoted: msg });
        }

        if (infoSatuanDari.basis !== infoSatuanKe.basis) {
            return await sock.sendMessage(chatId, {
                text: `❌ Tidak bisa mengkonversi *${satuanDari}* (${infoSatuanDari.basis}) ke *${satuanKe}* (${infoSatuanKe.basis})!\nPastikan kategori satuannya sama.`
            }, { quoted: msg });
        }

        // Pilih kunci faktor berdasarkan basis
        const kunciFaktor = { panjang: 'ke_meter', berat: 'ke_gram', kecepatan: 'ke_ms' }[infoSatuanDari.basis];

        // Konversi: nilai → basis → target
        const nilaiDalamBasis = nilaiAwal * infoSatuanDari[kunciFaktor];
        const nilaiHasil = nilaiDalamBasis / infoSatuanKe[kunciFaktor];

        const labelDari = infoSatuanDari.label || satuanDari;
        const labelKe = infoSatuanKe.label || satuanKe;

        await sock.sendMessage(chatId, {
            text: `📏 *Konversi Satuan*\n\n${nilaiAwal} *${labelDari}*\n= *${nilaiHasil.toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${labelKe}*`
        });
    }
};
