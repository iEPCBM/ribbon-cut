document.addEventListener('DOMContentLoaded', function () {
    // Основные элементы
    const jsConfetti = new JSConfetti();


    const simulationArea = document.getElementById('simulationArea');
    const ribbon = document.getElementById('ribbon');
    const scissors = document.getElementById('scissors');

    // Состояние приложения
    let isCutting = false;
    let cutCount = 0;
    let ribbonParts = [ribbon];
    let cutStartPoint = null;
    let currentCutLine = null;

    // Размеры области симуляции
    let areaRect = simulationArea.getBoundingClientRect();

    // Обновление размеров при изменении окна
    function updateAreaRect() {
        areaRect = simulationArea.getBoundingClientRect();
    }

    window.addEventListener('resize', updateAreaRect);

    // Получение координат события относительно области симуляции
    function getEventCoordinates(event) {
        let clientX, clientY;

        if (event.type.includes('touchend')) {
            const touch = event.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
            console.log(clientX);

        }
        else if (event.type.includes('touch')) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        return {
            x: clientX - areaRect.left,
            y: clientY - areaRect.top
        };
    }
    function convertRemToPixels(rem) {
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }


    // Создание эффекта разрезания
    function createCutEffect(x, y, angle) {
        const effect = document.createElement('div');
        effect.className = 'cut-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y - convertRemToPixels(15)}px`;
        effect.style.transform = `rotate(${angle}deg)`;
        effect.style.opacity = '0.7';

        simulationArea.appendChild(effect);

        // Анимация появления и исчезновения эффекта
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transition = 'opacity 0.5s ease';
        }, 100);

        // Удаление элемента после анимации
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }

    // Создание визуальной линии разреза
    function createCutLine(x, y, angle, length) {
        const line = document.createElement('div');
        line.className = 'cut-line';
        line.style.left = `${x}px`;
        line.style.top = `${y}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.opacity = '0.8';

        simulationArea.appendChild(line);

        // Исчезновение линии через некоторое время
        setTimeout(() => {
            line.style.opacity = '0';
            line.style.transition = 'opacity 0.5s ease';
        }, 300);

        // Удаление линии после анимации
        setTimeout(() => {
            if (line.parentNode) {
                line.parentNode.removeChild(line);
            }
        }, 800);

        return line;
    }

    // Разрезание ленты в заданной позиции
    function cutRibbonAt(x) {
        // Проверка, что разрез находится в пределах ленты
        if (x < 50 || x > areaRect.width - 50) return;

        // Поиск части ленты, в которой происходит разрез
        let targetPart = null;
        let partIndex = -1;
        let partStartX = 0;

        for (let i = 0; i < ribbonParts.length; i++) {
            const part = ribbonParts[i];
            const partRect = part.getBoundingClientRect();
            const partLeft = partRect.left - areaRect.left;
            const partRight = partRect.right - areaRect.left;

            if (x >= partLeft && x <= partRight) {
                targetPart = part;
                partIndex = i;
                partStartX = partLeft;
                break;
            }
        }

        if (!targetPart) return;

        // Проверка, что разрез не слишком близко к краям части
        const partWidth = targetPart.offsetWidth;
        const cutPositionInPart = x - partStartX;

        if (cutPositionInPart < 30 || cutPositionInPart > partWidth - 30) {
            return; // Не разрезаем слишком близко к краям
        }

        // Создание двух новых частей
        const leftPart = document.createElement('div');
        leftPart.className = 'ribbon-part';
        leftPart.style.left = `${partStartX}px`;
        leftPart.style.width = `${cutPositionInPart}px`;

        const rightPart = document.createElement('div');
        rightPart.className = 'ribbon-part';
        rightPart.style.left = `${x}px`;
        rightPart.style.width = `${partWidth - cutPositionInPart}px`;

        // Добавление новых частей в область симуляции
        const ribbonContainer = document.querySelector('.ribbon-container');
        ribbonContainer.appendChild(leftPart);
        ribbonContainer.appendChild(rightPart);

        // Удаление исходной части
        if (targetPart.parentNode) {
            targetPart.parentNode.removeChild(targetPart);
        }

        // Обновление массива частей
        ribbonParts.splice(partIndex, 1, leftPart, rightPart);

        // Обновление статистики
        cutCount++;

        // Создание эффекта разрезания
        const angle = 0; // Случайный угол для эффекта
        createCutEffect(x, areaRect.height / 2, angle);

        // Анимация разъезжания частей
        setTimeout(() => {
            leftPart.style.transform = `translateX(-${15}px)`;
            rightPart.style.transform = `translateX(${15}px)`;
        }, 0);

        // Показ сообщения при первом разрезе
        console.log(ribbonParts);

        if (cutCount === 2 && ribbonParts.length > 2) {
            setTimeout(() => {
                jsConfetti.addConfetti();
            }, 300);

            const leftRibbon = ribbonParts[0];
            const rightRibbon = ribbonParts[ribbonParts.length - 1];
            rightRibbon.classList.add("ribbon-right-anim");
            leftRibbon.classList.add("ribbon-left-anim");

        }

        return true;
    }
    function onCutStart(event) {
        event.preventDefault();

        isCutting = true;
        const coords = getEventCoordinates(event);
        cutStartPoint = coords;

        // Показ ножниц в начальной точке
        scissors.style.opacity = '1';
        scissors.style.left = `${coords.x}px`;
        scissors.style.top = `${coords.y}px`;
    }

    function onCutMove(event) {
        event.preventDefault();
        if (!isCutting) return;

        const coords = getEventCoordinates(event);

        // Обновление позиции ножниц
        scissors.style.left = `${coords.x}px`;
        scissors.style.top = `${coords.y}px`;

        // Создание линии разреза
        if (currentCutLine && currentCutLine.parentNode) {
            currentCutLine.parentNode.removeChild(currentCutLine);
        }

        if (cutStartPoint) {
            const dx = coords.x - cutStartPoint.x;
            const dy = coords.y - cutStartPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            if (length > 20) {
                currentCutLine = createCutLine(cutStartPoint.x, cutStartPoint.y, angle, length);
            }
        }
    }
    function onCutEnd(event) {
        event.preventDefault();
        if (!isCutting) return;

        isCutting = false;
        const coords = getEventCoordinates(event);

        // Скрытие ножниц
        setTimeout(() => {
            scissors.style.opacity = '0';
        }, 300);

        // Удаление линии разреза
        if (currentCutLine && currentCutLine.parentNode) {
            currentCutLine.parentNode.removeChild(currentCutLine);
            currentCutLine = null;
        }

        // Если начальная и конечная точки достаточно далеко, выполняем разрез
        if (cutStartPoint) {
            const dx = coords.y - cutStartPoint.y;
            const distance = Math.abs(dx);

            if (distance > 90) {
                // Разрез в середине между начальной и конечной точками
                const cutX = (cutStartPoint.x + coords.x) / 2;
                cutRibbonAt(cutX);
            }

            cutStartPoint = null;
        }
    }
    // Обработчики событий мыши
    simulationArea.addEventListener('mousedown', onCutStart);

    simulationArea.addEventListener('mousemove', onCutMove);

    simulationArea.addEventListener('mouseup', onCutEnd);

    // Обработчики событий для сенсорных устройств
    simulationArea.addEventListener('touchstart', onCutStart);

    simulationArea.addEventListener('touchmove', onCutMove);

    simulationArea.addEventListener('touchend', onCutEnd);


    // Инициализация
    updateAreaRect();

    // Автоматическое обновление размеров при изменении ориентации устройства
    window.addEventListener('orientationchange', function () {
        setTimeout(updateAreaRect, 100);
    });
});