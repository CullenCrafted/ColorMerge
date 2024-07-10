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
    black: { r: 0, g: 0, b: 0 }
};

function generateTargetColorAndRecipe() {
    let recipe = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
    let simulatedColor = { r: 255, g: 255, b: 255, count: 0 }; // Start as white

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

function showResultPopup(isFinal) {
    const popup = document.getElementById('result-popup');
    const squaresContainer = popup.querySelector('.squares-container');
    const okButton = document.getElementById('ok-button');

    squaresContainer.innerHTML = '';

    const colors = ['blue', 'red', 'yellow', 'white', 'black'];
    const colorNames = ['Blue', 'Red', 'Yellow', 'White', 'Black'];

    colors.forEach(color => {
        let square = document.createElement('div');
        square.className = 'square';
        square.style.backgroundColor = color;
        square.textContent = recipe[colorNames[colors.indexOf(color)].toLowerCase()];
        squaresContainer.appendChild(square);
    });

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
        currentColor.r = (currentColor.r * mixCount + colorValues[color].r) / (mixCount + 1);
        currentColor.g = (currentColor.g * mixCount + colorValues[color].g) / (mixCount + 1);
        currentColor.b = (currentColor.b * mixCount + colorValues[color].b) / (mixCount + 1);
        chosenColors.push(colorValues[color]); // Store chosen color
        colorClicks[color]++; // Increment the click count for this color
        mixCount++;
        updateDisplay();
    }

    // Check if max mixes allowed and correct combination reached
    if (mixCount === maxMixesAllowed) {
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
            }, 1000); // Flash for 1 seconds

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
                dot.style.backgroundColor = `rgb(${chosenColors[i].r}, ${chosenColors[i].g}, ${chosenColors[i].b})`;
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
    for (let i = 0; i < hearts; i++) {
        let heart = document.createElement('div');
        heart.className = 'heart';
        heartsContainer.appendChild(heart);
    }
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