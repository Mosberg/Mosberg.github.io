/** @type {*} */
const contentSection = document.querySelector('.content');
const navLinks = document.querySelectorAll('.nav-link');

// Create a Map to store preloaded HTML content
const preloadedContent = new Map();

// Function to preload HTML content
function preloadContent(href) {
  fetch(`src/${href}.html`)
    .then(response => response.text())
    .then(html => preloadedContent.set(href, html))
    .catch(console.error);
}

// Function to load content from preloaded HTML content or from server
function loadContent(href) {
  const content = preloadedContent.get(href) || '';
  contentSection.innerHTML = content;
}

// Event listener for navigation links
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    // Remove active class from all links
    navLinks.forEach(link => link.classList.remove('active'));

    // Add active class to the current link
    link.classList.add('active');

    // Load the content from preloaded HTML content or from server
    const href = link.getAttribute('href');
    if (!preloadedContent.has(href)) preloadContent(href);
    loadContent(href);
  });
});

// Preload home content by default
preloadContent('home');
