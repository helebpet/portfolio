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

// Fake "surveillance" log messages, revealed one at a time for artistic effect.
// The last two are special: the second-to-last waits for a click, the last
// shows only after the user clicks (handled in buildFeed / drawSurveillanceText).
let surveillanceMessages = [
    "[REC] motion detected. recording has started",                 // triggers on mouse movement
    "[MESSAGE] you are not the customer here. you are the product",
    "[SCAN] reading facial expression... mild discomfort detected",
    "[LOG] cross-referencing your face with everyone you know",
    "[STATUS] you have blinked 14 times since you arrived",
    "[NOTE] attention span below average. you have been flagged",
    "[MESSAGE] click anywhere to leave (this will not let you leave)", // waits for click
    "[ALERT] a photo of you has been saved and may be used against you" // shows after click
];

let currentMessageIndex = -1; // Start at -1 so no messages show initially
let lastMessageTime = 0; // Timestamp when last message was shown
let blinkTimer = 0; // Counter for controlling the automatic blinking animation of the interactive face
let isBlinking = false; // Boolean flag to track whether the face is currently in blink state
let mouseHasMoved = false; // Track if mouse has moved to trigger first message
let waitingForClick = false; // Track if we're waiting for user to click
let userHasClicked = false; // Track if user has clicked after the "click to get out" message
let cameraReady = false; // Becomes true once the user allows the camera and the feed is ready

// Screenshot functionality variables
let screenshots = []; // Array to store screenshot objects (each contains image and timestamp)
const MAX_SCREENSHOTS = 300; // Safety cap on stored photos (high, so you can scroll back to the first)
let filmOffset = 0;   // Animated vertical offset so the strip slides down when a new photo is taken
let filmScroll = 0;   // User scroll position through the film strip (mouse wheel over the band)
let maxFilmScroll = 0; // Maximum scroll distance, based on how many photos exist
let totalShots = 0;   // Total photos ever taken; keeps counting up so captures feel unlimited

// Film-strip frame dimensions (shared by capture animation and drawing)
const SHOT_FRAME_W = 160; // Photo width
const SHOT_PHOTO_H = 160; // Square photo height
const SHOT_LABEL_H = 46;  // Label area below each photo (subject id + timestamp)
const SHOT_FRAME_H = SHOT_PHOTO_H + SHOT_LABEL_H; // Total height of one film frame
const SHOT_FRAME_GAP = 16; // Vertical gap between film frames

// Real client-data harvest (genuinely read from the browser/device),
// mixed into the surveillance message feed below.
let harvestData = [];    // Lines of collected data
let batterySlot = -1;    // Index of the battery line within harvestData (updated async)
let feed = [];           // Combined feed: surveillance messages + harvested data, interleaved

// --- Sound effects (generated live with p5.sound, no audio files) ---
let beepOsc, beepEnv;    // Oscillator + envelope used for all short beeps
let audioReady = false;  // True once the audio context is started by a user gesture
let lastRadarPing = 0;   // Timing for the ambient radar ping

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
    
    // Timer does NOT start here. It begins only once the user allows the
    // camera (see the cameraReady check in draw()).
    startTime = 0;

    // Read real device/browser data, then mix it into the message feed
    collectClientData();
    buildFeed();

    // Log to browser console for debugging purposes
    console.log("Surveillance system initiated...");
}

