// ====================
// VARIABEL GLOBAL
// ====================
let currentUser = null;
let kandidatData = [];
let mahasiswaData = [];
let votingData = [];
let chart;
let hasVoted = false;
let votes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };

// ====================
// FUNGSI UTILITY
// ====================

let isEditingKandidat = false;
let isEditingMahasiswa = false;

function setLoadingState(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    const spinner = button.querySelector('.spinner');
    if (isLoading) {
        spinner.classList.remove('hidden');
        button.disabled = true;
    } else {
        spinner.classList.add('hidden');
        button.disabled = false;
    }
}

// ====================
// SHOW PAGE (SPA)
// ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId + 'Page').classList.remove('hidden');
    // Update nav active
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('bg-[#1C3D4D]'));
    document.getElementById('nav' + pageId.charAt(0).toUpperCase() + pageId.slice(1)).classList.add('bg-[#1C3D4D]');
    // Fade in effect
    document.getElementById(pageId + 'Page').classList.add('animate-fade-in');
}

// ====================
// LOGIN ADMIN
// ====================
document.getElementById("adminForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    setLoadingState('adminLoginBtn', true);

    const password = document.getElementById("adminPassword").value;
    if (password === "1") {
        await loadKandidat();
        await loadMahasiswa();
        await loadVoting();
        await updateAdminDashboard();
        // Perbaikan: Tampilkan dashboardContainer dan sembunyikan loginPage
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboardContainer').classList.remove('hidden');
        showPage("dashboard");
        setLoadingState('adminLoginBtn', false);
    } else {
        alert("Password admin salah!");
        setLoadingState('adminLoginBtn', false);
    }
});

// ====================
// UPDATE ADMIN DASHBOARD
// ====================
async function updateAdminDashboard() {
    await loadDashboard();
}

// ====================
// LOGOUT
// ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    document.getElementById('dashboardContainer').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
});

// ====================
// NAVIGASI
// ====================
document.getElementById('navDashboard').addEventListener('click', () => showPage('dashboard'));
document.getElementById('navKandidat').addEventListener('click', () => showPage('kandidat'));
document.getElementById('navMahasiswa').addEventListener('click', () => showPage('mahasiswa'));
document.getElementById('navVoting').addEventListener('click', () => showPage('voting'));

// ====================
// LOAD DATA UMUM
// ====================
async function loadData() {
    await loadDashboard();
    await loadKandidat();
    await loadMahasiswa();
    await loadVoting();
}

