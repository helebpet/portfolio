// WEB COOKIES ART PROJECT - P5.JS
// Original concept and design by Petra Helebrantová
// Created: September 15, 2025

// AI ASSISTANCE ACKNOWLEDGMENT:
// ChatGPT (OpenAI) and Claude AI (Anthropic) were used between 09/06/2025 and 09/15/2025 to help with:
// - Code commenting and documentation
// - Proper source citation formatting
// - Code organization suggestions
// - Implementation assistance for interactive cookie modal behavior
// - Physics-based button escape mechanics (ORIGINAL CONCEPT BY STUDENT)
// - Scrollable text area functionality
// - Responsive layout calculations
// - Mouse interaction and drag scrolling features
// - Button styling consistency and content-based sizing
// The core creative vision, artistic concept, and overall design were developed independently by the student.
// 
// STUDENT'S ORIGINAL CREATIVE IDEAS:
// - Making the "Manage Settings" button disappear and move freely to escape the mouse cursor
// - The concept of an unclickable/evasive button as artistic commentary on dark patterns
// - Physics-based mouse avoidance behavior for escaped button
// AI provided technical implementation assistance for these creative concepts.

// P5.JS LIBRARY:
// This project uses the p5.js library (https://p5js.org/)
// Created by Lauren McCarthy and the Processing Foundation
// Licensed under LGPL 2.1

// ==================== GLOBAL VARIABLES ====================

// Scroll and interaction state variables
let scrollOffset = 0;              // Current vertical scroll position in text area (pixels)
let maxScroll = 0;                 // Maximum scrollable distance calculated from content height
let textContentHeight = 0;         // Total height of all wrapped text content in pixels
let freeButton = null;             // Escaped button object containing position and physics data
let showOriginalManage = true;     // Flag controlling visibility of original manage settings button
let isDragging = false;            // Boolean tracking mouse drag state for text scrolling
let lastMouseY = 0;                // Previous mouse Y coordinate for drag distance calculation

// ==================== P5.JS CORE FUNCTIONS ====================

function setup() {
    // Create full-screen canvas for immersive cookie modal experience
    let canvas = createCanvas(windowWidth, windowHeight);
    // Attach canvas to specific HTML container element
    canvas.parent('p5-container');  
    
    // Set default font to Azeret Mono for consistent typography throughout interface
    textFont('Azeret Mono');
    
    // Log initialization for debugging purposes
    console.log("Canvas initialized:", windowWidth + "x" + windowHeight);
}

