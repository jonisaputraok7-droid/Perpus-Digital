/* =========================================================================
   Perpustakaan Digital MTs N 1 Bandar Lampung - Main Javascript Logic
   ========================================================================= */

// --- Firebase Configuration (GANTI DENGAN PUNYA ANDA) ---
// Silakan buat proyek di console.firebase.google.com lalu salin config di sini
const firebaseConfig = {
    apiKey: "AIzaSyBTwic2vL3IPxf4l8BQQNt5CjMHXgcRmy4",
    authDomain: "perpusdigital-dc3fc.firebaseapp.com",
    databaseURL: "https://perpusdigital-dc3fc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "perpusdigital-dc3fc",
    storageBucket: "perpusdigital-dc3fc.firebasestorage.app",
    messagingSenderId: "124694258088",
    appId: "1:124694258088:web:8c6fca7a368cf1545b3d9d",
    measurementId: "G-5FER2FVCJ8"
};

// Initialize Firebase
let db;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        console.log("Firebase initialized successfully.");
    } else {
        console.warn("Firebase script not found. Check index.html.");
    }
} catch (error) {
    console.error("Firebase failed to initialize:", error);
}

// --- Initial Mock Data for Demonstration ---
const initialData = {
    siswa: [
        { id: 1, nama: "Ahmad Faisal", kelas: "VII A" },
        { id: 2, nama: "Budi Santoso", kelas: "VII B" },
        { id: 3, nama: "Cindy Aurelia", kelas: "VIII A" },
        { id: 4, nama: "Dewi Lestari", kelas: "IX C" }
    ],
    buku: [
        { id: 1, judul: "Matematika Kelas VII", pengarang: "Kemdikbud", penerbit: "Erlangga", tahun: "2021" },
        { id: 2, judul: "Sejarah Kebudayaan Islam", pengarang: "Dr. H. Amin", penerbit: "Kemenag", tahun: "2020" },
        { id: 3, judul: "Bahasa Inggris - When English Rings a Bell", pengarang: "Siti Wachidah", penerbit: "Kemdikbud", tahun: "2017" }
    ],
    peminjaman: [
        { id: 1, siswaId: 1, bukuId: 1, jumlah: 1, tglPinjam: "2023-10-01", tglKembaliRencana: "2023-10-08", status: "Dipinjam" },
        { id: 2, siswaId: 3, bukuId: 2, jumlah: 1, tglPinjam: "2023-10-05", tglKembaliRencana: "2023-10-12", status: "Dikembalikan" }
    ],
    pengembalian: [
        { id: 1, transaksiId: 2, tglDikembalikan: "2023-10-10", jumlah: 1, statusKeterlambatan: "Tepat Waktu" }
    ],
    settings: {
        appTitle: "Perpus Digital",
        schoolName: "MTs N 1 Bandar Lampung",
        address: "Jl. Letnan Jenderal Ryacudu, Bandar Lampung",
        website: "https://mtsn1bandarlampung.sch.id",
        headmaster: "Drs. H. Lukman Hakim",
        librarian: "Winarno, S.Pd",
        logo: "img/logo.png",
        banner: ""
    }
};

// --- State Management ---
let appData = JSON.parse(localStorage.getItem('perpusData')) || initialData;

// Sinkronisasi dengan Firebase (Real-time Sync)
if (db) {
    db.ref('perpusData').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            console.log("Data diterima dari Firebase:", data);
            appData = data;
            localStorage.setItem('perpusData', JSON.stringify(appData));

            // Re-render UI hanya jika sudah di-login atau halaman aktif
            if (sessionStorage.getItem('isLoggedIn')) {
                renderAll();
            }
        } else {
            console.log("Firebase kosong, mengirim data lokal ke server...");
            saveData(); // Push local data to server if server is empty
        }
    });
}

