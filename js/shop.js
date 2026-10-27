import { GUNS, SHOP } from './guns.js?v=3';
import { GunViewer, loadModel } from './viewer.js?v=4';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const money = (n) => new Intl.NumberFormat('ru-RU').format(n) + '\u00a0' + SHOP.currency;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sale = GUNS.filter((g) => g.model);

/* грузим все модели сразу, пока показывается загрузочный экран (кэш общий с просмотрщиком) */
Promise.all(sale.map((g) => loadModel(g.model).catch((err) => console.error(err))))
    .then(() => { if (window.__modelsDone) { window.__modelsDone(); } });


function whenNear(el, fn, margin) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { io.disconnect(); fn(); }
    }, { rootMargin: (margin || 500) + 'px' });
    io.observe(el);
}

/* разделы коллекции */
function buildSection(g) {
    const sec = document.createElement('section');
    sec.className = 'gun';
    sec.id = 'gun-' + g.id;
    if (g.accent) { sec.dataset.accent = g.accent; }
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

/* ряд пушек внизу */
const cards = new Map();
function buildCard(g) {
    const ready = !!g.model;
    const el = document.createElement('article');
    el.className = 'card' + (ready ? '' : ' is-soon');
    el.dataset.gun = g.id;
    if (g.accent) { el.dataset.accent = g.accent; }
    el.innerHTML =
        '<div class="card-stage">' +
            (ready ? '' : '<span class="card-soon">скоро</span>') +
            '<i class="card-shot" aria-hidden="true"></i>' +
        '</div>' +
        '<div class="card-body">' +
            '<h3 class="card-name">' + esc(ready ? g.name : (g.heading || g.name)) + '</h3>' +
            '<p class="card-meta">' + (ready ? esc(g.tagline || g.short) : 'Ещё в мастерской') + '</p>' +
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
    }, 2500);  /* карточки внизу готовим заранее, чтобы к моменту прокрутки они уже были */

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

/* окно покупки */
const dlg = $('#buy');
const form = $('#buy-form');
const choices = $('#buy-choices');
const phone = $('#buy-phone');
const MAX_QTY = 10;
const clampQty = (v) => Math.max(0, Math.min(MAX_QTY, parseInt(v, 10) || 0));
/* сколько штук каждой пушки в заказе: { pushka1: 5, pushka2: 1, pushka3: 0 } */
const counts = {};
sale.forEach((g) => { counts[g.id] = 0; });
let current = sale.length ? sale[0].id : null;   /* последняя тронутая пушка: по ней красится окно */

const totalQty = () => sale.reduce((n, g) => n + counts[g.id], 0);
const totalSum = () => sale.reduce((n, g) => n + counts[g.id] * g.price, 0);

function renderChoices() {
    choices.innerHTML = sale.map((g) =>
        '<div class="choice" data-gun="' + g.id + '" data-accent="' + (g.accent || 'green') + '">' +
            '<span class="choice-info"><span class="choice-name">' + esc(g.name) + '</span>' +
            '<span class="choice-price">' + money(g.price) + '</span></span>' +
            '<div class="qty-box" role="group" aria-label="Количество: ' + esc(g.name) + '">' +
                '<button type="button" data-step="-1" aria-label="Меньше: ' + esc(g.name) + '">−</button>' +
                '<input type="number" min="0" max="' + MAX_QTY + '" value="' + counts[g.id] + '" inputmode="numeric" data-gun="' + g.id + '" aria-label="Сколько штук: ' + esc(g.name) + '">' +
                '<button type="button" data-step="1" aria-label="Больше: ' + esc(g.name) + '">+</button>' +
            '</div>' +
        '</div>'
    ).join('');
}
/* обновляет подсветку строк, итог и цвет окна (поля ввода не трогает, пока в них печатают) */
function recalc() {
    const g = sale.find((x) => x.id === current);
    $$('.choice', choices).forEach((row) => {
        const n = counts[row.dataset.gun];
        row.classList.toggle('is-on', n > 0);
        const inp = $('input', row);
        if (document.activeElement !== inp) { inp.value = n; }
    });
    const n = totalQty();
    $('#buy-total').textContent = n ? money(totalSum()) : '—';
    $('#buy-total-label').textContent = n ? 'Итого, ' + n + '\u00a0шт.' : 'Итого';
    dlg.dataset.accent = (g && g.accent) || '';   /* окно заказа красится в цвет последней выбранной пушки */
    if (dlg.open) { cards.forEach((c, k) => c.classList.toggle('is-picked', counts[k] > 0)); }
    saveDraft();
}


const DRAFT_KEY = 'secdecon_order_draft';
const DRAFT_TTL = 6 * 60 * 60 * 1000;
const field = (n) => form.elements[n];

