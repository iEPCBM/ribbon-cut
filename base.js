document.addEventListener('DOMContentLoaded', function () {
    const simulationArea = document.getElementById('simulationArea');
    const ribbon = document.getElementById('ribbon');
    const ribbon_container = document.getElementById('ribbon-container');
    const centerLogo = document.getElementById('central-logo');
    const lwh = document.getElementsByClassName('lwh');
    const fanfare = new Audio('./festive-fanfare.wav');
    let cutCount = 0;
    let ribbonParts = [ribbon];
    let cutStartPoints = [null, null];
    const activeTouches = new Map();
    let areaRect = simulationArea.getBoundingClientRect();

    function updateAreaRect() {
        areaRect = simulationArea.getBoundingClientRect();
    }

    window.addEventListener('resize', updateAreaRect);

    function convertRemToPixels(rem) {
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    function createScissors(touchId, x, y) {
        const scissors = document.createElement('div');
        scissors.className = 'scissors';
        scissors.id = `scissors-${touchId}`;
        scissors.style.left = `${x}px`;
        scissors.style.top = `${y}px`;
        scissors.style.opacity = '1';

        simulationArea.appendChild(scissors);
        return scissors;
    }


    function createCutEffect(x, y, angle, touchId = 0) {
        const effect = document.createElement('div');
        effect.className = 'cut-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y - convertRemToPixels(10)}px`;
        effect.style.transform = `rotate(${angle}deg)`;
        effect.style.opacity = '0.7';

        simulationArea.appendChild(effect);

        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transition = 'opacity 0.5s ease';
        }, 100);

        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }

    function createCutLine(touchId, startX, startY, endX, endY) {
        const line = document.createElement('div');
        line.className = 'cut-line';
        line.id = `line-${touchId}`;

        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.opacity = '0.8';

        simulationArea.appendChild(line);
        return line;
    }
    function cutRibbonAt(x, touchId = 0) {
        if (x < 50 || x > areaRect.width - 50) return;

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

        const partWidth = targetPart.offsetWidth;
        const cutPositionInPart = x - partStartX;

        if (cutPositionInPart < 30 || cutPositionInPart > partWidth - 30) {
            return;
        }

        const leftPart = document.createElement('div');
        leftPart.className = 'ribbon-part';
        leftPart.style.left = `${partStartX}px`;
        leftPart.style.width = `${cutPositionInPart}px`;

        const rightPart = document.createElement('div');
        rightPart.className = 'ribbon-part';
        rightPart.style.left = `${x}px`;
        rightPart.style.width = `${partWidth - cutPositionInPart}px`;

        const ribbonContainer = document.querySelector('.ribbon-container');
        ribbonContainer.appendChild(leftPart);
        ribbonContainer.appendChild(rightPart);

        if (targetPart.parentNode) {
            targetPart.parentNode.removeChild(targetPart);
        }

        ribbonParts.splice(partIndex, 1, leftPart, rightPart);

        cutCount++;

        const angle = 0;
        createCutEffect(x, areaRect.height / 2, angle, touchId);

        setTimeout(() => {
            leftPart.style.transform = `translateX(-${15}px)`;
            rightPart.style.transform = `translateX(${15}px)`;
        }, 0);

        console.log(ribbonParts);

        if (cutCount === 2 && ribbonParts.length > 2) {
            fanfare.play();
            setTimeout(() => {
                const jsConfetti = new JSConfetti();
                jsConfetti.addConfetti();
            }, 300);

            const leftRibbon = ribbonParts[0];
            const rightRibbon = ribbonParts[ribbonParts.length - 1];
            const centerRibbon = ribbonParts[1];
            rightRibbon.classList.add("ribbon-right-anim");
            leftRibbon.classList.add("ribbon-left-anim");
            for (let index = 0; index < lwh.length; index++) {
                const element = lwh[index];

                element.classList.add("hidden");
            }

            centerLogo.classList.add("center-logo-active");
            console.log(areaRect.width);
            centerLogo.style.transform = '';
            setTimeout(() => {

                centerRibbon.classList.add("ribbon-part-active");
                //centerRibbon.style.left = `${areaRect.width/2 - centerRibbon.offsetWidth/2}px`;
                //centerRibbon.style.transform = `translateX(${0}px) translateY(-${centerRibbon.getBoundingClientRect().top -simulationArea.getBoundingClientRect().top - convertRemToPixels(15)}px)`;

                centerLogo.style.transform = `translateX(${-centerLogo.getBoundingClientRect().left + (areaRect.width - centerLogo.getBoundingClientRect().width * 2) / 2}px) translateY(${-centerLogo.getBoundingClientRect().top + (window.innerHeight - centerLogo.getBoundingClientRect().height * 2) / 2
                    }px) scale(2)`;

            }, 1000);

        }

        return true;
    }
    function onCutStart(event) {
        if (cutCount >= 2)
            return;
        event.preventDefault();
        updateAreaRect();

        if (event.type.includes('touch')) {
            for (let i = 0; i < Math.max(event.changedTouches.length, 2); i++) {
                const touch = event.changedTouches[i];
                const touchId = touch.identifier;
                const x = touch.clientX - areaRect.left;
                const y = touch.clientY - areaRect.top;
                if (activeTouches.size < 2)
                    activeTouches.set(touchId, {
                        startX: x,
                        startY: y,
                        line: null,
                        scissors: createScissors(touchId, x, y)
                    });
            }
        }
        else {
            const x = event.clientX - areaRect.left;
            const y = event.clientY - areaRect.top;

            if (activeTouches.size < 2)
                activeTouches.set(0, {
                    startX: x,
                    startY: y,
                    line: null,
                    scissors: createScissors(0, x, y)
                });
        }
        console.log(cutStartPoints);
    }

    function onCutMove(event) {
        if (event.type.includes('touch')) {
            for (let i = 0; i < Math.max(event.changedTouches.length, 2); i++) {
                const touch = event.changedTouches[i];
                const touchId = touch.identifier;

                if (!activeTouches.has(touchId)) continue;

                const touchData = activeTouches.get(touchId);
                const x = touch.clientX - areaRect.left;
                const y = touch.clientY - areaRect.top;

                if (touchData.scissors) {
                    touchData.scissors.style.left = `${x}px`;
                    touchData.scissors.style.top = `${y}px`;
                }

                if (touchData.line && touchData.line.parentNode) {
                    touchData.line.parentNode.removeChild(touchData.line);
                }

                const dx = x - touchData.startX;
                const dy = y - touchData.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > convertRemToPixels(1)) {
                    touchData.line = createCutLine(touchId, touchData.startX, touchData.startY, x, y);
                }
            }
        }
        else {
            const touchId = 0;

            if (!activeTouches.has(touchId)) return;

            const x = event.clientX - areaRect.left;
            const y = event.clientY - areaRect.top;
            const touchData = activeTouches.get(touchId);
            if (touchData.scissors) {
                touchData.scissors.style.left = `${x}px`;
                touchData.scissors.style.top = `${y}px`;
            }

            if (touchData.line && touchData.line.parentNode) {
                touchData.line.parentNode.removeChild(touchData.line);
            }

            const dx = x - touchData.startX;
            const dy = y - touchData.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > convertRemToPixels(1)) {
                touchData.line = createCutLine(touchId, touchData.startX, touchData.startY, x, y);
            }
        }

    }
    function onCutEnd(event) {
        event.preventDefault();
        if (event.type.includes('touch')) {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                const touchId = touch.identifier;

                if (!activeTouches.has(touchId)) continue;

                const touchData = activeTouches.get(touchId);
                const y = touch.clientY - areaRect.top;
                const x = touch.clientX - areaRect.left;

                const dy = y - touchData.startY;
                if (Math.abs(dy) > convertRemToPixels(14)) {
                    const cutX = (touchData.startX + x) / 2;
                    cutRibbonAt(cutX, touchId);
                }

                if (touchData.line && touchData.line.parentNode) {
                    touchData.line.parentNode.removeChild(touchData.line);
                }

                if (touchData.scissors) {
                    touchData.scissors.style.opacity = '0';
                    setTimeout(() => {
                        if (touchData.scissors && touchData.scissors.parentNode) {
                            touchData.scissors.parentNode.removeChild(touchData.scissors);
                        }
                    }, 300);
                }

                activeTouches.delete(touchId);
            }
        }
        else {
            const touchId = 0;

            if (!activeTouches.has(touchId)) return;

            const touchData = activeTouches.get(touchId);
            const y = event.clientY - areaRect.top;
            const x = event.clientX - areaRect.left;

            const dy = y - touchData.startY;
            if (Math.abs(dy) > convertRemToPixels(14)) {
                const cutX = (touchData.startX + x) / 2;
                cutRibbonAt(cutX, touchId);
            }

            if (touchData.line && touchData.line.parentNode) {
                touchData.line.parentNode.removeChild(touchData.line);
            }

            if (touchData.scissors) {
                touchData.scissors.style.opacity = '0';
                setTimeout(() => {
                    if (touchData.scissors && touchData.scissors.parentNode) {
                        touchData.scissors.parentNode.removeChild(touchData.scissors);
                    }
                }, 300);
            }

            activeTouches.delete(touchId);
        }
    }
    simulationArea.addEventListener('mousedown', onCutStart);

    simulationArea.addEventListener('mousemove', onCutMove);

    simulationArea.addEventListener('mouseup', onCutEnd);

    simulationArea.addEventListener('touchstart', onCutStart);

    simulationArea.addEventListener('touchmove', onCutMove);

    simulationArea.addEventListener('touchend', onCutEnd);


    updateAreaRect();

    window.addEventListener('orientationchange', function () {
        setTimeout(updateAreaRect, 100);
    });
});