function saveData() {
    localStorage.setItem('perpusData', JSON.stringify(appData));
    if (db) {
        db.ref('perpusData').set(appData)
            .catch(error => console.error("Gagal simpan ke Firebase:", error));
    }
}

// Helper untuk render semua komponen UI
function renderAll() {
    renderDashboard();
    renderSiswa();
    renderBuku();
    renderPeminjaman();
    renderPengembalian();
    renderRekapan();
    renderSettings();
    applySettings();
    populateSelects();
    checkRoleVisibility();
}

// --- DOM Elements ---
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginSiswaBtn = document.getElementById('login-siswa-btn');
const logoutBtn = document.getElementById('logout-btn');
const sidebar = document.querySelector('.sidebar');
const toggleBtn = document.querySelector('.toggle-sidebar');
const navLinks = document.querySelectorAll('.nav-links a[data-target]');
const pageSections = document.querySelectorAll('.page-section');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Basic Auth Check
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
        showApp();
    }

    // Init Data Rendering (Using helper)
    renderAll();
});

// --- Auth Handling ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Simple mock authentication
    if (user && pass) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'admin');
        showApp();
    }
});

loginSiswaBtn.addEventListener('click', () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userRole', 'siswa');
    showApp();
});

logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    appView.style.display = 'none';
    loginView.style.display = 'flex';
    loginView.classList.add('active');
});

function showApp() {
    loginView.style.display = 'none';
    loginView.classList.remove('active');
    appView.style.display = 'flex';

    checkRoleVisibility();

    // Trigger chart resize if needed
    window.dispatchEvent(new Event('resize'));
}

function checkRoleVisibility() {
    const role = sessionStorage.getItem('userRole');
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');

    if (role === 'siswa') {
        adminOnlyElements.forEach(el => el.style.display = 'none');
        if (userNameEl) userNameEl.innerText = "Siswa Tamu";
        if (userRoleEl) userRoleEl.innerText = "Anggota";

        // Ensure student lands on dashboard or allowed page
        const activeLink = document.querySelector('.nav-links a.active');
        if (activeLink && activeLink.parentElement.classList.contains('admin-only')) {
            document.querySelector('.nav-links a[data-target="dashboard"]').click();
        }
    } else {
        adminOnlyElements.forEach(el => el.style.display = 'block');
        if (userNameEl) userNameEl.innerText = "Administrator";
        if (userRoleEl) userRoleEl.innerText = "Pustakawan";
    }
}

// --- Sidebar Navigation ---
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('close');
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        link.classList.add('active');

        // Hide all sections
        pageSections.forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('active');
        });

        // Show target section
        const targetId = link.getAttribute('data-target');
        const targetSec = document.getElementById(targetId);
        targetSec.style.display = 'block';

        // Small delay to allow transition
        setTimeout(() => {
            targetSec.classList.add('active');
        }, 50);

        // Re-render specific views if needed
        if (targetId === 'dashboard') renderDashboard();
        if (targetId === 'rekapan') renderRekapan();
        if (targetId === 'pengaturan') renderSettings();
        if (targetId === 'kartu-anggota') renderKartuAnggota();
    });
});