function draw() {
    // Clear previous frame content to prevent visual artifacts
    clear();
    
    // Draw semi-transparent overlay covering entire screen (cookie modal backdrop)
    fill(0, 0, 0, 153);            // Black with 60% opacity (153/255 = 0.6)
    noStroke();                     // Remove border outline
    rect(0, 0, width, height);     // Fill entire canvas area
    
    // Calculate responsive banner dimensions based on screen size
    let bannerWidth = min(width * 0.8, 600);   // 80% of screen width, maximum 600px
    let bannerHeight = min(height * 0.6, 400); // 60% of screen height, maximum 400px
    let bannerX = (width - bannerWidth) / 2;   // Center horizontally on screen
    let bannerY = (height - bannerHeight) / 2; // Center vertically on screen
    
    // Draw main banner background with sharp rectangular corners
    fill(255);                      // White background for readability
    noStroke();                     // No border outline
    rect(bannerX, bannerY, bannerWidth, bannerHeight); // Main modal container
    
    // Calculate responsive text sizes based on banner dimensions
    let titleSize = min(width * 0.04, 32);     // Title font size: 4% of width, max 32px
    let bodySize = min(width * 0.011, 9);      // Body font size: tiny, hard-to-read legalese
    let padding = bannerWidth * 0.08;          // Internal padding: 8% of banner width
    let textMaxWidth = bannerWidth - (padding * 2) - 20; // Available width for text (minus scrollbar)
    
    // Configure and draw title text
    fill(0);                        // Black text for high contrast
    noStroke();                     // No text outline
    textAlign(LEFT);                // Left-align text for readability
    textSize(titleSize);            // Apply calculated title size
    textStyle(BOLD);                // Bold font weight for emphasis
    
    // Smart title wrapping to ensure exactly 2 lines with no widows/orphans
    let titleText = "WE USE COOKIES TO IMPROVE YOUR EXPERIENCE!";
    let titleLines = wrapTitleSmartly(titleText, textMaxWidth + 20, titleSize);
    
    // Render each line of wrapped title text
    for (let i = 0; i < titleLines.length; i++) {
        text(titleLines[i], 
             bannerX + padding,                               // X position with padding
             bannerY + padding + titleSize + (i * titleSize * 1.2)); // Y position with line spacing
    }
    
    // Calculate dimensions for scrollable text area
    let titleHeight = titleLines.length * titleSize * 1.2;   // Total height of title section
    let textAreaY = bannerY + padding + titleSize + titleHeight + 10; // Start Y of scrollable area
    let buttonHeight = max(40, bannerHeight * 0.12);         // Button height: 12% of banner, min 40px
    let textAreaHeight = bannerY + bannerHeight - padding - buttonHeight - 20 - textAreaY; // Remaining height
    
    // Configure body text display
    textStyle(NORMAL);              // Remove bold formatting for body text
    textSize(bodySize);             // Set body text size
    
    // Long, varied cookie policy text so the user must scroll seemingly forever.
    let bodyText =
        "We and our trusted partners use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and deliver personalized content and advertisements. These essential tools help us understand how you interact with our website, remember your preferences, and provide you with relevant offers tailored to your interests. " +
        "We bake our cookies fresh each day, then track you in a sneaky way. The button's far, the text is small, you'll scroll and scroll and scroll and crawl. " +
        "1. INFORMATION WE COLLECT. We automatically collect your IP address, approximate and precise geolocation, device identifiers, operating system, browser type and version, screen resolution, battery level, installed fonts, language settings, time zone, and a unique fingerprint derived from the combination of these signals. We also collect every page you view, the order in which you view them, how long you hover over each element, your scroll depth, your mouse movement velocity, your typing cadence, and the exact coordinates of every click and tap. " +
        "We see you squint, we see you sigh, we watch the cursor wander by. We log the way you tap and type, we know your mood before you gripe. " +
        "2. HOW WE USE YOUR DATA. Your information is used to build a comprehensive behavioral profile that predicts your purchasing intent, emotional state, susceptibility to discounts, and likelihood of returning. We use this profile to dynamically adjust prices, reorder search results, and select which advertisements will be most difficult for you to ignore. " +
        "The price goes up, the price goes down, depending on your hometown frown. If you seem rich, you'll pay a lot; if you seem keen, you'll pay the lot. " +
        "3. WHO WE SHARE IT WITH. We share your data with more than nine hundred and forty carefully selected advertising partners, data brokers, analytics providers, insurance affiliates, credit assessment agencies, and other entities whose identities may change at any time without notice to you. Each of these partners may combine your data with information they have acquired from other sources to enrich their own profiles of you. " +
        "Nine hundred friends, and maybe more, all knocking gently on your door. They trade your secrets, swap your name, then send it back to us again. " +
        "4. COOKIES AND BEACONS. In addition to standard cookies, we deploy web beacons, pixel tags, local storage objects, session replay scripts, and ultrasonic cross-device tracking signals that allow us to recognize you across every device in your household. These technologies cannot be fully disabled while continuing to use the service. " +
        "A beacon here, a pixel there, a tiny sound beneath the air. Your phone, your watch, your fridge, your car, we find you, friend, wherever you are. " +
        "5. DATA RETENTION. We retain your personal data for as long as we deem it commercially useful, which in practice means indefinitely. Anonymized, aggregated, pseudonymized, hashed, and de-identified copies of your data may persist forever and are explicitly excluded from any deletion request you may submit. " +
        "You ask us, kindly, to delete; we smile and nod and then retreat. Your data lives, it never dies, it haunts our servers in the skies. " +
        "6. YOUR CHOICES. You may attempt to manage your preferences using the settings panel, although the controls are intentionally numerous, the defaults are intentionally permissive, and any choice you make will be forgotten the next time you clear your cookies, switch devices, or visit from a slightly different web address. " +
        "Of course you have a lovely choice, we gave it the tiniest voice. Toggle a hundred switches right, then watch them reset overnight. " +
        "7. INTERNATIONAL TRANSFERS. Your data may be transferred to, stored in, and processed within jurisdictions that do not provide the same level of legal protection as your home country, and by continuing you waive any objection to such transfers. " +
        "Your data packs a little case and jets off to a faraway place. No passport, visa, fuss, or fee, it travels so much more than thee. " +
        "8. CHANGES TO THIS POLICY. We may revise this policy at any moment, and your continued use of the site constitutes immediate acceptance of every future version, including versions that have not yet been written. " +
        "This policy shifts beneath your feet, a clause we haven't drafted yet. By reading on you'll soon agree to terms that are a mystery. " +
        "A NOTE ON OUR METHODS. Rest assured, we would never love-bomb you, that would be unprofessional and, frankly, beneath us. We simply rely on every other manipulative strategy available to keep you right here: manufactured urgency, carefully engineered dark patterns, a 'Manage Settings' button that physically sprints away from your cursor, and a consent form designed so you give up and accept long before you ever finish reading it. It is not personal. It is just optimization. " +
        "9. THE PART YOU SKIPPED. We know you're skimming, scrolling fast, just hoping that this wall will pass. But keep on going, don't you stop, the buttons wait right at the top of one more page, and then one more, behind a hidden trapped-up door. " +
        "10. STILL HERE? Impressive! Truly! What devotion! You've scrolled across a whole big ocean. Your patience, frankly, is sublime, and yet you've wasted all your time. " +
        "11. ALMOST THERE. We promise that the end is near, the very same thing we said last year. Just one more paragraph to read, then one more, just to plant the seed. " +
        "12. FINE PRINT FINALE. By continuing to use this site, you consent to all of the above, including the collection, sharing, and indefinite retention of your data, and you confirm that you have read this entire notice in full, which statistically you have not. So thanks for scrolling, what a ride; the tiny buttons hide with pride. You wanted out? You wanted free? You should have simply closed the tab, you see. " +
        "13. BONUS: A LITTLE CULTURE, AS A REWARD. You actually scrolled all the way to the very bottom. Statistically, almost nobody does this, so as a small thank-you (and because you clearly have nowhere better to be) here is the cultural section of this cookie policy: two real poems, written by a real human, about a very real man. No cookies required to read them. Please hold your applause until the end. // RELATIONSHIP OPTIMIZATION: You kept Subject A as your baseline test. / You managed Subject B, your ex, close to your vest. / You added Subject C, self-convinced of being the best. / You're running Subject D now, she thinks she's blessed. // The system ran on calculated rotation. / The overlap required careful coordination. / The Austrian trip, a strategic proposal operation, / a masterclass, you thought, in relationship optimization. // But athletic circles proved too tight, too small. / The network spread the word, exposing it all. / Your perfect system crumbled when the stories spread. / Now Subject D's unaware she's just filling the bed. // THANK U: Thank you for the disillusionment and pain. / Thank you for driving me halfway insane. / Thank you for showing me I was delulu. / Thank you for every lie I thought was true. / Thank you for the silence, loud and cruel. / Thank you for replacing me so quick, you're so cool. / Thank you for the text that made me cry. / Thank you for unfollowing when you knew I'd say goodbye. / Thank you for the stories you told behind my back. / Thank you for everything I seemed to lack. / Thank you for the Oscar-worthy performance you gave. / Thank you for the Emmy-level lies, so brave. / Thank you for the lessons that made me weep. / Thank you for the nights I couldn't sleep. / Thank you for the grief that wouldn't end. / Thank you for pretending to be my friend. / Thank you for teaching me to forgive. / Thank you for showing me how not to live. / Thank you, thank you, thank you for it all. / Thank you for watching me rise after the fall. // IN CASE THE METAPHOR WAS A LITTLE TOO SUBTLE: yes, that was about a guy who studies humor for a living and then ran his love life like an A/B/C/D/E... test, and honestly who knows how far down the alphabet he actually got. Multiple girlfriends in parallel, careful traffic allocation, an Austrian deployment, a whole product roadmap of the heart. He optimized for everything except not getting caught, the one metric that matters. Full disclosure: these poems are already a little out of date, he has since dumped Subject D and his entire roster has rotated at least once more, so please treat this as a historical document. Zero stars, would not recommend, genuinely excellent source material though. Either way, we hope it made you giggle a little, or feel a little less alone if you have been through something similar, or, hi, if you happen to be on his current roster. Anyway, now that we have cried together, you may accept the cookies. You have earned them.";
    
    // Process text for scrollable display
    let lines = wrapText(bodyText, textMaxWidth, bodySize);   // Break text into wrapped lines
    let lineHeight = bodySize * 1.4;                         // Line spacing: 140% of font size
    textContentHeight = lines.length * lineHeight;           // Calculate total content height
    maxScroll = max(0, textContentHeight - textAreaHeight);  // Calculate maximum scroll needed
    
    // Create clipping mask to contain scrolling text within designated area
    drawingContext.save();                                    // Save current drawing state
    drawingContext.beginPath();                              // Begin clipping path definition
    drawingContext.rect(bannerX + padding, textAreaY, textMaxWidth, textAreaHeight); // Define clip rectangle
    drawingContext.clip();                                   // Apply clipping mask
    
    // Render visible text lines with scroll offset applied
    for (let i = 0; i < lines.length; i++) {
        // Calculate line Y position with scroll offset applied
        let lineY = textAreaY + (i * lineHeight) - scrollOffset + bodySize;
        
        // Only draw lines visible within text area (performance optimization)
        if (lineY > textAreaY - lineHeight && lineY < textAreaY + textAreaHeight + lineHeight) {
            text(lines[i], bannerX + padding, lineY);       // Draw individual text line
        }
    }
    
    drawingContext.restore();                                // Restore drawing state (remove clipping)
    
    // Draw scrollbar when content exceeds visible area
    if (maxScroll > 0) {
        // Calculate scrollbar dimensions and position
        let scrollBarX = bannerX + bannerWidth - padding - 12; // Right side of text area
        let scrollBarY = textAreaY;                          // Align with text area top
        let scrollBarHeight = textAreaHeight;                // Match text area height
        
        // Draw scrollbar background track
        fill(200);                                           // Light gray color
        noStroke();                                          // No border
        rect(scrollBarX, scrollBarY, 8, scrollBarHeight);   // Vertical track rectangle
        
        // Calculate and draw scrollbar thumb (draggable indicator)
        let thumbHeight = max(20, (textAreaHeight / textContentHeight) * scrollBarHeight); // Proportional size
        let thumbY = scrollBarY + (scrollOffset / maxScroll) * (scrollBarHeight - thumbHeight); // Position based on scroll
        
        fill(100);                                           // Darker gray for thumb visibility
        rect(scrollBarX, thumbY, 8, thumbHeight);           // Thumb rectangle
    }
    
    // CALCULATE BUTTON WIDTHS BASED ON TEXT CONTENT (RESPONSIVE FOR ALL SCREEN SIZES)
    let buttonPadding = 20;                                  // Fixed padding in pixels
    let buttonSpacing = 20;                                  // Fixed 20px gap between buttons
    
    // Set text properties for measurement - ensure minimum readable size
    textStyle(BOLD);
    let baseTextSize = min(16, max(12, bannerWidth * 0.025)); // Min 12px, max 16px, responsive
    textSize(baseTextSize);
    
    // Calculate required width for each button based on text content
    let manageText = "Manage Settings";
    let acceptText = "Accept All";
    let manageTextWidth = textWidth(manageText);
    let acceptTextWidth = textWidth(acceptText);
    
    // Button widths = text width + padding on both sides
    let button1Width = manageTextWidth + (buttonPadding * 2);
    let button2Width = acceptTextWidth + (buttonPadding * 2);
    
    // Ensure buttons aren't too narrow (minimum width) and fit in banner
    let minButtonWidth = 80;                                 // Reduced minimum for small screens
    let maxButtonWidth = (bannerWidth - buttonSpacing - (padding * 2)) / 2; // Max width to fit in banner
    button1Width = constrain(button1Width, minButtonWidth, maxButtonWidth);
    button2Width = constrain(button2Width, minButtonWidth, maxButtonWidth);
    
    // If buttons don't fit with current text size, reduce text size
    let totalNeededWidth = button1Width + button2Width + buttonSpacing;
    if (totalNeededWidth > bannerWidth - (padding * 2)) {
        // Recalculate with smaller text size
        while (baseTextSize > 8 && totalNeededWidth > bannerWidth - (padding * 2)) {
            baseTextSize -= 1;
            textSize(baseTextSize);
            manageTextWidth = textWidth(manageText);
            acceptTextWidth = textWidth(acceptText);
            button1Width = constrain(manageTextWidth + (buttonPadding * 2), minButtonWidth, maxButtonWidth);
            button2Width = constrain(acceptTextWidth + (buttonPadding * 2), minButtonWidth, maxButtonWidth);
            totalNeededWidth = button1Width + button2Width + buttonSpacing;
        }
    }
    
    // Calculate button positions - center the button group
    let totalButtonWidth = button1Width + button2Width + buttonSpacing;
    let button1X = bannerX + (bannerWidth - totalButtonWidth) / 2;
    let button2X = button1X + button1Width + buttonSpacing;
    let buttonY = bannerY + bannerHeight - buttonHeight - padding;
    
    // ==================== MOUSE AVOIDANCE MECHANISM - ESCAPE TRIGGER ====================
    
    // MOUSE PROXIMITY DETECTION FOR BUTTON ESCAPE BEHAVIOR
    // Calculate straight-line distance between mouse cursor and center of original manage button
    let distanceToOriginalManage = dist(mouseX, mouseY, button1X + button1Width/2, buttonY + buttonHeight/2);
    let escapeDistance = 100;                                // Pixel radius around button that triggers escape
                                                            // When mouse enters this invisible circle, button "panics"
    
    // ESCAPE TRIGGER CONDITIONS - All must be true for button to escape:
    // 1. Mouse is within escape radius (distanceToOriginalManage < escapeDistance)
    // 2. Original button is still visible (showOriginalManage == true)
    // 3. No escaped button already exists (!freeButton == null)
    if (distanceToOriginalManage < escapeDistance && showOriginalManage && !freeButton) {
        // CREATE ESCAPED BUTTON PHYSICS OBJECT
        // Transform static button into dynamic physics-based entity
        freeButton = {
            // INITIAL POSITION - Start exactly where the original button was
            x: button1X + button1Width/2,                   // Center X coordinate of original button
            y: buttonY + buttonHeight/2,                     // Center Y coordinate of original button
            
            // VISUAL PROPERTIES - Maintain exact same appearance as original
            width: button1Width,                             // Preserve calculated responsive width
            height: buttonHeight,                            // Preserve calculated responsive height
            
            // INITIAL VELOCITY - Random "panic" movement away from mouse
            vx: random(-15, 15),                            // Random horizontal velocity (-15 to +15 pixels/frame)
            vy: random(-15, 15),                            // Random vertical velocity (-15 to +15 pixels/frame)
                                                            // This creates unpredictable initial movement direction
            
            // TARGET COORDINATES (currently unused but available for future AI behavior)
            targetX: random(button1Width, width - button1Width), // Random safe X position on screen
            targetY: random(buttonHeight, height - buttonHeight) // Random safe Y position on screen
        };
        
        // BUTTON STATE TRANSITION
        showOriginalManage = false;                          // Hide static button (visual switch)
                                                            // From this point, only the physics button renders
        console.log("Manage Settings button escaped!");     // Debug log for escape event
    }
    
    // Draw original Manage Settings button (when not escaped)
    if (showOriginalManage) {
        fill(220);                                           // Light gray background
        noStroke();                                          // No border
        rect(button1X, buttonY, button1Width, buttonHeight); // Button rectangle with content-based width
        
        // Draw button text with proper padding
        fill(0);                                             // Black text
        textAlign(CENTER);                                   // Center text in button
        textSize(baseTextSize);                             // Use base text size
        textStyle(BOLD);                                     // Bold font weight
        text(manageText, button1X + button1Width/2, buttonY + buttonHeight/2 + 6); // Centered text
    }
    
    // Draw Accept All button with content-based width
    fill(34, 139, 34);                                      // Forest green background
    noStroke();                                              // No border
    rect(button2X, buttonY, button2Width, buttonHeight);    // Button rectangle with content-based width
    
    // Draw Accept All button text
    fill(255);                                               // White text for contrast
    textAlign(CENTER);                                       // Center text in button
    textSize(baseTextSize);                                 // Same text size
    textStyle(BOLD);                                         // Bold font weight
    text(acceptText, button2X + button2Width/2, buttonY + buttonHeight/2 + 6); // Centered text
    
    // Update and render the escaped button if it exists
    if (freeButton) {
        updateFreeButton(freeButton);                        // Apply physics and mouse avoidance
        drawFreeButton(freeButton);                          // Render escaped button at current position
    }
}

