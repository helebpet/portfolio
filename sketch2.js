// WEB COOKIES ART PROJECT - P5.JS
// Original concept and design by Petra Helebrantová
// Created: September 15, 2025

// AI ASSISTANCE ACKNOWLEDGMENT:
// ChatGPT (OpenAI) and Claude AI (Anthropic) were used between 09/06/2025 and 09/15/2025 to help with:
// - Code commenting and documentation
// - Proper source citation formatting
// - Code organization suggestions
// - Implementation of drawScreenshots() function for screenshot display layout
// - Implementation of captureScreenshot() function for webcam image capture
// - Implementation of drawLargeCameraView() function for main camera display
// - Implementation of drawTimeDisplay() function for elapsed time counter
// - Implementation of getSeparatorX() function for layout positioning
// - Implementation of eye tracking mouse movement functionality in drawInteractiveFace()
// - Layout assistance based on student's Figma design mockups
// The core creative vision, artistic concept, and overall design were developed independently by the student.

// EXTERNAL CODE SOURCES:
// The duotone function was found online in a Google AI Overview 
// result on 09/13/2025 and then customized for this sketch. 
// Source URL: https://tinyurl.com/2v8zpx2p

// P5.JS LIBRARY:
// This project uses the p5.js library (https://p5js.org/)
// Created by Lauren McCarthy and the Processing Foundation
// Licensed under LGPL 2.1

// ==================== GLOBAL VARIABLES ====================

let capture; // Variable to hold camera video capture object from p5.js createCapture()
let eyeX = 0, eyeY = 0; // Variables for tracking eye movement coordinates in the interactive face element
let startTime; // Variable to store the millisecond timestamp when sketch begins (for elapsed time calculation)

// Array of fake "surveillance" messages to display sequentially for artistic effect
let surveillanceMessages = [
    "[DETECTED] mouse moved",                  // First message - triggers on mouse movement
    "[MESSAGE] you are the product",           // Second message 
    "[ALERT] location shared with your boss",  // Third message
    "[LOG] user is getting annoyed",           // Fourth message
    "[STATUS] user blinked 20 times",         // Fifth message
    "[MESSAGE] click anywhere on the screen to get out of here", // Sixth message - waits for click
    "[ALERT] embarrassing photo sent to your mum!" // Final message - shows after click
];

let currentMessageIndex = -1; // Start at -1 so no messages show initially
let lastMessageTime = 0; // Timestamp when last message was shown
let blinkTimer = 0; // Counter for controlling the automatic blinking animation of the interactive face
let isBlinking = false; // Boolean flag to track whether the face is currently in blink state
let mouseHasMoved = false; // Track if mouse has moved to trigger first message
let waitingForClick = false; // Track if we're waiting for user to click
let userHasClicked = false; // Track if user has clicked after the "click to get out" message

// Screenshot functionality variables
let screenshots = []; // Array to store screenshot objects (each contains image and timestamp)
const MAX_SCREENSHOTS = 3; // Maximum number of screenshots to keep in memory before oldest is discarded

// Duotone filter control variables
let duotoneEnabled = true; // Boolean to toggle duotone effect on/off
let shadowColorHex = '#000000';   // Hex color for dark areas in duotone effect (black)
let highlightColorHex = '#ff0000'; // Hex color for light areas in duotone effect (red)

// ==================== P5.JS CORE FUNCTIONS ====================

function setup() {
    // Create canvas that fills entire browser window for immersive surveillance experience
    let canvas = createCanvas(windowWidth, windowHeight);
    // Attach canvas to specific HTML element (assumes div with id='p5-container' exists)
    canvas.parent('p5-container');
    
    // Initialize webcam capture with VIDEO constant from p5.js
    capture = createCapture(VIDEO);
    // Set capture resolution to standard 640x480 for consistent performance
    capture.size(640, 480);
    // Hide the default video element since we'll draw it manually on canvas
    capture.hide();
    
    // Record when the sketch started for elapsed time display
    startTime = millis();
    // Log to browser console for debugging purposes
    console.log("Surveillance system initiated...");
}

