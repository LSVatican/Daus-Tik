let currentSlide = 0;
let slideData = [];
let postTitle = "";

async function pasteLink() {
    const text = await navigator.clipboard.readText();
    document.getElementById('tiktokUrl').value = text;
}

async function downloadFile(url, fileName) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Daus Tik - ${fileName.replace(/[/\\?%*:|"<>]/g, '')}.mp4`;
        if (fileName.includes('.jpeg')) a.download = a.download.replace('.mp4', '.jpeg');
        if (fileName.includes('.mp3')) a.download = a.download.replace('.mp4', '.mp3');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) { window.open(url, '_blank'); }
}

function renderSlides() {
    const area = document.getElementById('mediaArea');
    area.innerHTML = `
        <div id="slideContainer"></div>
        <div style="margin-top:10px">
            <button class="nav-btn" onclick="moveSlide(-1)" id="prevBtn">Prev</button>
            <span id="counter">1/${slideData.length}</span>
            <button class="nav-btn" onclick="moveSlide(1)" id="nextBtn">Next</button>
        </div>
    `;
    const container = document.getElementById('slideContainer');
    slideData.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = `slide-item ${i === 0 ? 'active' : ''}`;
        div.innerHTML = `
            <img src="${img.url}">
            <div class="btn-group">
                <button class="btn-dl" onclick="downloadFile('${img.url}', '${postTitle}_Slide_${i+1}')">Tanpa Watermark</button>
                <button class="btn-dl" style="background:#25d366" onclick="downloadFile('${img.wm}', '${postTitle}_Slide_${i+1}_WM')">Dengan Watermark</button>
            </div>
        `;
        container.appendChild(div);
    });
    updateNav();
}

function moveSlide(dir) {
    const items = document.querySelectorAll('.slide-item');
    items[currentSlide].classList.remove('active');
    currentSlide += dir;
    items[currentSlide].classList.add('active');
    document.getElementById('counter').innerText = `${currentSlide + 1}/${slideData.length}`;
    updateNav();
}

function updateNav() {
    document.getElementById('prevBtn').style.display = currentSlide === 0 ? 'none' : 'inline-block';
    document.getElementById('nextBtn').style.display = currentSlide === slideData.length - 1 ? 'none' : 'inline-block';
}

async function processTikTok() {
    const url = document.getElementById('tiktokUrl').value;
    if (!url) return alert("Masukkan link!");
    
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    
    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const data = (await res.json()).data;
        postTitle = data.title || "Video";
        
        document.getElementById('authorName').innerText = `@${data.author.unique_id}`;
        document.getElementById('videoTitle').innerText = postTitle;
        
        const mediaArea = document.getElementById('mediaArea');
        const actionArea = document.getElementById('actionArea');
        mediaArea.innerHTML = "";
        actionArea.innerHTML = "";

        if (data.images) {
            slideData = data.images.map((url, i) => ({ url, wm: data.wm_images[i] }));
            currentSlide = 0;
            renderSlides();
        } else {
            mediaArea.innerHTML = `<img src="${data.cover}" style="width:100%; border-radius:8px">`;
            actionArea.innerHTML = `
                <div class="btn-group">
                    <button class="btn-dl" onclick="downloadFile('${data.play}', '${postTitle}_NoWM')">Tanpa Watermark</button>
                    <button class="btn-dl" style="background:#25d366" onclick="downloadFile('${data.wmplay}', '${postTitle}_WM')">Dengan Watermark</button>
                    <button class="btn-dl" style="background:#555" onclick="downloadFile('${data.music}', '${postTitle}_Audio')">Download MP3</button>
                </div>
            `;
        }
        document.getElementById('result').classList.remove('hidden');
    } catch (e) { alert("Gagal mengambil data."); }
    document.getElementById('loading').classList.add('hidden');
}