// ==================== ADVANCED MOUSE AVOIDANCE PHYSICS ENGINE ====================

/**
 * COMPREHENSIVE PHYSICS AND BEHAVIOR SYSTEM FOR ESCAPED BUTTON
 * This function runs every frame to update the escaped button's position and behavior
 * Implements realistic "fear" response with exponential force curves and natural movement
 * @param {Object} btn - Button object containing position, velocity, and dimension data
 */
function updateFreeButton(btn) {
    // STEP 1: CALCULATE MOUSE THREAT LEVEL
    let distanceToMouse = dist(mouseX, mouseY, btn.x, btn.y);  // Euclidean distance to mouse cursor
    let fleeDistance = 250;                                    // Detection radius - button "sees" mouse from this far
                                                              // Increased from original 100px for more dramatic effect
    
    // STEP 2: MOUSE AVOIDANCE FORCE CALCULATION
    // Only apply avoidance force if mouse is within detection range AND we have valid distance
    if (distanceToMouse < fleeDistance && distanceToMouse > 0) {
        
        // SUB-STEP 2A: CALCULATE NORMALIZED DIRECTION VECTOR (precise math)
        // This creates a unit vector pointing directly away from the mouse
        let dirX = (btn.x - mouseX) / distanceToMouse;      // X component of flee direction (-1 to +1)
        let dirY = (btn.y - mouseY) / distanceToMouse;      // Y component of flee direction (-1 to +1)
        // Division by distance normalizes the vector to length 1.0 for consistent force application
        
        // SUB-STEP 2B: NON-LINEAR FORCE CURVE FOR REALISTIC PANIC RESPONSE
        let normalizedDist = distanceToMouse / fleeDistance; // Convert distance to 0-1 range
                                                            // 0 = mouse directly on button, 1 = mouse at edge of detection
        let forceMultiplier = pow(1 - normalizedDist, 2.5); // EXPONENTIAL PANIC CURVE
        // pow(x, 2.5) creates dramatic force increase as mouse gets closer:
        // - At distance 250px: force = pow(0, 2.5) = 0 (no panic)
        // - At distance 125px: force = pow(0.5, 2.5) = ~0.18 (mild concern)
        // - At distance 50px:  force = pow(0.8, 2.5) = ~0.57 (moderate fear)
        // - At distance 10px:  force = pow(0.96, 2.5) = ~0.90 (extreme panic!)
        
        let force = forceMultiplier * 15;                   // Base force strength multiplier
                                                            // 15 is the maximum pixels/frame acceleration
        
        // SUB-STEP 2C: APPLY DIRECTIONAL FORCE TO VELOCITY
        btn.vx += dirX * force;                             // Add horizontal escape acceleration
        btn.vy += dirY * force;                             // Add vertical escape acceleration
        // This creates smooth acceleration away from mouse, not instant teleportation
        
        // SUB-STEP 2D: ADD ORGANIC RANDOMNESS (prevents robotic movement)
        btn.vx += random(-1, 1);                            // Tiny random horizontal jitter
        btn.vy += random(-1, 1);                            // Tiny random vertical jitter
        // This simulates "nervous" or "panicked" movement - not perfectly calculated escape
    }
    
    // STEP 3: PHYSICS INTEGRATION (velocity -> position)
    btn.x += btn.vx;                                        // Apply horizontal velocity to X position
    btn.y += btn.vy;                                        // Apply vertical velocity to Y position
    // This is Euler integration: position = position + velocity * time
    // (time = 1 frame, so we omit it)
    
    // STEP 4: BOUNDARY COLLISION DETECTION AND RESPONSE
    // Prevent button from escaping the visible screen area with realistic bouncing
    
    // LEFT AND RIGHT WALL COLLISIONS
    if (btn.x <= btn.width/2) {                            // Hit left edge of screen
        btn.x = btn.width/2;                               // Snap back to edge (prevent clipping)
        btn.vx = abs(btn.vx) * 0.7;                       // Reverse horizontal velocity with energy loss
        // abs() ensures we bounce rightward, 0.7 simulates energy loss in "collision"
    } else if (btn.x >= width - btn.width/2) {             // Hit right edge of screen
        btn.x = width - btn.width/2;                       // Snap back to edge
        btn.vx = -abs(btn.vx) * 0.7;                      // Reverse horizontal velocity (bounce leftward)
    }
    
    // TOP AND BOTTOM WALL COLLISIONS
    if (btn.y <= btn.height/2) {                          // Hit top edge of screen
        btn.y = btn.height/2;                             // Snap back to edge
        btn.vy = abs(btn.vy) * 0.7;                       // Reverse vertical velocity (bounce downward)
    } else if (btn.y >= height - btn.height/2) {           // Hit bottom edge of screen
        btn.y = height - btn.height/2;                     // Snap back to edge
        btn.vy = -abs(btn.vy) * 0.7;                      // Reverse vertical velocity (bounce upward)
    }
    
    // STEP 5: PROGRESSIVE DAMPING SYSTEM (realistic physics simulation)
    let currentSpeed = sqrt(btn.vx * btn.vx + btn.vy * btn.vy); // Calculate total velocity magnitude
    // sqrt(vx² + vy²) gives us the speed regardless of direction
    
    let dampingFactor = map(currentSpeed, 0, 30, 0.99, 0.94);   // Variable damping based on speed
    // map() creates adaptive friction:
    // - Slow movement (0-10 px/frame): damping = 0.99 (keeps slow movements alive longer)
    // - Fast movement (20-30 px/frame): damping = 0.94 (reduces high speeds quickly)
    // This prevents both jittery stops and runaway acceleration
    
    btn.vx *= dampingFactor;                               // Apply horizontal damping
    btn.vy *= dampingFactor;                               // Apply vertical damping
    // Each frame, velocity is reduced by the damping factor, simulating air resistance
    
    // STEP 6: SPEED LIMITING (prevent impossible physics)
    let maxSpeed = 30;                                     // Maximum pixels per frame
    if (currentSpeed > maxSpeed) {                         // If moving too fast
        let scale = maxSpeed / currentSpeed;               // Calculate scaling factor
        btn.vx *= scale;                                   // Scale velocity back to maximum
        btn.vy *= scale;                                   // Scale velocity back to maximum
        // This maintains direction but caps speed for visual clarity
    }
    
    // STEP 7: MICRO-MOVEMENT ELIMINATION (prevent visual jitter)
    if (currentSpeed < 0.1) {                             // If barely moving
        btn.vx = 0;                                        // Stop horizontal movement completely
        btn.vy = 0;                                        // Stop vertical movement completely
        // This prevents tiny sub-pixel movements that cause visual jitter
    }
}