function draw() {
    // Set background to surveillance red color (RGB: 204, 0, 0)
    background(204, 0, 0);
    
    // Call each drawing function in layered order (back to front)
    drawSeparatorLine();    // Vertical line dividing screenshot area from camera area
    drawScreenshots();      // Display captured screenshot thumbnails on left side
    drawLargeCameraView();  // Main webcam feed display on right side
    drawSurveillanceText(); // Fake surveillance messages and title
    drawTimeDisplay();      // Elapsed time counter in top right
    drawInteractiveFace();  // Small face that tracks mouse movement
}

// ==================== LAYOUT HELPER FUNCTIONS ====================

function getSeparatorX() {
    let padding = 40; // Standard padding from screen edges
    let frameWidth = 160; // Width of individual screenshot frames
    let screenshotsRightEdge = padding + frameWidth; // Calculate rightmost pixel of screenshot area
    
    let cameraLeftEdge = screenshotsRightEdge + 80; // Add gap before camera area begins
    let cameraAreaLeft = cameraLeftEdge; // Alias for clarity
    
    // Return x-coordinate for separator line (halfway between screenshot area and camera area)
    return (screenshotsRightEdge + cameraAreaLeft) / 2;
}

function drawSeparatorLine() {
    let separatorX = getSeparatorX(); // Get calculated x-position for vertical divider
    let padding = 40; // Match padding used throughout sketch
    
    stroke(0); // Set line color to black
    strokeWeight(1); // Set line thickness to 1 pixel
    // Draw vertical line from top padding to bottom padding
    line(separatorX, padding, separatorX, height - padding);
    noStroke(); // Disable stroke for subsequent drawing operations
}

// ==================== SCREENSHOT FUNCTIONALITY ====================

function drawScreenshots() {
    let padding = 40; // Distance from left edge of screen
    let frameWidth = 160; // Width of each screenshot frame
    let frameHeight = 200; // Height of each screenshot frame (4:5 aspect ratio)
    let frameSpacing = 20; // Vertical gap between screenshot frames
    
    // Loop through all stored screenshots and draw them vertically stacked
    for (let i = 0; i < screenshots.length; i++) {
        let frameX = padding; // All frames have same x-position (left-aligned)
        // Calculate y-position: start at top padding, then space each frame
        let frameY = padding + i * (frameHeight + frameSpacing);
        
        // Draw white background rectangle for screenshot frame
        fill(255); // Set fill to white
        noStroke(); // No border line
        rect(frameX, frameY, frameWidth, frameHeight);
        
        // Calculate dimensions for image inside frame (with internal padding)
        let imagePadding = 20; // Space between frame edge and image
        let imageSize = frameWidth - (imagePadding * 2); // Image is square
        let imageX = frameX + imagePadding; // Image x-position with padding
        let imageY = frameY + imagePadding; // Image y-position with padding
        
        // If screenshot exists, draw it as grayscale image
        if (screenshots[i].image) {
            let monoImg = screenshots[i].image.get(); // Create copy to avoid modifying original
            monoImg.filter(GRAY); // Apply grayscale filter using p5.js GRAY constant
            // Draw processed image at calculated position and size
            image(monoImg, imageX, imageY, imageSize, imageSize);
        }
        
        // Draw timestamp text below image
        fill(0); // Set text color to black
        textAlign(CENTER); // Center text horizontally
        textSize(12); // Small text size for timestamp
        textFont('Azeret Mono'); // Use monospace font for technical aesthetic
        // Calculate y-position for timestamp (in bottom area of frame)
        let timestampY = imageY + imageSize + (frameHeight - (imageSize + imagePadding * 2)) / 2 + 5;
        // Draw timestamp centered in frame
        text(screenshots[i].timestamp, frameX + frameWidth/2, timestampY);
    }
}

