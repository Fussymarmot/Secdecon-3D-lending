import { GUNS, SHOP } from './guns.js';
import { GunViewer } from './viewer.js';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const money = (n) => new Intl.NumberFormat('ru-RU').format(n) + '\u00a0' + SHOP.currency;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sale = GUNS.filter((g) => g.model);

/* ленивая инициализация: тяжёлое (WebGL, загрузка модели) стартует, когда блок почти на экране */
function whenNear(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { io.disconnect(); fn(); }
    }, { rootMargin: '500px' });
    io.observe(el);
}

/* ---------- разделы коллекции ---------- */
function buildSection(g) {
    const sec = document.createElement('section');
    sec.className = 'gun';
    sec.id = 'gun-' + g.id;
    sec.innerHTML =
        '<div class="gun-copy">' +
            '<h2><em>' + esc(g.heading) + '</em><br><span class="h2-tilt">' + esc(g.short) +
            '<span class="sticker" aria-hidden="true">' + esc(g.sticker) + '</span></span></h2>' +
            '<p class="gun-lead">' + esc(g.lead) + '</p>' +
            '<div class="gun-actions">' +
                '<button type="button" class="btn" data-act="explode" aria-pressed="false"><span>Разобрать</span><b aria-hidden="true">⤧</b></button>' +
                '<button type="button" class="btn btn--fill" data-act="buy"><span>Купить — ' + money(g.price) + '</span></button>' +
            '</div>' +
            '<ul class="gun-facts">' + g.facts.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
            '<ul class="gun-parts" aria-label="Детали пушки">' + g.parts.map((p) =>
                '<li><button type="button" class="part" data-part="' + p.id + '"><b>' + esc(p.title) + '</b><span>' + esc(p.text) + '</span></button></li>'
            ).join('') + '</ul>' +
        '</div>' +
        '<div class="gun-stage" role="group" aria-label="3D-модель: ' + esc(g.name) + '">' +
            '<p class="gun-hint">Тяни мышью или пальцем — пушка вращается</p>' +
        '</div>';

    const stage = $('.gun-stage', sec);
    const explodeBtn = $('[data-act=explode]', sec);
    let viewer = null, wantOpen = false;

    explodeBtn.addEventListener('click', () => {
        wantOpen = !wantOpen;
        sec.classList.toggle('is-open', wantOpen);
        explodeBtn.setAttribute('aria-pressed', String(wantOpen));
        explodeBtn.firstElementChild.textContent = wantOpen ? 'Собрать' : 'Разобрать';
        if (viewer) { viewer.setExploded(wantOpen); }
        if (!wantOpen && viewer) { viewer.setHighlight(null); }
    });
    $('[data-act=buy]', sec).addEventListener('click', () => openBuy(g.id));
    $$('.part', sec).forEach((b) => {
        const on = () => viewer && viewer.setHighlight(b.dataset.part);
        const off = () => viewer && viewer.setHighlight(null);
        b.addEventListener('pointerenter', on); b.addEventListener('focus', on);
        b.addEventListener('pointerleave', off); b.addEventListener('blur', off);
    });

    whenNear(sec, () => {
        stage.classList.add('is-loading');
        viewer = new GunViewer(stage, g, { mode: 'view' });
        viewer.onInteract = () => stage.classList.add('is-touched');
        viewer.setExploded(wantOpen);
        viewer.init().then(() => stage.classList.remove('is-loading')).catch((err) => {
            console.error(err);
            stage.classList.remove('is-loading');
            stage.dataset.state = viewer.failed ? 'nogl' : 'error';
        });
    });
    return sec;
}