/**
 * Render the escaped Manage Settings button at its current physics-driven position
 * Uses IDENTICAL styling to the static button for perfect visual consistency
 * @param {Object} btn - Button object containing current position and dimension data
 */
function drawFreeButton(btn) {
    // Draw button background rectangle centered at current position
    fill(220);                                               // Light gray background (matches original exactly)
    noStroke();                                              // No border outline
    rect(btn.x - btn.width/2, btn.y - btn.height/2, btn.width, btn.height); // Centered rectangle
    
    // IDENTICAL STYLING TO STATIC BUTTON - calculate text size the same way
    let buttonPadding = 20;                                  // Same fixed padding as static buttons
    textStyle(BOLD);                                         // Set bold for measurement
    let baseTextSize = min(16, max(12, btn.width * 0.15));   // Responsive text size based on button width
    textSize(baseTextSize);
    
    let manageText = "Manage Settings";
    let manageTextWidth = textWidth(manageText);
    let maxTextWidth = btn.width - (buttonPadding * 2);
    
    // Reduce text size if needed to fit with proper padding (same as static button logic)
    while (manageTextWidth > maxTextWidth && baseTextSize > 8) {
        baseTextSize -= 1;
        textSize(baseTextSize);
        manageTextWidth = textWidth(manageText);
    }
    
    // Draw button text with identical styling to static button
    fill(0);                                                 // Black text color (matches static button)
    textAlign(CENTER);                                       // Center text alignment
    textSize(baseTextSize);                                 // Use calculated text size
    textStyle(BOLD);                                         // Bold font weight
    text(manageText, btn.x, btn.y + 6);                     // Draw text at button center with same vertical offset
}

