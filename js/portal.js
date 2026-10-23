(function () {
    'use strict';

    var TAU = Math.PI * 2;

    function rng(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function n1(v) { return Math.round(v * 10) / 10; }

    function arm(o) {
        var steps = o.steps || 150, out = [], inn = [], i;
        for (i = 0; i <= steps; i++) {
            var k = i / steps;
            var u = o.u0 + (o.u1 - o.u0) * k;
            var th = o.phase + u * o.turns * TAU;
            var r = o.rIn + (o.rOut - o.rIn) * Math.pow(u, o.curve || 1.1);
            var env = Math.pow(Math.sin(Math.PI * k), 0.55);
            var m = 0.5 + 0.5 * Math.sin(u * o.wave * TAU + o.wavePhase);
            var w = Math.max(0.6, (o.wMin + (o.wMax - o.wMin) * m) * env);
            var c = Math.cos(th), s = Math.sin(th);
            out.push(n1((r + w / 2) * c) + ' ' + n1((r + w / 2) * s));
            inn.push(n1(Math.max(0, r - w / 2) * c) + ' ' + n1(Math.max(0, r - w / 2) * s));
        }
        return '<path d="M' + out.join(' L') + ' L' + inn.reverse().join(' L') + ' Z" fill="' + o.fill + '"/>';
    }

    function ovalStroke(cx, cy, rx, ry, a0, len, color, width, opacity) {
        var pts = [], n = 28, i;
        for (i = 0; i <= n; i++) {
            var a = a0 + len * i / n;
            pts.push(n1(cx + rx * Math.cos(a)) + ' ' + n1(cy + ry * Math.sin(a)));
        }
        return '<path d="M' + pts.join(' L') + '" fill="none" stroke="' + color + '" stroke-width="' + width +
            '" stroke-linecap="round" opacity="' + opacity + '"/>';
    }

    function boilFilter(id, freq, seed, scale, phase) {
        var vals = [], i;
        for (i = 0; i < 12; i++) {
            vals.push((freq * (1 + 0.014 * Math.sin(i / 12 * TAU + phase))).toFixed(5));
        }
        return '<filter id="' + id + '" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
            '<feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="3" seed="' + seed + '" result="n">' +
            '<animate attributeName="baseFrequency" values="' + vals.join(';') + '" dur="3s" calcMode="discrete" repeatCount="indefinite"/>' +
            '</feTurbulence>' +
            '<feDisplacementMap in="SourceGraphic" in2="n" scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>' +
            '</filter>';
    }

    function staticWobble(id, freq, seed, scale) {
        return '<filter id="' + id + '" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
            '<feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="2" seed="' + seed + '" result="n"/>' +
            '<feDisplacementMap in="SourceGraphic" in2="n" scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>' +
            '</filter>';
    }

    function ellipse(cx, cy, rx, ry, fill) {
        return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"/>';
    }

    function ring(cx, cy, rx, ry, fill) {
        return '<path fill-rule="evenodd" fill="' + fill + '" d="' + ovalPath(cx, cy, rx, ry) + ovalPath(250, 350, 112, 190) + '"/>';
    }

    function ovalPath(cx, cy, rx, ry) {
        return 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0z';
    }

    function swirlMain() {
        var a = [], i, ph;
        a.push('<defs>' + staticWobble('pt-w1', 0.05, 7, 11) +
            '<radialGradient id="pt-dark"><stop offset="0" stop-color="#3c9a30"/><stop offset="1" stop-color="#2b7527"/></radialGradient></defs>');
        a.push('<g filter="url(#pt-w1)"><circle r="106" fill="url(#pt-dark)"/>');
        for (i = 0; i < 3; i++) {
            ph = i * TAU / 3;
            a.push(arm({ u0: 0, u1: 1, phase: ph, turns: 1.7, rIn: 3, rOut: 112, wMax: 19, wMin: 6, wave: 2.2, wavePhase: i * 2, fill: '#6fe23a' }));
            a.push(arm({ u0: 0.12, u1: 0.98, phase: ph + 0.34, turns: 1.7, rIn: 3, rOut: 112, wMax: 9, wMin: 2.5, wave: 3.1, wavePhase: i * 1.3, fill: '#4fb82f' }));
        }
        a.push(arm({ u0: 0, u1: 0.5, phase: 1, turns: 1.2, rIn: 1, rOut: 22, wMax: 6, wMin: 2.4, wave: 1.5, wavePhase: 0, fill: '#9cf046' }));
        a.push('</g>');
        return '<svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">' + a.join('') + '</svg>';
    }

    function swirlLight() {
        var a = [], i, ph;
        a.push('<defs>' + staticWobble('pt-w2', 0.06, 21, 9) + '</defs><g filter="url(#pt-w2)">');
        for (i = 0; i < 3; i++) {
            ph = i * TAU / 3 + 0.17;
            a.push(arm({ u0: 0.08, u1: 0.95, phase: ph, turns: 1.7, rIn: 3, rOut: 112, wMax: 5.5, wMin: 1.4, wave: 2.7, wavePhase: i * 1.7, fill: '#d2ff6e' }));
        }
        a.push('</g>');
        return '<svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">' + a.join('') + '</svg>';
    }

    function rim() {
        var CX = 250, CY = 350, r = rng(11), a = [], i;
        a.push('<defs>' +
            boilFilter('pt-b1', 0.034, 3, 18, 0) +
            boilFilter('pt-b2', 0.040, 8, 15, 1.3) +
            boilFilter('pt-b3', 0.046, 5, 12, 2.6) +
            boilFilter('pt-b4', 0.050, 9, 9, 4) +
            '<radialGradient id="pt-g1"><stop offset="0" stop-color="#6cf23a"/><stop offset="1" stop-color="#3fd92a"/></radialGradient>' +
            '</defs>');

        a.push('<g filter="url(#pt-b1)">' + ring(CX + 2, CY + 1, 166, 251, 'url(#pt-g1)') + '</g>');
        a.push('<g filter="url(#pt-b2)">' + ring(CX - 4, CY + 5, 151, 236, '#a2f63d') + '</g>');
        a.push('<g filter="url(#pt-b3)">' + ring(CX + 5, CY - 4, 137, 219, '#58d832') + '</g>');

        a.push('<g filter="url(#pt-b3)">');
        for (i = 0; i < 11; i++) {
            var f = 0.8 + r() * 0.13;
            var light = r() > 0.4;
            a.push(ovalStroke(CX, CY, 150 * f, 235 * f, r() * TAU, 0.5 + r() * 0.9,
                light ? '#caff5e' : '#3fbd2d', 4 + r() * 8, (0.55 + r() * 0.35).toFixed(2)));
        }
        a.push('</g>');

        a.push('<g filter="url(#pt-b4)"><path fill-rule="evenodd" fill="#3fb82e" d="' +
            ovalPath(CX, CY, 124, 205) + ovalPath(CX, CY, 104, 182) + '"/></g>');

        return '<svg viewBox="0 0 500 700" aria-hidden="true" focusable="false">' + a.join('') + '</svg>';
    }

    function sparkles() {
        var CX = 250, CY = 350, r = rng(42), a = [], i, N = 38;
        for (i = 0; i < N; i++) {
            var outer = i < N * 0.62;
            var f = outer ? 0.78 + r() * 0.28 : 0.3 + r() * 0.48;
            var ang = r() * TAU;
            var x = CX + 166 * f * Math.cos(ang);
            var y = CY + 251 * f * Math.sin(ang);
            var s = (outer ? 1.8 + Math.pow(r(), 2) * 9 : 1.4 + Math.pow(r(), 2) * 6.5);
            var ry = s * (0.55 + r() * 0.6);
            a.push('<g transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + Math.round(r() * 180) + ')">' +
                '<ellipse class="sparkle" style="--d:-' + (r() * 4).toFixed(2) + 's;--t:' + (2.6 + r() * 2.4).toFixed(2) + 's" rx="' +
                n1(s) + '" ry="' + n1(ry) + '" fill="#f6fff0"/></g>');
        }
        return '<svg viewBox="0 0 500 700" aria-hidden="true" focusable="false">' + a.join('') + '</svg>';
    }

    /* Спираль заранее отрендерена в картинки (assets/portal/*.webp):
       живой SVG-фильтр на вращающемся слое в Firefox и мобильном Chrome рисуется кусками.
       Исходные функции swirlMain() / swirlLight() оставлены, чтобы перерисовать картинки при необходимости. */
    function swirlImg(name) {
        return '<img alt="" width="768" height="768" draggable="false" decoding="async" src="assets/portal/swirl-' + name + '.webp">';
    }

    function build() {
        return '<div class="portal-aura"></div>' +
            '<div class="portal-body">' +
            '<div class="portal-swirl-oval">' +
            '<div class="portal-swirl-spin spin-a">' + swirlImg('main') + '</div>' +
            '<div class="portal-swirl-spin spin-b">' + swirlImg('light') + '</div>' +
            '</div>' +
            '<div class="portal-layer portal-rim">' + rim() + '</div>' +
            '<div class="portal-layer portal-sparkles">' + sparkles() + '</div>' +
            '</div>';
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { build: build, rim: rim, swirlMain: swirlMain, swirlLight: swirlLight, sparkles: sparkles };
        return;
    }

    var stage = document.getElementById('portal');
    if (!stage) { return; }
    stage.innerHTML = build();
})();
