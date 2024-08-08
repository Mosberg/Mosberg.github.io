// script.js
fetch('projects.json')
  .then(response => response.json())
  .then(data => {
    const container = document.querySelector('.container');
    data.forEach(project => {
      const card = document.createElement('div');
      card.className = 'card';

      const title = document.createElement('h2');
      title.textContent = project.title;
      card.appendChild(title);

      const image = document.createElement('img');
      image.src = project.image;
      card.appendChild(image);

      const description = document.createElement('p');
      description.textContent = project.description;
      card.appendChild(description);

      const rating = document.createElement('p');
      rating.textContent = `Rating: ${project.rating}`;
      card.appendChild(rating);

      const button = document.createElement('button');
      button.textContent = 'Learn More';
      card.appendChild(button);

      container.appendChild(card);
    });
  })
  .catch(error => console.error('Error:', error));
