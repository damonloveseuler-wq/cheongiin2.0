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
function onTouchStart(e) { startTracking(e.touches ? e.touches : e, this); }

window.addEventListener('mousemove', (e) => trackMovement(e));
window.addEventListener('touchmove', (e) => trackMovement(e.touches ? e.touches : e), {passive: true});
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
    const threshold = 15; // 방향을 인식할 최소 픽셀 거리 (조금 더 민감하게 조정)

    let currentDir = null;
    
    // 🔥 [버그 수정] 가로/세로 이동 거리를 명확하게 개별 비교하여 U, D, L, R 판정하도록 수정
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            currentDir = diffX > 0 ? 'R' : 'L';
        }
    } else {
        if (Math.abs(diffY) > threshold) {
            currentDir = diffY > 0 ? 'D' : 'U';
        }
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

// 자음/모음 스와이프 규칙 최종 처리기
function handleKoreanInput(key, history) {
    let resultChar = key;
    const pattern = history.join('');

    // 1. 모음 스와이프 규칙
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
    // 2. 자음 스와이프 규칙 (위로 올리면 쌍자음, 오른쪽은 거센소리)
    else if (key === 'ㄱ') {
        if (pattern === 'U') resultChar = 'ㄲ';
        else if (pattern === 'R') resultChar = 'ㅋ';
    }
    else if (key === 'ㄷ') {
        if (pattern === 'U') resultChar = 'ㄸ';
        else if (pattern === 'R') resultChar = 'ㅌ';
    }
    else if (key === 'ㅂ') {
        if (pattern === 'U') resultChar = 'ㅃ';
        else if (pattern === 'R') resultChar = 'ㅍ';
    }
    else if (key === 'ㅅ') {
        if (pattern === 'U') resultChar = 'ㅆ';
    }
    else if (key === 'ㅈ') {
        if (pattern === 'U') resultChar = 'ㅉ';
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

// 순수 자바스크립트 한글 글자 결합 엔진 (오토마타)
function hangulAssembleCustom(letters) {
    const cho = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    const jung = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
    const jong = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

    const complexJung = { "ㅗ-ㅏ": "ㅘ", "ㅗ-ㅐ": "ㅙ", "ㅗ-ㅣ": "ㅚ", "ㅜ-ㅓ": "ㅝ", "ㅜ-ㅔ": "ㅞ", "ㅜ-ㅣ": "ㅟ", "ㅡ-ㅣ": "ㅢ",    "ㅏ-ㅣ": "ㅐ", "ㅓ-ㅣ": "ㅔ", "ㅑ-ㅣ": "ㅒ", "ㅕ-ㅣ": "ㅖ" };
    const complexJong = { "ㄱ-ㅅ": "ㄳ", "ㄴ-ㅈ": "ㄵ", "ㄴ-ㅎ": "ㄶ", "ㄹ-ㄱ": "ㄺ", "ㄹ-ㅁ": "ㄻ", "ㄹ-ㅂ": "ㄼ", "ㄹ-ㅅ": "ㄽ", "ㄹ-ㅌ": "ㄾ", "ㄹ-ㅍ": "ㄿ", "ㄹ-ㅎ": "ㅀ", "ㅂ-ㅅ": "ㅄ" };

    let result = "";
    let i = 0;

    while (i < letters.length) {
        let char = letters[i];

        if (!cho.includes(char) && !jung.includes(char) && !jong.includes(char)) {
            result += char;
            i++;
            continue;
        }

        if (!cho.includes(char)) {
            if (i + 1 < letters.length && complexJung[`${char}-${letters[i+1]}`]) {
                result += complexJung[`${char}-${letters[i+1]}`];
                i += 2;
            } else {
                result += char;
                i++;
            }
            continue;
        }

        let cIdx = cho.indexOf(char);
        let jIdx = -1;
        let tIdx = 0;
        i++;

        if (i < letters.length && jung.includes(letters[i])) {
            let currentJung = letters[i];
            i++;
            if (i < letters.length && complexJung[`${currentJung}-${letters[i]}`]) {
                currentJung = complexJung[`${currentJung}-${letters[i]}`];
                i++;
            }
            jIdx = jung.indexOf(currentJung);
        }

        if (jIdx === -1) {
            result += cho[cIdx];
            continue;
        }

        if (i < letters.length && jong.includes(letters[i])) {
            if (i + 1 < letters.length && jung.includes(letters[i+1])) {
                tIdx = 0;
            } else {
                let currentJong = letters[i];
                let step = 1;
                
                if (i + 1 < letters.length && complexJong[`${currentJong}-${letters[i+1]}`]) {
                    if (i + 2 < letters.length && jung.includes(letters[i+2])) {
                        currentJong = letters[i];
                        step = 1;
                    } else {
                        currentJong = complexJong[`${currentJong}-${letters[i+1]}`];
                        step = 2;
                    }
                }
                tIdx = jong.indexOf(currentJong);
                i += step;
            }
        }

        let uniCode = 0xAC00 + (cIdx * 21 * 28) + (jIdx * 28) + tIdx;
        result += String.fromCharCode(uniCode);
    }
    return result;
}

function renderText() {
    output.value = hangulAssembleCustom(inputLetters);
}

bindEvents();