function captureScreenshot() {
    // Only proceed if webcam is loaded and ready
    if (capture && capture.loadedmetadata) {
        let cameraImg = capture.get(); // Get current frame from webcam as p5.Image
        
        // Calculate square crop area (center crop to make square thumbnail)
        let size = min(cameraImg.width, cameraImg.height); // Use smaller dimension as square size
        let cropX = (cameraImg.width - size) / 2; // Center horizontally
        let cropY = (cameraImg.height - size) / 2; // Center vertically
        // Extract square region from center of camera feed
        let croppedImg = cameraImg.get(cropX, cropY, size, size);
        
        // Generate timestamp string in 12-hour format (HH:MM:SS AM/PM)
        let now = new Date(); // Get current date/time
        let hours = now.getHours(); // 24-hour format initially
        let minutes = now.getMinutes().toString().padStart(2, '0'); // Ensure 2 digits
        let seconds = now.getSeconds().toString().padStart(2, '0'); // Ensure 2 digits
        let ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM/PM suffix
        hours = hours % 12 || 12; // Convert to 12-hour format (12 instead of 0)
        let hoursStr = hours.toString().padStart(2, '0'); // Ensure 2 digits
        let timestamp = `${hoursStr}:${minutes}:${seconds} ${ampm}`; // Assemble final timestamp
        
        // Create screenshot object with image and timestamp
        let screenshot = { image: croppedImg, timestamp: timestamp };
        screenshots.unshift(screenshot); // Add new screenshot to beginning of array
        
        // Remove oldest screenshots if we exceed maximum limit
        if (screenshots.length > MAX_SCREENSHOTS) {
            screenshots = screenshots.slice(0, MAX_SCREENSHOTS); // Keep only first MAX_SCREENSHOTS items
        }
        
        // Log to console for debugging
        console.log("Screenshot captured at " + timestamp);
    }
}

// ==================== MAIN CAMERA DISPLAY ====================

function drawLargeCameraView() {
    // Only draw if webcam is loaded and ready
    if (capture && capture.loadedmetadata) {
        let padding = 40; // Standard screen padding
        let separatorX = getSeparatorX(); // Get divider line position
        
        // Calculate target rectangle for camera display (right side of screen)
        let targetX = separatorX + padding; // Start after separator with padding
        let targetY = padding; // Start at top padding
        let targetWidth = width - targetX - padding; // Fill remaining width minus padding
        let targetHeight = height * 0.6; // Use 60% of screen height
        
        // Calculate aspect ratios to determine how to crop camera feed
        let cameraAspect = 640 / 480; // Webcam aspect ratio (4:3)
        let targetAspect = targetWidth / targetHeight; // Display area aspect ratio
        
        // Determine crop region based on aspect ratio comparison
        let sourceX, sourceY, sourceWidth, sourceHeight;
        if (cameraAspect > targetAspect) {
            // Camera is wider than target - crop sides
            sourceHeight = 480; // Use full height
            sourceWidth = sourceHeight * targetAspect; // Calculate width to match target aspect
            sourceX = Math.floor((640 - sourceWidth) / 2); // Center horizontally
            sourceY = 0; // Start at top
        } else {
            // Camera is taller than target - crop top/bottom
            sourceWidth = 640; // Use full width
            sourceHeight = Math.floor(sourceWidth / targetAspect); // Calculate height to match target aspect
            sourceX = 0; // Start at left
            sourceY = Math.floor((480 - sourceHeight) / 2); // Center vertically
        }
        
        // Extract cropped region from webcam feed
        let croppedImg = capture.get(sourceX, sourceY, sourceWidth, sourceHeight);
        
        // Apply duotone filter if enabled (red/black surveillance aesthetic)
        if (duotoneEnabled) {
            applyDuotone(croppedImg, shadowColorHex, highlightColorHex);
        }
        
        // Draw processed webcam feed to calculated target area
        image(croppedImg, targetX, targetY, targetWidth, targetHeight);
    }
}

// ==================== TEXT DISPLAY FUNCTIONS ====================

