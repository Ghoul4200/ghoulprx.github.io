document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url');
    const loadUrlButton = document.getElementById('load-url');
    const backButton = document.getElementById('back');
    const forwardButton = document.getElementById('forward');
    const refreshButton = document.getElementById('refresh');
    const newTabButton = document.getElementById('new-tab');
    const tabsContainer = document.getElementById('tabs');
    const iframesContainer = document.getElementById('iframes');

    let tabs = [];
    let currentTabIndex = -1;

    function createTab(url) {
        const tabIndex = tabs.length;
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.innerHTML = `<span class="circle"></span> <span class="close-tab">✕</span>`;
        tab.addEventListener('click', () => switchTab(tabIndex));
        tab.querySelector('.close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabIndex);
        });
        tabsContainer.insertBefore(tab, newTabButton);

        const iframe = document.createElement('iframe');
        iframe.className = 'iframe';
        iframe.src = url;
        iframe.addEventListener('load', () => updateTab(tabIndex));
        iframesContainer.appendChild(iframe);

        tabs.push({ tab, iframe, historyStack: [], currentIndex: -1 });
        switchTab(tabIndex);
    }

    function switchTab(index) {
        if (currentTabIndex !== -1) {
            tabs[currentTabIndex].tab.classList.remove('active');
            tabs[currentTabIndex].iframe.style.display = 'none';
        }
        currentTabIndex = index;
        tabs[currentTabIndex].tab.classList.add('active');
        tabs[currentTabIndex].iframe.style.display = 'block';
        urlInput.value = tabs[currentTabIndex].iframe.src;
    }

    function closeTab(index) {
        if (tabs.length === 1) return; 
        const tab = tabs[index];
        tab.tab.remove();
        tab.iframe.remove();
        tabs.splice(index, 1);
        if (currentTabIndex === index) {
            currentTabIndex = index === 0 ? 0 : index - 1;
        }
        tabs.forEach((tab, i) => {
            tab.tab.innerHTML = `<span class="circle"></span> <span class="close-tab">✕</span>`;
            tab.tab.querySelector('.close-tab').addEventListener('click', (e) => {
                e.stopPropagation();
                closeTab(i);
            });
        });
        switchTab(currentTabIndex);
    }

    function loadUrl(url, addToHistory = true) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const currentTab = tabs[currentTabIndex];
        currentTab.iframe.src = url;
        if (addToHistory) {
            currentTab.historyStack = currentTab.historyStack.slice(0, currentTab.currentIndex + 1);
            currentTab.historyStack.push(url);
            currentTab.currentIndex++;
            history.pushState({ tabIndex: currentTabIndex, index: currentTab.currentIndex }, '', `?url=${encodeURIComponent(url)}`);
        }
        urlInput.value = url;
    }

    function updateTab(index) {
        const tab = tabs[index];
        const iframe = tab.iframe;
        try {
            history.replaceState({ tabIndex: currentTabIndex, index: tab.currentIndex }, '', `?url=${encodeURIComponent(iframe.contentWindow.location.href)}`);
            urlInput.value = iframe.contentWindow.location.href;
        } catch (error) {
            console.error('Error accessing iframe content:', error);
        }
    }

    loadUrlButton.addEventListener('click', () => {
        const url = urlInput.value;
        if (url) {
            loadUrl(url);
        }
    });

    backButton.addEventListener('click', () => {
        const currentTab = tabs[currentTabIndex];
        if (currentTab.currentIndex > 0) {
            currentTab.currentIndex--;
            const url = currentTab.historyStack[currentTab.currentIndex];
            loadUrl(url, false);
            history.replaceState({ tabIndex: currentTabIndex, index: currentTab.currentIndex }, '', `?url=${encodeURIComponent(url)}`);
        }
    });

    forwardButton.addEventListener('click', () => {
        const currentTab = tabs[currentTabIndex];
        if (currentTab.currentIndex < currentTab.historyStack.length - 1) {
            currentTab.currentIndex++;
            const url = currentTab.historyStack[currentTab.currentIndex];
            loadUrl(url, false);
            history.replaceState({ tabIndex: currentTabIndex, index: currentTab.currentIndex }, '', `?url=${encodeURIComponent(url)}`);
        }
    });

    refreshButton.addEventListener('click', () => {
        const currentTab = tabs[currentTabIndex];
        const url = currentTab.iframe.src;
        loadUrl(url, false);
    });

    newTabButton.addEventListener('click', () => {
        createTab('about:blank');
    });

    window.addEventListener('popstate', (event) => {
        if (event.state) {
            currentTabIndex = event.state.tabIndex;
            const currentTab = tabs[currentTabIndex];
            currentTab.currentIndex = event.state.index;
            const url = currentTab.historyStack[currentTab.currentIndex];
            loadUrl(url, false);
        }
    });

    createTab('https://jobi.one');
});