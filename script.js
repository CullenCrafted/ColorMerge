let currentColor = { r: 255, g: 255, b: 255 };
let targetColor, recipe, mixCount, maxMixes = 1, maxMixesAllowed = 1, hearts = 2, chosenColors = [], colorClicks = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
let currentStreak = 0, highestStreak = 0;
let currentLevel = 1;
let transitioningToNextRound = false;

const colorValues = {
    red: { r: 255, g: 0, b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 }
};

function generateTargetColorAndRecipe() {
    const recipe = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
    let simulatedColor = { r: 255, g: 255, b: 255, count: 0 };
    const colorsAvailable = ['red', 'yellow', 'blue', 'white', 'black'];
    chosenColors = [];

    for (let i = 0; i < maxMixes; i++) {
        const color = colorsAvailable[Math.floor(Math.random() * colorsAvailable.length)];
        chosenColors.push(color);
        recipe[color]++;
    }

    getEffectiveColors(chosenColors).forEach(color => {
        simulatedColor.count++;
        simulatedColor.r = (simulatedColor.r * (simulatedColor.count - 1) + colorValues[color].r) / simulatedColor.count;
        simulatedColor.g = (simulatedColor.g * (simulatedColor.count - 1) + colorValues[color].g) / simulatedColor.count;
        simulatedColor.b = (simulatedColor.b * (simulatedColor.count - 1) + colorValues[color].b) / simulatedColor.count;
    });

    return { targetColor: simulatedColor, recipe };
}

function showResultPopup(isFinal) {
    const popup = document.getElementById('result-popup');
    const squaresContainer = popup.querySelector('.squares-container');
    const okButton = document.getElementById('ok-button');
    squaresContainer.innerHTML = '';
    const indicator = document.getElementById('mix-indicator');
    indicator.innerHTML = '';

    if (hearts === 0) {
        displayLevelIndicator(squaresContainer, true); // Display level number on last popup
    } else {
        displayHeartLossIndicator(squaresContainer); // Display "-❤️" on all prior popups
    }
    displayMixIndicator(indicator);
    showCorrectCountsInPopup(squaresContainer);

    // Adding a delay to ensure popup has correct colors
    setTimeout(() => {
        popup.style.backgroundColor = `rgb(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)})`;
        popup.style.display = 'flex';
        document.getElementById('reset-button').disabled = true; // Disable reset button

        if (hearts === 0) {
            showExtraHeartOption(popup);
            okButton.style.display = 'none';  // Hide OK button when hearts are 0
        } else {
            hideExtraHeartOption();  // Hide Restart and +heart buttons when hearts are not 0
            okButton.style.display = 'block';
            okButton.onclick = () => {
                popup.style.display = 'none';
                document.getElementById('reset-button').disabled = false; // Enable reset button
                if (isFinal) {
                    resetGame(true);
                } else {
                    resetGame();
                }
            };
        }
    }, 100); // Adjust this delay if necessary
}

