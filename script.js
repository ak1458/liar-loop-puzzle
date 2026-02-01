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
const preloadContainer = document.getElementById('preloadContainer');

// State
let currentState = 0;
let playgroundRect = null;
let dodgeCount = 0;
let yesSizeMultiplier = 1;
let isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        iframe.width = "100%";
        iframe.height = "220";
        iframe.frameBorder = "0";
        iframe.allowFullscreen = true;
        iframe.loading = "eager";
        iframe.style.borderRadius = "12px";
        iframe.style.pointerEvents = "none";
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
}

// --- DODGE LOGIC (REUSED) ---

function updatePlaygroundBounds() {
    playgroundRect = playground.getBoundingClientRect();
}

function getThreshold() {
    if (!playgroundRect) updatePlaygroundBounds();
    const minDim = Math.min(playgroundRect.width, playgroundRect.height);
    return Math.max(120, minDim / 4);
}

function getEdgePosition() {
    if (!playgroundRect) updatePlaygroundBounds();
    const padding = 18;
    const edges = ['top', 'right', 'bottom', 'left'];
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const maxX = playgroundRect.width - padding * 2;
    const maxY = playgroundRect.height - padding * 2;
    let x, y;
    switch (edge) {
        case 'top': x = padding + Math.random() * maxX; y = padding; break;
        case 'right': x = playgroundRect.width - padding; y = padding + Math.random() * maxY; break;
        case 'bottom': x = padding + Math.random() * maxX; y = playgroundRect.height - padding; break;
        case 'left': x = padding; y = padding + Math.random() * maxY; break;
    }
    return { x, y };
}

function setNoToEdge() {
    if (isReduced) return;
    const pos = getEdgePosition();
    btnNo.style.left = `${pos.x}px`;
    btnNo.style.top = `${pos.y}px`;

    dodgeCount++;
    if (dodgeCount % 2 === 0 && yesSizeMultiplier < 1.3) {
        yesSizeMultiplier += 0.05;
        btnYes.style.transform = `scale(${yesSizeMultiplier})`;
    }
}

function handleMouseMove(e) {
    if (isReduced) return;
    if (!playgroundRect) updatePlaygroundBounds();

    const mouseX = e.clientX - playgroundRect.left;
    const mouseY = e.clientY - playgroundRect.top;

    const btnRect = btnNo.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2 - playgroundRect.left;
    const btnCenterY = btnRect.top + btnRect.height / 2 - playgroundRect.top;

    const dx = mouseX - btnCenterX;
    const dy = mouseY - btnCenterY;
    const distance = Math.hypot(dx, dy);

    if (distance < getThreshold()) setNoToEdge();
}

function handleNoHover() {
    if (isReduced) return;
    setNoToEdge();
}

// --- INITIALIZATION ---

function init() {
    updatePlaygroundBounds();
    setNoToEdge();

    // Setup modal icon container for absolute positioning of stickers
    modalIcon.style.position = 'relative';
    modalIcon.style.height = '220px'; // Force height
    modalIcon.style.overflow = 'hidden';

    preloadStickers();

    // Event Listeners
    playground.addEventListener('mousemove', handleMouseMove);
    btnNo.addEventListener('mouseenter', handleNoHover);
    btnNo.addEventListener('click', (e) => { e.preventDefault(); setNoToEdge(); });
    btnNo.addEventListener('touchstart', (e) => { e.preventDefault(); setNoToEdge(); }, { passive: false });
    btnNo.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    btnYes.addEventListener('click', () => {
        // Start the Argument Loop
        modalOverlay.classList.add('active');
        nextState(); // Go to state 1
    });

    window.addEventListener('resize', () => {
        setTimeout(updatePlaygroundBounds, 150);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
