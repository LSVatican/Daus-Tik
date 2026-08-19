let currentSlideIndex = 0;
let totalSlides = 0;

// Fitur Tempel Link dari Clipboard
async function pasteLink() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('tiktokUrl').value = text;
    } catch (err) {
        alert('Gagal menempel link secara otomatis. Silakan tempel manual.');
    }
}

// Fungsi Memblokir Klik Kanan dan Drag Gambar
function disableBrowserDefaultOnImages() {
    const images = document.querySelectorAll('#mediaPreview img, .slide-item img');
    images.forEach(img => {
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });
}

// Format Nama File
function generateFileName(title, suffix, extension) {
    const cleanTitle = (title || 'TikTok')
        .replace(/[/\\?%*:|"<>]/g, '')
        .trim()
        .substring(0, 50);

    return `Daus Tik - ${cleanTitle}${suffix}.${extension}`;
}

// Fungsi Unduh Langsung via Blob
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
        
        document.body.removeChild(tempAnchor);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        window.open(fileUrl, '_blank');
    }
}

// Navigasi Slide (Next / Prev)
function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length === 0) return;

    // Sembunyikan slide aktif saat ini
    slides[currentSlideIndex].classList.remove('active');

    // Hitung indeks baru
    currentSlideIndex += direction;

    // Tampilkan slide baru
    slides[currentSlideIndex].classList.add('active');

    // Perbarui Tombol Navigasi & Indikator
    updateCarouselControls();
}

// Mengatur Kondisi Tombol Next & Prev
function updateCarouselControls() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const counter = document.getElementById('slideCounter');

    if (counter) {
        counter.innerText = `${currentSlideIndex + 1} / ${totalSlides}`;
    }

    // Jika Slide Pertama
    if (currentSlideIndex === 0) {
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = totalSlides > 1 ? 'inline-block' : 'none';
    } 
    // Jika Slide Terakhir
    else if (currentSlideIndex === totalSlides - 1) {
        if (btnPrev) btnPrev.style.display = 'inline-block';
        if (btnNext) btnNext.style.display = 'none';
    } 
    // Jika Slide di Tengah
    else {
        if (btnPrev) btnPrev.style.display = 'inline-block';
        if (btnNext) btnNext.style.display = 'inline-block';
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
    currentSlideIndex = 0;

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
                    const wmImgUrl = (data.wm_images && data.wm_images[index]) ? data.wm_images[index] : imgUrl;

                    const item = document.createElement('div');
                    item.className = `slide-item ${index === 0 ? 'active' : ''}`;
                    
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = `Slide ${index + 1}`;

                    const actions = document.createElement('div');
                    actions.className = 'slide-actions';

                    const btnNoWm = document.createElement('button');
                    btnNoWm.className = 'btn-slide-nowm';
                    btnNoWm.innerText = 'Tanpa Watermark';
                    btnNoWm.onclick = () => {
                        const fileName = generateFileName(videoTitle, `_Slide_${index + 1}`, 'jpeg');
                        downloadFile(imgUrl, fileName);
                    };

                    const btnWm = document.createElement('button');
                    btnWm.className = 'btn-slide-wm';
                    btnWm.innerText = 'Dengan Watermark';
                    btnWm.onclick = () => {
                        const fileName = generateFileName(videoTitle, `_Slide_${index + 1}_WM`, 'jpeg');
                        downloadFile(wmImgUrl, fileName);
                    };

                    actions.appendChild(btnNoWm);
                    actions.appendChild(btnWm);
                    item.appendChild(img);
                    item.appendChild(actions);
                    carouselWrapper.appendChild(item);
                });

                // Kontrol Navigasi Carousel
                const nav = document.createElement('div');
                nav.className = 'carousel-nav';
                nav.innerHTML = `
                    <button id="btnPrev" class="btn-nav" onclick="changeSlide(-1)">Prev</button>
                    <span id="slideCounter" class="slide-counter">1 / ${totalSlides}</span>
                    <button id="btnNext" class="btn-nav" onclick="changeSlide(1)">Next</button>
                `;

                slideContainer.appendChild(carouselWrapper);
                slideContainer.appendChild(nav);

                // Set kondisi tombol pertama kali
                updateCarouselControls();
            } 
            // Jika Postingan Berupa Video
            else {
                actionButtons.classList.remove('hidden');
                mediaPreview.innerHTML = `<img src="${data.cover}" alt="Thumbnail">`;

                document.getElementById('btnNoWm').onclick = (e) => {
                    e.preventDefault();
                    const fileName = generateFileName(videoTitle, '_NoWM', 'mp4');
                    downloadFile(data.play, fileName);
                };

                document.getElementById('btnWm').onclick = (e) => {
                    e.preventDefault();
                    const fileName = generateFileName(videoTitle, '_WM', 'mp4');
                    downloadFile(data.wmplay, fileName);
                };

                document.getElementById('btnAudio').onclick = (e) => {
                    e.preventDefault();
                    const fileName = generateFileName(videoTitle, '_Audio', 'mp3');
                    downloadFile(data.music, fileName);
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
