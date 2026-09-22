// ============================================================
// 🎉 BungOiAnGi – Confetti Particle System
// ============================================================

const COLORS = ['#FF6B35', '#FFB347', '#FF4757', '#2ED573', '#1E90FF', '#FF6EB4', '#FFD700', '#7BED9F'];

let particles = [];
let animId = null;
let canvas, ctx2d;

function ensure() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    ctx2d = canvas.getContext('2d');
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle(x, y) {
  return {
    x: x ?? Math.random() * window.innerWidth,
    y: y ?? -10,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * 4 + 2,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 6,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    life: 1,
    decay: Math.random() * 0.008 + 0.003,
    type: Math.random() > 0.5 ? 'rect' : 'circle',
  };
}

function step() {
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.vx *= 0.99;
    p.rot += p.rotV;
    p.life -= p.decay;

    ctx2d.save();
    ctx2d.globalAlpha = Math.max(0, p.life);
    ctx2d.translate(p.x, p.y);
    ctx2d.rotate((p.rot * Math.PI) / 180);
    ctx2d.fillStyle = p.color;
    if (p.type === 'circle') {
      ctx2d.beginPath();
      ctx2d.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx2d.fill();
    } else {
      ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx2d.restore();
  });
  if (particles.length > 0) {
    animId = requestAnimationFrame(step);
  } else {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function burst(x, y, count = 80) {
  ensure();
  if (animId) cancelAnimationFrame(animId);
  for (let i = 0; i < count; i++) {
    const p = createParticle(x, y);
    p.vx = (Math.random() - 0.5) * 16;
    p.vy = Math.random() * -12 - 4;
    p.decay = Math.random() * 0.005 + 0.002;
    particles.push(p);
  }
  animId = requestAnimationFrame(step);
}

export function rain(count = 120) {
  ensure();
  if (animId) cancelAnimationFrame(animId);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      particles.push(createParticle());
      if (!animId || particles.length === 1) {
        animId = requestAnimationFrame(step);
      }
    }, i * 18);
  }
}
