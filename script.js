let currentSlideIndex = 0;
let totalSlides = 0;

// ... (Fungsi pasteLink dan disableBrowserDefaultOnImages tetap sama)

// Fungsi Unduh Langsung via Blob (Force Download)
async function downloadFile(fileUrl, fileName) {
    try {
        // Mengambil data sebagai blob untuk memaksa download
        const response = await fetch(fileUrl, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const tempAnchor = document.createElement('a');
        tempAnchor.href = blobUrl;
        tempAnchor.download = fileName;
        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        
        // Bersihkan
        document.body.removeChild(tempAnchor);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        // Jika gagal karena CORS, gunakan metode window.open (pilihan terakhir)
        window.open(fileUrl, '_blank');
    }
}

// Fungsi Navigasi Carousel (Sama seperti sebelumnya)
function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length === 0) return;
    slides[currentSlideIndex].classList.remove('active');
    currentSlideIndex += direction;
    slides[currentSlideIndex].classList.add('active');
    updateCarouselControls();
}

function updateCarouselControls() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const counter = document.getElementById('slideCounter');
    if (counter) counter.innerText = `${currentSlideIndex + 1} / ${totalSlides}`;
    
    if (currentSlideIndex === 0) {
        btnPrev.style.display = 'none';
        btnNext.style.display = totalSlides > 1 ? 'inline-block' : 'none';
    } else if (currentSlideIndex === totalSlides - 1) {
        btnPrev.style.display = 'inline-block';
        btnNext.style.display = 'none';
    } else {
        btnPrev.style.display = 'inline-block';
        btnNext.style.display = 'inline-block';
    }
}

// Proses Utama
async function processTikTok() {
    const urlInput = document.getElementById('tiktokUrl').value.trim();
    if (!urlInput) { alert('Harap masukkan link TikTok!'); return; }

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    
    try {
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(urlInput)}`);
        const res = await response.json();

        document.getElementById('loading').classList.add('hidden');

        if (res.code === 0) {
            const data = res.data;
            const videoTitle = data.title || 'Postingan TikTok';
            
            document.getElementById('authorName').innerText = `@${data.author.unique_id}`;
            document.getElementById('videoTitle').innerText = videoTitle;

            // HANDLE SLIDE FOTO
            if (data.images && data.images.length > 0) {
                document.getElementById('actionButtons').classList.add('hidden');
                totalSlides = data.images.length;
                const slideContainer = document.getElementById('slideContainer');
                slideContainer.innerHTML = ''; // Reset

                data.images.forEach((imgUrl, index) => {
                    // MENGAMBIL WATERMARK ASLI DARI API
                    const wmImgUrl = (data.wm_images && data.wm_images[index]) ? data.wm_images[index] : imgUrl;

                    const item = document.createElement('div');
                    item.className = `slide-item ${index === 0 ? 'active' : ''}`;
                    item.innerHTML = `
                        <img src="${imgUrl}" alt="Slide ${index + 1}">
                        <div class="slide-actions">
                            <button class="btn-slide-nowm">Tanpa Watermark</button>
                            <button class="btn-slide-wm">Dengan Watermark</button>
                        </div>
                    `;

                    // Event Klik Force Download
                    item.querySelector('.btn-slide-nowm').onclick = () => 
                        downloadFile(imgUrl, generateFileName(videoTitle, `_Slide_${index+1}`, 'jpeg'));
                    
                    item.querySelector('.btn-slide-wm').onclick = () => 
                        downloadFile(wmImgUrl, generateFileName(videoTitle, `_Slide_${index+1}_WM`, 'jpeg'));

                    slideContainer.appendChild(item);
                });

                // Tambah Navigasi
                const nav = document.createElement('div');
                nav.className = 'carousel-nav';
                nav.innerHTML = `
                    <button id="btnPrev" class="btn-nav" onclick="changeSlide(-1)">Prev</button>
                    <span id="slideCounter" class="slide-counter">1 / ${totalSlides}</span>
                    <button id="btnNext" class="btn-nav" onclick="changeSlide(1)">Next</button>
                `;
                slideContainer.appendChild(nav);
                updateCarouselControls();
            } 
            // HANDLE VIDEO
            else {
                document.getElementById('actionButtons').classList.remove('hidden');
                document.getElementById('mediaPreview').innerHTML = `<img src="${data.cover}" alt="Thumbnail">`;

                // Tombol Video Tanpa Watermark
                document.getElementById('btnNoWm').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.play, generateFileName(videoTitle, '_NoWM', 'mp4'));
                };

                // Tombol Video DENGAN WATERMARK (Menggunakan data.wmplay)
                document.getElementById('btnWm').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.wmplay, generateFileName(videoTitle, '_WM', 'mp4'));
                };

                document.getElementById('btnAudio').onclick = (e) => {
                    e.preventDefault();
                    downloadFile(data.music, generateFileName(videoTitle, '_Audio', 'mp3'));
                };
            }
            document.getElementById('result').classList.remove('hidden');
            disableBrowserDefaultOnImages();
        } else {
            alert('Gagal mengambil data. Link mungkin tidak valid.');
        }
    } catch (e) {
        document.getElementById('loading').classList.add('hidden');
        alert('Kesalahan API.');
    }
}

function generateFileName(title, suffix, extension) {
    const cleanTitle = (title || 'TikTok').replace(/[/\\?%*:|"<>]/g, '').trim().substring(0, 50);
    return `Daus Tik - ${cleanTitle}${suffix}.${extension}`;
}
