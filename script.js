const baseURL = 'https://mncks.buzz';

function toggleLoading(show) {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = show ? 'block' : 'none';
}

function displayError(message) {
    document.getElementById('error-message').textContent = message;
}

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`网络请求失败: 状态码 ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        displayError(`网络请求错误: ${error.message}`);
        throw error;
    }
}

async function getLatestList() {
    const body = await fetchData(`${baseURL}/`);
    if (!body) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'text/html');
    const blocks = doc.querySelectorAll('.block');

    return Array.from(blocks, block => {
        const titleElement = block.querySelector('a');
        const imgElement = block.querySelector('img');
        return {
            title: titleElement?.getAttribute('title') || '未知标题',
            href: baseURL + (titleElement?.getAttribute('href') || '#'),
            thumb: imgElement?.getAttribute('src') || '默认图片链接'
        };
    });
}

function createVideoCard({ title, href, thumb }) {
    return `
        <div class='col-md-4'>
            <div class='card' data-href='${href}'>
                <img src='${thumb}' class='card-img-top' alt='${title}'>
                <div class='card-body'>
                    <h5 class='card-title'>${title}</h5>
                    <button class='btn btn-primary play-btn'>观看视频</button>
                </div>
            </div>
        </div>
    `;
}

async function renderVideos() {
    try {
        toggleLoading(true);
        const videoList = document.getElementById('videoList');
        const videos = await getLatestList();

        if (!videos || videos.length === 0) {
            displayError('加载视频列表失败。');
            return;
        }

        videos.forEach(video => {
            videoList.insertAdjacentHTML('beforeend', createVideoCard(video));
        });
    } catch (error) {
    } finally {
        toggleLoading(false);
    }
}

async function getM3U8(videoUrl) {
    if (videoUrl.includes("/info/")) {
        videoUrl = videoUrl.replace("/info/", "/play/");
    }

    const response = await fetchData(videoUrl);
    if (!response) return null;

    const toPlayFn = response.match(/to_play\('(.*?)'\)/);
    if (toPlayFn && toPlayFn[1]) {
        const cleanedBase64 = toPlayFn[1].replace(/[^A-Za-z0-9+/=]/g, '');
        const decoded = atob(cleanedBase64);
        const m3u8Url = decoded.match(/(http.*?\.m3u8)/);
        return m3u8Url ? m3u8Url[1] : null;
    }
    return null;
}

async function playVideo(url) {
    toggleLoading(true);
    const playerContainer = document.getElementById('videoPlayer');
    const videoPlayer = document.getElementById('player');

    try {
        const playUrl = await getM3U8(url);
        if (playUrl) {
            videoPlayer.src = playUrl;
            videoPlayer.load();
            videoPlayer.play();
            playerContainer.classList.remove('d-none');
        } else {
            throw new Error('无法获取视频播放链接');
        }
    } catch (error) {
        displayError(`播放视频失败: ${error.message}`);
    } finally {
        toggleLoading(false);
    }

    // 处理返回按钮逻辑
    const backButton = document.getElementById('backButton');
    backButton.onclick = function() {
        playerContainer.classList.add('d-none');
        videoPlayer.pause();
    };
}

document.getElementById('videoList').addEventListener('click', function(event) {
    if (event.target.classList.contains('play-btn')) {
        const card = event.target.closest('.card');
        playVideo(card.getAttribute('data-href'));
    }
});

document.addEventListener('DOMContentLoaded', renderVideos);
