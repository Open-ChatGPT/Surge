document.addEventListener('DOMContentLoaded', function() {
    renderVideos();
    setUpEventListeners();
});

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

function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}
