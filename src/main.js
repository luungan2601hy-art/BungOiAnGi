// ============================================================
// 🍜 BungOiAnGi – Main Application
// ============================================================

import './style.css';
import { dishes, MOODS, BUDGETS, CATEGORIES, filterDishes, getRandomDish, popularDishes, newDishes } from './data/dishes.js';
import { playClick, playSelect, playBup, playWin, playSpinTick, playBattle } from './utils/audio.js';
import { burst, rain } from './utils/confetti.js';

// ============================================================
// STATE
// ============================================================
const state = {
  activePage: 'home',
  mood: null,
  budget: 'all',
  exploreDiet: 'all',
  exploreTags: [],
  exploreSort: 'default',
  favorites: JSON.parse(localStorage.getItem('bung_favs') || '[]'),
  // Wheel
  wheelItems: [],
  wheelSpinning: false,
  wheelAngle: 0,
  // Battle
  battlePool: [],
  battleRound: [],
  battleWinners: [],
  battleRoundNum: 0,
  battleChampion: null,
  // Quiz
  quizAnswers: {},
  quizStep: 0,
};

// ============================================================
// RENDER: APP SHELL
// ============================================================
function renderApp() {
  document.getElementById('app').innerHTML = `
    ${renderHeader()}
    ${renderPages()}
    ${renderModal()}
  `;
  bindAll();
}

function renderHeader() {
  const favCount = state.favorites.length;
  return `
  <header class="header" id="header">
    <div class="header-inner">
      <a href="#" class="logo" id="logo-link">
        <span class="logo-icon">🍜</span>
        <span class="logo-text">
          <span class="logo-title">BUNGOIANGI</span>
          <span class="logo-sub">Bụng đói có món ngay ✨</span>
        </span>
      </a>
      <nav class="nav" id="main-nav">
        <button class="nav-btn active" data-page="home" id="nav-home">🏠 Trang chủ</button>
        <button class="nav-btn" data-page="explore" id="nav-explore">🔍 Khám phá</button>
        <button class="nav-btn" data-page="quiz" id="nav-quiz">🤔 Hôm nay ăn gì?</button>
        <button class="nav-btn" data-page="wheel" id="nav-wheel">🎡 Vòng quay</button>
        <button class="nav-btn" data-page="battle" id="nav-battle">⚔️ Đấu món</button>
      </nav>
      <button class="fav-btn" id="fav-nav-btn">
        ❤️ Gu của tôi
        ${favCount > 0 ? `<span class="fav-badge" id="fav-badge">${favCount}</span>` : `<span class="fav-badge hidden" id="fav-badge">0</span>`}
      </button>
    </div>
  </header>`;
}

function renderPages() {
  return `
    <main>
      <div id="page-home" class="page active">${renderHome()}</div>
      <div id="page-explore" class="page">${renderExplore()}</div>
      <div id="page-quiz" class="page">${renderQuiz()}</div>
      <div id="page-wheel" class="page">${renderWheel()}</div>
      <div id="page-battle" class="page">${renderBattle()}</div>
      <div id="page-favs" class="page">${renderFavs()}</div>
    </main>`;
}

