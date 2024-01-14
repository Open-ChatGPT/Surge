const baseURL = 'https://mncks.buzz';

document.addEventListener('DOMContentLoaded', function() {
    renderVideos();
    setUpEventListeners();
});

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`网络请求失败: 状态码 ${response.status}`);
        return await response.text();
    } catch (error) {
        displayError(`网络请求错误: ${error}`);
    }
}

function displayError(message) {
    document.getElementById('error-message').textContent = message;
}

async function getLatestList() {
    const body = await fetchData(`${baseURL}/`);
    if (!body) return [];

    return parseVideoBlocks(body);
}

function parseVideoBlocks(body) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'text/html');
    const blocks = doc.querySelectorAll('.block');

    return Array.from(blocks, block => {
        return {
            title: block.querySelector('a')?.getAttribute('title') || '未知标题',
            href: baseURL + (block.querySelector('a')?.getAttribute('href') || '#'),
            thumb: block.querySelector('img')?.getAttribute('src') || '默认图片链接'
        };
    });
}

function createVideoCard({ title, href, thumb }) {
    return `<div class="mt-2 col-md-4 col-sm-4 col-xs-12">
                <div class="card clickable" data-href='${href}' data-title='${title}' data-thumb='${thumb}'>
                    <img src='${thumb}' class='card-img-top' alt='${title}'>
                    <div class="card-body">
                        <p class="card-text text-truncate">${title}</p>
                    </div>
                </div>
            </div>`;
}

async function renderVideos() {
    toggleLoading(true);
    const videos = await getLatestList();
    toggleLoading(false);

    if (!videos || videos.length === 0) {
        displayError('加载视频列表失败。');
        return;
    }

    const videoList = document.getElementById('videoList');
    videoList.innerHTML = videos.map(createVideoCard).join('');
}

function setUpEventListeners() {
    document.getElementById('backToList').addEventListener('click', toggleVideoPlayerVisibility);
    document.getElementById('backToTop').addEventListener('click', () => window.scrollTo(0, 0));
    document.getElementById('videoList').addEventListener('click', onVideoCardClick);
}

function toggleVideoPlayerVisibility() {
    const playerContainer = document.getElementById('videoPlayer');
    const videoList = document.getElementById('videoList');
    const isPlayerVisible = !playerContainer.classList.contains('d-none');

    if (isPlayerVisible) {
        playerContainer.classList.add('d-none');
        videoList.style.display = '';
        renderVideos();
    } else {
        videoList.style.display = 'none';
        playerContainer.classList.remove('d-none');
    }
}

function onVideoCardClick(event) {
    let card = event.target.closest('.clickable');
    if (card) {
        const videoObj = {
            title: card.getAttribute('data-title'),
            thumb: card.getAttribute('data-thumb'),
            href: card.getAttribute('data-href')
        };

        if(videoObj.href) {
            switchToVideoPlayer(videoObj);
        } else {
            console.error("视频对象或URL丢失");
        }
    }
}

async function switchToVideoPlayer(videoObj) {
    toggleLoading(true);
    const playUrl = await getM3U8(videoObj.href);
    if (playUrl) {
        prepareVideoPlayer(playUrl, videoObj);
    } else {
        console.error('无法获取视频播放链接');
        displayError('无法加载视频。');
    }
    toggleLoading(false);
}

let player; // 定义播放器变量

function prepareVideoPlayer(playUrl, videoObj) {
    toggleVideoPlayerVisibility();

    const videoTitle = document.getElementById('videoTitle');
    videoTitle.textContent = videoObj.title;

    // 初始化 Video.js 播放器
    if (!player) {
        player = videojs('my-video', {
            autoplay: true,
            muted: true, // 添加静音设置
            preload: 'auto',
            fluid: true
        });
    }

    player.src({ type: 'video/mp4', src: playUrl });
    player.poster(videoObj.thumb);
}

async function getM3U8(videoUrl) {
    if (!videoUrl) {
        console.error("videoUrl未定义");
        return null;
    }

    if (videoUrl.includes("/info/")) {
        videoUrl = videoUrl.replace("/info/", "/play/");
    }

    try {
        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error(`网络请求失败: 状态码 ${response.status}`);

        const body = await response.text();
        return extractM3U8Url(body);
    } catch (error) {
        console.error(`获取播放链接时出错: ${error}`);
        return null;
    }
}

function extractM3U8Url(body) {
    const toPlayFn = body.match(/to_play\('(.*?)'\)/);
    if (toPlayFn && toPlayFn[1]) {
        const cleanedBase64 = toPlayFn[1].replace(/[^A-Za-z0-9+/=]/g, '');
        const decoded = atob(cleanedBase64);
        const m3u8Url = decoded.match(/(http.*?\.m3u8)/);
        return m3u8Url && m3u8Url[1] ? m3u8Url[1] : null;
    }
    return null;
}

function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}