/*
    Config
*/
const BATCH_SIZE = 3;
const BATCH_DELAY = 2500;
const PREVENT_EVENTS = [
    // Allow text selection & copying (both pc and mobile)
    'mousedown', 'selectstart', 'touchstart', 'touchend', 'keydown',
    // Allow right-click to unlock context-menu copy option
    'contextmenu',
];
const LOGS_TAG = 'NOBLEMTL-UTILITIES';



/*
    Main code
*/
const main = async () => {
    for (const event of PREVENT_EVENTS)
        document.addEventListener(event, preventEvent, true);
    const bookmarkButton = document.querySelector('.thumbook > .rt > .bookmark');
    if (!bookmarkButton) return; // its home or chapter page.
    const downloadButton = document.createElement('div');
    const downloadContentIcon = document.createElement('span');
    const downloadContentText = document.createTextNode(' Download');
    downloadButton.className = 'bookmark';
    downloadContentIcon.className = 'fa fa-download';
    downloadButton.appendChild(downloadContentIcon);
    downloadButton.appendChild(downloadContentText);
    downloadButton.addEventListener('click', async () => {
        const novelTitle = getNovelTitle();
        const novelChapters = getNovelChapterUrls();
        const novelChaptersCount = novelChapters.length;
        const totalTime = Math.ceil(novelChaptersCount / BATCH_SIZE) * BATCH_DELAY / 1000;
        if (novelChaptersCount === 0) return alert('Looks like novel is empty, check console for any warnings or errors.');
        if (!confirm(`Download entire novel? (${novelChaptersCount} chapters, around ${totalTime} seconds)`)) return;
        console.info(`[${LOGS_TAG}] Download of "${novelTitle}" started... (BATCH_SIZE=${BATCH_SIZE}, BATCH_DELAY=${BATCH_DELAY}, totalTime=${totalTime})`);
        const chapters = [];
        for (let i = 0; i < novelChaptersCount; i += 3) {
            const batch = novelChapters.slice(i, i + BATCH_SIZE);
            const batchesLeft = novelChaptersCount / BATCH_SIZE - i / BATCH_SIZE;
            const timeLeft = totalTime - i / BATCH_SIZE * BATCH_DELAY / 1000;
            const batchResult = await Promise.all(batch.map(getChapterFromUrl));
            chapters.push(...batchResult);
            console.log(`[${LOGS_TAG}] Downloading, ${batchesLeft} batches left (around ${timeLeft} seconds left)`);
            await wait(BATCH_DELAY);
        }
        console.info(`[${LOGS_TAG}] Download of "${novelTitle}" ended.`);
        saveChaptersAsFile(chapters, `${novelTitle}.txt`);
    });
    bookmarkButton.insertAdjacentElement('beforebegin', downloadButton);
}



/*
    Utils
*/
const DOM_PARSER = new DOMParser();
const getChapterFromUrl = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error during request: ${response.status} (${response.statusText})`);
    const text = await response.text();
    const htmlDocument = DOM_PARSER.parseFromString(text, 'text/html');
    const contentElement = htmlDocument.querySelector('.epcontent.entry-content');
    if (!contentElement) throw new Error('Element that should contain chapter text is missing.');
    const paragraphs = Array.from(contentElement.querySelectorAll('p:not(p.a)'));
    const chapterText = paragraphs.map(e => e.textContent.trim()).join('\n').replaceAll('From Noble mtl dot com', '');
    return chapterText + '\n\n';
}
const getNovelTitle = () => document.querySelector('.entry-title')?.textContent ?? 'Untitled';
const getNovelChapterUrls = () => Array.from(document.querySelectorAll('.eplister.eplisterfull ul li a') ?? []).map(e => e?.href).reverse();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const saveChaptersAsFile = (chapters, filename) => {
    const blob = new Blob(chapters, { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
const preventEvent = (ev) => {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    return true;
};



/*
    Run script and catch any error
*/
main().catch(r => {
    alert(`NobleMTL Utilities ended with error:\n  ${r}`);
});