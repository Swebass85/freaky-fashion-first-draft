console.log("basket.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  setupAddToBasketButtons();
  setupQuantitySelectors();
  setupTrashButtons();
});

function setupAddToBasketButtons() {
  const basketButtons = document.querySelectorAll(".basket-btn, .add-to-cart-btn");

  basketButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.dataset.productId;

      try {
        const response = await fetch(`/basket/${productId}`, {
          method: "POST",
        });

        const data = await response.json();

        if (data.success) {
          button.classList.add("active");

          const basketCount = document.querySelector("#basket-count");

          if (basketCount) {
            basketCount.textContent = data.count;
          }
        }
      } catch (err) {
        console.error("Could not add product to basket:", err);
      }
    });
  });
}

function setupQuantitySelectors() {
  const selects = document.querySelectorAll(".product__page--quantity");

  selects.forEach((select) => {
    select.addEventListener("change", async () => {
      const quantity = Number(select.value);
      const productId = select.dataset.productId;

      const productBox = select.closest(".product__page--purchase-box");
      const priceElement = productBox?.querySelector(".product-price");

      if (!productBox || !priceElement) {
        return;
      }

      const basePrice = Number(priceElement.dataset.price);
      const newPrice = basePrice * quantity;

      try {
        const response = await fetch(`/basket/update/${productId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity }),
        });

        const data = await response.json();

        if (data.success) {
          priceElement.textContent = `${newPrice} SEK`;

          const basketCount = document.querySelector("#basket-count");

          if (basketCount) {
            basketCount.textContent = data.count;
          }

          updateOrderValue();
        }
      } catch (err) {
        console.error("Could not update basket quantity:", err);
      }
    });
  });
}

function updateOrderValue() {
  let orderValue = 0;

  document.querySelectorAll(".product-price").forEach((price) => {
    orderValue += Number(price.textContent.replace(" SEK", ""));
  });

  const deliveryFee = orderValue > 0 && orderValue < 500 ? 49 : 0;
  const total = orderValue + deliveryFee;

  const orderValueElement = document.querySelector("#order-value");
  const deliveryFeeElement = document.querySelector("#delivery-fee");
  const totalPriceElement = document.querySelector("#total-price");

  if (orderValueElement) {
    orderValueElement.textContent = `${orderValue} SEK`;
  }

  if (deliveryFeeElement) {
    deliveryFeeElement.innerHTML =
      deliveryFee === 0
        ? "<strong>Gratis leverans</strong>"
        : `${deliveryFee} SEK`;
  }

  if (totalPriceElement) {
    totalPriceElement.textContent = `${total} SEK`;
  }
}

function setupTrashButtons() {
  const trashButtons = document.querySelectorAll(".trash-btn");

  trashButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const productId = button.dataset.productId;

      try {
        const response = await fetch(`/basket/remove/${productId}`, {
          method: "POST",
        });

        const data = await response.json();

        if (data.success) {
          const productBox = button.closest(".product__page--purchase-box");

          if (productBox) {
            productBox.remove();
          }

          const basketCount = document.querySelector("#basket-count");

          if (basketCount) {
            basketCount.textContent = data.count;
          }

          updateOrderValue();

          const remainingProducts = document.querySelectorAll(
            ".product__page--purchase-box"
          );

          if (remainingProducts.length === 0) {
            const checkoutPayment = document.querySelector(
              ".checkout__page--payment"
            );

            const checkoutWrapper = document.querySelector(
              ".product__page--checkout-wrapper"
            );

            if (checkoutPayment) {
              checkoutPayment.remove();
            }

            if (checkoutWrapper) {
              checkoutWrapper.innerHTML = `
                <div class="empty__shopping-basket">
                  <p class="basket-empty-message">
                    Din varukorg är tom
                  </p>

                  <img
                    src="/images/tom_varukorg.png"
                    class="basket-empty-img"
                    alt="Tom varukorg"
                  >
                </div>
              `;
            }
          }
        }
      } catch (err) {
        console.error("Could not remove product from basket:", err);
      }
    });
  });
}