// ==================== TEXT PROCESSING UTILITIES ====================

/**
 * Smart title wrapping that ensures exactly 2 lines with no widows/orphans
 * Forces at least 2 words on the second line
 * @param {string} txt - Input title text to be wrapped
 * @param {number} maxWidth - Maximum pixel width for each line
 * @param {number} fontSize - Font size for accurate width calculation
 * @returns {Array} Array of exactly 2 wrapped title lines
 */
function wrapTitleSmartly(txt, maxWidth, fontSize) {
    let words = txt.split(' ');
    textSize(fontSize);
    
    // If we can fit everything on one line, force a split anyway for 2-line requirement
    if (textWidth(txt) <= maxWidth) {
        // Find a good split point - aim for roughly equal distribution
        let midPoint = Math.floor(words.length / 2);
        
        // Adjust to ensure at least 2 words on second line
        if (words.length - midPoint < 2) {
            midPoint = words.length - 2;
        }
        
        let line1 = words.slice(0, midPoint).join(' ');
        let line2 = words.slice(midPoint).join(' ');
        
        return [line1, line2];
    }
    
    // Find the best split point that fits within width constraints
    // and ensures at least 2 words on the second line
    let bestSplit = -1;
    
    for (let i = 1; i < words.length - 1; i++) { // Start at 1, end before last word to ensure 2+ words remain
        let line1 = words.slice(0, i).join(' ');
        let line2 = words.slice(i).join(' ');
        
        // Check if both lines fit and second line has at least 2 words
        if (textWidth(line1) <= maxWidth && 
            textWidth(line2) <= maxWidth && 
            words.slice(i).length >= 2) {
            bestSplit = i;
        }
    }
    
    // If no good split found, use fallback
    if (bestSplit === -1) {
        bestSplit = Math.max(1, words.length - 2); // Ensure at least 2 words on second line
    }
    
    let line1 = words.slice(0, bestSplit).join(' ');
    let line2 = words.slice(bestSplit).join(' ');
    
    return [line1, line2];
}

