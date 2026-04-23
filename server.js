const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 🛡️ AUTO-SEED PASAR INDUK 🛡️ ---
// Memastikan data grosir tidak akan pernah hilang
const defaultPasarInduk = {
    karnivora: {
        daging_ayam: { nama: "Daging Ayam Brolier", modal: 50, efek: "+20 Kenyang", tipe: "makanan" },
        daging_sapi: { nama: "Daging Sapi Premium", modal: 120, efek: "+50 Kenyang", tipe: "makanan" },
        tulang_iga: { nama: "Tulang Iga Segar", modal: 80, efek: "+30 Kenyang", tipe: "makanan" },
        sosis_daging: { nama: "Sosis Daging Olahan", modal: 30, efek: "+10 Kenyang", tipe: "makanan" }
    },
    herbivora: {
        gandum: { nama: "Gandum Kering", modal: 25, efek: "+15 Kenyang", tipe: "makanan" },
        wortel: { nama: "Wortel Segar", modal: 40, efek: "+25 Kenyang", tipe: "makanan" },
        apel: { nama: "Apel Merah Manis", modal: 60, efek: "+35 Kenyang", tipe: "makanan" },
        rumput_sultan: { nama: "Rumput Sultan Berkualitas", modal: 100, efek: "+50 Kenyang", tipe: "makanan" }
    },
    pescivora: {
        ikan_kecil: { nama: "Ikan Teri Air Tawar", modal: 30, efek: "+15 Kenyang", tipe: "makanan" },
        ikan_salmon: { nama: "Ikan Salmon Samudra", modal: 150, efek: "+60 Kenyang", tipe: "makanan" },
        udang: { nama: "Udang Kupas", modal: 70, efek: "+30 Kenyang", tipe: "makanan" },
        cumi: { nama: "Cumi-cumi Mentah", modal: 90, efek: "+40 Kenyang", tipe: "makanan" }
    },
    mythical: {
        kristal_mana: { nama: "Kristal Mana Biru", modal: 500, efek: "+100 Kenyang & Energi", tipe: "makanan" },
        buah_surga: { nama: "Buah Eden", modal: 800, efek: "+100 Kenyang & +10 XP", tipe: "makanan" },
        elixir_murni: { nama: "Tetesan Elixir Murni", modal: 1200, efek: "Kenyang Max & Imunitas", tipe: "makanan" }
    },
    apotek: {
        pil_ringan: { nama: "Pil Ringan", modal: 150, kegunaan: "Menyembuhkan sakit pencernaan", tipe: "obat" },
        perban: { nama: "Perban Steril", modal: 100, kegunaan: "Memulihkan luka luar akibat PvP", tipe: "obat" },
        vitamin: { nama: "Vitamin Booster", modal: 250, kegunaan: "Meningkatkan imunitas", tipe: "obat" },
        antibiotik: { nama: "Antibiotik Dosis Tinggi", modal: 450, kegunaan: "Menyembuhkan sakit keras", tipe: "obat" },
        salep_luka: { nama: "Salep Luka Ajaib", modal: 300, kegunaan: "Memulihkan HP pet", tipe: "obat" }
    }
};

