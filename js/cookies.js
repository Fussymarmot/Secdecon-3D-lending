/* Предупреждение об использовании cookie. */

(function () {
    var NAME = 'secdecon_cookie_notice';

    function seen() {
        if (document.cookie.split('; ').some(function (c) { return c.indexOf(NAME + '=') === 0; })) { return true; }
        try { return localStorage.getItem(NAME) === '1'; } catch (e) { return false; }
    }

    function remember() {
        document.cookie = NAME + '=1; max-age=31536000; path=/; SameSite=Lax';
        try { localStorage.setItem(NAME, '1'); } catch (e) { }
    }

    function show() {
        if (seen()) { return; }
        var box = document.createElement('div');
        box.className = 'cookie-notice';
        box.setAttribute('role', 'region');
        box.setAttribute('aria-label', 'Уведомление о cookie');
        box.innerHTML =
            '<p>Этот сайт использует файлы cookie. Продолжая пользоваться сайтом, вы соглашаетесь с их обработкой. ' +
            'Подробнее — в <a href="cookies.html">политике cookies</a>. ' +
            'Если вы не согласны, отключите cookie в настройках браузера или прекратите использование сайта.</p>' +
            '<button type="button">Понятно</button>';
        box.querySelector('button').addEventListener('click', function () {
            remember();
            box.remove();
        });
        document.body.appendChild(box);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', show);
    } else {
        show();
    }
})();
