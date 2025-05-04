@ Morse Code Implementation in ARM Assembly
@ Author: MORSOLINGO
@ Date: 2025-04-28
@ Description: ARM assembly implementation for Morse code encoding/decoding without Bluetooth

.syntax unified
.cpu cortex-m4
.fpu softvfp
.thumb

@ Constants
.equ DOT_DURATION,      200     @ Duration of a dot in milliseconds
.equ DASH_DURATION,     600     @ Duration of a dash (3x dot)
.equ ELEMENT_GAP,       200     @ Gap between elements (1x dot)
.equ CHAR_GAP,          600     @ Gap between characters (3x dot)
.equ WORD_GAP,          1400    @ Gap between words (7x dot)
.equ LED_PIN,           13      @ LED pin (adjust as needed for your hardware)

@ Global variables
.section .data
    morse_table:
        @ Each character's Morse code pattern
        @ Format: Length (in bits) followed by the pattern
        @ 0 = dot, 1 = dash, stored as bits (right-to-left)
        @ A-Z (0-25)
        .byte 2, 0x02      @ A: .-    (10 in binary)
        .byte 4, 0x09      @ B: -...  (1001 in binary)
        .byte 4, 0x0D      @ C: -.-.  (1101 in binary)
        .byte 3, 0x03      @ D: -..   (011 in binary)
        .byte 1, 0x00      @ E: .     (0 in binary)
        .byte 4, 0x05      @ F: ..-.  (0101 in binary)
        .byte 3, 0x07      @ G: --.   (111 in binary)
        .byte 4, 0x01      @ H: ....  (0001 in binary)
        .byte 2, 0x00      @ I: ..    (00 in binary)
        .byte 4, 0x0E      @ J: .---  (1110 in binary)
        .byte 3, 0x05      @ K: -.-   (101 in binary)
        .byte 4, 0x02      @ L: .-..  (0010 in binary)
        .byte 2, 0x03      @ M: --    (11 in binary)
        .byte 2, 0x01      @ N: -.    (01 in binary)
        .byte 3, 0x07      @ O: ---   (111 in binary)
        .byte 4, 0x06      @ P: .--.  (0110 in binary)
        .byte 4, 0x0B      @ Q: --.-  (1011 in binary)
        .byte 3, 0x02      @ R: .-.   (010 in binary)
        .byte 3, 0x00      @ S: ...   (000 in binary)
        .byte 1, 0x01      @ T: -     (1 in binary)
        .byte 3, 0x04      @ U: ..-   (100 in binary)
        .byte 4, 0x08      @ V: ...-  (1000 in binary)
        .byte 3, 0x06      @ W: .--   (110 in binary)
        .byte 4, 0x0C      @ X: -..-  (1100 in binary)
        .byte 4, 0x0A      @ Y: -.--  (1010 in binary)
        .byte 4, 0x09      @ Z: --..  (1001 in binary)
        
        @ 0-9 (26-35)
        .byte 5, 0x1F      @ 0: ----- (11111 in binary)
        .byte 5, 0x0F      @ 1: .---- (01111 in binary)
        .byte 5, 0x07      @ 2: ..--- (00111 in binary)
        .byte 5, 0x03      @ 3: ...-- (00011 in binary)
        .byte 5, 0x01      @ 4: ....- (00001 in binary)
        .byte 5, 0x00      @ 5: ..... (00000 in binary)
        .byte 5, 0x10      @ 6: -.... (10000 in binary)
        .byte 5, 0x18      @ 7: --... (11000 in binary)
        .byte 5, 0x1C      @ 8: ---.. (11100 in binary)
        .byte 5, 0x1E      @ 9: ----. (11110 in binary)
        
    message_buffer:
        .space 100         @ Buffer for storing the message to be encoded

.section .text
.global main