function drawSurveillanceText() {
    let padding = 40; // Standard screen padding
    let separatorX = getSeparatorX(); // Get divider position for alignment
    let cameraHeight = height * 0.6; // Match camera display height
    
    // Draw main title
    fill(0); // Black text color
    textAlign(LEFT); // Left-align text
    textSize(32); // Large text for prominence
    textFont('Azeret Mono'); // Monospace font for technical/surveillance aesthetic
    // Position title below camera area
    text("SURVEILLANCE IN PROGRESS", separatorX + padding, padding + cameraHeight + 50);
    
    // Draw surveillance messages progressively
    textSize(14); // Smaller text for messages
    let yPos = padding + cameraHeight + 90; // Starting y-position for messages
    
    // Only show messages up to current index
    for (let i = 0; i <= currentMessageIndex && i < surveillanceMessages.length; i++) {
        text(surveillanceMessages[i], separatorX + padding, yPos + i * 25);
    }
    
    // Handle message progression logic
    if (mouseHasMoved && currentMessageIndex < 0) {
        // Start showing messages when mouse moves
        currentMessageIndex = 0;
        lastMessageTime = millis();
    } else if (currentMessageIndex >= 0 && currentMessageIndex < 5) {
        // Progress through first 5 messages normally (indices 0-4)
        if (millis() - lastMessageTime > 2000) { // 2 seconds delay
            currentMessageIndex++;
            lastMessageTime = millis(); // Record when this message was shown
        }
    } else if (currentMessageIndex === 5) {
        // Show "click anywhere" message and wait for click
        waitingForClick = true;
        if (userHasClicked) {
            currentMessageIndex++;
            waitingForClick = false;
        }
    }
    // Message index 6 (final message) stays visible once shown
}

function drawTimeDisplay() {
    let padding = 40; // Standard screen padding
    let cameraHeight = height * 0.6; // Match camera area height for alignment
    
    // Configure text appearance
    fill(0); // Black text
    textAlign(RIGHT); // Right-align for top-right positioning
    textSize(14); // Small text size
    textFont('Azeret Mono'); // Monospace font for digital clock aesthetic
    
    // Calculate elapsed time since sketch started (keeping milliseconds)
    let totalMs = millis() - startTime; // Total elapsed milliseconds
    let elapsed = totalMs / 1000; // Convert to seconds for hour/minute calculations
    
    // Break down elapsed time into hours, minutes, seconds, milliseconds
    let hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    let minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    let seconds = Math.floor(elapsed % 60).toString().padStart(2, '0');
    let milliseconds = Math.floor((totalMs % 1000) / 10).toString().padStart(2, '0'); // Get first two digits of milliseconds (00-99)
    
    // Display formatted time with two millisecond digits in top-right corner
    text(`${hours}:${minutes}:${seconds}:${milliseconds}`, width - padding, padding + cameraHeight + 50);
}

// ==================== INTERACTIVE FACE ELEMENT ====================

function drawInteractiveFace() {
    // Position face in bottom-right corner
    let padding = 40;
    let faceX = width - padding - 40; // X-position (from right edge)
    let faceY = height - padding - 40; // Y-position (from bottom edge)
    let faceSize = 60; // Diameter of face circle
    
    // Draw face outline circle
    noFill(); // No fill color (transparent)
    stroke(0); // Black outline
    strokeWeight(1); // Thin line
    circle(faceX, faceY, faceSize);
    
    // Calculate eye direction based on mouse position
    let mouseAngle = atan2(mouseY - faceY, mouseX - faceX); // Angle from face center to mouse
    let eyeDistance = 6; // How far eyes move from center
    // Calculate eye offset coordinates using trigonometry
    eyeX = cos(mouseAngle) * eyeDistance;
    eyeY = sin(mouseAngle) * eyeDistance;
    
    // Configure eye drawing
    fill(0); // Black eyes
    noStroke(); // No outline on eyes
    
    // Handle automatic blinking animation
    blinkTimer++; // Increment blink timer each frame
    if (blinkTimer > 180) { // After 3 seconds (180 frames at 60fps)
        isBlinking = true; // Start blink
        if (blinkTimer > 190) { // After 10 frames of blinking
            isBlinking = false; // End blink
            blinkTimer = 0; // Reset timer for next blink cycle
        }
    }
    
    // Draw eyes based on blink state
    if (!isBlinking) {
        // Draw normal circular eyes that track mouse
        circle(faceX - 12 + eyeX * 0.3, faceY - 8 + eyeY * 0.3, 6); // Left eye
        circle(faceX + 12 + eyeX * 0.3, faceY - 8 + eyeY * 0.3, 6); // Right eye
    } else {
        // Draw closed eyes as horizontal ellipses
        ellipse(faceX - 12, faceY - 8, 12, 2); // Left closed eye
        ellipse(faceX + 12, faceY - 8, 12, 2); // Right closed eye
    }
    
    // Draw mouth as horizontal line
    fill(0); // Black mouth
    noStroke(); // No outline
    rect(faceX - 10, faceY + 12, 20, 1); // Rectangular mouth (20px wide, 1px tall)
}