function saveDraft() {
    if (form.hidden) { return; }
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            t: Date.now(),
            open: dlg.open,
            counts: counts,
            cur: current,
            name: field('name').value,
            phone: phone.value,
            address: field('address').value,
            comment: field('comment').value
        }));
    } catch (e) { }
}
function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}
function restoreDraft() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { d = null; }
    if (!d || !d.t || Date.now() - d.t > DRAFT_TTL) { clearDraft(); return; }
    if (d.counts && typeof d.counts === 'object') {
        sale.forEach((g) => { counts[g.id] = clampQty(d.counts[g.id]); });
    } else if (sale.some((g) => g.id === d.gun)) {      /* старый черновик: одна пушка и общее количество */
        counts[d.gun] = clampQty(d.qty) || 1;
    } else { return; }
    const cur = d.cur || d.gun;
    if (sale.some((g) => g.id === cur)) { current = cur; }
    field('name').value = d.name || '';
    field('address').value = d.address || '';
    field('comment').value = d.comment || '';
    phone.value = phoneFormat(phoneDigits(d.phone));
    phone.dataset.prev = phone.value;
    renderChoices();
    recalc();
    if (d.open) { showBuy(); }
}
function showBuy() {
    renderChoices();
    recalc();
    $('#buy-done').hidden = true;
    form.hidden = false;
    $('#buy-error').hidden = true;
    dlg.showModal();
    recalc();
    saveDraft();
}
/* кнопка «Купить» у пушки: добавляет её в заказ, если там её ещё нет */
function openBuy(id) {
    if (!sale.some((g) => g.id === id)) { return; }
    current = id;
    if (counts[id] === 0) { counts[id] = 1; }
    showBuy();
}
function setCount(id, n) {
    counts[id] = clampQty(n);
    current = id;
    $('#buy-error').hidden = true;
    recalc();
}
choices.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-step]');
    if (!btn) { return; }
    const id = btn.closest('.choice').dataset.gun;
    setCount(id, counts[id] + parseInt(btn.dataset.step, 10));
});
choices.addEventListener('input', (e) => {
    if (e.target.dataset && e.target.dataset.gun) { setCount(e.target.dataset.gun, e.target.value); }
});
choices.addEventListener('change', (e) => {      /* когда поле потеряло фокус, показываем исправленное число */
    if (e.target.dataset && e.target.dataset.gun) { e.target.value = counts[e.target.dataset.gun]; }
});
$('#buy-close').addEventListener('click', () => dlg.close());
$('#buy-done-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => { if (e.target === dlg) { dlg.close(); } });
dlg.addEventListener('close', () => { cards.forEach((c) => c.classList.remove('is-picked')); saveDraft(); });
form.addEventListener('input', saveDraft);
form.addEventListener('change', saveDraft);
window.addEventListener('pagehide', saveDraft);


/* телефон: маска и проверка  */

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
    const err = $('#buy-error');
    if (!totalQty()) {
        err.textContent = 'Выбери хотя бы одну пушку: укажи, сколько штук нужно.';
        err.hidden = false;
        return;
    }
    const fd = new FormData(form);
    const items = sale.filter((g) => counts[g.id] > 0).map((g) => ({
        gun: g.id, gunName: g.name, quantity: counts[g.id], price: g.price, sum: g.price * counts[g.id]
    }));
    const summary = items.map((i) => i.quantity + ' × ' + i.gunName).join(', ');
    const order = {
        items: items,
        quantity: totalQty(),
        total: totalSum(),
        name: String(fd.get('name') || '').trim(),
        phone: '+7' + phoneDigits(phone.value),
        address: String(fd.get('address') || '').trim(),
        comment: String(fd.get('comment') || '').trim(),
        createdAt: new Date().toISOString()
    };
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
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
            ? 'Заказ отправлен: ' + summary + '. Мы позвоним на ' + phoneFormat(phoneDigits(order.phone)) + ', как только он будет принят.'
            : 'Форма работает в демо-режиме: заказ (' + summary + ') никуда не отправлен, потому что адрес приёма заказов ещё не указан.';
        form.hidden = true;
        $('#buy-done').hidden = false;
        clearDraft();
        form.reset();
        phone.dataset.prev = '';
        sale.forEach((g) => { counts[g.id] = 0; });
        recalc();
    } catch (ex) {
        console.error(ex);
        err.textContent = 'Не получилось отправить заказ. Проверь соединение и попробуй ещё раз.';
        err.hidden = false;
    } finally {
        btn.disabled = false;
    }
});

/* запуск */
const collection = $('#collection');
sale.forEach((g) => collection.appendChild(buildSection(g)));
const row = $('#gallery-row');
GUNS.forEach((g) => row.appendChild(buildCard(g)));
restoreDraft();
