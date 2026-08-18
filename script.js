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
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });
}

// Fungsi Utama: Mengunduh File Secara Paksa (Force Direct Download via Blob)
async function downloadFile(fileUrl, fileName) {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const tempAnchor = document.createElement('a');
        tempAnchor.href = blobUrl;
        tempAnchor.download = fileName;
        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        
        // Hapus elemen sementara setelah unduhan dimulai
        document.body.removeChild(tempAnchor);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        // Fallback jika terkena pembatasan CORS dari server asal
        window.open(fileUrl, '_blank');
    }
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
                actionButtons.classList.add('hidden');
                
                data.images.forEach((imgUrl, index) => {
                    const wmImgUrl = (data.wm_images && data.wm_images[index]) ? data.wm_images[index] : imgUrl;

                    const item = document.createElement('div');
                    item.className = 'slide-item';
                    
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = `Slide ${index + 1}`;

                    const btnNoWm = document.createElement('button');
                    btnNoWm.className = 'btn-slide-nowm';
                    btnNoWm.innerText = 'Tanpa Watermark';
                    btnNoWm.onclick = () => downloadFile(imgUrl, `daustik_slide_${index + 1}.jpeg`);

                    const btnWm = document.createElement('button');
                    btnWm.className = 'btn-slide-wm';
                    btnWm.innerText = 'Dengan Watermark';
                    btnWm.onclick = () => downloadFile(wmImgUrl, `daustik_slide_wm_${index + 1}.jpeg`);

                    item.appendChild(img);
                    item.appendChild(btnNoWm);
                    item.appendChild(btnWm);
                    slideContainer.appendChild(item);
                });
            } 
            // Jika Postingan Berupa Video
            else {
                actionButtons.classList.remove('hidden');
                mediaPreview.innerHTML = `<img src="${data.cover}" alt="Thumbnail">`;

                // Set Handler Klik Tombol Video
                document.getElementById('btnNoWm').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.play, 'daustik_video_nowm.mp4');
                };

                document.getElementById('btnWm').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.wmplay, 'daustik_video_wm.mp4');
                };

                document.getElementById('btnAudio').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.music, 'daustik_audio.mp3');
                };
            }

            result.classList.remove('hidden');
            disableBrowserDefaultOnImages();

        } else {
            alert('Gagal mengambil data. Pastikan link TikTok valid!');
        }
    } catch (error) {
        loading.classList.add('hidden');
        alert('Terjadi kesalahan jaringan atau API.');
    }
}