/* ---------- ряд пушек внизу ---------- */
const cards = new Map();
function buildCard(g) {
    const ready = !!g.model;
    const el = document.createElement('article');
    el.className = 'card' + (ready ? '' : ' is-soon');
    el.dataset.gun = g.id;
    el.innerHTML =
        '<div class="card-stage">' +
            (ready ? '' : '<span class="card-soon">скоро</span>') +
            '<i class="card-shot" aria-hidden="true"></i>' +
        '</div>' +
        '<div class="card-body">' +
            '<h3 class="card-name">' + esc(g.heading || g.name) + '</h3>' +
            '<p class="card-meta">' + (ready ? esc(g.short) : 'Ещё в мастерской') + '</p>' +
            (ready
                ? '<p class="card-price">' + money(g.price) + '</p><button type="button" class="btn btn--fill btn--small"><span>Купить</span></button>'
                : '<p class="card-price card-price--off">—</p>') +
        '</div>';
    if (!ready) { return el; }

    const stage = $('.card-stage', el);
    let viewer = null;
    whenNear(el, () => {
        stage.classList.add('is-loading');
        viewer = new GunViewer(stage, g, { mode: 'card' });
        viewer.init().then(() => stage.classList.remove('is-loading')).catch(() => {
            stage.classList.remove('is-loading');
            stage.dataset.state = 'error';
        });
    });

    const shot = $('.card-shot', el);
    el.addEventListener('pointerenter', () => {
        shot.classList.remove('is-firing'); void shot.offsetWidth; shot.classList.add('is-firing');
    });
    el.addEventListener('pointermove', (e) => {
        if (!viewer) { return; }
        const r = stage.getBoundingClientRect();
        viewer.aim(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
                   Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)));
    });
    el.addEventListener('pointerleave', () => viewer && viewer.relax());
    el.addEventListener('click', () => openBuy(g.id));
    cards.set(g.id, el);
    return el;
}

/* ---------- окно покупки ---------- */
const dlg = $('#buy');
const form = $('#buy-form');
const choices = $('#buy-choices');
const qty = $('#buy-qty');
const phone = $('#buy-phone');
let current = sale.length ? sale[0].id : null;

function renderChoices() {
    choices.innerHTML = sale.map((g) =>
        '<label class="choice"><input type="radio" name="gun" value="' + g.id + '"' + (g.id === current ? ' checked' : '') + '>' +
        '<span class="choice-name">' + esc(g.name) + '</span><span class="choice-price">' + money(g.price) + '</span></label>'
    ).join('');
}
function recalc() {
    const g = sale.find((x) => x.id === current);
    const n = Math.max(1, Math.min(10, parseInt(qty.value, 10) || 1));
    $('#buy-total').textContent = g ? money(g.price * n) : '—';
    saveDraft();
}

/* ---------- черновик заказа: переживает переход на другие страницы и перезагрузку ---------- */
const DRAFT_KEY = 'secdecon_order_draft';
const DRAFT_TTL = 6 * 60 * 60 * 1000; /* 6 часов */
const field = (n) => form.elements[n];

