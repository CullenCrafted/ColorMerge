let currentColor = { r: 255, g: 255, b: 255 }; // Start as white
let targetColor, recipe, mixCount, maxMixes, maxMixesAchieved, maxMixesAllowed, hearts, chosenColors, colorClicks;
let currentStreak = 0; // Current streak
let highestStreak = 0; // Highest streak
maxMixes = 1; // Initial max mixes allowed
maxMixesAchieved = 1; // Initial max mixes achieved
maxMixesAllowed = 1; // Initial max mixes allowed by the game logic
hearts = 2; // Start with 2 hearts
chosenColors = []; // Store chosen colors
colorClicks = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 }; // Track number of clicks for each color

const colorValues = {
    red: { r: 255, g: 0, b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 }
};

function generateTargetColorAndRecipe() {
    let recipe = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
    let simulatedColor = { r: 255, g: 255, b: 255, count: 0 }; // Start as white
    let colorsAvailable = ['red', 'yellow', 'blue', 'white', 'black'];
    let chosenColors = [];

    for (let i = 0; i < maxMixes; i++) {
        let color = colorsAvailable[Math.floor(Math.random() * colorsAvailable.length)];
        chosenColors.push(color);
        recipe[color]++;
    }

    let effectiveColors = getEffectiveColors(chosenColors);

    effectiveColors.forEach(color => {
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

    // Update the mix indicator with correct and incorrect colors
    const indicator = document.getElementById('mix-indicator');
    indicator.innerHTML = '';

    // Create a copy of the recipe to track the remaining correct counts
    let remainingRecipe = { ...recipe };

    // Calculate total correct and incorrect counts
    let correctCount = 0;
    let incorrectIndices = [];

    chosenColors.forEach((color, index) => {
        if (remainingRecipe[color] > 0) {
            correctCount++;
            remainingRecipe[color]--;
        } else {
            incorrectIndices.push(index);
        }
    });

    // Display correct dots
    for (let i = 0; i < correctCount; i++) {
        let indicatorBox = document.createElement('div');
        indicatorBox.className = 'indicator-box correct';
        let dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.backgroundColor = `rgb(${colorValues[chosenColors[i]].r}, ${colorValues[chosenColors[i]].g}, ${colorValues[chosenColors[i]].b})`;
        indicatorBox.appendChild(dot);
        indicator.appendChild(indicatorBox);
    }

    // Display incorrect dots
    incorrectIndices.forEach(index => {
        let indicatorBox = document.createElement('div');
        indicatorBox.className = 'indicator-box incorrect';
        let dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.backgroundColor = `rgb(${colorValues[chosenColors[index]].r}, ${colorValues[chosenColors[index]].g}, ${colorValues[chosenColors[index]].b})`;

        // Find the correct color that should be here
        let correctColor = Object.keys(recipe).find(key => recipe[key] > 0 && remainingRecipe[key] > 0);
        if (correctColor) {
            let correctDot = document.createElement('div');
            correctDot.className = 'correct-dot';
            correctDot.style.backgroundColor = `rgb(${colorValues[correctColor].r}, ${colorValues[correctColor].g}, ${colorValues[correctColor].b})`;
            indicatorBox.appendChild(correctDot);
            remainingRecipe[correctColor]--; // Decrement the correct color count
        }

        indicatorBox.appendChild(dot);
        indicator.appendChild(indicatorBox);
    });

    // Fill in remaining slots if maxMixesAllowed is greater
    for (let i = chosenColors.length; i < maxMixesAllowed; i++) {
        let indicatorBox = document.createElement('div');
        indicatorBox.className = 'indicator-box';
        let dot = document.createElement('div');
        dot.className = 'dot';
        indicatorBox.appendChild(dot);
        indicator.appendChild(indicatorBox);
    }

    popup.style.backgroundColor = `rgb(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)})`;
    popup.style.display = 'flex';

    okButton.style.display = 'block'; // Ensure OK button is displayed for all popups
    okButton.onclick = () => {
        popup.style.display = 'none';
        if (isFinal) {
            hearts = 2;
            maxMixes = 1;
            maxMixesAllowed = 1;
            currentStreak = 0;
            resetGame();
        } else {
            resetGame();
        }
    };
}

function addColor(color) {
    // Check if color is valid and mixCount is less than maxMixesAllowed
    if (color in colorValues && mixCount < maxMixesAllowed) {
        chosenColors.push(color); // Store chosen color
        colorClicks[color]++; // Increment the click count for this color
        mixCount++;

        // Calculate new current color
        let effectiveColors = getEffectiveColors(chosenColors);
        
        // Adjust colors if green is present
        let yellowCount = chosenColors.filter(c => c === 'yellow').length;
        let blueCount = chosenColors.filter(c => c === 'blue').length;
        let greenCount = Math.min(yellowCount, blueCount);
        let remainingYellows = yellowCount - greenCount;
        let remainingBlues = blueCount - greenCount;
        let nonGreenColors = chosenColors.filter(c => c !== 'yellow' && c !== 'blue');
        let additionalColors = [...Array(greenCount).fill('green')];

        if (remainingYellows > 0) {
            additionalColors.push(...Array(remainingYellows).fill('yellow'));
        }
        if (remainingBlues > 0) {
            additionalColors.push(...Array(remainingBlues).fill('blue'));
        }

        effectiveColors = [...nonGreenColors, ...additionalColors];

        let totalColors = effectiveColors.length;
        let r = effectiveColors.reduce((sum, color) => sum + colorValues[color].r, 0) / totalColors;
        let g = effectiveColors.reduce((sum, color) => sum + colorValues[color].g, 0) / totalColors;
        let b = effectiveColors.reduce((sum, color) => sum + colorValues[color].b, 0) / totalColors;

        currentColor = { r: r, g: g, b: b };

        updateDisplay();

        // Check for immediate match with target color but remaining colors to add
        if (Math.round(currentColor.r) === Math.round(targetColor.r) && 
            Math.round(currentColor.g) === Math.round(targetColor.g) && 
            Math.round(currentColor.b) === Math.round(targetColor.b) && 
            mixCount < maxMixesAllowed) {
            // Ensure no repeated colors in chosen colors
            let uniqueColors = new Set(chosenColors);
            if (uniqueColors.size === chosenColors.length) {
                hearts++; // Add an extra heart
            }
            showNicePopup();
            setTimeout(() => {
                maxMixes++;
                maxMixesAllowed++;
                mixCount = 0; // Reset mixCount for the next round
                chosenColors = []; // Reset chosen colors
                resetGame(); // Reset game for next round
            }, 1000); // Wait for 1 second before moving to the next round
        }
    }

    // Ensure the game only checks for a match after all mixes have been done
    if (mixCount === maxMixesAllowed) {
        let effectiveColors = getEffectiveColors(chosenColors);
        if (Math.round(currentColor.r) === Math.round(targetColor.r) && 
            Math.round(currentColor.g) === Math.round(targetColor.g) && 
            Math.round(currentColor.b) === Math.round(targetColor.b)) {
            // Correct combination
            currentStreak++;
            if (currentStreak > highestStreak) {
                highestStreak = currentStreak;
            }
            updateStreakDisplay(); // Update streak display
            const statusContainer = document.getElementById('status-container');
            statusContainer.classList.add('status-flash');
            setTimeout(() => {
                statusContainer.classList.remove('status-flash');
            }, 1000); // Flash for 1 second
            setTimeout(() => {
                maxMixes++;
                maxMixesAllowed++;
                mixCount = 0; // Reset mixCount for the next round
                chosenColors = []; // Reset chosen colors
                resetGame(); // Reset game for next round
            }, 400); // Wait for 0.4 seconds before moving to the next round
        } else {
            // Incorrect combination
            hearts--;
            if (hearts === 0) {
                showResultPopup(true); // Show the final result popup
            } else {
                showResultPopup(false); // Show the result popup
            }
        }
    }
}

function getEffectiveColors(colors) {
    let yellowCount = colors.filter(c => c === 'yellow').length;
    let blueCount = colors.filter(c => c === 'blue').length;

    let effectiveColors = [...colors];
    if (yellowCount > 0 && blueCount > 0) {
        // Ensure to only add one green per pair of yellow and blue
        let greenCount = Math.min(yellowCount, blueCount);
        effectiveColors = effectiveColors.filter((c, i) => {
            if (c === 'yellow' && yellowCount > 0) {
                yellowCount--;
                return false;
            }
            if (c === 'blue' && blueCount > 0) {
                blueCount--;
                return false;
            }
            return true;
        });
        for (let i = 0; i < greenCount; i++) {
            effectiveColors.push('green');
        }
    }
    return effectiveColors;
}

function showNicePopup() {
    const nicePopup = document.createElement('div');
    nicePopup.id = 'nice-popup';
    nicePopup.textContent = 'NICE +1';
    nicePopup.classList.add('nice-popup'); // Add the CSS class
    document.body.appendChild(nicePopup);

    setTimeout(() => {
        nicePopup.remove();
    }, 1000); // Display the "NICE" popup for 1 second
}

function updateStreakDisplay() {
    document.getElementById('current-streak').textContent = `Current: ${currentStreak}`;
    document.getElementById('highest-streak').textContent = `Highest: ${highestStreak}`;
}

function updateDisplay() {
    // Update mixing area background
    document.getElementById('mixing-area').style.backgroundColor = `rgb(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)})`;
    // Update body background
    document.body.style.backgroundColor = `rgb(${Math.round(targetColor.r)}, ${Math.round(targetColor.g)}, ${Math.round(targetColor.b)})`;
    // Toggle class for black dots to change to white when background is black
    const mixIndicator = document.querySelector('.mix-indicator');
    if (targetColor.r === 0 && targetColor.g === 0 && targetColor.b === 0) {
        document.body.classList.add('background-black');
    } else {
        document.body.classList.remove('background-black');
    }
    // Toggle class for white border on color display when background is white
    const colorDisplay = document.querySelector('.color-display');
    if (targetColor.r === 255 && targetColor.g === 255 && targetColor.b === 255) {
        colorDisplay.classList.add('white-background');
    } else {
        colorDisplay.classList.remove('white-background');
    }
    updateMixIndicator();
    updateColorCounts();
    updateHeartsDisplay();
}

function resetGame() {
    let generated = generateTargetColorAndRecipe();
    targetColor = generated.targetColor;
    recipe = generated.recipe;
    currentColor = { r: 255, g: 255, b: 255 };
    mixCount = 0;
    chosenColors = []; // Reset chosen colors
    colorClicks = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 }; // Reset color clicks
    updateDisplay();
    updateStreakDisplay(); // Update streak display on reset
    updateHeartsDisplay(); // Ensure hearts display is reset
}

function updateMixIndicator() {
    const indicator = document.getElementById('mix-indicator');
    indicator.innerHTML = '';

    if (maxMixesAllowed <= 10) {
        // Original dot layout
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
        // New square layout
        const colors = ['blue', 'red', 'yellow', 'white', 'black'];
        colors.forEach(color => {
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

window.onload = function () {
    resetGame(); // Setup initial game state
    updateHeartsDisplay(); // Display initial hearts

    // Add event listeners for touchstart and touchend to simulate hover on mobile
    document.querySelectorAll('#color-buttons button').forEach(button => {
        button.addEventListener('touchstart', function() {
            button.classList.add('active');
        });
        button.addEventListener('touchend', function() {
            button.classList.remove('active');
        });
    });
}

document.getElementById('reset-button').addEventListener('click', function () {
    maxMixes = 1; // Reset maxMixes to 1
    maxMixesAllowed = 1; // Reset maxMixesAllowed to 1
    hearts = 2; // Reset hearts to 2
    chosenColors = []; // Reset chosen colors
    currentStreak = 0; // Reset current streak
    resetGame();
    // Add a class to change the button color temporarily
    this.classList.add('pressed');
    setTimeout(() => {
        this.classList.remove('pressed');
    }, 200); // Remove the class after 200ms
});
