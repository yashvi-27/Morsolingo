// Morse code Bluetooth receiver and trainer for micro:bit
// No import statements needed in MakeCode

// Morse code timing parameters (in milliseconds)
const DOT_DURATION = 200;
const DASH_DURATION = DOT_DURATION * 3;
const ELEMENT_PAUSE = DOT_DURATION;
const LETTER_PAUSE = DOT_DURATION * 3;
const WORD_PAUSE = DOT_DURATION * 7;

// Morse code lookup table - maps characters to morse code patterns
const morseTable: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
    'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '--..', '9': '----.',
    ' ': '/'      // Space becomes word separator
};

// Track the current mode: 0 = T1 (text to morse), 1 = Q1 (quiz), 2 = T2 (morse to text), 3 = Q2 (morse quiz)
let currentMode = 0;

// Variable to store the current quiz letter
let quizLetter = "";

// Letters for quiz mode (A-Z)
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Start Bluetooth services
bluetooth.startUartService();

// Bluetooth connection handler
bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Yes);
    basic.pause(1000);
    basic.clearScreen();

    // Show the current mode after connection
    showCurrentMode();
});

// Bluetooth disconnection handler
bluetooth.onBluetoothDisconnected(function () {
    basic.showIcon(IconNames.No);
    basic.pause(1000);
    basic.clearScreen();
});

// Show the current mode on display
function showCurrentMode() {
    if (currentMode === 0) {
        basic.showString("T1");
    } else if (currentMode === 1) {
        basic.showString("Q1");
    } else if (currentMode === 2) {
        basic.showString("T2");
    } else if (currentMode === 3) {
        basic.showString("Q2");
    }
    basic.pause(500);
    basic.clearScreen();
}

// Button A handler - Cycle through modes: T1 -> Q1 -> T1
input.onButtonPressed(Button.A, function () {
    if (currentMode === 0) {
        currentMode = 1;  // Switch from T1 to Q1
        startQuiz();      // Start quiz immediately when entering Q1
    } else if (currentMode === 1) {
        currentMode = 0;  // Switch from Q1 back to T1
    } else if (currentMode === 2) {
        currentMode = 3;  // Switch from T2 to Q2
        startMorseQuiz(); // Start morse quiz immediately when entering Q2
    } else if (currentMode === 3) {
        currentMode = 2;  // Switch from Q2 back to T2
    }

    showCurrentMode();
});

// Button B handler - Switch between T1/Q1 and T2/Q2 groups
input.onButtonPressed(Button.B, function () {
    if (currentMode === 0) {
        currentMode = 2;  // Switch from T1 to T2
    } else if (currentMode === 2) {
        currentMode = 0;  // Switch from T2 to T1
    } else if (currentMode === 1) {
        currentMode = 3;  // Switch from Q1 to Q2
        startMorseQuiz(); // Start morse quiz immediately when entering Q2
    } else if (currentMode === 3) {
        currentMode = 1;  // Switch from Q2 to Q1
        startQuiz();      // Start quiz immediately when entering Q1
    }

    showCurrentMode();
});

// Generate random letter and play it in morse code
function startQuiz() {
    // Generate a random letter A-Z
    let index = Math.randomRange(0, letters.length - 1);
    quizLetter = letters.charAt(index);

    // Play the morse code for this letter
    basic.showString("?");
    basic.pause(500);

    // Get the morse code and play it
    let morseCode = morseTable[quizLetter];
    playMorseCode(morseCode);

    // Show question mark to indicate waiting for answer
    basic.showIcon(IconNames.Diamond);
}

// Generate random letter and display it for the user to provide morse code
function startMorseQuiz() {
    // Generate a random letter A-Z
    let index = Math.randomRange(0, letters.length - 1);
    quizLetter = letters.charAt(index);

    // Display the letter for the user to translate to morse
    basic.showString(quizLetter);

    // Show icon to indicate waiting for morse code input
    basic.showIcon(IconNames.Diamond);
}

// Text to morse code conversion function
function textToMorse(text: string): string {
    let morseString = "";

    // Convert to uppercase for lookup
    text = text.toUpperCase();

    for (let i = 0; i < text.length; i++) {
        let char = text.charAt(i);

        // Look up the morse code for this character
        if (morseTable[char]) {
            // Add the morse code pattern
            morseString += morseTable[char];

            // Add space between letters (unless it's the last character)
            if (i < text.length - 1) {
                morseString += ' ';
            }
        }
    }

    return morseString;
}

