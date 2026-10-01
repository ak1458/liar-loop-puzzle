// Level 2: The Liar Loop Logic

// DOM Elements
const playground = document.getElementById('playground');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const modalOverlay = document.getElementById('modalOverlay');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalButtons = document.getElementById('modalButtons');
const question = document.getElementById('question');
const hint = document.getElementById('hint');
const tally = document.getElementById('tally');
const tallyCount = document.getElementById('tallyCount');

// State
let currentState = 0;
let dodgeCount = 0;
let lastDodgeAt = 0;
let lastWidth = window.innerWidth;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Hint text shown as No keeps escaping (index = dodges / 2)
const taunts = [
    'There is only one right answer...',
    'Wrong button. Try again.',
    'That button is not for you.',
    'Yes is right there, you know.',
    'Yes is getting bigger. Take the hint.',
    'I can do this all day.',
    'The No button has left the chat.'
];

// --- STATE MACHINE CONFIGURATION ---
// 0: Initial Dodge Game
// 1: Accusation 1 ("Liar")
// 2: Accusation 2 ("Don't believe you")
// 3: Accusation 3 ("Prove it")
// 4: Final Acceptance ("Call me")

const gameStates = {
    1: {
        title: "Liar! 🤥",
        message: "I don't believe you! You're just saying that to make me happy.",
        sticker: "https://tenor.com/embed/17727752104958678205", // Milk And Mocha (User provided)
        btnText: "No, I swear! 🥺"
    },
    2: {
        title: "Stop Lying! 😤",
        message: "You probably clicked it by mistake. Look me in the eye!",
        sticker: "https://tenor.com/embed/23655029", // Leo GIF (User provided)
        btnText: "I LOVE YOU! 💖"
    },
    3: {
        title: "Prove it then...",
        message: "If you really love me, you wouldn't hesitate.",
        sticker: "https://tenor.com/embed/3230095517762915165", // Hey Baby (User provided)
        btnText: "I promise!! 😭"
    },
    4: {
        title: "Okay fine... 🥰",
        message: "I believe you. But just to be sure... call me right now.",
        sticker: "https://tenor.com/embed/10550883246321102858", // Happy/Love (Kept as requested)
        btnText: "Calling you... 📞",
        action: "call"
    }
};

// --- PRE-LOADER LOGIC ---
const stickers = Object.values(gameStates).map(s => s.sticker);
const stickerCache = {};

function preloadStickers() {
    stickers.forEach(url => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = "Reaction sticker";
        iframe.tabIndex = -1;
        iframe.loading = "eager";
        iframe.style.position = "absolute";
        iframe.style.top = "0";
        iframe.style.left = "0";
        iframe.style.opacity = "0";
        iframe.style.transition = "opacity 0.2s ease";

        // Append to modalIcon initially to keep them "alive" in the DOM
        // We will just toggle opacity
        modalIcon.appendChild(iframe);
        stickerCache[url] = iframe;
    });
}

function showSticker(url) {
    // Hide all
    Object.values(stickerCache).forEach(frame => {
        frame.style.opacity = "0";
        frame.style.zIndex = "0";
    });

    // Show target
    if (stickerCache[url]) {
        stickerCache[url].style.opacity = "1";
        stickerCache[url].style.zIndex = "10";
    }
}

// --- CORE GAME LOOP ---

function nextState() {
    currentState++;
    const stateData = gameStates[currentState];

    if (!stateData) return; // Should not happen

    // Update UI
    modalTitle.textContent = stateData.title;
    modalMessage.textContent = stateData.message;
    showSticker(stateData.sticker);

    // Update Button
    modalButtons.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'modal-button';
    btn.textContent = stateData.btnText;

    if (stateData.action === 'call') {
        btn.onclick = () => {
            // Trigger phone dialer
            window.location.href = "tel:+919453878422";
        };
    } else {
        btn.onclick = nextState;
    }

    modalButtons.appendChild(btn);
    btn.focus();
}

// --- DODGE LOGIC (REUSED) ---

// Element rect relative to the playground
function relRect(el) {
    const p = playground.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
        left: r.left - p.left,
        top: r.top - p.top,
        right: r.right - p.left,
        bottom: r.bottom - p.top
    };
}

function overlaps(a, b, gap) {
    return a.left < b.right + gap && a.right > b.left - gap &&
        a.top < b.bottom + gap && a.bottom > b.top - gap;
}