// ============================================================
// HOME PAGE
// ============================================================
function renderHome() {
  const moodButtons = Object.values(MOODS).map(m => `
    <button class="mood-btn ${state.mood === m.id ? 'active' : ''}" data-mood="${m.id}" id="mood-${m.id}">
      <span class="m-emoji">${m.emoji}</span>
      <span class="m-label">${m.label}</span>
    </button>`).join('');

  const budgetButtons = BUDGETS.map(b => `
    <button class="budget-btn ${state.budget === b.id ? 'active' : ''}" data-budget="${b.id}" id="budget-${b.id}">
      <span class="b-label">${b.label}</span>
      ${b.sublabel ? `<span class="b-sub">${b.sublabel}</span>` : ''}
    </button>`).join('');

  return `
    <section class="hero-section">
      <!-- Hero Box -->
      <div class="hero-box">
        <div class="hero-stickers">
          <span class="sticker">🍜</span>
          <span class="sticker">🔥</span>
          <span class="sticker">🥢</span>
          <span class="sticker">🌶️</span>
        </div>
        <h1 class="hero-title">HÔM NAY<br>ĂN GÌ?</h1>
        <p class="hero-tagline">"Để BungOiAnGi quyết định!"</p>
        <button class="bup-btn" id="bup-btn">
          <span class="btn-icon">🎲</span>
          BỤP! ĂN GÌ
        </button>
      </div>

      <!-- Filters -->
      <div>
        <p class="section-label">Bạn đang cảm thấy...</p>
        <div class="mood-grid" id="mood-grid">${moodButtons}</div>
        <p class="section-label">Ngân sách hôm nay?</p>
        <div class="budget-row" id="budget-row">${budgetButtons}</div>
      </div>
    </section>

    <div class="container">
      <!-- Popular -->
      <div class="section-header">
        <h2>🔥 Món được chọn nhiều</h2>
        <span class="section-badge" id="popular-count">${getFilteredPopular().length} món</span>
      </div>
      <div class="dishes-grid" id="popular-grid">
        ${renderDishCards(getFilteredPopular())}
      </div>

      <!-- New/Explore -->
      <div class="section-header" style="margin-top:2.5rem">
        <h2>🍜 Khám phá món mới</h2>
        <span class="section-badge" id="new-count">${getFilteredNew().length} món</span>
      </div>
      <div class="dishes-grid" id="new-grid">
        ${renderDishCards(getFilteredNew())}
      </div>
    </div>`;
}

function getFilteredPopular() {
  return filterDishes(state.mood, state.budget).filter(d => d.popular);
}
function getFilteredNew() {
  return filterDishes(state.mood, state.budget).filter(d => !d.popular).slice(0, 8);
}

// ============================================================
// EXPLORE PAGE
// ============================================================
function renderExplore() {
  const catBtns = CATEGORIES.map(c => `
    <button class="cat-btn ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}" id="cat-${c.id}">${c.label}</button>
  `).join('');
  const tagOptions = ['Cay', 'Healthy', 'Rẻ', 'Nướng', 'Miền Bắc', 'Miền Nam', 'Đường phố', 'Classic'];
  const tagBtns = tagOptions.map(tag => `
    <button class="tag-filter-btn" data-tag="${tag}">${tag}</button>
  `).join('');

  return `
    <div class="explore-header">
      <div style="max-width:1200px;margin:0 auto">
        <h1>🔍 Khám Phá Món Ăn</h1>
        <p>Hơn ${dishes.length} món ăn Việt Nam đặc sắc khắp 3 miền đang chờ bạn!</p>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input class="search-input" type="text" id="explore-search" placeholder="Tìm tên món, tag... (vd: cay, miền bắc, rẻ)" />
        </div>
      </div>
    </div>
    <div class="category-tabs" id="cat-tabs">${catBtns}</div>
    <div class="explore-grid-wrap">
      <div class="explore-filters">
        <div class="filter-group">
          <label for="explore-diet">Loại món</label>
          <select id="explore-diet" class="filter-select">
            <option value="all">Tất cả</option>
            <option value="chay">Món chay</option>
            <option value="man">Món mặn</option>
          </select>
        </div>
        <div class="filter-group filter-tags">
          <span class="filter-label">Tag</span>
          <div class="tag-filter-list">${tagBtns}</div>
        </div>
        <div class="filter-group">
          <label for="explore-sort">Sắp xếp</label>
          <select id="explore-sort" class="filter-select">
            <option value="default">Mặc định</option>
            <option value="price-asc">Giá thấp đến cao</option>
            <option value="price-desc">Giá cao đến thấp</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="calo">Calories thấp nhất</option>
          </select>
        </div>
      </div>
      <p class="explore-count" id="explore-count">${dishes.length} món</p>
      <div class="dishes-grid" id="explore-grid">
        ${renderDishCards(dishes)}
      </div>
    </div>`;
}

