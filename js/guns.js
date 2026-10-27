/* 
name — полное название
heading — первая строка заголовка раздела, short — вторая
tagline — короткая подпись под названием в карточке
accent — цвет раздела
light — цвета подсветки в 3D: rim (контровой свет), glowNode + glow (свечение изнутри,
               glowNode — имя узла в .glb), highlight (подсветка детали при наведении) */

export const SHOP = {
    /* Куда отправлять заказы (POST, JSON). Пока пусто — форма работает в демо-режиме
       и ничего никуда не отправляет. Сюда можно поставить адрес вебхука или своего бота. */
    orderEndpoint: '',
    currency: '₽'
};

export const GUNS = [
    {
        id: 'pushka1',
        name: 'Interdimensional Portal Gun',
        heading: 'Interdimensional',
        short: 'Portal Gun',
        tagline: 'Зелёная, перемещает по ЦКК',
        sticker: 'модель 01',
        price: 4990,
        model: 'models/pushka1.glb',
        lead: 'Зелёная пушка для перемещения по центральной конечной кривой. Плоский корпус, рукоять под ладонь и зелёная колба, из которой всё и начинается. Три излучателя спереди открывают проход туда, куда тебя никто не звал.',
        facts: [
            'Колба с зелёной портальной жидкостью',
            'Три излучателя с подсветкой',
            'Экран координат и кнопка запуска'
        ],
        /* nodes — имена узлов в .glb */
        parts: [
            { id: 'flask', nodes: ['flask'], title: 'Колба', text: 'Внутри та самая зелёная жидкость.' },
            { id: 'screen', nodes: ['screen'], title: 'Экран', text: 'Показывает координаты измерения.' },
            { id: 'button', nodes: ['button'], title: 'Кнопка', text: 'Одно нажатие, и портал открыт.' },
            { id: 'emitters', nodes: ['emitter_1', 'emitter_2', 'emitter_3'], title: 'Излучатели ×3', text: 'Три ствола с зелёными линзами.' },
            { id: 'body', nodes: ['body'], title: 'Корпус', text: 'Основа всей конструкции.' }
        ],
        light: { rim: 0x7dffb0, glowNode: 'flask', glow: 0x6dff3a, highlight: 0x3dff5a },
        explode: 1,                         /* насколько разлетаются детали */
        view: { azimuth: 38, elevation: 22 } /* стартовый ракурс в разделе */
    },
    {
        id: 'pushka2',
        name: 'See-through Portal Gun',
        heading: 'See-through',
        short: 'Portal Gun',
        tagline: 'Розовая, видно, куда попадёшь',
        sticker: 'модель 02',
        accent: 'pink',
        price: 4990,
        model: 'models/pushka2.glb',
        lead: 'Розовая пушка. Тоже перемещает по центральной конечной кривой, но можно увидеть сразу, где ты окажешься. Под вытянутым колпаком прячется светящийся розовый ствол, а запуск — кнопкой перед рукоятью.',
        facts: [
            'Перемещает по центральной конечной кривой',
            'Показывает заранее, где ты окажешься',
            'Светящийся розовый ствол под колпаком'
        ],
        parts: [
            { id: 'lid', nodes: ['lid'], title: 'Колпак', text: 'Вытянутый колпак с открытым носом.' },
            { id: 'barrel', nodes: ['trunk'], title: 'Ствол', text: 'Светящийся розовый ствол с кольцами.' },
            { id: 'frame', nodes: ['frame','handle'], title: 'Рама с рукоятью', text: 'Нижняя чаша: на ней лежит ствол, а сверху её закрывает колпак.' },
           
            { id: 'button', nodes: ['button'], title: 'Спусковой крючок', text: 'Крючок для запуска портала.' }
        ],
        light: { rim: 0xff86d2, glowNode: 'trunk', glow: 0xff3ea6, highlight: 0xff4db8 },
        explode: 1,
        view: { azimuth: 38, elevation: 22 }
    },
    { id: 'pushka3', name: 'Портальная пушка №3', heading: 'Пушка №3', short: 'Скоро', model: null },
    { id: 'pushka4', name: 'Портальная пушка №4', heading: 'Пушка №4', short: 'Скоро', model: null }
];