// Morse code to text conversion function
function morseToText(morse: string): string {
    // Remove any spaces at beginning/end
    morse = morse.trim();

    // Fixed list of all characters to check
    const allChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";

    // Loop through each character and check if its morse code matches
    for (let i = 0; i < allChars.length; i++) {
        let char = allChars.charAt(i);
        if (morseTable[char] === morse) {
            return char;
        }
    }

    // Return empty string if no match found
    return "";
}

// Play morse code function
function playMorseCode(morseString: string) {
    basic.showIcon(IconNames.EigthNote);

    for (let i = 0; i < morseString.length; i++) {
        let char = morseString.charAt(i);

        if (char === '.') {  // Dot
            music.playTone(1000, DOT_DURATION);
            led.plot(2, 2);  // Light middle pixel for dot
            basic.pause(ELEMENT_PAUSE);
            basic.clearScreen();
        } else if (char === '-') {  // Dash
            music.playTone(1000, DASH_DURATION);
            // Display dash pattern instead of arrow
            led.plot(1, 2);
            led.plot(2, 2);
            led.plot(3, 2);
            basic.pause(ELEMENT_PAUSE);
            basic.clearScreen();
        } else if (char === ' ') {  // Space between letters
            basic.pause(LETTER_PAUSE);
        } else if (char === '/') {  // Word separator
            basic.pause(WORD_PAUSE);
        }
    }

    basic.clearScreen();
}

// Read and process UART messages
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let textMsg = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine));

    if (textMsg && textMsg.length > 0) {
        if (currentMode === 0) {
            // MODE T1: Text to Morse Converter
            // Convert text to morse code
            let morseMsg = textToMorse(textMsg);

            // Play the morse code
            playMorseCode(morseMsg);
        }
        else if (currentMode === 1) {
            // MODE Q1: Quiz mode - letter guessing
            let firstChar = textMsg.charAt(0).toUpperCase();

            // Check if the user's answer matches the quiz letter
            if (firstChar === quizLetter) {
                // Correct answer
                basic.showIcon(IconNames.Yes);
                music.playTone(1200, 300);
                basic.pause(1000);
            } else {
                // Wrong answer
                basic.showIcon(IconNames.No);
                music.playTone(200, 300);
                basic.pause(1000);

                // Show the correct letter
                basic.showString("=" + quizLetter);
                basic.pause(500);
            }

            // Start a new quiz question
            startQuiz();
        }
        else if (currentMode === 2) {
            // MODE T2: Morse to Text Converter
            // User sends morse code (.-, ..., etc)
            let morse = textMsg.trim();

            // Check if morse contains only valid characters (., -, space)
            let validChars = true;
            for (let i = 0; i < morse.length; i++) {
                let ch = morse.charAt(i);
                if (ch !== '.' && ch !== '-' && ch !== ' ') {
                    validChars = false;
                    break;
                }
            }

            if (validChars) {
                let letter = morseToText(morse);

                if (letter) {
                    // Found a valid letter
                    basic.showIcon(IconNames.Yes);
                    basic.pause(500);
                    basic.showString(letter);
                } else {
                    // No valid letter found
                    basic.showIcon(IconNames.No);
                    basic.pause(500);
                }
            } else {
                // Invalid morse code format
                basic.showIcon(IconNames.No);
                basic.pause(500);
            }
        }
        else if (currentMode === 3) {
            // MODE Q2: Quiz mode - morse code guessing
            let userMorse = textMsg.trim();

            // Check if morse contains only valid characters (., -, space)
            let validChars = true;
            for (let i = 0; i < userMorse.length; i++) {
                let ch = userMorse.charAt(i);
                if (ch !== '.' && ch !== '-' && ch !== ' ') {
                    validChars = false;
                    break;
                }
            }

            if (!validChars) {
                // Invalid morse code format
                basic.showIcon(IconNames.No);
                basic.pause(500);
                basic.showIcon(IconNames.Diamond); // Show waiting icon again
                return;
            }

            // Get the correct morse code for the quiz letter
            let correctMorse = morseTable[quizLetter];

            if (userMorse === correctMorse) {
                // Correct answer
                basic.showIcon(IconNames.Yes);
                music.playTone(1200, 300);
                basic.pause(1000);
            } else {
                // Wrong answer
                basic.showIcon(IconNames.No);
                music.playTone(200, 300);
                basic.pause(1000);

                // Show the correct morse code
                basic.showString("=");
                playMorseCode(correctMorse);
                basic.pause(500);
            }

            // Start a new morse quiz question
            startMorseQuiz();
        }
    }
});

// Show ready status on startup and initial mode
basic.showString("READY");
basic.pause(500);
basic.showString("T1");