function showExtraHeartOption(popup) {
    const existingButtons = document.querySelector('.button-container');
    if (existingButtons) {
        existingButtons.remove();  // Ensure no duplicate button containers are present
    }

    const extraHeartButton = document.createElement('button');
    extraHeartButton.id = 'extra-heart-button';
    extraHeartButton.textContent = '+❤️';
    extraHeartButton.onclick = () => {
        showAdPage();
        popup.style.display = 'none';
    };

    const restartButton = document.createElement('button');
    restartButton.id = 'restart-button';
    restartButton.textContent = 'Restart';
    restartButton.onclick = () => {
        resetGame(true);
        popup.style.display = 'none';
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(restartButton);
    buttonContainer.appendChild(extraHeartButton);

    popup.appendChild(buttonContainer);

    // Hide the OK button
    const okButton = document.getElementById('ok-button');
    okButton.style.display = 'none';
}

function hideExtraHeartOption() {
    const existingButtons = document.querySelector('.button-container');
    if (existingButtons) {
        existingButtons.remove();  // Remove the button container if it exists
    }
}

function showAdPage() {
    const adPage = document.createElement('div');
    adPage.id = 'ad-page';

    const adContent = document.createElement('div');
    adContent.className = 'ad-content';

    const countdownBar = document.createElement('div');
    countdownBar.id = 'countdown-bar';

    adContent.appendChild(countdownBar);
    adPage.appendChild(adContent);
    document.body.appendChild(adPage);

    let countdown = 10;
    const interval = setInterval(() => {
        countdown--;
        countdownBar.style.width = `${countdown * 10}%`;
        if (countdown === 0) {
            clearInterval(interval);
            adPage.remove();
            hearts++;
            updateHeartsDisplay();
            resetGame();
        }
    }, 1000);
}

function showCorrectCountsInPopup(container) {
    const correctCountsContainer = document.createElement('div');
    correctCountsContainer.className = 'correct-counts-container';

    const colorOrder = ['blue', 'red', 'yellow', 'white', 'black'];

    colorOrder.forEach(color => {
        let correctSquare = document.createElement('div');
        correctSquare.className = 'square';
        correctSquare.style.backgroundColor = color;
        correctSquare.textContent = recipe[color] !== undefined ? recipe[color] : 0;
        correctCountsContainer.appendChild(correctSquare);
    });

    container.appendChild(correctCountsContainer);

    // Hide the last square in the mix indicator when correct counts appear
    const remainingClicksSquare = document.querySelector('.mix-indicator .square:last-child');
    if (remainingClicksSquare) {
        remainingClicksSquare.classList.add('hide');
    }
}

function displayMixIndicator(indicator) {
    const colorOrder = ['blue', 'red', 'yellow', 'white', 'black'];

    colorOrder.forEach(color => {
        let square = document.createElement('div');
        square.className = 'square';
        square.style.backgroundColor = color;
        square.textContent = colorClicks[color];
        indicator.appendChild(square);
    });

    let remainingClicks = document.createElement('div');
    remainingClicks.className = 'square';
    remainingClicks.style.backgroundColor = 'gray';
    remainingClicks.textContent = maxMixesAllowed - mixCount;
    indicator.appendChild(remainingClicks);
}

function displayLevelIndicator(container, isFinal) {
    const levelIndicator = document.createElement('div');
    levelIndicator.className = 'level-indicator';
    levelIndicator.textContent = `LEVEL ${currentLevel}`;
    container.appendChild(levelIndicator);
}

function displayHeartLossIndicator(container) {
    const heartLossIndicator = document.createElement('div');
    heartLossIndicator.className = 'heart-loss-indicator';
    heartLossIndicator.textContent = `-1❤️`;
    container.appendChild(heartLossIndicator);
}

function displayDots(indicator, correctCount, incorrectIndices, remainingRecipe) {
    for (let i = 0; i < correctCount; i++) {
        let indicatorBox = createIndicatorBox('correct', chosenColors[i]);
        indicator.appendChild(indicatorBox);
    }

    incorrectIndices.forEach(index => {
        let indicatorBox = createIndicatorBox('incorrect', chosenColors[index]);
        let correctColor = findCorrectColor(remainingRecipe);
        if (correctColor) {
            let correctDot = document.createElement('div');
            correctDot.className = 'correct-dot';
            correctDot.style.backgroundColor = `rgb(${colorValues[correctColor].r}, ${colorValues[correctColor].g}, ${colorValues[correctColor].b})`;
            indicatorBox.appendChild(correctDot);
            remainingRecipe[correctColor]--;
        }
        indicator.appendChild(indicatorBox);
    });
}

function createIndicatorBox(type, color) {
    let indicatorBox = document.createElement('div');
    indicatorBox.className = `indicator-box ${type}`;
    let dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.backgroundColor = `rgb(${colorValues[color].r}, ${colorValues[color].g}, ${colorValues[color].b})`;
    indicatorBox.appendChild(dot);
    return indicatorBox;
}

function findCorrectColor(remainingRecipe) {
    return Object.keys(recipe).find(key => recipe[key] > 0 && remainingRecipe[key] > 0);
}

function fillRemainingSlots(indicator) {
    for (let i = chosenColors.length; i < maxMixesAllowed; i++) {
        let indicatorBox = document.createElement('div');
        indicatorBox.className = 'indicator-box';
        let dot = document.createElement('div');
        dot.className = 'dot';
        indicatorBox.appendChild(dot);
        indicator.appendChild(indicatorBox);
    }
}

function findCorrectColor(remainingRecipe) {
    return Object.keys(recipe).find(key => recipe[key] > 0 && remainingRecipe[key] > 0);
}

function fillRemainingSlots(indicator) {
    for (let i = chosenColors.length; i < maxMixesAllowed; i++) {
        let indicatorBox = document.createElement('div');
        indicatorBox.className = 'indicator-box';
        let dot = document.createElement('div');
        dot.className = 'dot';
        indicatorBox.appendChild(dot);
        indicator.appendChild(indicatorBox);
    }
}

function addColor(color) {
    if (transitioningToNextRound || !(color in colorValues) || mixCount >= maxMixesAllowed) return;

    chosenColors.push(color);
    colorClicks[color]++;
    mixCount++;

    updateCurrentColor();
    updateDisplay();
    updateMixIndicator();

    // Check if current color matches target color and the number of mixes used is less than allowed
    if (colorsMatch() && mixCount < maxMixesAllowed) {
        hearts++;
        currentStreak++; // Update current streak
        highestStreak = Math.max(currentStreak, highestStreak); // Update highest streak
        updateHeartsDisplay();
        updateStreakDisplay(); // Update streak display
        showNicePopup(); // Show +1 pop-up

        // Move to the next round immediately
        transitioningToNextRound = true;
        setTimeout(nextRound, 200);
        return;
    }

     // Ensure the game only checks for a match after all mixes have been done
     if (mixCount === maxMixesAllowed) {
        // Adding a delay to ensure all updates are completed before showing the popup
        setTimeout(() => {
            checkFinalMatch();
        }, 200); // Adjust this delay if necessary
    }
}

function handleImmediateMatch() {
    if (new Set(chosenColors).size === chosenColors.length) {
        hearts++;
        currentStreak++; // Update current streak
        highestStreak = Math.max(currentStreak, highestStreak); // Update highest streak
        updateHeartsDisplay();
        updateStreakDisplay(); // Update streak display
    }
    transitioningToNextRound = true;
    showNicePopup();
    setTimeout(nextRound, 1000);
}

function nextRound() {
    maxMixes++;
    maxMixesAllowed++;
    mixCount = 0;
    chosenColors = [];
    currentLevel++;
    resetGame();
    transitioningToNextRound = false;
}

function updateCurrentColor() {
    let effectiveColors = getEffectiveColors(chosenColors);
    currentColor = calculateAverageColor(effectiveColors);
}

function calculateAverageColor(effectiveColors) {
    let totalColors = effectiveColors.length;
    let r = effectiveColors.reduce((sum, color) => sum + colorValues[color].r, 0) / totalColors;
    let g = effectiveColors.reduce((sum, color) => sum + colorValues[color].g, 0) / totalColors;
    let b = effectiveColors.reduce((sum, color) => sum + colorValues[color].b, 0) / totalColors;
    return { r, g, b };
}

function colorsMatch() {
    return Math.round(currentColor.r) === Math.round(targetColor.r) && Math.round(currentColor.g) === Math.round(targetColor.g) && Math.round(currentColor.b) === Math.round(targetColor.b);
}

function checkFinalMatch() {
    if (colorsMatch()) {
        currentStreak++;
        highestStreak = Math.max(currentStreak, highestStreak);
        updateStreakDisplay();
        flashStatus();

        transitioningToNextRound = true;
        setTimeout(nextRound, 300);
    } else {
        hearts--;
        updateHeartsDisplay();
        // Adding a delay to ensure all updates are completed before showing the popup
        setTimeout(() => {
            showResultPopup(hearts === 0);
        }, 100); // Adjust this delay if necessary
    }
}

function getEffectiveColors(colors) {
    let yellowCount = colors.filter(c => c === 'yellow').length;
    let blueCount = colors.filter(c => c === 'blue').length;
    let effectiveColors = [...colors];

    if (yellowCount > 0 && blueCount > 0) {
        let greenCount = Math.min(yellowCount, blueCount);
        effectiveColors = effectiveColors.filter(c => (c !== 'yellow' || --yellowCount >= 0) && (c !== 'blue' || --blueCount >= 0));
        for (let i = 0; i < greenCount; i++) {
            effectiveColors.push('green');
        }
    }
    return effectiveColors;
}

function showNicePopup() {
    const nicePopup = document.createElement('div');
    nicePopup.id = 'nice-popup';
    nicePopup.textContent = '+1❤️';
    nicePopup.classList.add('nice-popup');
    document.body.appendChild(nicePopup);

    setTimeout(() => nicePopup.remove(), 1000);
}

function updateStreakDisplay() {
    document.getElementById('current-streak').textContent = `Current: ${currentStreak}`;
    document.getElementById('highest-streak').textContent = `Highest: ${highestStreak}`;
}

function updateDisplay() {
    document.getElementById('mixing-area').style.backgroundColor = `rgb(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)})`;
    document.body.style.backgroundColor = `rgb(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)})`;
    toggleClass('background-black', targetColor.r === 0 && targetColor.g === 0 && targetColor.b === 0);
    toggleClass('white-background', targetColor.r === 255 && targetColor.g === 255 && targetColor.b === 255, '.color-display');
    updateMixIndicator();
    updateColorCounts();
    updateHeartsDisplay();
}

function toggleClass(className, condition, selector = 'body') {
    const element = document.querySelector(selector);
    condition ? element.classList.add(className) : element.classList.remove(className);
}

function resetGame(isFinal = false) {
    if (isFinal) {
        maxMixes = 1;
        maxMixesAllowed = 1;
        hearts = 2;
        currentStreak = 0;
        currentLevel = 1;
    }
    const { targetColor: newTargetColor, recipe: newRecipe } = generateTargetColorAndRecipe();
    targetColor = newTargetColor;
    recipe = newRecipe;
    currentColor = { r: 255, g: 255, b: 255 };
    mixCount = 0;
    chosenColors = [];
    colorClicks = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
    updateDisplay();
    updateStreakDisplay();
    updateHeartsDisplay();
}

function updateMixIndicator() {
    const indicator = document.getElementById('mix-indicator');
    indicator.innerHTML = '';

    if (maxMixesAllowed <= 10) {
        for (let i = 0; i < maxMixesAllowed; i++) {
            let dot = document.createElement('div');
            dot.className = 'dot';
            if (i < chosenColors.length) {
                let color = chosenColors[i];
                dot.style.backgroundColor = `rgb(${colorValues[color].r}, ${colorValues[color].g}, ${colorValues[color].b})`;
            }
            indicator.appendChild(dot);
        }
    } else {
        ['blue', 'red', 'yellow', 'white', 'black'].forEach(color => {
            let square = document.createElement('div');
            square.className = 'square';
            square.style.backgroundColor = color;
            square.textContent = colorClicks[color];
            indicator.appendChild(square);
        });
        let remainingClicks = document.createElement('div');
        remainingClicks.className = 'square';
        remainingClicks.style.backgroundColor = 'gray';
        remainingClicks.textContent = maxMixesAllowed - mixCount;
        indicator.appendChild(remainingClicks);
    }
}

function updateColorCounts() {
    document.getElementById('red-count').textContent = `Red: ${recipe.red}`;
    document.getElementById('yellow-count').textContent = `Yellow: ${recipe.yellow}`;
    document.getElementById('blue-count').textContent = `Blue: ${recipe.blue}`;
    document.getElementById('white-count').textContent = `White: ${recipe.white}`;
    document.getElementById('black-count').textContent = `Black: ${recipe.black}`;
}

function updateHeartsDisplay() {
    const heartsContainer = document.getElementById('hearts-container');
    heartsContainer.innerHTML = '';
    let heartCounter = document.createElement('div');
    heartCounter.className = 'heart-counter';
    heartCounter.textContent = `❤️ ${hearts}`;
    heartsContainer.appendChild(heartCounter);
}

function flashStatus() {
    const statusContainer = document.getElementById('status-container');
    statusContainer.classList.add('status-flash');
    setTimeout(() => statusContainer.classList.remove('status-flash'), 1000);
}

window.onload = function () {
    resetGame();
    updateHeartsDisplay();
    document.querySelectorAll('#color-buttons button').forEach(button => {
        button.addEventListener('touchstart', () => button.classList.add('active'));
        button.addEventListener('touchend', () => button.classList.remove('active'));
    });
}

document.getElementById('reset-button').addEventListener('click', function () {
    if (this.disabled) {
        return; // Do nothing if the reset button is disabled
    }
    maxMixes = 1;
    maxMixesAllowed = 1;
    hearts = 2;
    currentStreak = 0;
    resetGame();
    this.classList.add('pressed');
    setTimeout(() => this.classList.remove('pressed'), 200);
});