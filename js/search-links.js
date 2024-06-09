function upFunction() {
  const input = document.getElementById("search-input");
  const filter = input.value.toUpperCase();
  const lists = document.querySelectorAll("ul[id]"); // get all ul elements with an id

  lists.forEach((list) => {
    const category = list.querySelector("h3"); // get the h3 element inside the ul
    const listItems = list.querySelectorAll("li");

    // Loop through all list items, and hide those who don't match the search query
    listItems.forEach((item) => {
      const anchor = item.querySelector("a");
      if (anchor.textContent.toUpperCase().includes(filter)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });

    // Hide the category if none of its list items are visible
    const hasVisibleItems = Array.prototype.some.call(listItems, (item) => {
      return item.style.display !== "none";
    });
    if (hasVisibleItems) {
      category.style.display = "";
    } else {
      category.style.display = "none";
    }
  });
}
