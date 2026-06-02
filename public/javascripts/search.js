console.log("search.js loaded");

const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");

let selectedIndex = -1;
let debounceTimer;

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  console.log("User typed:", query);

  clearTimeout(debounceTimer);

  if (!query) {
    searchResults.innerHTML = "";
    return;
  }

  debounceTimer = setTimeout(async () => {

    console.log("SEARCH REQUEST SENT:", query);


    try {
      console.time("Frontend search request");
      const response = await fetch(
        `/search?q=${encodeURIComponent(query)}`
      );

      const products = await response.json();

      console.timeEnd("Frontend search request");
      console.log("RESULTS:", products);
      

      searchResults.innerHTML = products.map(product => `
        <a href="/products/${product.id}" class="search-result">
          <img src="${product.picture_front}" class="search-result__image">

          <div>
            <h4>${product.type}</h4>
            <p>${product.brand}</p>
            <p>${product.price} SEK</p>
          </div>
        </a>
      `).join("");

    } catch (err) {
      console.error(err);
    }

  }, 500);
});

document.addEventListener("keydown", (e) => {
  const items = searchResults.querySelectorAll(".search-result");

  if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") {
    return;
  }

  if (!items.length) return;

  e.preventDefault();

  if (e.key === "ArrowDown") {
    selectedIndex = selectedIndex + 1;

    if (selectedIndex >= items.length) {
      selectedIndex = 0;
    }

    updateSelection(items);
  }

  if (e.key === "ArrowUp") {
    selectedIndex = selectedIndex - 1;

    if (selectedIndex < 0) {
      selectedIndex = items.length - 1;
    }

    updateSelection(items);
  }

  if (e.key === "Enter" && selectedIndex >= 0) {
    window.location.href = items[selectedIndex].href;
  }
});

function updateSelection(items) {
  items.forEach(item => {
    item.classList.remove("search-result--active");
  });

  const activeItem = items[selectedIndex];

  if (activeItem) {
    activeItem.classList.add("search-result--active");
  }
}

document.addEventListener("click", (e) => {
  const isInsideSearch =
    searchInput.contains(e.target) ||
    searchResults.contains(e.target);

  if (!isInsideSearch) {
    searchResults.innerHTML = "";
    selectedIndex = -1;
  }
});