@ Main function
main:
    bl setup              @ Initialize hardware
    
    @ Example: Encode the message "SOS"
    ldr r0, =message_buffer
    mov r1, #'S'
    strb r1, [r0], #1
    mov r1, #'O'
    strb r1, [r0], #1
    mov r1, #'S'
    strb r1, [r0], #1
    mov r1, #0            @ Null terminator
    strb r1, [r0]
    
    ldr r0, =message_buffer
    bl encode_message     @ Encode and output the message
    
    b main_loop           @ Enter main loop

@ Setup function - initialize hardware
setup:
    push {lr}
    
    @ Initialize GPIO for the LED
    @ (Platform-specific code would go here)
    @ This is a placeholder for hardware-specific initialization
    
    pop {pc}

@ Main program loop
main_loop:
    @ This could be expanded to read input, handle user commands, etc.
    b main_loop

@ Encode and output a message in Morse code
@ r0 = pointer to null-terminated string to encode
encode_message:
    push {r4, r5, r6, r7, r8, lr}
    mov r4, r0                  @ Store message pointer
    
message_loop:
    ldrb r5, [r4], #1          @ Load next character and increment pointer
    cmp r5, #0                 @ Check for null terminator
    beq encode_message_done
    
    @ Check for space (word gap)
    cmp r5, #' '
    bne not_space
    
    @ Output word gap
    mov r0, #WORD_GAP
    bl delay
    b message_loop
    
not_space:
    @ Convert to uppercase if lowercase
    cmp r5, #'a'
    blt not_lowercase
    cmp r5, #'z'
    bgt not_lowercase
    sub r5, r5, #32           @ Convert to uppercase
    
not_lowercase:
    @ Calculate index into morse_table
    cmp r5, #'A'
    blt check_number
    cmp r5, #'Z'
    bgt message_loop           @ Skip invalid characters
    sub r5, r5, #'A'           @ Convert A-Z to 0-25
    b get_morse_code
    
check_number:
    cmp r5, #'0'
    blt message_loop           @ Skip invalid characters
    cmp r5, #'9'
    bgt message_loop           @ Skip invalid characters
    sub r5, r5, #'0'           @ Convert 0-9 to 0-9
    add r5, r5, #26            @ Offset to number section in table
    
get_morse_code:
    @ Calculate address in morse_table (2 bytes per entry)
    lsl r6, r5, #1             @ r6 = r5 * 2
    ldr r7, =morse_table
    add r7, r7, r6             @ r7 = address of morse code entry
    
    ldrb r6, [r7]              @ r6 = length of pattern in bits
    ldrb r7, [r7, #1]          @ r7 = pattern
    
    @ Output the Morse code pattern
output_pattern:
    cmp r6, #0
    beq pattern_done
    
    @ Determine if next element is dot or dash
    and r8, r7, #1            @ Extract LSB
    lsr r7, r7, #1            @ Shift for next bit
    
    @ Output dot or dash
    cmp r8, #0
    beq output_dot
    
output_dash:
    bl led_on
    mov r0, #DASH_DURATION
    bl delay
    bl led_off
    b element_done
    
output_dot:
    bl led_on
    mov r0, #DOT_DURATION
    bl delay
    bl led_off
    
element_done:
    sub r6, r6, #1            @ Decrement bit count
    
    @ Add gap between elements if not the last element
    cmp r6, #0
    beq pattern_done
    mov r0, #ELEMENT_GAP
    bl delay
    b output_pattern
    
pattern_done:
    @ Add gap between characters
    mov r0, #CHAR_GAP
    bl delay
    
    b message_loop

encode_message_done:
    pop {r4, r5, r6, r7, r8, pc}

@ Turn LED on
led_on:
    push {lr}
    
    @ Set LED pin high (platform-specific code would go here)
    @ This is a placeholder for hardware-specific code
    
    pop {pc}

@ Turn LED off
led_off:
    push {lr}
    
    @ Set LED pin low (platform-specific code would go here)
    @ This is a placeholder for hardware-specific code
    
    pop {pc}

@ Delay function
@ r0 = delay time in milliseconds
delay:
    push {r4, lr}
    mov r4, r0
    
    @ Platform-specific delay implementation would go here
    @ This is a placeholder for hardware-specific delay function
    
    pop {r4, pc}

.end
