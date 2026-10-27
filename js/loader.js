(function () {
    'use strict';

    var root = document.documentElement;
    if (!root.classList.contains('is-loading')) { return; }

    var MIN_SHOW = 1100;   /* мин паказ */
    var MAX_WAIT = 15000;  /*макс показ (шрифты + 3D-модели) */
    var started = Date.now();
    var finished = false;

    var phrases = [
        'Wubba lubba dub dub!',
        'Открываем портал…',
        'Калибруем пушку…',
        'Не говори Морти…',
        'Ищем нужное измерение…'
    ];
    var textEl = document.getElementById('loader-text');
    var idx = 0;
    var timer = setInterval(function () {
        idx = (idx + 1) % phrases.length;
        if (textEl) { textEl.textContent = phrases[idx]; }
    }, 1200);

    function leave() {
        if (finished) { return; }
        finished = true;
        var wait = Math.max(0, MIN_SHOW - (Date.now() - started));
        setTimeout(function () {
            clearInterval(timer);
            root.classList.add('loader-out');
            setTimeout(function () {
                root.classList.remove('is-loading', 'loader-out');
            }, 900);
        }, wait);
    }

    /* Шрифты ждём*/
    function fonts() {
        if (!document.fonts || !document.fonts.load) { return Promise.resolve(); }
        var t = 'ПОРТАЛЬНАЯ пушка Abc 001';
        return Promise.all([
            document.fonts.load('700 1em Oswald', t),
            document.fonts.load('400 1em Manrope', t),
            document.fonts.load('700 1em Manrope', t),
            document.fonts.load('400 1em "IBM Plex Mono"', t),
            document.fonts.load('500 1em "IBM Plex Mono"', t)
        ]).catch(function () {});
    }

    /* 3D-модели: shop.js вызывает window.__modelsDone(), когда все .glb загружены (или не удалось) */
    var models = new Promise(function (resolve) { window.__modelsDone = resolve; });

    var loaded = new Promise(function (resolve) {
        if (document.readyState === 'complete') { resolve(); }
        else { window.addEventListener('load', resolve); }
    });

    /* картинки портала (кадры рамки, спираль): ждём декодирования и пару кадров отрисовки */
    var portalImgs = loaded.then(function () {
        var imgs = Array.prototype.slice.call(document.querySelectorAll('#portal img'));
        return Promise.all(imgs.map(function (img) {
            return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
        })).then(function () {
            return new Promise(function (resolve) {
                requestAnimationFrame(function () { requestAnimationFrame(resolve); });
            });
        });
    });

    Promise.all([fonts(), loaded, models, portalImgs]).then(leave);
    setTimeout(leave, MAX_WAIT);
})();
