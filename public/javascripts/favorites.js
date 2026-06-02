document.querySelectorAll(".favorite-btn, .add-to-favorites-btn").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const productId = button.dataset.productId;

    const response = await fetch(`/favorites/${productId}`, {
      method: "POST"
    });

    const result = await response.json();

    if (result.success) {

      button.classList.toggle("active", result.isFavorite);

      const counter = document.getElementById("favorites-count");

      if (counter) {
        counter.textContent = result.count;
      }
    }
  });
});