// ============================================================
// QUIZ PAGE
// ============================================================
const QUIZ = [
  {
    q: '🌅 Đây là bữa ăn nào?',
    key: 'meal',
    opts: [
      { icon: '☀️', label: 'Bữa sáng', value: 'sang' },
      { icon: '🌤️', label: 'Bữa trưa', value: 'trua' },
      { icon: '🌙', label: 'Bữa tối', value: 'toi' },
      { icon: '🌜', label: 'Ăn khuya', value: 'khuya' },
    ],
  },
  {
    q: '👥 Bạn ăn với ai?',
    key: 'with',
    opts: [
      { icon: '🙋', label: 'Một mình', value: 'alone' },
      { icon: '👫', label: 'Cùng người thương', value: 'couple' },
      { icon: '👨‍👩‍👧‍👦', label: 'Cả gia đình', value: 'family' },
      { icon: '🎉', label: 'Nhóm bạn đông vui', value: 'group' },
    ],
  },
  {
    q: '👅 Khẩu vị hôm nay?',
    key: 'taste',
    opts: [
      { icon: '🍲', label: 'Đậm đà, no nê', value: 'rich' },
      { icon: '🥗', label: 'Thanh đạm, nhẹ bụng', value: 'light' },
      { icon: '🌶️', label: 'Cay nồng xé lưỡi', value: 'spicy' },
      { icon: '💸', label: 'Ngon mà rẻ thôi', value: 'cheap' },
    ],
  },
];