// --- ROUTING HALAMAN DASHBOARD (GET) ---
app.get('/dashboard', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(401).send('<h1>Akses Ditolak</h1>');

    if (!global.db.market.pasarInduk || Object.keys(global.db.market.pasarInduk).length === 0) {
        global.db.market.pasarInduk = defaultPasarInduk;
        fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
    }

    let dataToko = null;
    let nomorPemilik = null;

    for (const [nomor, data] of Object.entries(global.db.market.tokoPemain)) {
        if (data.tokenWeb === token) {
            dataToko = data;
            nomorPemilik = nomor;
            break;
        }
    }

    if (!dataToko) return res.status(404).send('<h1>Toko Tidak Ditemukan</h1>');

    const saldoPemilik = global.db.player[nomorPemilik]?.saldo || 0;
    const kategoriBarang = global.db.market.pasarInduk[dataToko.kategori];

    // MENGUBAH TABEL MENJADI KARTU (MOBILE FRIENDLY)
    let kartuBarang = '';
    for (const [idBarang, info] of Object.entries(kategoriBarang)) {
        const stokSekarang = dataToko.etalase[idBarang]?.stok || 0;
        const hargaJual = dataToko.etalase[idBarang]?.harga || (info.modal + 20); 

        kartuBarang += `
            <div class="card">
                <div class="card-header">
                    <div class="item-info">
                        <h3>${info.nama}</h3>
                        <p>${info.kegunaan || info.efek}</p>
                    </div>
                    <div class="stok-badge">📦 ${stokSekarang}</div>
                </div>
                <div class="modal-info">Modal Grosir: <span>${info.modal} 💠</span></div>
                <div class="input-grid">
                    <div class="input-group">
                        <label>Beli Stok Baru</label>
                        <input type="number" class="input-form" id="kulak_${idBarang}" min="0" value="0">
                    </div>
                    <div class="input-group">
                        <label>Set Harga Jual</label>
                        <input type="number" class="input-form" id="harga_${idBarang}" min="${info.modal}" value="${hargaJual}">
                    </div>
                </div>
            </div>
        `;
    }

    // TAMPILAN HTML & CSS MODERN MOBILE-FIRST
    const htmlTampilan = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Nexus Market</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            
            :root {
                --primary: #3b82f6; --primary-dark: #2563eb;
                --bg: #f8fafc; --card-bg: #ffffff;
                --text: #1e293b; --text-muted: #64748b;
                --success: #10b981; --border: #e2e8f0;
            }

            body { 
                font-family: 'Plus Jakarta Sans', sans-serif; 
                background-color: var(--bg); margin: 0; padding: 0; 
                color: var(--text); padding-bottom: 90px; /* Space for sticky button */
            }

            /* Header Section */
            .top-nav {
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                padding: 25px 20px 40px; border-bottom-left-radius: 25px; border-bottom-right-radius: 25px;
                color: white; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            }
            .shop-title { margin: 0 0 5px 0; font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px;}
            .shop-cat { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;}
            
            /* Kas Card */
            .kas-card {
                background: white; border-radius: 16px; margin: -25px 20px 20px;
                padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .kas-card div p { margin: 0; font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;}
            .kas-card div h2 { margin: 0; font-size: 20px; color: var(--success); }
            
            /* Item Cards */
            .content { padding: 0 20px; }
            .section-title { font-size: 16px; margin-bottom: 15px; color: var(--text); font-weight: 700;}
            
            .card {
                background: var(--card-bg); border-radius: 16px; padding: 16px;
                margin-bottom: 16px; border: 1px solid var(--border);
                box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            }
            .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;}
            .item-info h3 { margin: 0 0 4px 0; font-size: 15px; color: var(--text); }
            .item-info p { margin: 0; font-size: 11px; color: var(--text-muted); line-height: 1.4; }
            .stok-badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;}
            
            .modal-info { font-size: 12px; color: #ef4444; font-weight: 600; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed var(--border);}
            .modal-info span { font-size: 14px; }

            /* Inputs */
            .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .input-group label { display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
            .input-form { 
                width: 100%; box-sizing: border-box; padding: 10px; border: 2px solid var(--border); 
                border-radius: 10px; font-family: inherit; font-size: 14px; font-weight: 600; text-align: center;
                transition: border 0.2s; -webkit-appearance: none;
            }
            .input-form:focus { border-color: var(--primary); outline: none; }

            /* Sticky Action Bar */
            .bottom-bar {
                position: fixed; bottom: 0; left: 0; right: 0; background: white;
                padding: 15px 20px; border-top: 1px solid var(--border);
                box-shadow: 0 -4px 15px rgba(0,0,0,0.05); z-index: 100;
            }
            .btn-save {
                background: var(--primary); color: white; border: none; width: 100%;
                padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700;
                display: flex; justify-content: center; align-items: center; gap: 8px;
                box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); cursor: pointer;
            }
            .btn-save:active { transform: scale(0.98); }
        </style>
    </head>
    <body>
        
        <div class="top-nav">
            <h1 class="shop-title">🏪 ${dataToko.nama}</h1>
            <span class="shop-cat">${dataToko.kategori}</span>
        </div>

        <div class="kas-card">
            <div>
                <p>Uang Kas</p>
                <h2>${saldoPemilik.toLocaleString('id-ID')} 💠</h2>
            </div>
            <div style="text-align: right;">
                <p>Status</p>
                <span style="color:var(--text); font-weight:700; font-size:14px;">Buka ✅</span>
            </div>
        </div>

        <div class="content">
            <div class="section-title">Manajemen Etalase</div>
            ${kartuBarang}
        </div>

        <div class="bottom-bar">
            <button class="btn-save" onclick="simpanPerubahan()">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Simpan & Update
            </button>
        </div>

        <script>
            function simpanPerubahan() {
                const inputs = document.querySelectorAll('.input-form');
                let dataUpdate = {};
                
                inputs.forEach(input => {
                    const parts = input.id.split('_'); 
                    const aksi = parts[0];
                    const idBarang = parts.slice(1).join('_');

                    if (!dataUpdate[idBarang]) dataUpdate[idBarang] = {};
                    dataUpdate[idBarang][aksi] = parseInt(input.value) || 0;
                });

                const btn = document.querySelector('.btn-save');
                btn.innerHTML = '⏳ Menyimpan...';
                btn.style.opacity = '0.7';

                fetch('/api/update-toko', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: '${token}', data: dataUpdate })
                })
                .then(res => res.json())
                .then(res => {
                    if(res.sukses) {
                        alert(res.pesan);
                        window.location.reload(); 
                    } else {
                        alert('⚠️ Gagal: ' + res.pesan);
                        btn.innerHTML = 'Simpan & Update';
                        btn.style.opacity = '1';
                    }
                });
            }
        </script>
    </body>
    </html>
    `;

    res.send(htmlTampilan);
});

// --- API UNTUK MENYIMPAN PERUBAHAN (POST) ---
app.post('/api/update-toko', (req, res) => {
    const { token, data } = req.body;

    let nomorPemilik = null;
    let dataToko = null;

    for (const [nomor, toko] of Object.entries(global.db.market.tokoPemain)) {
        if (toko.tokenWeb === token) {
            nomorPemilik = nomor;
            dataToko = toko;
            break;
        }
    }

    if (!dataToko) return res.json({ sukses: false, pesan: "Token tidak valid" });

    // Panggil ulang dari default jika kosong
    const pasarIndukAman = global.db.market.pasarInduk || defaultPasarInduk;
    const kategoriBarang = pasarIndukAman[dataToko.kategori];
    let totalBiayaKulak = 0;
    
    for (const idBarang in data) {
        if (data[idBarang].kulak > 0 && kategoriBarang[idBarang]) {
            totalBiayaKulak += data[idBarang].kulak * kategoriBarang[idBarang].modal;
        }
    }

    if (global.db.player[nomorPemilik].saldo < totalBiayaKulak) {
        // PERBAIKAN: Menggunakan backtick asli tanpa tanda \
        return res.json({ sukses: false, pesan: `Uang kas tidak cukup! Butuh ${totalBiayaKulak} 💠` });
    }

    global.db.player[nomorPemilik].saldo -= totalBiayaKulak;
    global.db.bank.brankas += totalBiayaKulak;

    for (const idBarang in data) {
        const itemMarket = kategoriBarang[idBarang];
        if (!itemMarket) continue;

        if (!dataToko.etalase[idBarang]) {
            dataToko.etalase[idBarang] = { stok: 0, harga: itemMarket.modal };
        }

        dataToko.etalase[idBarang].stok += data[idBarang].kulak;
        
        const hargaSet = data[idBarang].harga;
        dataToko.etalase[idBarang].harga = hargaSet < itemMarket.modal ? itemMarket.modal : hargaSet;
    }

    fs.writeFileSync(path.join(process.cwd(), 'data/market.json'), JSON.stringify(global.db.market, null, 2));
    fs.writeFileSync(path.join(process.cwd(), 'data/player.json'), JSON.stringify(global.db.player, null, 2));
    fs.writeFileSync(path.join(process.cwd(), 'data/bank.json'), JSON.stringify(global.db.bank, null, 2));

    res.json({ sukses: true, pesan: "Toko berhasil diupdate dan kulakan berhasil!" });
});

function startWebServer() {
    app.listen(port, () => {
        // PERBAIKAN: Menggunakan backtick asli tanpa tanda \
        console.log(`[WEB SERVER] Dashboard Toko online di http://localhost:${port}`);
    });
}

module.exports = startWebServer;