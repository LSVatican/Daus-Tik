// Fitur Tempel Link dari Clipboard
async function pasteLink() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('tiktokUrl').value = text;
    } catch (err) {
        alert('Gagal menempel link secara otomatis. Silakan tempel manual.');
    }
}

// Fungsi untuk Memblokir Klik Kanan dan Drag Gambar Thumbnail
function disableBrowserDefaultOnImages() {
    const images = document.querySelectorAll('#mediaPreview img, .slide-item img');
    images.forEach(img => {
        // Blokir Klik Kanan
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        // Blokir Drag Gambar
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });
}

// Proses Mengambil Data dari Tikwm API
async function processTikTok() {
    const urlInput = document.getElementById('tiktokUrl').value.trim();
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const mediaPreview = document.getElementById('mediaPreview');
    const slideContainer = document.getElementById('slideContainer');
    const actionButtons = document.getElementById('actionButtons');

    if (!urlInput) {
        alert('Harap masukkan link TikTok terlebih dahulu!');
        return;
    }

    // Reset Tampilan
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    slideContainer.innerHTML = '';
    mediaPreview.innerHTML = '';

    try {
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(urlInput)}`);
        const res = await response.json();

        loading.classList.add('hidden');

        if (res.code === 0) {
            const data = res.data;

            document.getElementById('authorName').innerText = `@${data.author.unique_id}`;
            document.getElementById('videoTitle').innerText = data.title || 'Tanpa Judul';

            // Jika Postingan Berupa Slide Foto
            if (data.images && data.images.length > 0) {
                actionButtons.classList.add('hidden'); // Sembunyikan tombol video utama
                
                data.images.forEach((imgUrl, index) => {
                    // Jika API menyediakan gambar watermark terpisah, gunakan data.wm_images[index] jika ada, jika tidak gunakan url gambar
                    const wmImgUrl = (data.wm_images && data.wm_images[index]) ? data.wm_images[index] : imgUrl;

                    const item = document.createElement('div');
                    item.className = 'slide-item';
                    item.innerHTML = `
                        <img src="${imgUrl}" alt="Slide ${index + 1}">
                        <a href="${imgUrl}" target="_blank" class="btn-slide-nowm" download>Tanpa Watermark</a>
                        <a href="${wmImgUrl}" target="_blank" class="btn-slide-wm" download>Dengan Watermark</a>
                    `;
                    slideContainer.appendChild(item);
                });
            } 
            // Jika Postingan Berupa Video
            else {
                actionButtons.classList.remove('hidden');
                
                // Tampilkan Thumbnail Video
                mediaPreview.innerHTML = `<img src="${data.cover}" alt="Thumbnail">`;

                // Set Link Download
                document.getElementById('btnNoWm').href = data.play;
                document.getElementById('btnWm').href = data.wmplay;
                document.getElementById('btnAudio').href = data.music;
            }

            result.classList.remove('hidden');

            // Jalankan pemblokiran bawaan browser pada thumbnail yang baru dibuat
            disableBrowserDefaultOnImages();

        } else {
            alert('Gagal mengambil data. Pastikan link TikTok valid!');
        }
    } catch (error) {
        loading.classList.add('hidden');
        alert('Terjadi kesalahan jaringan atau API.');
    }
}