function saveDraft() {
    if (form.hidden) { return; } /* показан экран «заказ отправлен» — сохранять нечего */
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            t: Date.now(),
            open: dlg.open,
            gun: current,
            qty: qty.value,
            name: field('name').value,
            phone: phone.value,
            address: field('address').value,
            comment: field('comment').value
        }));
    } catch (e) { /* хранилище недоступно — не страшно */ }
}
function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ничего */ }
}
function restoreDraft() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { d = null; }
    if (!d || !d.t || Date.now() - d.t > DRAFT_TTL) { clearDraft(); return; }
    if (!sale.some((g) => g.id === d.gun)) { return; }
    current = d.gun;
    qty.value = Math.max(1, Math.min(10, parseInt(d.qty, 10) || 1));
    field('name').value = d.name || '';
    field('address').value = d.address || '';
    field('comment').value = d.comment || '';
    phone.value = phoneFormat(phoneDigits(d.phone));
    phone.dataset.prev = phone.value;
    renderChoices();
    recalc();
    if (d.open) { openBuy(current); }
}
function openBuy(id) {
    if (!sale.some((g) => g.id === id)) { return; }
    current = id;
    renderChoices();
    recalc();
    $('#buy-done').hidden = true;
    form.hidden = false;
    cards.forEach((c, k) => c.classList.toggle('is-picked', k === id));
    dlg.showModal();
    saveDraft();
}
choices.addEventListener('change', (e) => {
    if (e.target.name === 'gun') {
        current = e.target.value;
        recalc();
        cards.forEach((c, k) => c.classList.toggle('is-picked', k === current));
    }
});
$('#qty-minus').addEventListener('click', () => { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); recalc(); });
$('#qty-plus').addEventListener('click', () => { qty.value = Math.min(10, (parseInt(qty.value, 10) || 1) + 1); recalc(); });
qty.addEventListener('input', recalc);
$('#buy-close').addEventListener('click', () => dlg.close());
$('#buy-done-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => { if (e.target === dlg) { dlg.close(); } });
dlg.addEventListener('close', () => { cards.forEach((c) => c.classList.remove('is-picked')); saveDraft(); });
form.addEventListener('input', saveDraft);
form.addEventListener('change', saveDraft);
window.addEventListener('pagehide', saveDraft);


/* ---------- телефон: маска и проверка ---------- */

function phoneDigits(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (/^\s*\+7/.test(raw) || (d.length >= 11 && /^[78]/.test(d)) || d === '8') { d = d.slice(1); }
    return d.slice(0, 10);
}
function phoneFormat(d) {
    if (!d) { return ''; }
    let out = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) { out += ')'; }
    if (d.length > 3) { out += ' ' + d.slice(3, 6); }
    if (d.length > 6) { out += '-' + d.slice(6, 8); }
    if (d.length > 8) { out += '-' + d.slice(8, 10); }
    return out;
}
/* возвращает текст ошибки или пустую строку, если номер подходит */
function phoneError(d) {
    if (!d) { return 'Введи номер телефона.'; }
    if (d.length < 10) { return 'В номере не хватает цифр: нужно 10 после +7.'; }
    if (!/^[3489]/.test(d)) { return 'Такого кода в российской нумерации нет. Проверь номер.'; }
    if (/^(\d)\1{9}$/.test(d)) { return 'Похоже на ненастоящий номер. Проверь, пожалуйста.'; }
    return '';
}
phone.addEventListener('input', (e) => {
    let d = phoneDigits(phone.value);
    /* Backspace по символу маски ("(", ")", пробел, "-") должен стирать цифру, а не упираться в маску */
    if (e.inputType === 'deleteContentBackward' && phone.dataset.prev && phoneFormat(d) === phone.dataset.prev) {
        d = d.slice(0, -1);
    }
    phone.value = phoneFormat(d);
    phone.dataset.prev = phone.value;
    phone.setCustomValidity('');
});
phone.addEventListener('blur', () => { phone.setCustomValidity(phoneError(phoneDigits(phone.value))); });

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    phone.setCustomValidity(phoneError(phoneDigits(phone.value)));
    if (!form.reportValidity()) { return; }
    const g = sale.find((x) => x.id === current);
    const fd = new FormData(form);
    const order = {
        gun: g.id, gunName: g.name,
        quantity: Math.max(1, Math.min(10, parseInt(qty.value, 10) || 1)),
        total: g.price * Math.max(1, Math.min(10, parseInt(qty.value, 10) || 1)),
        name: String(fd.get('name') || '').trim(),
        phone: '+7' + phoneDigits(phone.value),
        address: String(fd.get('address') || '').trim(),
        comment: String(fd.get('comment') || '').trim(),
        createdAt: new Date().toISOString()
    };
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    const err = $('#buy-error');
    err.hidden = true;
    try {
        if (SHOP.orderEndpoint) {
            const res = await fetch(SHOP.orderEndpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order)
            });
            if (!res.ok) { throw new Error('HTTP ' + res.status); }
        } else {
            console.info('Заказ (демо-режим, сервер не подключён):', order);
        }
        $('#buy-done-text').textContent = SHOP.orderEndpoint
            ? 'Заказ на «' + g.name + '» отправлен. Мы позвоним на ' + phoneFormat(phoneDigits(order.phone)) + ', как только он будет принят.'
            : 'Форма работает в демо-режиме: заказ на «' + g.name + '» никуда не отправлен, потому что адрес приёма заказов ещё не указан.';
        form.hidden = true;
        $('#buy-done').hidden = false;
        clearDraft();
        form.reset();
        phone.dataset.prev = '';
        qty.value = 1;
        recalc();
    } catch (ex) {
        console.error(ex);
        err.textContent = 'Не получилось отправить заказ. Проверь соединение и попробуй ещё раз.';
        err.hidden = false;
    } finally {
        btn.disabled = false;
    }
});

/* ---------- запуск ---------- */
const collection = $('#collection');
sale.forEach((g) => collection.appendChild(buildSection(g)));
const row = $('#gallery-row');
GUNS.forEach((g) => row.appendChild(buildCard(g)));
restoreDraft();
