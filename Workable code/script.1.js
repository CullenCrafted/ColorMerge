let currentColor = { r: 255, g: 255, b: 255 }; // Start as white
let targetColor, recipe, mixCount, maxMixes, maxMixesAchieved, maxMixesAllowed, hearts, chosenColors;

maxMixes = 1; // Initial max mixes allowed
maxMixesAchieved = 1; // Initial max mixes achieved
maxMixesAllowed = 1; // Initial max mixes allowed by the game logic
hearts = 2; // Start with 2 hearts
chosenColors = []; // Store chosen colors

function generateTargetColorAndRecipe() {
    let recipe = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
    let simulatedColor = { r: 255, g: 255, b: 255, count: 0 }; // Start as white
    const colorValues = {
        red: { r: 255, g: 0, b: 0 },
        yellow: { r: 255, g: 255, b: 0 },
        blue: { r: 0, g: 0, b: 255 },
        white: { r: 255, g: 255, b: 255 },
        black: { r: 0, g: 0, b: 0 }
    };
    let colorsAvailable = ['red', 'yellow', 'blue', 'white', 'black'];

    for (let i = 0; i < maxMixes; i++) {
        let color = colorsAvailable[Math.floor(Math.random() * colorsAvailable.length)];
        recipe[color]++;
        simulatedColor.count++;
        simulatedColor.r = (simulatedColor.r * (simulatedColor.count - 1) + colorValues[color].r) / simulatedColor.count;
        simulatedColor.g = (simulatedColor.g * (simulatedColor.count - 1) + colorValues[color].g) / simulatedColor.count;
        simulatedColor.b = (simulatedColor.b * (simulatedColor.count - 1) + colorValues[color].b) / simulatedColor.count;
    }

    return { targetColor: simulatedColor, recipe };
}

function addColor(color) {
    const colorValues = {
        red: { r: 255, g: 0, b: 0 },
        yellow: { r: 255, g: 255, b: 0 },
        blue: { r: 0, g: 0, b: 255 },
        white: { r: 255, g: 255, b: 255 },
        black: { r: 0, g: 0, b: 0 }
    };

    // Check if color is valid and mixCount is less than maxMixesAllowed
    if (color in colorValues && mixCount < maxMixesAllowed) {
        currentColor.r = (currentColor.r * mixCount + colorValues[color].r) / (mixCount + 1);
        currentColor.g = (currentColor.g * mixCount + colorValues[color].g) / (mixCount + 1);
        currentColor.b = (currentColor.b * mixCount + colorValues[color].b) / (mixCount + 1);
        chosenColors.push(colorValues[color]); // Store chosen color
        mixCount++;
        updateDisplay();
    }

    // Check if max mixes allowed and correct combination reached
    if (mixCount === maxMixesAllowed) {
        if (currentColor.r === targetColor.r && currentColor.g === targetColor.g && currentColor.b === targetColor.b) {
            // Correct combination
            const colorDisplay = document.querySelector('.color-display');
            colorDisplay.classList.add('green-border');
            setTimeout(() => {
                colorDisplay.classList.remove('green-border');
                maxMixes++;
                maxMixesAllowed++;
                mixCount = 0; // Reset mixCount for the next round
                chosenColors = []; // Reset chosen colors
                resetGame(); // Reset game for next round
            }, 500); // Wait for 0.5 seconds before moving to the next round
        } else {
            // Incorrect combination
            hearts--;
            if (hearts === 0) {
                alert("Game over! Resetting the game.");
                hearts = 2;
                maxMixes = 1;
                maxMixesAllowed = 1;
            }
            chosenColors = []; // Reset chosen colors
            resetGame(); // Reset game for next round
        }
    }
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
    updateDisplay();
}

function updateMixIndicator() {
    const indicator = document.getElementById('mix-indicator');
    indicator.innerHTML = '';

    if (maxMixesAllowed <= 10) {
        for (let i = 0; i < maxMixesAllowed; i++) {
            let dot = document.createElement('div');
            dot.className = 'dot';
            if (i < chosenColors.length) {
                dot.style.backgroundColor = `rgb(${chosenColors[i].r}, ${chosenColors[i].g}, ${chosenColors[i].b})`;
            }
            indicator.appendChild(dot);
        }
    } else {
        const ratio = document.createElement('div');
        ratio.className = 'mix-indicator-counter';
        ratio.textContent = `${maxMixesAllowed - mixCount} / ${maxMixesAllowed}`;
        indicator.appendChild(ratio);
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
    for (let i = 0; i < hearts; i++) {
        let heart = document.createElement('div');
        heart.className = 'heart';
        heartsContainer.appendChild(heart);
    }
}

window.onload = function () {
    resetGame(); // Setup initial game state
    updateHeartsDisplay(); // Display initial hearts
}

// Reset button event listener
document.getElementById('reset-button').addEventListener('click', function () {
    maxMixes = 1; // Reset maxMixes to 1
    maxMixesAllowed = 1; // Reset maxMixesAllowed to 1
    hearts = 2; // Reset hearts to 2
    chosenColors = []; // Reset chosen colors
    resetGame();
});
