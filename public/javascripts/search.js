const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");

let selectedIndex = -1;
let debounceTimer;

if (searchInput && searchResults) {
  searchInput.addEventListener("input", handleSearchInput);
  document.addEventListener("keydown", handleKeyboardNavigation);
  document.addEventListener("click", handleOutsideClick);
}

function handleSearchInput(event) {
  const query = event.target.value.trim();

  clearTimeout(debounceTimer);
  selectedIndex = -1;

  if (!query) {
    clearSearchResults();
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchSearchResults(query);
  }, 500);
}

async function fetchSearchResults(query) {
  try {
    const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const products = await response.json();

    renderSearchResults(products);
  } catch (err) {
    console.error("Search request failed:", err);
    clearSearchResults();
  }
}

function renderSearchResults(products) {
  if (!products.length) {
    searchResults.innerHTML = `
      <p class="search-result search-result--empty">
        Inga produkter hittades
      </p>
    `;
    return;
  }

  searchResults.innerHTML = products
    .map((product) => {
      return `
        <a href="/products/${product.id}" class="search-result">
          <img
            src="${product.picture_front}"
            class="search-result__image"
            alt="${product.type}"
          >

          <div>
            <h4>${product.type}</h4>
            <p>${product.brand}</p>
            <p>${product.price} SEK</p>
          </div>
        </a>
      `;
    })
    .join("");
}

function handleKeyboardNavigation(event) {
  const items = searchResults.querySelectorAll(".search-result:not(.search-result--empty)");

  if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
    return;
  }

  if (!items.length) {
    return;
  }

  event.preventDefault();

  if (event.key === "ArrowDown") {
    selectedIndex = selectedIndex + 1;

    if (selectedIndex >= items.length) {
      selectedIndex = 0;
    }

    updateSelection(items);
  }

  if (event.key === "ArrowUp") {
    selectedIndex = selectedIndex - 1;

    if (selectedIndex < 0) {
      selectedIndex = items.length - 1;
    }

    updateSelection(items);
  }

  if (event.key === "Enter" && selectedIndex >= 0) {
    window.location.href = items[selectedIndex].href;
  }
}

function updateSelection(items) {
  items.forEach((item) => {
    item.classList.remove("search-result--active");
  });

  const activeItem = items[selectedIndex];

  if (activeItem) {
    activeItem.classList.add("search-result--active");
  }
}

function handleOutsideClick(event) {
  const isInsideSearch =
    searchInput.contains(event.target) ||
    searchResults.contains(event.target);

  if (!isInsideSearch) {
    clearSearchResults();
  }
}

function clearSearchResults() {
  searchResults.innerHTML = "";
  selectedIndex = -1;
}