/**
 * Break text into lines that fit within specified pixel width
 * Uses greedy line-breaking algorithm with word boundaries
 * @param {string} txt - Input text to be wrapped
 * @param {number} maxWidth - Maximum pixel width for each line
 * @param {number} fontSize - Font size for accurate width calculation
 * @returns {Array} Array of wrapped text lines
 */
function wrapText(txt, maxWidth, fontSize) {
    let lines = [];                                          // Array to store resulting wrapped lines
    textSize(fontSize);                                      // Set font size for width calculations

    // Honor explicit line breaks (\n) so poem lines and stanza gaps are kept.
    let paragraphs = txt.split('\n');

    for (let p = 0; p < paragraphs.length; p++) {
        // Blank line = stanza/section spacing
        if (paragraphs[p].trim() === '') {
            lines.push('');
            continue;
        }

        let words = paragraphs[p].split(' ');               // Split paragraph into words
        let currentLine = '';                                // Current line being constructed

        for (let i = 0; i < words.length; i++) {
            if (words[i] === '') continue;                  // Skip extra spaces
            let testLine = currentLine + words[i] + ' ';    // Test adding next word to current line
            let testWidth = textWidth(testLine);            // Calculate pixel width of test line

            // If adding word would exceed max width and current line has content
            if (testWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine.trim());             // Complete current line and add to array
                currentLine = words[i] + ' ';               // Start new line with current word
            } else {
                currentLine = testLine;                      // Add word to current line
            }
        }

        // Add final line of this paragraph if it contains any content
        if (currentLine.trim() !== '') {
            lines.push(currentLine.trim());
        }
    }

    return lines;                                            // Return array of wrapped lines
}