// ====================
// DASHBOARD
// ====================
// ====================
// DASHBOARD
// ====================
async function loadDashboard() {
    const { data: voting } = await supabaseClient.from('voters').select('*');
    const { data: kandidat } = await supabaseClient.from('kandidat').select('*');
    const { data: mahasiswa } = await supabaseClient.from('cek').select('*');
    kandidatData = kandidat || [];
    votingData = voting || [];
    mahasiswaData = mahasiswa || [];
    document.getElementById('totalVotes').textContent = votingData.length;
    document.getElementById('totalVoters').textContent = mahasiswaData.length;

// Hitung total belum voting
    document.getElementById('totalBelumVoting').textContent = mahasiswaData.length-votingData.length;

    // Hitung counts untuk kandidat (sudah benar)
    const counts = {};
    votingData.forEach(v => {
        counts[v.calon_id] = (counts[v.calon_id] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // Hitung counts untuk angkatan (baru ditambahkan)
    const angkatanCounts = {};
    votingData.forEach(v => {
        angkatanCounts[v.Angkatan] = (angkatanCounts[v.Angkatan] || 0) + 1;
    });
    const uniqueAngkatans = Object.keys(angkatanCounts); // Angkatan unik

    // Update results dinamis untuk kandidat (tidak diubah)
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.innerHTML = kandidatData.map(k => {
        const voteCount = counts[k.No] || 0;
        const percentage = total > 0 ? Math.round((voteCount / total) * 100) : 0;
        return `
            <div class="border border-white mb-2 rounded-lg p-6">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center">
                        <div class="borrder mr-4 panjang mx-auto mb-4 rounded-full overflow-hidden">
                            <img src="${k.foto_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='}" alt="${k.nama}" class="mr-4 w-full h-full object-cover">
                        </div>
                        <div>
                            <h3 class="font-bold text-white">${k.nama}</h3>
                            <p class="text-sm ttext-white">Calon No. ${k.No}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-white" id="votes${k.No}">${voteCount}</div>
                        <div class="text-sm ttext-white" id="percentage${k.No}">${percentage}%</div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-black h-3 rounded-full progress-bar" id="progress${k.No}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join("");

    // Update results dinamis untuk angkatan (diperbaiki)
    const resultsContainerAngkatan = document.getElementById("resultsContainerAngkatan");
    resultsContainerAngkatan.innerHTML = uniqueAngkatans.map(angk => {
        const voteCount = angkatanCounts[angk] || 0;
        const percentage = total > 0 ? Math.round((voteCount / total) * 100) : 0;
        return `
            <div class="border border-gray-200 rounded-lg p-3 mb-4">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center">
                        <div>
                            <h1 class="text-2xl font-bold text-white">${angk}</h1>  <!-- Dinamis berdasarkan angkatan -->
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-white">${voteCount}</div>
                    <div class="text-sm text-white">${percentage}%</div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-black h-3 rounded-full progress-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join("");

    // Chart untuk kandidat (tidak diubah)
    const ctx = document.getElementById('votingChart').getContext('2d');
    const labels = kandidatData.map(k => k.nama);
    const data = kandidatData.map(k => votingData.filter(v => v.calon_id === k.No).length);
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Suara',
                data,
                backgroundColor: '#255267',
            }]
        },
        options: {
        responsive: true,  // Aktifkan responsiveness
        maintainAspectRatio: false,  // Izinkan tinggi menyesuaikan container
        plugins: {
            legend: {
                display: true,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    },
    });
}


document.getElementById('refreshDashboard').addEventListener('click', async () => {
    setLoadingState('refreshDashboard', true);
    await loadDashboard();
    setLoadingState('refreshDashboard', false);
});
document.getElementById('refreshkandidat').addEventListener('click', async () => {
    setLoadingState('refreshkandidat', true);
    await loadKandidat();
    setLoadingState('refreshkandidat', false);
});
document.getElementById('refreshmahasiswa').addEventListener('click', async () => {
    setLoadingState('refreshmahasiswa', true);
    await loadMahasiswa();
    setLoadingState('refreshmahasiswa', false);
});
document.getElementById('refreshVoting').addEventListener('click', async () => {
    setLoadingState('refreshVoting', true);
    await loadVoting();
    setLoadingState('refreshVoting', false);
});

// ====================
// DATA KANDIDAT CRUD
// ====================
async function loadKandidat() {
    const { data } = await supabaseClient.from('kandidat').select('*');
    kandidatData = data || [];
    const list = document.getElementById('kandidatList');
    list.innerHTML = kandidatData.map(k => `
        <div class="bg-white dark:bg-gray-700 rounded-xl shadow p-4">
            <div class="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                <img src="${k.foto_url || 'assets/default.jpg'}" class="borrder w-full h-full rounded-full mx-auto mb-4 object-cover" alt="${k.nama}">
            </div>
            <h3 class="text-lg font-semibold">${k.nama}</h3>
            <p class="text-sm text-gray-600">Calon No. ${k.No}</p>
            <p>Visi: ${k.visi}</p>
            <p>Misi: ${k.misi}</p>
            <button onclick="editKandidat(${k.No})" class="bg-blue-500 text-white py-1 px-2 rounded mt-2">Edit</button>
            <button onclick="deleteKandidat(${k.No})" class="bg-red-500 text-white py-1 px-2 rounded mt-2">Hapus</button>
        </div>
    `).join('');
}

document.getElementById('kandidatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoadingState('kandidatSubmit', true);
    const id = document.getElementById('kandidatId').value.trim();
    const No = document.getElementById('kandidatNo').value.trim();
    const nama = document.getElementById('kandidatNama').value.trim();
    const visi = document.getElementById('kandidatVisi').value.trim();
    const misi = document.getElementById('kandidatMisi').value.trim();
    const fotoFile = document.getElementById('kandidatFoto').files[0];

    console.log('Submitting kandidat:', { No, nama, visi, misi, isEditing: isEditingKandidat });  // Debug

    if (!nama || !visi || !misi) {
        alert('Nama, Visi, dan Misi wajib diisi!');
        setLoadingState('kandidatSubmit', false);
        return;
    }

    if (!No) {
        alert('No Kandidat wajib diisi!');
        setLoadingState('kandidatSubmit', false);
        return;
    }

    if (!isEditingKandidat) {  // Cek duplikasi hanya untuk insert
        const existing = kandidatData.find(k => k.No == No);
        if (existing) {
            alert('No Kandidat sudah ada!');
            setLoadingState('kandidatSubmit', false);
            return;
        }
    }

    let fotoUrl = '';
    if (fotoFile) {
        try {
            const fileName = `images/${Date.now()}.${fotoFile.name.split('.').pop()}`;
            const { data, error } = await supabaseClient.storage.from('images').upload(fileName, fotoFile);
            if (error) throw error;
            const { data: url } = supabaseClient.storage.from('images').getPublicUrl(data.path);
            fotoUrl = url.publicUrl;
        } catch (err) {
            alert('Error upload foto: ' + err.message);
            setLoadingState('kandidatSubmit', false);
            return;
        }
    }

    try {
        let result;
        if (isEditingKandidat) {  // Edit mode
            console.log('Updating kandidat No:', No);
            result = await supabaseClient.from('kandidat').update({ nama, visi, misi, foto_url: fotoUrl }).eq('No', No);
        } else {  // Insert mode
            console.log('Inserting kandidat:', { No: parseInt(No), nama, visi, misi, foto_url: fotoUrl });
            result = await supabaseClient.from('kandidat').insert({ No: parseInt(No), nama, visi, misi, foto_url: fotoUrl });
        }
        console.log('Supabase result:', result);
        if (result.error) throw result.error;
        alert(isEditingKandidat ? 'Kandidat berhasil diperbarui!' : 'Kandidat baru berhasil ditambahkan!');
        document.getElementById('kandidatForm').reset();
        isEditingKandidat = false;  // Reset flag
        await loadKandidat();
        await loadDashboard();
    } catch (err) {
        console.error('Database error:', err);
        alert('Error: ' + err.message);
    } finally {
        setLoadingState('kandidatSubmit', false);
    }
});

function editKandidat(id) {
    const k = kandidatData.find(k => k.No == id);  // Gunakan == untuk fleksibilitas
    if (k) {
        isEditingKandidat = true;  // Set flag edit
        document.getElementById('kandidatNo').value = k.No;
        document.getElementById('kandidatNama').value = k.nama;
        document.getElementById('kandidatVisi').value = k.visi;
        document.getElementById('kandidatMisi').value = k.misi;
    } else {
        alert('Kandidat tidak ditemukan!');
    }
}


async function deleteKandidat(id) {
    if (confirm('Yakin ingin menghapus kandidat ini?')) {
        await supabaseClient.from('kandidat').delete().eq('No', id);
        loadKandidat();
    }
}

// ====================
// DATA MAHASISWA CRUD
// ====================
async function loadMahasiswa() {
    const { data } = await supabaseClient.from('cek').select('*');
    mahasiswaData = data || [];
    const list = document.getElementById('mahasiswaList');
    list.innerHTML = mahasiswaData.map(m => `
        <tr>
            <td class="p-4">${m.id}</td>
            <td class="p-4">${m.Nama}</td>
            <td class="p-4">${m.NIM}</td>
            <td class="p-4">${m.password}</td>
            <td class="p-4">${m.Prodi}</td>
            <td class="p-4">${m.Kelas}</td>
            <td class="p-4">${m.StatusVote}</td>
            <td class="p-4">${m.Angkatan}</td>
            <td class="p-4">
                <button onclick="editMahasiswa(${m.id})" class="bg-blue-500 text-white py-1 px-2 rounded">Edit</button>
                <button onclick="deleteMahasiswa(${m.id})" class="bg-red-500 text-white py-1 px-2 rounded">Hapus</button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('mahasiswaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoadingState('mahasiswaSubmit', true);

    const id = document.getElementById('mahasiswaId').value.trim();
    const nama = document.getElementById('mahasiswaNama').value.trim();
    const nim = document.getElementById('mahasiswaNIM').value.trim();  // NIM sebagai string
    const prodi = document.getElementById('mahasiswaProdi').value.trim();
    const password = document.getElementById('mahasiswaPassword').value.trim();
    const kelas = document.getElementById('mahasiswaKelas').value;
    const status = document.getElementById('mahasiswaStatusVote').value;  // Pastikan sesuai database (Status)
    const angkatan = document.getElementById('mahasiswaAngkatan').value;


    if (!nama || !nim || !prodi || !password) {
        alert('Nama, NIM, Prodi, dan Password wajib diisi!');
        setLoadingState('mahasiswaSubmit', false);
        return;
    }

    try {
        let result;
        if (isEditingMahasiswa) {  // Edit mode
            console.log('Updating mahasiswa id:', id);
            result = await supabaseClient.from('cek').update({ Nama: nama, NIM: nim, Prodi: prodi, password, Kelas: kelas, StatusVote: status, Angkatan: angkatan }).eq('id', id);
        } else {  // Insert mode
            console.log('Inserting mahasiswa (id auto-increment)');
            result = await supabaseClient.from('cek').insert({ Nama: nama, NIM: nim, Prodi: prodi, password, Kelas: kelas, StatusVote: status, Angkatan: angkatan });  // Jangan kirim id
        }
        console.log('Supabase result:', result);
        if (result.error) throw result.error;
        alert(isEditingMahasiswa ? 'Mahasiswa berhasil diperbarui!' : 'Mahasiswa baru berhasil ditambahkan!');
        document.getElementById('mahasiswaForm').reset();
        isEditingMahasiswa = false;  // Reset flag
        await loadMahasiswa();
    } catch (err) {
        console.error('Database error:', err);
        alert('Error: ' + err.message);
    } finally {
        setLoadingState('mahasiswaSubmit', false);
    }
});

function editMahasiswa(id) {
    const m = mahasiswaData.find(m => m.id == id);  // Gunakan == untuk fleksibilitas tipe
    if (m) {
        isEditingMahasiswa = true;  // Set flag edit
        document.getElementById('mahasiswaId').value = m.id;
        document.getElementById('mahasiswaNama').value = m.Nama;
        document.getElementById('mahasiswaNIM').value = m.NIM;
        document.getElementById('mahasiswaProdi').value = m.Prodi;
        document.getElementById('mahasiswaPassword').value = m.password;
        document.getElementById('mahasiswaKelas').value = m.Kelas;
        document.getElementById('mahasiswaStatusVote').value = m.StatusVote;  // Pastikan Status
        document.getElementById('mahasiswaAngkatan').value = m.Angkatan;
    } else {
        alert('Mahasiswa tidak ditemukan!');
    }
}


async function deleteMahasiswa(id) {
    if (confirm('Yakin ingin menghapus mahasiswa ini?')) {
        await supabaseClient.from('cek').delete().eq('id', id);
        loadMahasiswa();
    }
}

// ====================
// DATA VOTING
// ====================
async function loadVoting() {
    const { data } = await supabaseClient.from('voters').select('*');
    votingData = data || [];
    const list = document.getElementById('votingList');
    list.innerHTML = votingData.map(v => `
        <tr>
            <td class="p-4">${v.nama}</td>
            <td class="p-4">${v.nim}</td>
            <td class="p-4">${v.calon}</td>
            <td class="p-4">${new Date(v.waktu).toLocaleString()}</td>
            <td class="p-4">${v.Angkatan}</td>
            <td class="p-4">${v.Prodi}</td>
        </tr>
    `).join('');
}

document.getElementById('exportVoting').addEventListener('click', async () => {
    setLoadingState('exportVoting', true);
    let content = 'Hasil Voting\n\n';
    votingData.forEach(v => {
        content += `${v.nama} (${v.nim}) - ${v.calon} - ${new Date(v.waktu).toLocaleString()}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hasil_voting.txt';
    a.click();
    setLoadingState('exportVoting', false);
});

// ====================
// DARK MODE TOGGLE
// ====================
// On page load or when changing themes, best to add inline in `head` to avoid FOUC

document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('darkModeToggle').innerHTML = isDark ? '☀️' : '🌙';
});

// Inisialisasi dark mode dari localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
    document.getElementById('darkModeToggle').innerHTML = '☀️';
}

// ====================
// INISIALISASI
// ====================
document.addEventListener('DOMContentLoaded', () => {
    // Tidak perlu showPage di sini, loginPage sudah tampil secara default
});