// Move No to a random free spot inside the playground, as far from `from` as possible
function dodge(from) {
    const now = performance.now();
    if (now - lastDodgeAt < 120) return;
    lastDodgeAt = now;

    // First escape: pin No where it currently sits, then let it run
    if (!btnNo.classList.contains('loose')) {
        // Reparent so the playground (not the animated button row) is the containing block
        const r = relRect(btnNo);
        btnNo.style.left = `${r.left}px`;
        btnNo.style.top = `${r.top}px`;
        btnNo.classList.add('loose');
        playground.appendChild(btnNo);
        void btnNo.offsetWidth; // commit start position so the jump animates
    }

    const pad = 16;
    const width = playground.clientWidth;
    const height = playground.clientHeight;
    const bw = btnNo.offsetWidth;
    const bh = btnNo.offsetHeight;
    const current = relRect(btnNo);
    const origin = from || { x: (current.left + current.right) / 2, y: (current.top + current.bottom) / 2 };
    const avoid = [relRect(btnYes), relRect(question)];
    const farEnough = Math.min(width, height) / 3;

    let best = null;
    for (let i = 0; i < 40; i++) {
        const x = pad + Math.random() * Math.max(0, width - bw - pad * 2);
        const y = pad + Math.random() * Math.max(0, height - bh - pad * 2);
        const box = { left: x, top: y, right: x + bw, bottom: y + bh };
        if (avoid.some(a => overlaps(box, a, 12))) continue;
        const d = Math.hypot(x + bw / 2 - origin.x, y + bh / 2 - origin.y);
        if (!best || d > best.d) best = { x, y, d };
        if (d > farEnough) break;
    }
    if (!best) best = { x: pad, y: height - bh - pad };

    btnNo.style.left = `${best.x}px`;
    btnNo.style.top = `${best.y}px`;
    btnNo.style.setProperty('--tilt', `${(Math.random() * 16 - 8).toFixed(1)}deg`);

    dodgeCount++;
    tallyCount.textContent = dodgeCount;
    tally.classList.add('show');

    if (dodgeCount % 2 === 0) {
        const scale = Math.min(1.35, 1 + dodgeCount * 0.025);
        btnYes.style.setProperty('--yes-scale', scale);
        hint.textContent = taunts[Math.min(dodgeCount / 2, taunts.length - 1)];
        hint.classList.remove('bump');
        void hint.offsetWidth;
        hint.classList.add('bump');
    }
}

// Mouse: run away before the cursor even reaches the button
function handlePointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    const p = playground.getBoundingClientRect();
    const x = e.clientX - p.left;
    const y = e.clientY - p.top;
    const r = relRect(btnNo);
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    if (Math.hypot(dx, dy) < 56) dodge({ x, y });
}

function handleNoPress(e) {
    e.preventDefault();
    e.stopPropagation();
    dodge();
}

// Little burst of hearts from the Yes button
function burstHearts() {
    if (reduceMotion.matches) return;
    const r = btnYes.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 18; i++) {
        const heart = document.createElement('span');
        const angle = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 140;
        heart.className = 'heart';
        heart.textContent = '♥';
        heart.style.left = `${cx}px`;
        heart.style.top = `${cy}px`;
        heart.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        heart.style.setProperty('--dy', `${Math.sin(angle) * dist - 60}px`);
        heart.style.setProperty('--r', `${Math.random() * 120 - 60}deg`);
        heart.style.setProperty('--s', (0.8 + Math.random()).toFixed(2));
        heart.addEventListener('animationend', () => heart.remove());
        document.body.appendChild(heart);
    }
}

// Layout changed width: put No back beside Yes (height-only changes are mobile address-bar noise)
function handleResize() {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    btnNo.classList.remove('loose');
    btnYes.after(btnNo);
    btnNo.style.left = '';
    btnNo.style.top = '';
}

// --- INITIALIZATION ---

function init() {
    preloadStickers();

    // Event Listeners
    playground.addEventListener('pointermove', handlePointerMove);
    btnNo.addEventListener('mouseenter', () => dodge());
    btnNo.addEventListener('click', handleNoPress);
    btnNo.addEventListener('touchstart', handleNoPress, { passive: false });
    btnNo.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    btnYes.addEventListener('click', () => {
        // Start the Argument Loop
        burstHearts();
        modalOverlay.classList.add('active');
        nextState(); // Go to state 1
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 150);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