// --- Modal Handling ---
function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Populate dynamic dropdowns before showing
    if (id === 'modal-peminjaman' || id === 'modal-pengembalian') {
        populateSelects();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// --- Form Submissions (Tambah Manual) ---

// Tambah Siswa
document.getElementById('form-siswa').addEventListener('submit', (e) => {
    e.preventDefault();
    const nama = document.getElementById('siswa-nama').value;
    const kelas = document.getElementById('siswa-kelas').value;

    appData.siswa.push({
        id: Date.now(),
        nama,
        kelas
    });

    saveData();
    renderSiswa();
    closeModal('modal-siswa');
    e.target.reset();
});

// Tambah Buku
document.getElementById('form-buku').addEventListener('submit', (e) => {
    e.preventDefault();
    appData.buku.push({
        id: Date.now(),
        judul: document.getElementById('buku-judul').value,
        pengarang: document.getElementById('buku-pengarang').value,
        penerbit: document.getElementById('buku-penerbit').value,
        tahun: document.getElementById('buku-tahun').value
    });

    saveData();
    renderBuku();
    closeModal('modal-buku');
    e.target.reset();
});

// Tambah/Update Peminjaman
document.getElementById('form-peminjaman').addEventListener('submit', (e) => {
    e.preventDefault();

    const editId = document.getElementById('edit-pinjam-id').value;
    let bukuId = parseInt(document.getElementById('pinjam-buku').value);
    const bukuManual = document.getElementById('pinjam-buku-manual').value.trim();

    // Validasi: Harus pilih buku atau input manual
    if (!bukuId && !bukuManual) {
        alert('Silakan pilih buku dari daftar atau input judul buku manual.');
        return;
    }

    // Jika input manual, tambahkan ke data buku dulu
    if (!bukuId && bukuManual) {
        const newBuku = {
            id: Date.now(),
            judul: bukuManual,
            pengarang: document.getElementById('pinjam-pengarang-manual').value.trim() || "-",
            penerbit: document.getElementById('pinjam-penerbit-manual').value.trim() || "-",
            tahun: document.getElementById('pinjam-tahun-manual').value.trim() || "-"
        };
        appData.buku.push(newBuku);
        bukuId = newBuku.id;
        renderBuku(); // Update tabel buku
    }

    const payload = {
        siswaId: parseInt(document.getElementById('pinjam-siswa').value),
        bukuId: bukuId,
        jumlah: parseInt(document.getElementById('pinjam-jumlah').value),
        tglPinjam: document.getElementById('pinjam-tgl').value,
        tglKembaliRencana: document.getElementById('pinjam-kemb').value,
    };

    if (editId) {
        const idx = appData.peminjaman.findIndex(p => p.id === parseInt(editId));
        if (idx !== -1) {
            appData.peminjaman[idx] = { ...appData.peminjaman[idx], ...payload };
        }
    } else {
        appData.peminjaman.push({
            id: Date.now() + 1,
            ...payload,
            status: "Dipinjam"
        });
    }

    saveData();
    renderPeminjaman();
    renderDashboard();
    closeModal('modal-peminjaman');
    e.target.reset();
    document.getElementById('edit-pinjam-id').value = '';
});

// Tambah/Update Pengembalian
document.getElementById('form-pengembalian').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-kembali-id').value;
    const transId = parseInt(document.getElementById('kembali-transaksi').value);
    const tglBalik = document.getElementById('kembali-tgl').value;
    const jumlah = parseInt(document.getElementById('kembali-jumlah').value);

    // Find borrow record
    const pinjamIndex = appData.peminjaman.findIndex(p => p.id === transId);
    if (pinjamIndex === -1) {
        alert('Transaksi peminjaman tidak ditemukan.');
        return;
    }

    // Calculate lateness
    const tglRencana = new Date(appData.peminjaman[pinjamIndex].tglKembaliRencana);
    const tglAktual = new Date(tglBalik);
    const diffTime = tglAktual - tglRencana;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const statusKeterlambatan = diffDays > 0 ? `Terlambat ${diffDays} hari` : "Tepat Waktu";

    const payload = {
        transaksiId: transId,
        tglDikembalikan: tglBalik,
        jumlah: jumlah,
        statusKeterlambatan: statusKeterlambatan
    };

    if (editId) {
        const idx = appData.pengembalian.findIndex(k => k.id === parseInt(editId));
        if (idx !== -1) {
            appData.pengembalian[idx] = { ...appData.pengembalian[idx], ...payload };
        }
    } else {
        appData.peminjaman[pinjamIndex].status = "Dikembalikan";
        appData.pengembalian.push({
            id: Date.now(),
            ...payload
        });
    }

    saveData();
    renderPeminjaman();
    renderPengembalian();
    renderDashboard();
    closeModal('modal-pengembalian');
    e.target.reset();
    document.getElementById('edit-kembali-id').value = '';
});