function draw() {
    // Set background to surveillance red color (RGB: 204, 0, 0)
    background(204, 0, 0);

    // Detect the moment the user grants camera access and the feed is ready.
    // Only then do the timer and the surveillance messages begin.
    if (!cameraReady && capture && capture.loadedmetadata) {
        cameraReady = true;
        startTime = millis();       // Start the elapsed-time counter now
        lastMessageTime = millis(); // Message progression counts from here too
    }

    // Soft ambient radar ping once the camera is live
    if (cameraReady && audioReady && millis() - lastRadarPing > 3200) {
        lastRadarPing = millis();
        beep(660, 0.08, 0.28);
    }

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
    let padding = 40;            // Distance from left edge of screen
    let frameW = SHOT_FRAME_W;   // Photo width
    let photoH = SHOT_PHOTO_H;   // Square photo height
    let frameH = SHOT_FRAME_H;   // Total height of one film frame (photo + label)
    let gap = SHOT_FRAME_GAP;    // Vertical gap between frames
    let holeMargin = 16;         // Sprocket-hole strip width on each side
    let bandX = padding - holeMargin;       // Left edge of the black film band
    let bandW = frameW + holeMargin * 2;    // Total film band width

    // Ease the strip back to rest so each new capture slides down smoothly
    filmOffset += (0 - filmOffset) * 0.18;
    if (Math.abs(filmOffset) < 0.3) filmOffset = 0;

    // Compute how far the user can scroll back through the whole tape
    let viewTop = padding;
    let viewHeight = height - padding * 2;
    let contentHeight = screenshots.length * (frameH + gap);
    maxFilmScroll = Math.max(0, contentHeight - viewHeight);
    filmScroll = constrain(filmScroll, 0, maxFilmScroll);

    // Combined offset: animation slide + user scroll position
    let scrollY = filmOffset - filmScroll;

    // --- Film base: near-black band running the full height ---
    noStroke();
    fill(12);
    rect(bandX, 0, bandW, height);

    // --- Sprocket holes down both edges, scrolling with the film ---
    let holeSpacing = 26;
    let holeW = 8, holeH = 14;
    fill(196, 32, 24); // red background shows through the holes
    let startY = (scrollY % holeSpacing) - holeSpacing;
    for (let y = startY; y < height + holeSpacing; y += holeSpacing) {
        rect(bandX + 4, y, holeW, holeH, 2);
        rect(bandX + bandW - 4 - holeW, y, holeW, holeH, 2);
    }

    // --- Photo frames, newest at the top, clipped to the film band ---
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(bandX, 0, bandW, height);
    drawingContext.clip();

    for (let i = 0; i < screenshots.length; i++) {
        let frameY = padding + scrollY + i * (frameH + gap);
        // Skip frames scrolled fully off-screen
        if (frameY > height || frameY + frameH < 0) continue;

        let photoX = padding;
        let photoY = frameY;

        // White booking-photo border around the mugshot
        noFill();
        stroke(235);
        strokeWeight(2);
        rect(photoX - 4, photoY - 4, frameW + 8, photoH + 8);
        noStroke();

        // Grayscale mugshot image (already grayscaled at capture time)
        if (screenshots[i].image) {
            image(screenshots[i].image, photoX, photoY, frameW, photoH);
        }

        // Booking placard: subject id + capture time
        textFont('Azeret Mono');
        textAlign(LEFT);
        fill(235);
        textSize(13);
        let idStr = 'SUBJECT #' + screenshots[i].id.toString().padStart(4, '0');
        text(idStr, photoX, photoY + photoH + 20);
        fill(170);
        textSize(11);
        text(screenshots[i].timestamp, photoX, photoY + photoH + 38);
    }

    drawingContext.restore();

    // --- Scroll indicator on the right edge of the band ---
    if (maxFilmScroll > 0) {
        let trackX = bandX + bandW - 4;
        let thumbH = Math.max(24, viewHeight * (viewHeight / contentHeight));
        let thumbY = viewTop + (viewHeight - thumbH) * (filmScroll / maxFilmScroll);
        noStroke();
        fill(255, 50);
        rect(trackX, viewTop, 2, viewHeight);
        fill(255, 190);
        rect(trackX, thumbY, 2, thumbH, 1);
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
        croppedImg.filter(GRAY); // Grayscale once here so drawing stays cheap while scrolling

        // Generate timestamp string in 12-hour format (HH:MM:SS AM/PM)
        let now = new Date(); // Get current date/time
        let hours = now.getHours(); // 24-hour format initially
        let minutes = now.getMinutes().toString().padStart(2, '0'); // Ensure 2 digits
        let seconds = now.getSeconds().toString().padStart(2, '0'); // Ensure 2 digits
        let ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM/PM suffix
        hours = hours % 12 || 12; // Convert to 12-hour format (12 instead of 0)
        let hoursStr = hours.toString().padStart(2, '0'); // Ensure 2 digits
        let timestamp = `${hoursStr}:${minutes}:${seconds} ${ampm}`; // Assemble final timestamp
        
        // Assign an ever-increasing subject id so the running count feels unlimited
        totalShots++;
        let screenshot = { image: croppedImg, timestamp: timestamp, id: totalShots };
        screenshots.unshift(screenshot); // Newest photo goes to the top of the strip

        // Push the whole strip up by one frame, then ease it back to rest, so the
        // new photo appears to feed in from the top like advancing film.
        filmOffset = -(SHOT_FRAME_H + SHOT_FRAME_GAP);
        filmScroll = 0; // Jump back to the newest photo at the top when a new one is taken

        // Keep only the most recent photos in memory (older frames have scrolled off)
        if (screenshots.length > MAX_SCREENSHOTS) {
            screenshots = screenshots.slice(0, MAX_SCREENSHOTS); // Keep only first MAX_SCREENSHOTS items
        }

        playShutter(); // Camera-shutter beep

        // Log to console for debugging
        console.log("Screenshot captured at " + timestamp + " (subject #" + totalShots + ")");
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

    // Messages only appear once the user has allowed the camera.
    if (!cameraReady || feed.length === 0) return;

    // Handle feed progression logic. The "click to get out" line is the
    // second-to-last item; the final line shows only after the user clicks.
    let waitIndex = feed.length - 2;
    if (mouseHasMoved && currentMessageIndex < 0) {
        // Start streaming the feed when the mouse first moves
        currentMessageIndex = 0;
        lastMessageTime = millis();
        playLineBeep(currentMessageIndex);
    } else if (currentMessageIndex >= 0 && currentMessageIndex < waitIndex) {
        // Reveal the next line on a steady interval
        if (millis() - lastMessageTime > 2800) {
            currentMessageIndex++;
            lastMessageTime = millis();
            playLineBeep(currentMessageIndex);
        }
    } else if (currentMessageIndex === waitIndex) {
        // Show "click anywhere" line and wait for the user to click
        waitingForClick = true;
        if (userHasClicked) {
            currentMessageIndex++;
            waitingForClick = false;
            playLineBeep(currentMessageIndex);
        }
    }
    // Final line stays visible once shown.

    // Draw a scrolling window of the most recent feed lines (messages + data).
    // The number of visible lines adapts so the log never runs below the bottom
    // margin (where the tracking face sits).
    textSize(14);
    let lineSpacing = 22;
    let yStart = padding + cameraHeight + 90;
    let bottomLimit = height - padding; // stay within the bottom margin
    let visibleCount = Math.max(1, Math.floor((bottomLimit - yStart) / lineSpacing));
    let startI = Math.max(0, currentMessageIndex - visibleCount + 1);
    let row = 0;
    for (let i = startI; i <= currentMessageIndex && i < feed.length; i++) {
        let item = feed[i];
        // Data items read live from harvestData so the battery line stays current
        let line = item.t === 'data' ? harvestData[item.i] : item.s;
        fill(0);
        text(line, separatorX + padding, yStart + row * lineSpacing);
        row++;
    }
}

function drawTimeDisplay() {
    // The elapsed-time counter only runs once the user has allowed the camera.
    if (!cameraReady) return;

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

// ==================== REAL CLIENT-DATA HARVEST ====================

// Identify the browser from the user-agent string (best-effort, real data)
function shortBrowser() {
    let ua = navigator.userAgent;
    let m;
    if ((m = ua.match(/Edg\/([\d.]+)/)))                 return "Edge " + m[1].split('.')[0];
    if ((m = ua.match(/OPR\/([\d.]+)/)))                 return "Opera " + m[1].split('.')[0];
    if ((m = ua.match(/Chrome\/([\d.]+)/)))              return "Chrome " + m[1].split('.')[0];
    if ((m = ua.match(/Firefox\/([\d.]+)/)))             return "Firefox " + m[1].split('.')[0];
    if ((m = ua.match(/Version\/([\d.]+).*Safari/)))     return "Safari " + m[1].split('.')[0];
    return "unknown browser";
}

// Gather genuine browser/device information into the harvest list
function collectClientData() {
    let nav = navigator;
    let lines = [];

    let tz = '?';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}

    lines.push("[DATA] os: " + (nav.platform || 'unknown'));
    lines.push("[DATA] browser: " + shortBrowser());
    lines.push("[DATA] language: " + (nav.language || '??'));
    lines.push("[DATA] region: " + tz);
    lines.push("[DATA] screen: " + screen.width + "x" + screen.height);
    lines.push("[DATA] cpu cores: " + (nav.hardwareConcurrency || '?'));
    if (nav.deviceMemory) lines.push("[DATA] memory: " + nav.deviceMemory + " GB");
    lines.push("[DATA] touch: " + (nav.maxTouchPoints || 0) + " points");
    if (nav.connection && nav.connection.effectiveType) {
        lines.push("[DATA] network: " + nav.connection.effectiveType);
    }
    lines.push("[DATA] cookies: " + (nav.cookieEnabled ? 'enabled' : 'blocked'));
    lines.push("[DATA] came from: " +
        (document.referrer ? document.referrer.replace(/^https?:\/\//, '').slice(0, 26) : 'direct visit'));

    batterySlot = lines.length;
    lines.push("[DATA] battery: scanning...");

    lines.push("[DATA] do-not-track: " + (nav.doNotTrack === '1' ? 'on (ignored anyway)' : 'off'));
    lines.push("[ALERT] all of the above stored forever");

    harvestData = lines;

    // Battery is read asynchronously where the browser supports it
    if (nav.getBattery) {
        nav.getBattery().then(function (b) {
            function upd() {
                harvestData[batterySlot] = "[DATA] battery: " + Math.round(b.level * 100) +
                    "% " + (b.charging ? "(charging)" : "(draining)");
            }
            upd();
            b.addEventListener('levelchange', upd);
            b.addEventListener('chargingchange', upd);
        }).catch(function () {
            harvestData[batterySlot] = "[DATA] battery: access denied";
        });
    } else {
        harvestData[batterySlot] = "[DATA] battery: unavailable";
    }
}

// Interleave the surveillance messages with the harvested data into one feed.
// Data items are stored as references ({t:'data', i}) so live values (battery)
// stay current when rendered.
function buildFeed() {
    let msgs = surveillanceMessages;
    let escapeMsg = msgs[msgs.length - 2]; // "click anywhere to get out"
    let finalMsg = msgs[msgs.length - 1];  // "embarrassing photo sent..."
    let early = msgs.slice(0, msgs.length - 2); // everything before those two

    let f = [];
    let maxLen = Math.max(early.length, harvestData.length);
    for (let i = 0; i < maxLen; i++) {
        if (i < early.length) f.push({ t: 'msg', s: early[i] });
        if (i < harvestData.length) f.push({ t: 'data', i: i });
    }
    f.push({ t: 'msg', s: escapeMsg });
    f.push({ t: 'msg', s: finalMsg });

    feed = f;
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
    initAudio(); // Start audio on first gesture (browsers require this)
    // Trigger first message when mouse moves
    if (!mouseHasMoved) {
        mouseHasMoved = true;
        console.log("Mouse movement detected - surveillance initiated");
    }
}

function mousePressed() {
    initAudio(); // Start audio on first gesture (browsers require this)
    console.log("Screen clicked!"); // Log interaction for debugging

    if (waitingForClick) {
        // User clicked after "click to get out" message
        userHasClicked = true;
        console.log("User tried to escape - showing final message");
    }
    
    captureScreenshot(); // Take screenshot when user clicks
}

function mouseWheel(event) {
    // Scroll through the film strip when the cursor is over the band, so the
    // user can reach the very first photos. Returns false to stop the page
    // itself from scrolling.
    let padding = 40;
    let holeMargin = 16;
    let bandX = padding - holeMargin;
    let bandW = SHOT_FRAME_W + holeMargin * 2;

    if (mouseX >= bandX && mouseX <= bandX + bandW) {
        filmScroll = constrain(filmScroll + event.delta, 0, maxFilmScroll);
        return false;
    }
}

function windowResized() {
    // Handle browser window resize by adjusting canvas size
    resizeCanvas(windowWidth, windowHeight);
}

// ==================== SOUND EFFECTS ====================

// Start the audio context (must follow a user gesture) and build the beep voice
function initAudio() {
    if (audioReady) return;
    if (typeof userStartAudio === 'function') userStartAudio();
    beepEnv = new p5.Envelope();
    beepEnv.setADSR(0.001, 0.03, 0.0, 0.06);
    beepEnv.setRange(0.25, 0);
    beepOsc = new p5.Oscillator('sine');
    beepOsc.amp(beepEnv);
    beepOsc.start();
    audioReady = true;
}

// Play a short beep at a given frequency, level and release time
function beep(freq, level, release) {
    if (!audioReady || !beepOsc) return;
    beepOsc.freq(freq);
    beepEnv.setADSR(0.001, 0.03, 0.0, release || 0.06);
    beepEnv.setRange(level || 0.2, 0);
    beepEnv.play(beepOsc);
}

// Beep tuned to the type of feed line being revealed
function playLineBeep(idx) {
    let item = feed[idx];
    if (!item) return;
    let line = item.t === 'data' ? harvestData[item.i] : item.s;
    if (line && line.indexOf('[ALERT]') === 0) {
        beep(300, 0.28, 0.16);   // low, urgent tone for alerts
    } else if (item.t === 'data') {
        beep(1400, 0.14, 0.04);  // quick high blip for harvested data
    } else {
        beep(880, 0.18, 0.06);   // mid beep for messages
    }
}

// Two-tone camera-shutter beep when a photo is captured
function playShutter() {
    beep(720, 0.24, 0.05);
    setTimeout(function () { beep(420, 0.24, 0.08); }, 70);
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