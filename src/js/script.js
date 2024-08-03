// Get all navGrid image elements
const images = document.querySelectorAll('img');

// Get the mainGrid element
const mainGrid = document.querySelector('.indholdGrid');

// Function to load HTML content
function loadHTML(img) {
  // Get the HTML file name from the image ID
  const htmlFile = `src/html/${img.id}.html`;

  // Load the HTML content
  fetch(htmlFile)
    .then(response => response.text())
    .then(html => {
      // Set the HTML content to the mainGrid element
      mainGrid.innerHTML = html;

      // Add the active class to the clicked image
      images.forEach(image => image.classList.remove('active'));
      img.classList.add('active');
    })
    .catch(error => console.error('Error loading HTML:', error));
}

// Add event listeners to all images
images.forEach(img => {
  img.addEventListener('click', () => {
    // Load the new HTML content
    loadHTML(img);
  });

  // Load the main HTML content by default
  document.addEventListener('DOMContentLoaded', () => {
    const mainImage = document.getElementById('main');
    loadHTML(mainImage);
  });
});