// --- Rendering Functions ---

function getBuku(id) { return appData.buku.find(b => b.id === id) || {}; }
function getSiswa(id) { return appData.siswa.find(s => s.id === id) || {}; }

function renderSiswa() {
    const tbody = document.querySelector('#table-siswa tbody');
    tbody.innerHTML = '';
    appData.siswa.forEach((s, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${s.nama}</strong></td>
                <td><span class="badge badge-success">${s.kelas}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSiswa(${s.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function deleteSiswa(id) {
    if (confirm('Yakin hapus siswa ini?')) {
        appData.siswa = appData.siswa.filter(s => s.id !== id);
        saveData();
        renderSiswa();
    }
}

function renderBuku() {
    const tbody = document.querySelector('#table-buku tbody');
    tbody.innerHTML = '';
    appData.buku.forEach((b, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${b.judul}</strong></td>
                <td>${b.pengarang}</td>
                <td>${b.penerbit}</td>
                <td>${b.tahun}</td>
                <td>
                    <button class="btn btn-sm btn-outline"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBuku(${b.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function deleteBuku(id) {
    if (confirm('Yakin hapus buku ini?')) {
        appData.buku = appData.buku.filter(b => b.id !== id);
        saveData();
        renderBuku();
    }
}

function renderPeminjaman() {
    const tbody = document.querySelector('#table-peminjaman tbody');
    tbody.innerHTML = '';
    appData.peminjaman.forEach((p, idx) => {
        const buku = getBuku(p.bukuId);
        const siswa = getSiswa(p.siswaId);
        const statusClass = p.status === 'Dipinjam' ? 'badge-warning' : 'badge-success';

        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${buku.judul}</strong></td>
                <td>${buku.pengarang}</td>
                <td>${buku.penerbit}</td>
                <td>${buku.tahun}</td>
                <td>${p.jumlah}</td>
                <td>${p.tglPinjam}</td>
                <td>${p.tglKembaliRencana} <br> <span class="badge ${statusClass}">${p.status}</span></td>
                <td>${siswa.nama} <br><small>(${siswa.kelas})</small></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editPeminjaman(${p.id})"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deletePeminjaman(${p.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function editPeminjaman(id) {
    const p = appData.peminjaman.find(item => item.id === id);
    if (p) {
        openModal('modal-peminjaman');
        document.getElementById('edit-pinjam-id').value = p.id;
        document.getElementById('pinjam-siswa').value = p.siswaId;
        document.getElementById('pinjam-buku').value = p.bukuId;
        document.getElementById('pinjam-jumlah').value = p.jumlah;
        document.getElementById('pinjam-tgl').value = p.tglPinjam;
        document.getElementById('pinjam-kemb').value = p.tglKembaliRencana;
        document.getElementById('pinjam-buku-manual').value = ''; // Reset manual input
    }
}

function deletePeminjaman(id) {
    if (confirm('Yakin hapus transaksi peminjaman ini?')) {
        appData.peminjaman = appData.peminjaman.filter(p => p.id !== id);
        // Also remove associated return if any
        appData.pengembalian = appData.pengembalian.filter(k => k.transaksiId !== id);
        saveData();
        renderPeminjaman();
        renderPengembalian();
        renderDashboard();
    }
}

function renderPengembalian() {
    const tbody = document.querySelector('#table-pengembalian tbody');
    tbody.innerHTML = '';
    appData.pengembalian.forEach((kembali, idx) => {
        // Get the associated borrow transaction
        const pinjam = appData.peminjaman.find(p => p.id === kembali.transaksiId);
        if (!pinjam) return;

        const buku = getBuku(pinjam.bukuId);
        const siswa = getSiswa(pinjam.siswaId);
        const statusClass = kembali.statusKeterlambatan === 'Tepat Waktu' ? 'badge-success' : 'badge-danger';

        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${buku.judul}</strong></td>
                <td>${buku.pengarang}</td>
                <td>${buku.penerbit}</td>
                <td>${buku.tahun}</td>
                <td>${kembali.jumlah}</td>
                <td>${kembali.tglDikembalikan} <br> <span class="badge ${statusClass}">${kembali.statusKeterlambatan}</span></td>
                <td>${siswa.nama} <br><small>(${siswa.kelas})</small></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editPengembalian(${kembali.id})"><i class='bx bx-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deletePengembalian(${kembali.id})"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
}

function editPengembalian(id) {
    const k = appData.pengembalian.find(item => item.id === id);
    if (k) {
        // We need to allow picking from ALL borrows for editing, 
        // unlike adding which only shows active ones.
        populateSelects(true);

        openModal('modal-pengembalian');
        document.getElementById('edit-kembali-id').value = k.id;
        document.getElementById('kembali-transaksi').value = k.transaksiId;
        document.getElementById('kembali-tgl').value = k.tglDikembalikan;
        document.getElementById('kembali-jumlah').value = k.jumlah;
    }
}

function deletePengembalian(id) {
    if (confirm('Yakin hapus transaksi pengembalian ini?')) {
        const k = appData.pengembalian.find(item => item.id === id);
        if (k) {
            // Restore borrow status to "Dipinjam"
            const pIdx = appData.peminjaman.findIndex(p => p.id === k.transaksiId);
            if (pIdx !== -1) appData.peminjaman[pIdx].status = "Dipinjam";

            appData.pengembalian = appData.pengembalian.filter(item => item.id !== id);
            saveData();
            renderPeminjaman();
            renderPengembalian();
            renderDashboard();
        }
    }
}

function renderRekapan() {
    const tbody = document.querySelector('#table-rekapan tbody');
    const filterType = document.getElementById('filter-rekapan').value;
    tbody.innerHTML = '';

    // Advanced grouped logic
    let groupedData = {};

    appData.peminjaman.forEach(p => {
        const date = new Date(p.tglPinjam);
        const key = filterType === 'bulan' ?
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` :
            `${date.getFullYear()}`;

        if (!groupedData[key]) {
            groupedData[key] = { pinjam: 0, kembali: 0, bukuTerlaris: {} };
        }

        groupedData[key].pinjam += p.jumlah;
        groupedData[key].bukuTerlaris[p.bukuId] = (groupedData[key].bukuTerlaris[p.bukuId] || 0) + p.jumlah;
    });

    appData.pengembalian.forEach(k => {
        const date = new Date(k.tglDikembalikan);
        const key = filterType === 'bulan' ?
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` :
            `${date.getFullYear()}`;

        if (groupedData[key]) {
            groupedData[key].kembali += k.jumlah;
        }
    });

    // Sort keys descending
    const sortedKeys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach(period => {
        const d = groupedData[period];
        // find most popular book
        let topBookId = null;
        let maxVal = 0;
        for (const [bId, count] of Object.entries(d.bukuTerlaris)) {
            if (count > maxVal) { maxVal = count; topBookId = bId; }
        }
        const topBookName = topBookId ? getBuku(parseInt(topBookId)).judul : '-';
        const displayPeriod = filterType === 'bulan' ? formatBulan(period) : period;

        tbody.innerHTML += `
            <tr>
                <td><strong>${displayPeriod}</strong></td>
                <td><span class="badge badge-warning">${d.pinjam} Buku Dipinjam</span></td>
                <td><span class="badge badge-success">${d.kembali} Buku Dikembalikan</span></td>
                <td>${topBookName} <small>(${maxVal} kali)</small></td>
            </tr>
        `;
    });
}

function formatBulan(yyyyMm) {
    const [y, m] = yyyyMm.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    return `${months[parseInt(m) - 1]} ${y}`;
}

// Re-render rekapan on filter change
document.getElementById('filter-rekapan').addEventListener('change', renderRekapan);

// --- Pengaturan Logic ---

function renderSettings() {
    const s = appData.settings;
    if (!s) return;

    document.getElementById('set-app-title').value = s.appTitle;
    document.getElementById('set-school-name').value = s.schoolName;
    document.getElementById('set-school-address').value = s.address;
    document.getElementById('set-school-web').value = s.website;
    document.getElementById('set-headmaster').value = s.headmaster;
    document.getElementById('set-librarian').value = s.librarian || "Winarno, S.Pd";
}

function applySettings() {
    const s = appData.settings;
    if (!s) return;

    // Apply Global Titles
    document.title = s.appTitle + " - " + s.schoolName;

    // Apply school names in UI
    document.querySelectorAll('.app-school-name').forEach(el => el.innerText = s.schoolName);
    document.querySelectorAll('.app-title-full').forEach(el => el.innerText = s.appTitle);
    document.querySelectorAll('.app-title-short').forEach(el => el.innerText = s.appTitle);

    // Apply images if exist
    if (s.logo) {
        document.querySelectorAll('.app-logo-img').forEach(img => img.src = s.logo);
    }

    if (s.banner) {
        document.getElementById('login-view').style.backgroundImage = `url(${s.banner})`;
        document.getElementById('login-view').style.backgroundSize = 'cover';
        document.getElementById('login-view').style.backgroundPosition = 'center';
    } else {
        document.getElementById('login-view').style.backgroundImage = 'none';
    }
}

// Handle Settings Form Submit
document.getElementById('form-settings').addEventListener('submit', (e) => {
    e.preventDefault();

    appData.settings.appTitle = document.getElementById('set-app-title').value;
    appData.settings.schoolName = document.getElementById('set-school-name').value;
    appData.settings.address = document.getElementById('set-school-address').value;
    appData.settings.website = document.getElementById('set-school-web').value;
    appData.settings.headmaster = document.getElementById('set-headmaster').value;
    appData.settings.librarian = document.getElementById('set-librarian').value;

    saveData();
    applySettings();
    alert('Pengaturan berhasil disimpan!');
});

// Handle Image Uploads for settings
document.getElementById('set-logo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            appData.settings.logo = event.target.result;
            saveData();
            applySettings();
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('set-banner-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            appData.settings.banner = event.target.result;
            saveData();
            applySettings();
        };
        reader.readAsDataURL(file);
    }
});


function populateSelects(showAllTransactions = false) {
    // Populate Siswa Select
    const sSelect = document.getElementById('pinjam-siswa');
    if (sSelect) {
        sSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
        appData.siswa.forEach(s => {
            sSelect.innerHTML += `<option value="${s.id}">${s.nama} (${s.kelas})</option>`;
        });
    }

    // Populate Buku Select
    const bSelect = document.getElementById('pinjam-buku');
    if (bSelect) {
        bSelect.innerHTML = '<option value="">-- Pilih Buku --</option>';
        appData.buku.forEach(b => {
            bSelect.innerHTML += `<option value="${b.id}">${b.judul}</option>`;
        });
    }

    // Populate Transaksi Select for Pengembalian
    const tSelect = document.getElementById('kembali-transaksi');
    if (tSelect) {
        tSelect.innerHTML = '<option value="">-- Pilih Transaksi --</option>';
        const filterFn = showAllTransactions ? () => true : p => p.status === 'Dipinjam';

        appData.peminjaman.filter(filterFn).forEach(p => {
            const b = getBuku(p.bukuId);
            const s = getSiswa(p.siswaId);
            tSelect.innerHTML += `<option value="${p.id}">${b.judul} - ${s.nama} (${p.tglPinjam})</option>`;
        });
    }
}

// --- Dashboard & Chart.js ---
let peminjamanChart;

function renderDashboard() {
    // 1. Update top stats
    document.getElementById('stat-total-buku').innerText = appData.buku.length;
    document.getElementById('stat-total-siswa').innerText = appData.siswa.length;

    const activeBorrows = appData.peminjaman.filter(p => p.status === 'Dipinjam');
    document.getElementById('stat-dipinjam').innerText = activeBorrows.length;

    const lates = appData.pengembalian.filter(k => k.statusKeterlambatan !== 'Tepat Waktu').length;
    document.getElementById('stat-terlambat').innerText = lates;

    // 2. Render Chart
    const ctx = document.getElementById('peminjamanChart').getContext('2d');

    // Aggregate real data by month for the current year
    const currentYear = new Date().getFullYear();
    const monthlyData = new Array(12).fill(0);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

    appData.peminjaman.forEach(p => {
        const d = new Date(p.tglPinjam);
        if (d.getFullYear() === currentYear) {
            monthlyData[d.getMonth()] += p.jumlah;
        }
    });

    if (peminjamanChart) {
        peminjamanChart.destroy();
    }

    peminjamanChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Jumlah Buku Dipinjam',
                data: monthlyData,
                backgroundColor: 'rgba(13, 138, 188, 0.7)',
                borderColor: '#0D8ABC',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Pinjaman: ${context.parsed.y} Buku`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    });
}

// --- Utility Functions (Export/Print) ---

function downloadExcel(tableId, filename) {
    const table = document.getElementById(tableId);

    // Create a new workbook and add the table as a worksheet
    const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });

    // Write and download the Excel file
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function printTable(tableId, title) {
    const s = appData.settings;
    const tableHtml = document.getElementById(tableId).outerHTML;
    const printArea = document.getElementById('print-area');

    // Branding Header
    let logoHtml = s.logo ? `<img src="${s.logo}" class="print-logo">` : '';
    let addressHtml = s.address ? `<p class="print-address">${s.address}</p>` : '';
    let webHtml = s.website ? `<p class="print-web">${s.website}</p>` : '';

    printArea.innerHTML = `
        <div class="print-header">
            <div class="print-header-content">
                ${logoHtml}
                <div class="print-header-text">
                    <h1>PERPUSTAKAAN ${s.schoolName ? s.schoolName.toUpperCase() : 'DIGITAL'}</h1>
                    ${addressHtml}
                    ${webHtml}
                </div>
            </div>
            <hr class="print-divider">
            <h2 class="print-title">${title}</h2>
        </div>
        <div class="print-body">
            ${tableHtml.replace('id="' + tableId + '"', 'class="print-table"')}
        </div>
        <div class="print-footer">
            <div class="signature-grid">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Madrasah</p>
                    <br><br><br>
                    <p><strong>(${s.headmaster || '....................'})</strong></p>
                </div>
                <div class="signature-box">
                    <p>&nbsp;</p>
                    <p>Kepala Perpustakaan</p>
                    <br><br><br>
                    <p><strong>(${s.librarian || 'Winarno, S.Pd'})</strong></p>
                </div>
            </div>
        </div>
    `;

    window.print();
}

// --- Excel Import & Templates ---

function downloadTemplateSiswa() {
    const header = [["Nama Siswa", "Kelas"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "Template_Data_Siswa.xlsx");
}

function downloadTemplateBuku() {
    const header = [["Judul Buku", "Nama Pengarang", "Nama Penerbit", "Tahun Terbit"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, ws, "Template Buku");
    XLSX.writeFile(wb, "Template_Data_Buku.xlsx");
}

function handleUploadSiswa(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

        // Skip header row and process data
        let addedCount = 0;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].length >= 2) {
                appData.siswa.push({
                    id: Date.now() + i, // prevent duplicate IDs during fast loop
                    nama: rows[i][0] || "",
                    kelas: rows[i][1] || ""
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            saveData();
            renderSiswa();
            populateSelects();
            renderDashboard();
            alert(`Berhasil mengimpor ${addedCount} data siswa.`);
        } else {
            alert('Format file kosong atau tidak sesuai.');
        }

        // Reset input
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

function handleUploadBuku(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

        // Skip header row and process data
        let addedCount = 0;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].length >= 4) {
                appData.buku.push({
                    id: Date.now() + i,
                    judul: rows[i][0] || "",
                    pengarang: rows[i][1] || "",
                    penerbit: rows[i][2] || "",
                    tahun: rows[i][3] || ""
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            saveData();
            renderBuku();
            populateSelects();
            renderDashboard();
            alert(`Berhasil mengimpor ${addedCount} data buku.`);
        } else {
            alert('Format file kosong atau tidak sesuai.');
        }

        // Reset input
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

// Attach upload handlers to hidden inputs when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const inputUploadSiswa = document.getElementById('upload-siswa-input');
    if (inputUploadSiswa) {
        inputUploadSiswa.addEventListener('change', handleUploadSiswa);
    }

    const inputUploadBuku = document.getElementById('upload-buku-input');
    if (inputUploadBuku) {
        inputUploadBuku.addEventListener('change', handleUploadBuku);
    }
});
// --- Kartu Anggota Logic ---

function renderKartuAnggota() {
    const tbody = document.querySelector('#table-kartu tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    appData.siswa.forEach((s, idx) => {
        const cardHTML = generateCardHTML(s);
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${s.nama}</strong></td>
                <td><span class="badge badge-success">${s.kelas}</span></td>
                <td>
                    <div class="card-preview-container">
                        ${cardHTML}
                    </div>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="printMemberCard(${s.id})">
                        <i class='bx bx-printer'></i> Cetak
                    </button>
                </td>
            </tr>
        `;
    });
}

function generateCardHTML(siswa) {
    const s = appData.settings;
    const logoSrc = s.logo || 'https://via.placeholder.com/40';

    return `
        <div class="member-card">
            <div class="card-header">
                <img src="${logoSrc}" class="card-logo" alt="Logo">
                <div class="card-header-text">
                    <h2>KARTU ANGGOTA PERPUSTAKAAN</h2>
                    <p>${s.schoolName}</p>
                </div>
            </div>
            <div class="card-body">
                <div class="card-photo">
                    <i class='bx bx-user'></i>
                </div>
                <div class="card-info">
                    <div class="info-row">
                        <span class="info-label">Nama Lengkap</span>
                        <span class="info-value">: ${siswa.nama}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Kelas</span>
                        <span class="info-value">: ${siswa.kelas}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status Anggota</span>
                        <span class="info-value">: Anggota Aktif</span>
                    </div>
                </div>
            </div>
            <div class="card-footer" style="min-height: 15px;"></div>
        </div>
    `;
}

function printMemberCard(id) {
    const siswa = appData.siswa.find(s => s.id === id);
    if (!siswa) return;

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = `<div class="print-card-wrapper">${generateCardHTML(siswa)}</div>`;
    window.print();
}

function printAllCards() {
    const printArea = document.getElementById('print-area');
    let allCards = '';

    appData.siswa.forEach(s => {
        allCards += `<div class="print-card-wrapper">${generateCardHTML(s)}</div>`;
    });

    printArea.innerHTML = allCards;
    window.print();
}

// Update navLinks event listener to include kartu-anggota
const originalNavListener = () => {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // ... (existing logic handled by the original code)
            const targetId = link.getAttribute('data-target');
            if (targetId === 'kartu-anggota') renderKartuAnggota();
        });
    });
};

// Since we cannot easily modify the existing listener without full replacement,
// let's add an additional check in the render logic if possible or monkey-patch.
// Better: Add the check to the existing navLinks.forEach block in app.js.
