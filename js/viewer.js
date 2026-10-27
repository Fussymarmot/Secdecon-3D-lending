import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches;
const CARD_SIZE = 3.43;  /* размер модели в карточке */

/* загрузка моделей */
const loader = new GLTFLoader();
const cache = new Map();
export function loadModel(url) {
    if (!cache.has(url)) { cache.set(url, loader.loadAsync(url).then(function (g) { return g.scene; })); }
    return cache.get(url);
}

/* рисуем только то, что видно на экране */
const viewers = new Set();
let raf = 0, lastTime = 0;
function loop(now) {
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    viewers.forEach(function (v) { if (v.visible && v.ready) { v.frame(dt); } });
}
function startLoop() {
    if (!raf) { lastTime = performance.now(); raf = requestAnimationFrame(loop); }
}
document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (viewers.size) { startLoop(); }
});

function lerpAngle(a, b, t) {
    var d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    return a + d * t;
}
function smooth(t) { return t * t * (3 - 2 * t); }

/* mode: 'view'  — большой просмотрщик в разделе 
         'card'  — карточка внизу */
export class GunViewer {
    constructor(host, gun, opts) {
        this.host = host;
        this.gun = gun;
        this.mode = (opts && opts.mode) || 'view';
        this.visible = false;
        this.ready = false;
        this.t = 0;              /* 0 — собрана, 1 — разобрана */
        this.target = 0;
        this.hlId = null;
        this.spin = Math.PI * 0.85;
        this.hover = 0;
        this.hoverTarget = 0;
        this.aimX = 0;
        this.aimY = 0;
        this.onInteract = null;

        try {
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        } catch (e) {
            this.failed = true;
            return;
        }
        var r = this.renderer;
        r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mode === 'card' ? 1.5 : 2));
        r.outputColorSpace = THREE.SRGBColorSpace;
        r.toneMapping = THREE.ACESFilmicToneMapping;
        r.toneMappingExposure = 1.1;
        r.domElement.className = 'gl';
        host.appendChild(r.domElement);

        this.scene = new THREE.Scene();
        var pm = new THREE.PMREMGenerator(r);
        this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environmentIntensity = 0.85;
        pm.dispose();

        this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

        var L = this.light = gun.light || {};   /* цвета подсветки */
        var key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 5, 4);
        var rim = new THREE.DirectionalLight(L.rim != null ? L.rim : 0x7dffb0, 1.4);
        rim.position.set(-4, 2, -3);
        this.scene.add(key, rim);

        this.pivot = new THREE.Group();
        this.scene.add(this.pivot);

        this.size();
        new ResizeObserver(this.size.bind(this)).observe(host);
        new IntersectionObserver(function (es) {
            this.visible = es[0].isIntersecting;
            if (this.visible) { startLoop(); }
        }.bind(this), { rootMargin: '120px' }).observe(host);
    }

    async init() {
        if (this.failed) { throw new Error('webgl'); }
        var src = await loadModel(this.gun.model);
        var model = src.clone(true);
        model.traverse(function (o) {
            if (!o.isMesh) { return; }
            o.material = o.material.clone();
            if (o.material.transparent) { o.material.depthWrite = false; o.renderOrder = 2; }
        });
        this.pivot.add(model);
        this.model = model;

        this.parts = [];
        var box = new THREE.Box3(), c = new THREE.Vector3();
        model.updateMatrixWorld(true);
        model.children.forEach(function (n) {
            var d = n.userData && n.userData.explode;
            var dir = new THREE.Vector3();
            if (d) { dir.fromArray(d); }
            else {
                box.setFromObject(n).getCenter(c);
                dir.copy(c).multiplyScalar(0.9);
            }
            this.parts.push({ node: n, home: n.position.clone(), dir: dir });
        }, this);

        var sA = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
        this.rA = sA.radius; this.cA = sA.center.clone();
        this.applyExplode(1);
        model.updateMatrixWorld(true);
        var sE = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
        this.rE = sE.radius; this.cE = sE.center.clone();
        this.applyExplode(0);

        var flask = model.getObjectByName(this.light.glowNode || 'flask');
        if (flask) {
            var fc = new THREE.Box3().setFromObject(flask).getCenter(new THREE.Vector3());
            var glow = new THREE.PointLight(this.light.glow != null ? this.light.glow : 0x6dff3a, 3, 7, 2);
            glow.position.copy(fc);
            flask.add(glow);
        }

        /* приводятся к одному размеру (см. spinSize) */
        this.rCard = this.rA;
        if (this.mode === 'card') {
            var k = CARD_SIZE / this.spinSize(model);
            this.pivot.scale.setScalar(k);
            this.rCard = this.rA * Math.max(1, k);
        }
        if (this.mode === 'view') { this.setupView(); }
        else { this.camera.position.set(0, this.dist(this.rCard) * 0.22, this.dist(this.rCard)); this.camera.lookAt(0, 0, 0); }

        this.t = this.target;
        this.applyExplode(smooth(this.t));
        this.ready = true;
        this.size();
        this.renderer.render(this.scene, this.camera);   /* прогрев: шейдеры и текстуры готовы до первого показа */
        startLoop();
        viewers.add(this);
    }

    setupView() {
        var v = this.gun.view || {}, az = (v.azimuth == null ? 38 : v.azimuth) * Math.PI / 180, el = (v.elevation == null ? 22 : v.elevation) * Math.PI / 180;
        var dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
        this.camera.position.copy(dir.multiplyScalar(this.dist(this.rA)));
        var ctl = this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        ctl.enableZoom = false;       /* колесо не перехватываем*/
        ctl.enablePan = false;
        ctl.enableDamping = true;
        ctl.dampingFactor = 0.08;
        ctl.rotateSpeed = 0.9;
        ctl.minPolarAngle = Math.PI * 0.12;
        ctl.maxPolarAngle = Math.PI * 0.88;
        ctl.autoRotate = !REDUCE;
        ctl.autoRotateSpeed = 1.1;
        ctl.target.copy(this.cA);
        this.renderer.domElement.style.touchAction = COARSE ? 'pan-y' : 'none';
        var timer = 0, self = this;
        ctl.addEventListener('start', function () {
            ctl.autoRotate = false; clearTimeout(timer);
            if (self.onInteract) { self.onInteract(); }
        });
        ctl.addEventListener('end', function () {
            clearTimeout(timer);
            if (!REDUCE) { timer = setTimeout(function () { ctl.autoRotate = true; }, 3500); }
        });
    }

    dist(r) {
        var vf = this.camera.fov * Math.PI / 180;
        var hf = 2 * Math.atan(Math.tan(vf / 2) * this.camera.aspect);
        return r * 1.12 / Math.sin(Math.min(vf, hf) / 2);
    }

    size() {
        if (!this.renderer) { return; }
        var w = this.host.clientWidth, h = this.host.clientHeight;
        if (!w || !h) { return; }
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        if (this.ready && this.mode === 'card') {
            this.camera.position.set(0, this.dist(this.rCard) * 0.22, this.dist(this.rCard));
            this.camera.lookAt(0, 0, 0);
        }
    }

    spinSize(model) {
        var pts = [], v = new THREE.Vector3();
        model.updateMatrixWorld(true);
        model.traverse(function (o) {
            if (!o.isMesh) { return; }
            var a = o.geometry.attributes.position, step = Math.max(1, Math.floor(a.count / 600));
            for (var i = 0; i < a.count; i += step) { pts.push(v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld).clone()); }
        });
        var minY = Infinity, maxY = -Infinity;
        pts.forEach(function (p) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
        var h = maxY - minY, sum = 0, N = 24;
        for (var n = 0; n < N; n++) {
            var a = n / N * Math.PI, c = Math.cos(a), s = Math.sin(a), lo = Infinity, hi = -Infinity;
            pts.forEach(function (p) { var x = p.x * c + p.z * s; lo = Math.min(lo, x); hi = Math.max(hi, x); });
            sum += (hi - lo) * h;
        }
        var r = Math.sqrt(sum / N);
        if (window.__spin) { window.__spin[this.gun.id] = r; }
        return r;
    }

    applyExplode(e) {
        var k = (this.gun.explode == null ? 1 : this.gun.explode) * e;
        this.parts.forEach(function (p) { p.node.position.copy(p.home).addScaledVector(p.dir, k); });
    }

    setExploded(on) {
        this.target = on ? 1 : 0;
        if (REDUCE && this.ready) { this.t = this.target; }
    }

    /* подсветить деталь по id из guns.js*/
    setHighlight(id) {
        if (this.hlId === id || !this.model) { return; }
        this.hlId = id;
        var def = id && this.gun.parts.find(function (p) { return p.id === id; });
        var names = def ? def.nodes : [];
        this.model.traverse(function (o) {
            if (!o.isMesh) { return; }
            var m = o.material;
            if (!m.userData.base) { m.userData.base = { e: m.emissive.clone(), i: m.emissiveIntensity }; }
            var up = o, on = false;
            while (up && up !== this.model) { if (names.indexOf(up.name) !== -1) { on = true; break; } up = up.parent; }
            var b = m.userData.base, lit = b.e.r + b.e.g + b.e.b > 0.01;
            if (on) {
                if (lit) { m.emissiveIntensity = b.i * 1.8; }
                else { m.emissive.set(this.light.highlight != null ? this.light.highlight : 0x3dff5a); m.emissiveIntensity = 0.3; }
            } else { m.emissive.copy(b.e); m.emissiveIntensity = b.i; }
        }.bind(this));
    }

    aim(x, y) { this.hoverTarget = 1; this.aimX = x; this.aimY = y; }
    relax() { this.hoverTarget = 0; }

    frame(dt) {
        var k = 1 - Math.exp(-dt * 5.5);
        this.t += (this.target - this.t) * k;
        if (Math.abs(this.target - this.t) < 0.0008) { this.t = this.target; }
        var e = smooth(this.t);
        this.applyExplode(e);

        if (this.mode === 'view') {
            var ctl = this.controls;
            ctl.target.lerpVectors(this.cA, this.cE, e);
            var off = this.camera.position.clone().sub(ctl.target);
            off.setLength(this.dist(this.rA + (this.rE - this.rA) * e));
            this.camera.position.copy(ctl.target).add(off);
            ctl.update(dt);
        } else {
            this.hover += (this.hoverTarget - this.hover) * (1 - Math.exp(-dt * 6));
            if (this.hover < 0.02 && !REDUCE) { this.spin += dt * 0.55; }
            var facing = Math.PI + this.aimX * 0.55;     /* перед пушки разворачивается к зрителю */
            this.pivot.rotation.y = lerpAngle(this.spin, facing, smooth(this.hover));
            this.pivot.rotation.x = this.aimY * 0.22 * this.hover;
            if (this.hover < 0.02) { this.spin = this.pivot.rotation.y; }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
