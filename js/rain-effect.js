/**
 * The Kaavish Radio — Atmospheric Rain & Droplet Canvas Visuals
 */

class RainCanvasEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.splashes = [];
    this.maxDrops = 130;
    this.isRunning = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initDrops();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initDrops() {
    this.drops = [];
    for (let i = 0; i < this.maxDrops; i++) {
      this.drops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: 12 + Math.random() * 18,
        speed: 8 + Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.35,
        wind: -1.2 + Math.random() * 0.5
      });
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw rain drops
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];
      this.ctx.beginPath();
      this.ctx.moveTo(d.x, d.y);
      this.ctx.lineTo(d.x + d.wind * (d.length / 5), d.y + d.length);
      this.ctx.strokeStyle = `rgba(220, 235, 255, ${d.opacity})`;
      this.ctx.lineWidth = 1.1;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      d.y += d.speed;
      d.x += d.wind;

      // When hitting bottom or randomly near ground, create subtle ripple
      if (d.y > this.height) {
        if (Math.random() < 0.2) {
          this.splashes.push({
            x: d.x,
            y: this.height - Math.random() * 40,
            radius: 1,
            maxRadius: 6 + Math.random() * 8,
            opacity: 0.4
          });
        }
        d.y = -d.length;
        d.x = Math.random() * this.width;
      }
    }

    // Draw splashes / ripples
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      this.ctx.beginPath();
      this.ctx.ellipse(s.x, s.y, s.radius * 2, s.radius * 0.7, 0, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 230, 190, ${s.opacity})`;
      this.ctx.lineWidth = 0.8;
      this.ctx.stroke();

      s.radius += 0.5;
      s.opacity -= 0.025;
      if (s.opacity <= 0) {
        this.splashes.splice(i, 1);
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.RainCanvasEffect = RainCanvasEffect;
