(async () => {
    const pathMatch = location.pathname.match(/artworks\/(\d+)/);
    if (!pathMatch) return;
    const artworkId = pathMatch[1];

    async function checkPattern2() {
        const isLogin = (() => {
            const nextDataEl = document.getElementById("__NEXT_DATA__");
            if (nextDataEl) {
                try {
                    const data = JSON.parse(nextDataEl.textContent);
                    return !!(data.props?.isLoggedIn || data.props?.pageProps?.gaUserData?.login);
                } catch (e) {}
            }
            return !!(window.dataLayer && window.dataLayer[0]?.login === 'yes');
        })();

        if (isLogin) return false;

        try {
            const res = await fetch(`https://www.pixiv.net/ajax/illust/${artworkId}`);
            const { body } = await res.json();
            return body.urls.original === null; 
        } catch (e) {
            return false;
        }
    }

    function waitForElement(selector) {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    async function startTool() {
        const timeEl = await waitForElement("time");
        const figureEl = await waitForElement("figure");
        const uploadDate = new Date(timeEl.dateTime);
        const pad = (n) => String(n).padStart(2, '0');
        const year = uploadDate.getFullYear();
        const month = pad(uploadDate.getMonth() + 1);
        const day = pad(uploadDate.getDate());
        const hours = pad(uploadDate.getHours());
        const minutes = pad(uploadDate.getMinutes());
        const basePath = `https://i.pximg.net/img-master/img/${year}/${month}/${day}/${hours}/${minutes}`;

        figureEl.innerHTML = '<div id="custom-img-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;"></div>';
        const container = document.getElementById("custom-img-container");
        const viewer = document.createElement("div");
        viewer.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);overflow-y:auto;display:none;flex-direction:column;align-items:center;padding:40px 0;z-index:999999;";
        document.body.appendChild(viewer);

        const closeBtn = document.createElement("div");
        closeBtn.innerHTML = "✕";
        closeBtn.style.cssText = "position:fixed;top:20px;right:30px;color:rgba(255,255,255,0.5);font-size:24px;cursor:pointer;z-index:1000000;";
        closeBtn.addEventListener("click", () => viewer.style.display = "none");
        viewer.appendChild(closeBtn);

        function findCorrectSeconds(sec) {
            if (sec > 59) return;
            const paddedSec = pad(sec);
            const img = new Image();
            img.src = `${basePath}/${paddedSec}/${artworkId}_p0_master1200.jpg`;
            img.onload = () => loadAllImages(paddedSec);
            img.onerror = () => findCorrectSeconds(sec + 1);
        }

        function loadAllImages(correctSec) {
            let pageIndex = 0;
            function loadNextPage() {
                const imgUrl = `${basePath}/${correctSec}/${artworkId}_p${pageIndex}_master1200.jpg`;
                const img = new Image();
                img.src = imgUrl;
                img.onload = () => {
                    const thumbImg = document.createElement("img");
                    thumbImg.src = imgUrl;
                    thumbImg.style.cssText = "max-width:100%;height:auto;border-radius:8px;cursor:zoom-in;";
                    thumbImg.onclick = () => viewer.style.display = "flex";
                    container.appendChild(thumbImg);

                    const vImg = document.createElement("img");
                    vImg.src = imgUrl;
                    vImg.style.cssText = "max-width:90vw;height:auto;margin-bottom:30px;cursor:zoom-in;";
                    vImg.onclick = () => {
                        vImg.style.maxWidth = vImg.style.maxWidth === "none" ? "90vw" : "none";
                        vImg.style.cursor = vImg.style.maxWidth === "none" ? "zoom-out" : "zoom-in";
                    };
                    viewer.appendChild(vImg);
                    pageIndex++;
                    loadNextPage();
                };
            }
            loadNextPage();
        }
        findCorrectSeconds(0);
    }

    chrome.storage.local.get({ toolEnabled: true }, async (result) => {
        if (result.toolEnabled && await checkPattern2()) {
            startTool();
        }
    });
})();