// ==================== USER INTERACTION HANDLERS ====================

/**
 * Handle mouse wheel events for scrolling text content
 * @param {Object} event - Mouse wheel event containing delta information
 */
function mouseWheel(event) {
    // Only process scroll events if content is scrollable
    if (maxScroll > 0) {
        scrollOffset += event.delta;                        // Apply scroll delta to offset
        scrollOffset = constrain(scrollOffset, 0, maxScroll); // Clamp to valid scroll range
        return false;                                        // Prevent default browser scrolling
    }
}

/**
 * Handle mouse drag events for text area scrolling
 * Called continuously while mouse button is held down and mouse moves
 */
function mouseDragged() {
    // Only process drag if actively dragging within scrollable content
    if (isDragging && maxScroll > 0) {
        let deltaY = mouseY - lastMouseY;                   // Calculate vertical mouse movement
        scrollOffset -= deltaY;                             // Apply inverse scroll (natural scroll direction)
        scrollOffset = constrain(scrollOffset, 0, maxScroll); // Clamp to valid scroll range
        lastMouseY = mouseY;                                 // Update previous mouse position for next frame
    }
}

/**
 * Handle mouse release events to end drag scrolling
 */
function mouseReleased() {
    isDragging = false;                                      // Disable drag scrolling state
}

