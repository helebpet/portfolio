// Projects data
const projects = [
    { title: 'There is No Finish Line', year: 2025, image: '' },
    { title: 'Green Roots', year: 2024, image: '' },
    { title: 'Beyond the Address', year: 2024, image: '' },
    { title: 'Weapon of Mass Distraction', year: 2025, image: '' },
    { title: 'Type Studies Collection', year: 2024, image: '' },
    { title: 'Fractul Variable', year: 2024, image: '' },
    { title: 'Circadian Lamp', year: 2025, image: '' },
    { title: 'E&I Hub USFCA', year: 2025, image: '' },
    { title: 'Cookies', year: 2025, image: '' },
    { title: 'Wavía', year: 2025, image: '' },
    { title: 'E&I Hub USFCA', year: 2025, image: '' },
    { title: 'Modrian Dreams', year: 2025, image: '' }
];

// Rotating words
const designTypes = [
    { text: 'editorial', article: 'an' },
    { text: 'graphic', article: 'a' },
    { text: 'web', article: 'a' },
    { text: 'UI', article: 'a' },
    { text: 'UX', article: 'a' }
];

let currentIndex = 1; // Start with 'graphic'

function rotateWord() {
    currentIndex = (currentIndex + 1) % designTypes.length;
    const current = designTypes[currentIndex];
    
    document.getElementById('rotating-article').textContent = current.article;
    document.getElementById('rotating-word').textContent = current.text;
}

// Rotate every 2 seconds
setInterval(rotateWord, 2000);

// Generate project grid
const projectsGrid = document.getElementById('projects-grid');
projects.forEach((project) => {
    const card = document.createElement('a');
    card.href = '#';
    card.className = 'project-card';
    card.onclick = (e) => {
        e.preventDefault();
    };

    card.innerHTML = `
        <div class="project-image">
            <img src="https://via.placeholder.com/600x450/cccccc/666666?text=${encodeURIComponent(project.title)}" alt="${project.title}">
        </div>
        <div class="project-info">
            <span class="project-title">${project.title}</span>
            <span class="project-year">${project.year}</span>
        </div>
    `;

    projectsGrid.appendChild(card);
});