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
        light: { rim: 0x9eff00, glowNode: 'flask', glow: 0x9eff00, highlight: 0xff5c00 },
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
        light: { rim: 0xff007f, glowNode: 'trunk', glow: 0xff007f, highlight: 0x061148 },
        explode: 1,
        view: { azimuth: 38, elevation: 22 }
    },
    {
        id: 'pushka3',
        name: 'Infinite Multiverse Portal Gun',
        heading: 'Infinite Multiverse',
        short: 'Portal Gun',
        tagline: 'Жёлтая, ведёт по всей мультивселенной',
        sticker: 'модель 03',
        accent: 'yellow',
        price: 4990,
        model: 'models/pushka3.glb',
        lead: 'Жёлтая пушка, с которой можно перемещаться по всей мультивселенной. Под стеклянной колбой светится портальная жидкость, рядом батарея, резистор и преобразователь. Спереди массивный ствол, по бокам ряд сигнальных ламп, а запуск — спусковым крючком под корпусом.',
        facts: [
            'Перемещает по всей мультивселенной',
            'Светящаяся жёлтая портальная жидкость в колбе',
            'Ряд сигнальных ламп на корпусе'
        ],
        parts: [
            { id: 'trunk', nodes: ['trunk'], title: 'Ствол', text: 'Жёлтый излучатель, из которого вылетает портал.' },
            { id: 'capsule', nodes: ['capsule', 'sphere'], title: 'Колба с портальной жидкостью', text: 'Стеклянный купол с портальной жидкостью внутри, она питает портал.' },
            { id: 'parts', nodes: ['battery', 'resistor', 'converter'], title: 'Электроника', text: 'Батарея, резистор и преобразователь под стеклом.' },
            { id: 'lamps', nodes: ['light_bulbs'], title: 'Сигнальные лампы', text: 'Ряд ламп поперёк корпуса.' },
            { id: 'button', nodes: ['button'], title: 'Спусковой крючок', text: 'Крючок для создания портала.' },
            { id: 'body', nodes: ['body'], title: 'Корпус', text: 'Основа конструкции с рукоятью.' }
        ],
        light: { rim: 0xe1ff00, glowNode: 'sphere', glow: 0xe1ff00, highlight: 0x410073 },
        explode: 1,
        view: { azimuth: 38, elevation: 22 }
    },
    {
        id: 'pushka4',
        name: 'Interspatial Portal Gun',
        heading: 'Interspatial',
        short: 'Portal Gun',
        tagline: 'Бирюзовая, телепортирует по всей планете',
        sticker: 'модель 04',
        accent: 'cyan',
        price: 4990,
        model: 'models/pushka4.glb',
        lead: 'Бирюзовая пушка, всё устройство на виду. С данной пушкой можно телепортироваться в пределах планеты. Спереди масивный ствол выходящий из колбы с светящимся стержнем.',
        facts: [
            'Открытая рама без кожуха',
            'Стеклянная колба со светящимся стержнем',
            'Преобразователь, оплетённый проводами'
        ],
        parts: [
            { id: 'wires', nodes: ['wires'], title: 'Преобразователь', text: 'Преобразует энергию и провода вокруг него.' },
            { id: 'flask', nodes: ['flask'], title: 'Колба и дуло', text: 'Стеклянная колба с дулом, внутри которой светится бирюзовый стержень.' },
            { id: 'mount', nodes: ['holder', 'lid'], title: 'Крышка и крепление', text: 'Сидят на заднем конце и держат горловину колбы.' },
            { id: 'frame', nodes: ['frame'], title: 'Рама', text: 'Плоская рама с вырезом под колбу, основа всей конструкции.' }
        ],
        light: { rim: 0x3ef8f5, glowNode: 'flask', glow: 0x3ef8f5, highlight: 0xd320b4 },
        explode: 1,
        view: { azimuth: 38, elevation: 22 }
    }
];
