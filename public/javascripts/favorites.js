document
  .querySelectorAll(".favorite-btn, .add-to-favorites-btn")
  .forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const { productId } = button.dataset;

      try {
        const response = await fetch(`/favorites/${productId}`, {
          method: "POST"
        });

        const data = await response.json();

        if (!data.success) {
          return;
        }

        button.classList.toggle("active", data.isFavorite);

        const counter = document.getElementById("favorites-count");

        if (counter) {
          counter.textContent = data.count;
        }
      } catch (err) {
        console.error("Failed to update favorites:", err);
      }
    });
  });