function renderQuiz() {
  const steps = QUIZ.map((q, i) => `
    <div class="quiz-step ${i === 0 ? '' : 'hidden'}" data-step="${i}" id="quiz-step-${i}">
      <p class="quiz-q">${q.q}</p>
      <div class="quiz-options">
        ${q.opts.map(o => `
          <button class="quiz-opt" data-key="${q.key}" data-val="${o.value}" id="qopt-${q.key}-${o.value}">
            <span class="opt-icon">${o.icon}</span> ${o.label}
          </button>`).join('')}
      </div>
    </div>`).join('');

  const dots = QUIZ.map((_, i) => `<div class="quiz-dot ${i === 0 ? 'active' : ''}" id="quiz-dot-${i}"></div>`).join('');

  return `
    <div class="quiz-wrap">
      <div class="quiz-header">
        <h1>🤔 Hôm Nay Ăn Gì?</h1>
        <p>Trả lời 3 câu hỏi ngắn để nhận gợi ý món chuẩn khẩu vị!</p>
      </div>
      <div class="quiz-progress" id="quiz-progress">${dots}</div>
      ${steps}
      <div class="quiz-result hidden" id="quiz-result">
        <div class="quiz-result-dish" id="quiz-result-dish"></div>
        <div style="display:flex;gap:.75rem;margin-top:1rem">
          <button class="btn-primary" id="quiz-restart-btn">🔄 Thử lại</button>
          <button class="btn-secondary" id="quiz-save-btn">❤️ Lưu vào Gu</button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// WHEEL PAGE
// ============================================================
const WHEEL_COLORS = ['#FF6B35','#FFB347','#52B788','#FF4757','#1E90FF','#FF6EB4','#FFD700','#7BED9F','#FF8C42','#A29BFE'];

function renderWheel() {
  const allChips = dishes.slice(0, 20).map(d => `
    <button class="wheel-item-chip in-wheel" data-dish-id="${d.id}" id="wchip-${d.id}">${d.name}</button>
  `).join('');
  return `
    <div class="wheel-wrap">
      <h1 class="wheel-title">🎡 Vòng Quay May Mắn</h1>
      <p class="wheel-sub">Không biết ăn gì? Để vòng quay quyết định!</p>
      <div class="wheel-container">
        <div class="wheel-pointer">▼</div>
        <canvas id="wheel-canvas" class="wheel-canvas" width="380" height="380"></canvas>
        <button class="wheel-center-btn" id="wheel-spin-btn">QUAY<br>THÔI!</button>
      </div>
      <div class="wheel-items" id="wheel-chips">${allChips}</div>
      <div class="wheel-result-box" id="wheel-result-box">
        <h3 id="wheel-result-name">🎉</h3>
        <p id="wheel-result-desc"></p>
      </div>
    </div>`;
}

// ============================================================
// BATTLE PAGE
// ============================================================
function renderBattle() {
  return `
    <div class="battle-wrap">
      <h1 class="battle-title">⚔️ Đấu Món</h1>
      <p class="battle-sub">Chọn món thắng để tìm ra Quán Quân của ngày hôm nay!</p>
      <div class="battle-bracket" id="battle-bracket"></div>
      <div id="battle-arena-wrap">
        <div class="battle-arena" id="battle-arena">
          <div class="battle-card" id="bc-left">
            <img id="bc-left-img" src="" alt="" />
            <div class="bc-name" id="bc-left-name"></div>
            <div class="bc-vote">👆 Bấm để chọn</div>
          </div>
          <div class="vs-badge">VS</div>
          <div class="battle-card" id="bc-right">
            <img id="bc-right-img" src="" alt="" />
            <div class="bc-name" id="bc-right-name"></div>
            <div class="bc-vote">👆 Bấm để chọn</div>
          </div>
        </div>
        <p id="battle-info" style="text-align:center;color:var(--text-muted);font-size:.85rem;margin-top:.75rem;font-weight:600"></p>
      </div>
      <div class="battle-champion" id="battle-champion">
        <div class="champion-crown">👑</div>
        <div class="champion-title">Quán Quân Hôm Nay</div>
        <div class="champion-name" id="champion-name"></div>
        <img id="champion-img" src="" alt="" class="champion-img" />
        <p id="champion-desc" style="opacity:.85;font-size:.9rem;margin-top:.5rem"></p>
        <button class="battle-restart-btn" id="battle-restart-btn">🔄 Đấu lại từ đầu</button>
      </div>
    </div>`;
}

// ============================================================
// FAVORITES PAGE
// ============================================================
function renderFavs() {
  const favDishes = dishes.filter(d => state.favorites.includes(d.id));
  return `
    <div class="fav-page-header">
      <h1>❤️ Gu Của Tôi</h1>
      <p>Những món ăn bạn đã yêu thích và lưu lại</p>
    </div>
    <div class="container">
      ${favDishes.length === 0 ? `
        <div class="fav-empty">
          <div class="fe-icon">❤️</div>
          <p>Bạn chưa lưu món nào.<br>Bấm ❤️ trên món ăn để thêm vào đây!</p>
        </div>` : `
        <div style="margin-top:1.5rem"></div>
        <div class="dishes-grid">${renderDishCards(favDishes)}</div>`}
    </div>`;
}

// ============================================================
// DISH CARDS
// ============================================================
function renderDishCards(list) {
  if (!list.length) return `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="es-icon">🍽️</div>
      <p>Không tìm thấy món phù hợp.<br>Thử chọn tâm trạng/ngân sách khác nhé!</p>
    </div>`;
  return list.map(d => {
    const saved = state.favorites.includes(d.id);
    return `
      <div class="dish-card" data-dish="${d.id}" id="card-${d.id}">
        <div class="dish-img-wrap">
          <img class="dish-img" src="${d.img}" alt="${d.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'" />
          <span class="dish-price-badge">${(d.price / 1000).toFixed(0)}K</span>
          <button class="dish-fav-btn ${saved ? 'saved' : ''}" data-fav="${d.id}" id="fav-${d.id}" title="Lưu vào Gu của tôi">
            ${saved ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="dish-body">
          <div class="dish-name">${d.name}</div>
          <div class="dish-desc">${d.desc}</div>
          <div class="dish-meta">
            <span>⭐ ${d.rating}</span>
            <span>🕐 ${d.time}</span>
            <span>🔥 ${d.calo} kcal</span>
          </div>
          <div class="dish-tags">
            ${d.tags.slice(0, 3).map(t => `<span class="dish-tag">${t}</span>`).join('')}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ============================================================
// MODAL
// ============================================================
function renderModal() {
  return `
    <div class="modal-overlay" id="dish-modal" role="dialog" aria-modal="true">
      <div class="modal" id="modal-box">
        <img id="modal-img" src="" alt="" class="modal-img" />
        <div class="modal-body">
          <div class="modal-name" id="modal-name"></div>
          <div class="modal-desc" id="modal-desc"></div>
          <div class="modal-facts" id="modal-facts"></div>
          <div class="modal-reason" id="modal-reason"></div>
          <div class="modal-actions">
            <button class="btn-secondary" id="modal-change-btn">🔄 Đổi món khác</button>
            <button class="btn-primary" id="modal-save-btn">❤️ Lưu vào Gu</button>
          </div>
        </div>
      </div>
    </div>`;
}

function openModal(dish, onRoll) {
  const overlay = document.getElementById('dish-modal');
  document.getElementById('modal-img').src = dish.img;
  document.getElementById('modal-name').textContent = dish.name;
  document.getElementById('modal-desc').textContent = dish.desc;
  document.getElementById('modal-facts').innerHTML = `
    <div class="modal-fact"><span class="mf-value">${(dish.price/1000).toFixed(0)}K</span><span class="mf-key">Giá</span></div>
    <div class="modal-fact"><span class="mf-value">${dish.calo}</span><span class="mf-key">Kcal</span></div>
    <div class="modal-fact"><span class="mf-value">${dish.time}</span><span class="mf-key">Chờ</span></div>
    <div class="modal-fact"><span class="mf-value">⭐ ${dish.rating}</span><span class="mf-key">Đánh giá</span></div>
  `;
  document.getElementById('modal-reason').textContent = `✅ Lý do nên ăn: ${dish.desc.split('–')[0].trim()}`;

  const saveBtn = document.getElementById('modal-save-btn');
  const saved = state.favorites.includes(dish.id);
  saveBtn.textContent = saved ? '✅ Đã lưu' : '❤️ Lưu vào Gu';
  saveBtn.onclick = () => { toggleFav(dish.id); renderApp(); };

  const changeBtn = document.getElementById('modal-change-btn');
  if (onRoll) {
    changeBtn.onclick = () => {
      playBup();
      const newDish = getRandomDish(state.mood, state.budget);
      openModal(newDish, onRoll);
    };
  } else {
    changeBtn.style.display = 'none';
  }

  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('dish-modal').classList.remove('open');
}

// ============================================================
// FAVORITES
// ============================================================
function toggleFav(id) {
  const idx = state.favorites.indexOf(id);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push(id);
  localStorage.setItem('bung_favs', JSON.stringify(state.favorites));
}

// ============================================================
// WHEEL LOGIC
// ============================================================
let wheelItems = [];
let wheelAngle = 0;
let wheelSpinning = false;

function getWheelItems() {
  const inWheel = document.querySelectorAll('.wheel-item-chip.in-wheel');
  return Array.from(inWheel).map(el => {
    const id = parseInt(el.dataset.dishId);
    return dishes.find(d => d.id === id);
  }).filter(Boolean);
}

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const items = getWheelItems();
  if (!items.length) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 8;
  const arc = (Math.PI * 2) / items.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  items.forEach((item, i) => {
    const startAngle = wheelAngle + i * arc;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(10, Math.min(14, 200 / items.length))}px 'Plus Jakarta Sans', sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    const name = item.name.length > 14 ? item.name.slice(0, 12) + '…' : item.name;
    ctx.fillText(name, r - 14, 5);
    ctx.restore();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#FF6B35';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function spinWheel() {
  if (wheelSpinning) return;
  const items = getWheelItems();
  if (items.length < 2) return;
  wheelSpinning = true;

  const totalSpins = (5 + Math.random() * 5) * Math.PI * 2;
  const duration = 4000 + Math.random() * 2000;
  const startAngle = wheelAngle;
  let startTime = null;
  let lastTickAngle = wheelAngle;
  const tickInterval = (Math.PI * 2) / items.length;

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function frame(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOut(progress);
    wheelAngle = startAngle + totalSpins * easedProgress;

    // Tick sound
    if (Math.abs(wheelAngle - lastTickAngle) >= tickInterval * 0.9) {
      playSpinTick();
      lastTickAngle = wheelAngle;
    }

    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      wheelSpinning = false;
      // Find winner
      const arc = (Math.PI * 2) / items.length;
      const normalizedAngle = ((wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointer = (Math.PI * 2 - normalizedAngle + Math.PI * 1.5) % (Math.PI * 2);
      const winnerIdx = Math.floor(pointer / arc) % items.length;
      const winner = items[winnerIdx];
      showWheelResult(winner);
    }
  }
  requestAnimationFrame(frame);
}

function showWheelResult(dish) {
  playWin();
  rain(100);
  const box = document.getElementById('wheel-result-box');
  document.getElementById('wheel-result-name').textContent = `🎉 ${dish.name}`;
  document.getElementById('wheel-result-desc').textContent = `${dish.desc.slice(0, 80)}... – ${(dish.price/1000).toFixed(0)}K | ⭐ ${dish.rating}`;
  box.classList.add('show');
}

// ============================================================
// BATTLE LOGIC
// ============================================================
const BATTLE_ROUNDS = ['Tứ kết', 'Bán kết', 'Chung kết'];

function initBattle() {
  // Pick 8 random dishes
  const shuffled = [...dishes].sort(() => Math.random() - 0.5).slice(0, 8);
  state.battlePool = shuffled;
  state.battleRound = [...shuffled];
  state.battleWinners = [];
  state.battleRoundNum = 0;
  state.battleChampion = null;
  nextBattlePair();
}

function nextBattlePair() {
  const champion = document.getElementById('battle-champion');
  const arenaWrap = document.getElementById('battle-arena-wrap');
  champion.classList.remove('show');
  arenaWrap.style.display = 'block';

  if (state.battleRound.length < 2) {
    // Show champion
    if (state.battleWinners.length === 1) {
      showChampion(state.battleWinners[0]);
    } else {
      // Move winners to next round
      state.battleRound = [...state.battleWinners];
      state.battleWinners = [];
      state.battleRoundNum++;
      nextBattlePair();
    }
    return;
  }

  const left = state.battleRound.shift();
  const right = state.battleRound.shift();
  const remaining = state.battleRound.length + state.battleWinners.length;

  updateBattleBracket();

  document.getElementById('bc-left-img').src = left.img;
  document.getElementById('bc-left-name').textContent = left.name;
  document.getElementById('bc-right-img').src = right.img;
  document.getElementById('bc-right-name').textContent = right.name;
  document.getElementById('battle-info').textContent = `Còn ${remaining} trận nữa trong vòng này`;

  const leftCard = document.getElementById('bc-left');
  const rightCard = document.getElementById('bc-right');
  leftCard.className = 'battle-card';
  rightCard.className = 'battle-card';

  leftCard.onclick = () => chooseBattleWinner(left, leftCard, rightCard);
  rightCard.onclick = () => chooseBattleWinner(right, rightCard, leftCard);
}

function chooseBattleWinner(winner, winnerCard, loserCard) {
  playBattle();
  winnerCard.classList.add('winner');
  loserCard.classList.add('loser');
  state.battleWinners.push(winner);
  setTimeout(() => {
    if (state.battleRound.length === 0 && state.battleWinners.length === 1) {
      showChampion(state.battleWinners[0]);
    } else if (state.battleRound.length === 0) {
      state.battleRound = [...state.battleWinners];
      state.battleWinners = [];
      state.battleRoundNum++;
      nextBattlePair();
    } else {
      nextBattlePair();
    }
  }, 800);
}

function showChampion(dish) {
  playWin();
  rain(150);
  state.battleChampion = dish;
  const arenaWrap = document.getElementById('battle-arena-wrap');
  const champion = document.getElementById('battle-champion');
  arenaWrap.style.display = 'none';
  document.getElementById('champion-name').textContent = dish.name;
  document.getElementById('champion-img').src = dish.img;
  document.getElementById('champion-desc').textContent = dish.desc.slice(0, 100) + '...';
  champion.classList.add('show');
}

function updateBattleBracket() {
  const roundName = BATTLE_ROUNDS[Math.min(state.battleRoundNum, BATTLE_ROUNDS.length - 1)] || 'Vòng đấu';
  const bracket = document.getElementById('battle-bracket');
  bracket.innerHTML = BATTLE_ROUNDS.map((r, i) => `
    <span class="bracket-step ${i === state.battleRoundNum ? 'active' : ''}">${r}</span>
    ${i < BATTLE_ROUNDS.length - 1 ? '<span class="bracket-arrow">→</span>' : ''}
  `).join('');
}

// ============================================================
// QUIZ LOGIC
// ============================================================
function resolveQuizResult() {
  const { taste, with: withWho } = state.quizAnswers;
  let mood = null;
  if (taste === 'spicy') mood = 'cay';
  else if (taste === 'light') mood = 'healthy';
  else if (taste === 'cheap') mood = 'ngheo';
  else if (withWho === 'group') mood = 'party';
  else mood = 'ngon';
  return getRandomDish(mood, null) || dishes[Math.floor(Math.random() * dishes.length)];
}

function showQuizResult(dish) {
  for (let i = 0; i < QUIZ.length; i++) {
    document.getElementById(`quiz-step-${i}`).classList.add('hidden');
  }
  const result = document.getElementById('quiz-result');
  const dishEl = document.getElementById('quiz-result-dish');
  dishEl.innerHTML = `
    <img src="${dish.img}" alt="${dish.name}" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:1rem" />
    <div class="quiz-result-name">${dish.name}</div>
    <div class="quiz-result-desc">${dish.desc}</div>
    <div class="dish-meta" style="justify-content:center;margin-bottom:.5rem">
      <span>⭐ ${dish.rating}</span> <span>🔥 ${dish.calo} kcal</span>
      <span>💰 ${(dish.price/1000).toFixed(0)}K</span>
    </div>`;
  result.classList.remove('hidden');
  playWin();
  burst(window.innerWidth / 2, window.innerHeight / 2, 60);

  document.getElementById('quiz-save-btn').onclick = () => {
    toggleFav(dish.id);
    updateFavBadge();
    document.getElementById('quiz-save-btn').textContent = '✅ Đã lưu!';
  };
  document.getElementById('quiz-restart-btn').onclick = () => resetQuiz();
}

function resetQuiz() {
  state.quizAnswers = {};
  state.quizStep = 0;
  document.getElementById('quiz-result').classList.add('hidden');
  QUIZ.forEach((_, i) => {
    const step = document.getElementById(`quiz-step-${i}`);
    step.classList.toggle('hidden', i !== 0);
    step.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
  });
  updateQuizDots();
}

function updateQuizDots() {
  QUIZ.forEach((_, i) => {
    const dot = document.getElementById(`quiz-dot-${i}`);
    if (!dot) return;
    dot.className = 'quiz-dot';
    if (i < state.quizStep) dot.classList.add('done');
    else if (i === state.quizStep) dot.classList.add('active');
  });
}

// ============================================================
// UPDATE HELPERS
// ============================================================
function updateFavBadge() {
  const badge = document.getElementById('fav-badge');
  if (!badge) return;
  const count = state.favorites.length;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
  badge.style.animation = 'none';
  requestAnimationFrame(() => { badge.style.animation = ''; });
}

function updateHomeGrids() {
  const pg = document.getElementById('popular-grid');
  const ng = document.getElementById('new-grid');
  const pc = document.getElementById('popular-count');
  const nc = document.getElementById('new-count');
  if (pg) pg.innerHTML = renderDishCards(getFilteredPopular());
  if (ng) ng.innerHTML = renderDishCards(getFilteredNew());
  if (pc) pc.textContent = `${getFilteredPopular().length} món`;
  if (nc) nc.textContent = `${getFilteredNew().length} món`;
  bindDishCards();
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) targetPage.classList.add('active');
  const navBtn = document.querySelector(`[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');
  state.activePage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'wheel') {
    setTimeout(() => drawWheel(), 50);
  }
  if (page === 'battle') {
    initBattle();
  }
  if (page === 'favs') {
    const favPage = document.getElementById('page-favs');
    if (favPage) favPage.innerHTML = renderFavs();
    bindDishCards();
  }
}

// ============================================================
// BIND EVENTS
// ============================================================
function bindAll() {
  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      navigateTo(btn.dataset.page);
    });
  });

  document.getElementById('fav-nav-btn')?.addEventListener('click', () => {
    playClick();
    navigateTo('favs');
  });

  document.getElementById('logo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    playClick();
    navigateTo('home');
  });

  // BUP button
  document.getElementById('bup-btn')?.addEventListener('click', (e) => {
    playBup();
    const btn = e.currentTarget;
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => { btn.style.transform = ''; }, 200);
    burst(e.clientX, e.clientY, 60);
    setTimeout(() => {
      const dish = getRandomDish(state.mood, state.budget);
      if (dish) openModal(dish, true);
    }, 300);
  });

  // Mood
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSelect();
      const mood = btn.dataset.mood;
      state.mood = state.mood === mood ? null : mood;
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === state.mood));
      updateHomeGrids();
    });
  });

  // Budget
  document.querySelectorAll('.budget-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSelect();
      state.budget = btn.dataset.budget;
      document.querySelectorAll('.budget-btn').forEach(b => b.classList.toggle('active', b.dataset.budget === state.budget));
      updateHomeGrids();
    });
  });

  // Modal close
  document.getElementById('dish-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Explore search & cats
  const searchInput = document.getElementById('explore-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => updateExploreGrid());
  }
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateExploreGrid();
    });
  });

  document.getElementById('explore-diet')?.addEventListener('change', (e) => {
    state.exploreDiet = e.target.value;
    updateExploreGrid();
  });

  document.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      const tag = btn.dataset.tag;
      state.exploreTags = state.exploreTags.includes(tag)
        ? state.exploreTags.filter(item => item !== tag)
        : [...state.exploreTags, tag];
      btn.classList.toggle('active', state.exploreTags.includes(tag));
      updateExploreGrid();
    });
  });

  document.getElementById('explore-sort')?.addEventListener('change', (e) => {
    state.exploreSort = e.target.value;
    updateExploreGrid();
  });

  // Quiz
  document.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      playSelect();
      const key = btn.dataset.key;
      const val = btn.dataset.val;
      // Deselect others in same step
      const step = btn.closest('.quiz-step');
      step.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.quizAnswers[key] = val;

      setTimeout(() => {
        const nextStep = state.quizStep + 1;
        if (nextStep < QUIZ.length) {
          document.getElementById(`quiz-step-${state.quizStep}`).classList.add('hidden');
          document.getElementById(`quiz-step-${nextStep}`).classList.remove('hidden');
          state.quizStep = nextStep;
          updateQuizDots();
        } else {
          state.quizStep = QUIZ.length;
          updateQuizDots();
          const dish = resolveQuizResult();
          showQuizResult(dish);
        }
      }, 400);
    });
  });

  // Wheel chips
  document.querySelectorAll('.wheel-item-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      playClick();
      chip.classList.toggle('in-wheel');
      const result = document.getElementById('wheel-result-box');
      if (result) result.classList.remove('show');
      setTimeout(() => drawWheel(), 50);
    });
  });

  document.getElementById('wheel-spin-btn')?.addEventListener('click', () => {
    spinWheel();
  });

  document.getElementById('battle-restart-btn')?.addEventListener('click', () => {
    playClick();
    initBattle();
  });

  bindDishCards();
}

function bindDishCards() {
  // Card click -> open detail
  document.querySelectorAll('.dish-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.dish-fav-btn')) return;
      const id = parseInt(card.dataset.dish);
      const dish = dishes.find(d => d.id === id);
      if (dish) openModal(dish, false);
    });
  });

  // Fav buttons
  document.querySelectorAll('.dish-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSelect();
      const id = parseInt(btn.dataset.fav);
      toggleFav(id);
      updateFavBadge();
      const saved = state.favorites.includes(id);
      btn.textContent = saved ? '❤️' : '🤍';
      btn.classList.toggle('saved', saved);
      if (saved) burst(e.clientX, e.clientY, 30);
    });
  });
}

function updateExploreGrid() {
  const query = document.getElementById('explore-search')?.value || '';
  const activecat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';
  const results = filterDishes(null, 'all', activecat, query, state.exploreDiet, state.exploreTags);
  if (state.exploreSort === 'price-asc') results.sort((a, b) => a.price - b.price);
  if (state.exploreSort === 'price-desc') results.sort((a, b) => b.price - a.price);
  if (state.exploreSort === 'rating') results.sort((a, b) => b.rating - a.rating);
  if (state.exploreSort === 'calo') results.sort((a, b) => a.calo - b.calo);
  const grid = document.getElementById('explore-grid');
  const count = document.getElementById('explore-count');
  if (grid) grid.innerHTML = renderDishCards(results);
  if (count) count.textContent = `${results.length} món`;
  bindDishCards();
}

// ============================================================
// BOOT
// ============================================================
renderApp();
