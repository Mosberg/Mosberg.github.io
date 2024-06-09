let count = 0;

document
  .getElementById("colorChangeBtn")
  .addEventListener("click", function () {
    document.body.style.backgroundColor =
      "#" + Math.floor(Math.random() * 16777215).toString(16);
    document.querySelector("h1").style.color =
      "#" + Math.floor(Math.random() * 16777215).toString(16);

    // Loop through all ul elements and apply style to each
    document.querySelectorAll("ul").forEach(function (ul) {
      ul.style.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    });

    // Loop through all h3 elements and apply style to each
    document.querySelectorAll("h3").forEach(function (h3) {
      h3.style.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    });

    // Loop through all a elements and apply style to each
    document.querySelectorAll("a").forEach(function (a) {
      a.style.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    });

    // Increment counter
    count++;
    document.getElementById("counter").innerHTML = count;
  });
