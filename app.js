const output = document.getElementById('output');
let inputLetters = []; 
let isEnglishMode = false; 

// 영문 쿼티 레이아웃 배열
const qwertyLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "⌫"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "↵"],
    ["이모지", "space", "한/영"]
];

let startX = 0, startY = 0;
let lastX = 0, lastY = 0;
let activeKey = null;
let movementHistory = []; 

function bindEvents() {
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('mousedown', onMouseDown);
        key.addEventListener('touchstart', onTouchStart, {passive: true});
    });
}

function onMouseDown(e) { startTracking(e, this); }
function onTouchStart(e) { startTracking(e.touches ? e.touches[0] : e, this); }

window.addEventListener('mousemove', (e) => trackMovement(e));
window.addEventListener('touchmove', (e) => trackMovement(e.touches ? e.touches[0] : e), {passive: true});
window.addEventListener('mouseup', () => stopTracking());
window.addEventListener('touchend', () => stopTracking());

function startTracking(e, keyElement) {
    if (!e) return;
    activeKey = keyElement;
    startX = e.clientX;
    startY = e.clientY;
    lastX = startX;
    lastY = startY;
    movementHistory = [];
}

function trackMovement(e) {
    if (!activeKey || !e) return;

    const diffX = e.clientX - lastX;
    const diffY = e.clientY - lastY;
    const threshold = 15; 

    let currentDir = null;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) currentDir = diffX > 0 ? 'R' : 'L';
    } else {
        if (Math.abs(diffY) > threshold) currentDir = diffY > 0 ? 'D' : 'U';
    }

    if (currentDir) {
        if (movementHistory.length === 0 || movementHistory[movementHistory.length - 1] !== currentDir) {
            movementHistory.push(currentDir);
            lastX = e.clientX;
            lastY = e.clientY;
        }
    }
}

function stopTracking() {
    if (!activeKey) return;

    const action = activeKey.getAttribute('data-action');
    const keyVal = activeKey.getAttribute('data-key');
    let text = activeKey.textContent.trim().replace(/\s+/g, '');

    if (text === '한/영' || action === 'lang') {
        toggleLanguageMode();
        activeKey = null;
        return;
    }

    if (action) {
        handleAction(action);
        activeKey = null;
        return;
    }

    if (isEnglishMode) {
        if (!['이모지', '특수문자', '한자', '한/영'].includes(text)) {
            if (text === '⌫') handleAction('backspace');
            else if (text === '↵') handleAction('enter');
            else if (text === '␣') handleAction('space');
            else inputLetters.push(text);
            renderText();
        }
        activeKey = null;
        return;
    }

    if (keyVal) {
        handleKoreanInput(keyVal, movementHistory);
    } else {
        if (!['이모지', '특수문자', '한자'].includes(text)) {
            inputLetters.push(text);
            renderText();
        }
    }

    activeKey = null;
}

// 💡 요청하신 오리지널 스와이프 규칙 복원
function handleKoreanInput(key, history) {
    let resultChar = key;
    const pattern = history.join('');

    if (key === 'ㅡ') {
        if (pattern === 'U') resultChar = 'ㅗ';
        else if (pattern === 'D') resultChar = 'ㅜ';
        else if (pattern === 'DUD') resultChar = 'ㅠ';
        else if (pattern === 'UDU') resultChar = 'ㅛ';
        else resultChar = 'ㅡ'; 
    } 
    else if (key === 'ㅣ') {
        if (pattern === 'R') resultChar = 'ㅏ';
        else if (pattern === 'RLR') resultChar = 'ㅑ';
        else if (pattern === 'L') resultChar = 'ㅓ';
        else if (pattern === 'LRL') resultChar = 'ㅕ';
        else resultChar = 'ㅣ'; 
    }

    inputLetters.push(resultChar);
    renderText();
}

function handleAction(action) {
    if (action === 'backspace') inputLetters.pop();
    else if (action === 'space') inputLetters.push(' ');
    else if (action === 'enter') inputLetters.push('\n');
    renderText();
}

function toggleLanguageMode() {
    isEnglishMode = !isEnglishMode;
    const keyboardDiv = document.querySelector('.keyboard');
    
    if (isEnglishMode) {
        keyboardDiv.style.gridTemplateColumns = "repeat(10, 1fr)";
        keyboardDiv.innerHTML = "";
        
        qwertyLayout.flat().forEach(char => {
            const keyEl = document.createElement('div');
            keyEl.className = 'key';
            keyEl.textContent = char;
            
            if (char === 'space' || char === '␣') {
                keyEl.textContent = '␣';
                keyEl.style.gridColumn = "span 4";
            }
            if (['이모지', '한/영'].includes(char)) {
                keyEl.style.gridColumn = "span 3";
                keyEl.style.backgroundColor = "#eee";
            }
            keyboardDiv.appendChild(keyEl);
        });
        bindEvents(); 
    } else {
        location.reload(); 
    }
}

function renderText() {
    // Hangul 라이브러리가 정상 로드되었는지 체크하는 안전장치
    if (typeof Hangul !== 'undefined') {
        output.value = Hangul.assemble(inputLetters);
    } else {
        output.value = inputLetters.join(''); // 라이브러리가 꺼져있으면 분리된 채로라도 출력 보장
    }
}

bindEvents();

