// ... (Bagian fungsi pasteLink, disableBrowserDefaultOnImages, generateFileName, downloadFile biarkan sama seperti sebelumnya) ...

// Pastikan fungsi downloadFile tetap seperti ini
async function downloadFile(fileUrl, fileName) {
    try {
        // Gunakan metode fetch langsung untuk memicu download
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const tempAnchor = document.createElement('a');
        tempAnchor.href = blobUrl;
        tempAnchor.download = fileName;
        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        
        document.body.removeChild(tempAnchor);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        // Fallback jika terjadi kendala CORS
        window.open(fileUrl, '_blank');
    }
}

// ... (Bagian updateCarouselControls biarkan sama) ...

// Proses Mengambil Data dari Tikwm API
async function processTikTok() {
    const urlInput = document.getElementById('tiktokUrl').value.trim();
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
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
    
    try {
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(urlInput)}`);
        const res = await response.json();

        loading.classList.add('hidden');

        if (res.code === 0) {
            const data = res.data;
            const videoTitle = data.title || 'Postingan TikTok';

            document.getElementById('authorName').innerText = `@${data.author.unique_id}`;
            document.getElementById('videoTitle').innerText = videoTitle;

            // Jika Postingan Berupa Slide Foto
            if (data.images && data.images.length > 0) {
                actionButtons.classList.add('hidden');
                totalSlides = data.images.length;

                const carouselWrapper = document.createElement('div');
                carouselWrapper.className = 'carousel-container';

                data.images.forEach((imgUrl, index) => {
                    // MENGAMBIL WATERMARK: Gunakan array wm_images dari API
                    const wmImgUrl = (data.wm_images && data.wm_images[index]) ? data.wm_images[index] : imgUrl;

                    const item = document.createElement('div');
                    item.className = `slide-item ${index === 0 ? 'active' : ''}`;
                    
                    const img = document.createElement('img');
                    img.src = imgUrl; // Preview tetap pakai original agar loading cepat
                    img.alt = `Slide ${index + 1}`;

                    const actions = document.createElement('div');
                    actions.className = 'slide-actions';

                    // Tombol Tanpa Watermark
                    const btnNoWm = document.createElement('button');
                    btnNoWm.className = 'btn-slide-nowm';
                    btnNoWm.innerText = 'Tanpa Watermark';
                    btnNoWm.onclick = () => downloadFile(imgUrl, generateFileName(videoTitle, `_Slide_${index + 1}`, 'jpeg'));

                    // Tombol Dengan Watermark (Pastikan menggunakan wmImgUrl)
                    const btnWm = document.createElement('button');
                    btnWm.className = 'btn-slide-wm';
                    btnWm.innerText = 'Dengan Watermark';
                    btnWm.onclick = () => downloadFile(wmImgUrl, generateFileName(videoTitle, `_Slide_${index + 1}_WM`, 'jpeg'));

                    actions.appendChild(btnNoWm);
                    actions.appendChild(btnWm);
                    item.appendChild(img);
                    item.appendChild(actions);
                    carouselWrapper.appendChild(item);
                });

                // ... (Sisanya tambahkan navigasi Prev/Next seperti kode sebelumnya) ...
                slideContainer.appendChild(carouselWrapper);
            } 
            // Jika Postingan Berupa Video
            else {
                actionButtons.classList.remove('hidden');
                document.getElementById('mediaPreview').innerHTML = `<img src="${data.cover}" alt="Thumbnail">`;

                // TOMBOL VIDEO WATERMARK: Menggunakan data.wmplay
                document.getElementById('btnNoWm').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.play, generateFileName(videoTitle, '_NoWM', 'mp4'));
                };

                document.getElementById('btnWm').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.wmplay, generateFileName(videoTitle, '_WM', 'mp4'));
                };
                
                // ... (sisanya sama untuk audio)
            }

            result.classList.remove('hidden');
            disableBrowserDefaultOnImages();

        } else {
            alert('Gagal mengambil data. Pastikan link TikTok valid!');
        }
    } catch (error) {
        loading.classList.add('hidden');
        alert('Terjadi kesalahan koneksi.');
    }
}