// ==================== EVENT HANDLERS ====================

function mouseMoved() {
    // Trigger first message when mouse moves
    if (!mouseHasMoved) {
        mouseHasMoved = true;
        console.log("Mouse movement detected - surveillance initiated");
    }
}

function mousePressed() {
    console.log("Screen clicked!"); // Log interaction for debugging
    
    if (waitingForClick) {
        // User clicked after "click to get out" message
        userHasClicked = true;
        console.log("User tried to escape - showing final message");
    }
    
    captureScreenshot(); // Take screenshot when user clicks
}

function windowResized() {
    // Handle browser window resize by adjusting canvas size
    resizeCanvas(windowWidth, windowHeight);
}

// ==================== DUOTONE FILTER IMPLEMENTATION ====================
// The following functions implement the duotone color effect

// Convert hex color string to RGB object
// Source: Common hex-to-RGB conversion algorithm (public domain)
function hexToRgb(hex) {
    // Use regular expression to parse hex color format
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16), // Parse red component
        g: parseInt(result[2], 16), // Parse green component
        b: parseInt(result[3], 16)  // Parse blue component
    } : { r: 0, g: 0, b: 0 }; // Return black if parsing fails
}

/**
 * Apply duotone effect to a p5.Image
 * Based on technique found in Google AI Overview (cited above)
 * @param {p5.Image} img - The image to modify (modified in-place)
 * @param {string} shadowHex - Hex color for dark areas
 * @param {string} highlightHex - Hex color for light areas
 */
function applyDuotone(img, shadowHex, highlightHex) {
    // Validate input image
    if (!img || !img.loadPixels) return;
    
    // Convert hex colors to RGB objects
    const shadow = hexToRgb(shadowHex);
    const highlight = hexToRgb(highlightHex);
    
    // Load pixel data for manipulation
    img.loadPixels();
    const pixels = img.pixels; // Get reference to pixel array
    
    // Safety check for empty pixel array
    if (!pixels || pixels.length === 0) {
        return; // Exit if no pixel data available
    }
    
    // Process each pixel (RGBA format: 4 values per pixel)
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];     // Red component
        const g = pixels[i + 1]; // Green component  
        const b = pixels[i + 2]; // Blue component
        // Alpha component at pixels[i + 3] remains unchanged
        
        // Calculate luminance using standard RGB-to-grayscale weights
        // These coefficients account for human eye sensitivity to different colors
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        
        // Map luminance to blend between shadow and highlight colors
        // luminance = 0 (dark) → full shadow color
        // luminance = 1 (light) → full highlight color
        pixels[i]     = Math.round(shadow.r * (1 - luminance) + highlight.r * luminance);
        pixels[i + 1] = Math.round(shadow.g * (1 - luminance) + highlight.g * luminance);
        pixels[i + 2] = Math.round(shadow.b * (1 - luminance) + highlight.b * luminance);
        // Alpha channel (pixels[i + 3]) is left unchanged
    }
    
    // Apply the modified pixel data back to the image
    img.updatePixels();
}