/**
 * Handle mouse press events for starting drag scrolling and button clicks
 * Performs hit testing for different interactive areas
 */
function mousePressed() {
    // Recalculate layout dimensions for accurate hit testing
    let bannerWidth = min(width * 0.8, 600);
    let bannerHeight = min(height * 0.6, 400);
    let bannerX = (width - bannerWidth) / 2;
    let bannerY = (height - bannerHeight) / 2;
    let padding = bannerWidth * 0.08;
    let titleSize = min(width * 0.04, 32);
    let titleText = "WE USE COOKIES TO IMPROVE YOUR EXPERIENCE!";
    let titleLines = wrapTitleSmartly(titleText, bannerWidth - (padding * 2) + 20, titleSize);
    let titleHeight = titleLines.length * titleSize * 1.2;
    let textAreaY = bannerY + padding + titleSize + titleHeight + 10;
    let buttonHeight = max(40, bannerHeight * 0.12);
    let textAreaHeight = bannerY + bannerHeight - padding - buttonHeight - 20 - textAreaY;
    
    // Check if mouse click is within text area to initiate drag scrolling
    if (mouseX >= bannerX + padding && mouseX <= bannerX + bannerWidth - padding &&
        mouseY >= textAreaY && mouseY <= textAreaY + textAreaHeight) {
        isDragging = true;                                   // Enable drag scrolling mode
        lastMouseY = mouseY;                                 // Store initial mouse Y position
        return;                                              // Exit early to prevent button processing
    }
    
    // RECALCULATE BUTTON POSITIONS FOR CLICK DETECTION (must match drawing code exactly)
    let buttonPadding = 20;                                  // Same as drawing code
    let buttonSpacing = 20;                                  // Same as drawing code
    
    // Set text properties for measurement (same as drawing code)
    textStyle(BOLD);
    let baseTextSize = min(16, max(12, bannerWidth * 0.025)); // Same responsive calculation
    textSize(baseTextSize);
    
    // Calculate button widths (same as drawing code)
    let manageText = "Manage Settings";
    let acceptText = "Accept All";
    let manageTextWidth = textWidth(manageText);
    let acceptTextWidth = textWidth(acceptText);
    
    let button1Width = manageTextWidth + (buttonPadding * 2);
    let button2Width = acceptTextWidth + (buttonPadding * 2);
    
    // Apply same constraints as drawing code
    let minButtonWidth = 80;
    let maxButtonWidth = (bannerWidth - buttonSpacing - (padding * 2)) / 2;
    button1Width = constrain(button1Width, minButtonWidth, maxButtonWidth);
    button2Width = constrain(button2Width, minButtonWidth, maxButtonWidth);
    
    // Apply same text size reduction logic if needed
    let totalNeededWidth = button1Width + button2Width + buttonSpacing;
    if (totalNeededWidth > bannerWidth - (padding * 2)) {
        while (baseTextSize > 8 && totalNeededWidth > bannerWidth - (padding * 2)) {
            baseTextSize -= 1;
            textSize(baseTextSize);
            manageTextWidth = textWidth(manageText);
            acceptTextWidth = textWidth(acceptText);
            button1Width = constrain(manageTextWidth + (buttonPadding * 2), minButtonWidth, maxButtonWidth);
            button2Width = constrain(acceptTextWidth + (buttonPadding * 2), minButtonWidth, maxButtonWidth);
            totalNeededWidth = button1Width + button2Width + buttonSpacing;
        }
    }
    
    // Calculate button positions (same as drawing code)
    let totalButtonWidth = button1Width + button2Width + buttonSpacing;
    let button1X = bannerX + (bannerWidth - totalButtonWidth) / 2;
    let button2X = button1X + button1Width + buttonSpacing;
    let buttonY = bannerY + bannerHeight - buttonHeight - padding;
    
    // Check if Accept All button was clicked
    if (mouseX >= button2X && mouseX <= button2X + button2Width &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        console.log("✅ Cookies accepted!");                // Log acceptance
        window.location.href = "camera.html";               // Navigate to camera page
        freeButton = null;                                   // Clean up escaped button
        showOriginalManage = true;                           // Reset manage button visibility
    }
    
    // Check if the escaped Manage Settings button was clicked (challenging due to movement)
    if (freeButton) {
        let distanceToFreeButton = dist(mouseX, mouseY, freeButton.x, freeButton.y);
        // Use radius-based hit detection for moving button
        if (distanceToFreeButton < freeButton.width/2) {
            console.log("🎉 You caught the escaped button!"); // Log successful click
            freeButton = null;                               // Remove escaped button
            showOriginalManage = true;                       // Restore original static button
        }
    }
}

/**
 * Handle browser window resize events
 * Resets canvas dimensions and button states for new layout
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);                 // Adjust canvas to new window dimensions
    freeButton = null;                                       // Reset escaped button (prevents layout issues)
    showOriginalManage = true;                              // Reset to initial button state
    console.log("Canvas resized to:", windowWidth + "x" + windowHeight); // Log resize event
}