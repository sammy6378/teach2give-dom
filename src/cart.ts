// cart.ts
import { dbService } from "./main";

// interface for cart items
interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: {
    desktop: string;
    mobile: string;
    tablet: string;
    thumbnail: string;
  };
  quantity: number;
}

// Convert static cartItems to a dynamic array
const cart: CartItem[] = [];

// add item to cart
export async function addToCart(item: {
  id: number;
  name: string;
  price: number;
  category: string;
  quantity: number;
  image: {
    thumbnail: string;
    mobile: string;
    tablet: string;
    desktop: string;
  };
}) {
  const existingItem = cart.find((cartItem) => cartItem.name === item.name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: {
        thumbnail: item.image.thumbnail,
        mobile: item.image.mobile,
        tablet: item.image.tablet,
        desktop: item.image.desktop,
      },
      quantity: 1,
    });
  }

  //   save to indexdb
  const dbItem = {
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    thumbnail: item.image.thumbnail,
    quantity: item.quantity,
  };

  try {
    const allItems = await dbService.getAllItems();
    const exists = allItems.some((i) => i.name === dbItem.name);

    if (!exists) {
      await dbService.addItem(dbItem);
    } else {
      await dbService.updateItem(dbItem);
    }
  } catch (error) {
    console.error("DB error during addToCart:", error);
  }

  renderCart();
}


// updating quantity in the cart
async function updateQuantity(name: string, delta: number) {
  const item = cart.find((i) => i.name === name);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(name); 
  } else {
    // Update quantity in DB
    try {
      await dbService.updateItem({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        thumbnail: item.image.thumbnail,
        quantity: item.quantity,
      });
    } catch (err) {
      console.error("Failed to update DB item quantity:", err);
    }

    renderCart();
  }
}


// remove item from cart
export async function removeFromCart(itemName: string) {
  const itemIndex = cart.findIndex((item) => item.name === itemName);

  if (itemIndex !== -1) {
    const item = cart[itemIndex];
    item.quantity -= 1;

    if (item.quantity === 0) {
      cart.splice(itemIndex, 1);
      await dbService.deleteItem(item.id); // remove from DB
    } else {
      await dbService.updateItem({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        thumbnail: item.image.thumbnail,
        quantity: item.quantity,
      });
    }
  }

  renderCart();
}


// populate cart items
export async function renderCart() {
  const cartContainer = document.querySelector<HTMLDivElement>(".cart")!;
  const items = await dbService.getAllItems();

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  cartContainer.innerHTML = `
    <h2>Your Cart (${totalQuantity})</h2>
    <div class="cart-items">
      ${items.length === 0
      ? `
          <img src="/illustration-empty-cart.svg" alt="empty cart icon">
          <p>Your added items will appear here</p>
        `
      : `
          ${items
        .map(
          (item) => `
          <div class="cart-item">
            <div class="cart-item-image">
              <img src="${item.thumbnail}" alt="cart item">
            </div>
            <div class="cart-item-info">
              <p class="item-name">${item.name}</p>
              <p class="item-price">$${item.price.toFixed(2)} x ${item.quantity} =
                <span class="item-total">$${(item.price * item.quantity).toFixed(
                      2
                    )}</span>
              </p>
              <div class="cart-actions">
                <div class="quantity-controls">
                  <button class="decrease" data-name="${item.name}">−</button>
                  <span class="quantity-number">${item.quantity}</span>
                  <button class="increase" data-name="${item.name}">+</button>
                </div>
                <button class="delete-icon" data-name="${item.name}" title="Remove item">
                  X
                </button>
              </div>
            </div>
          </div>`
        ).join("")}
          <div class="cart-total">
            <p>Total</p>
            <p>$${totalPrice.toFixed(2)}</p>
          </div>
          <div class="note">
            <p>This is a carbon-neutral delivery</p>
          </div>
          <button id="checkout">Confirm Order</button>
        `
    }
    </div>
  `;

  // Checkout listener
  document
    .getElementById("checkout")
    ?.addEventListener("click", showOrderModal);

  // Delete
  document
    .querySelectorAll<HTMLButtonElement>(".delete-icon")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.name!;
        removeFromCart(name);
      });
    });

  // Increase quantity
  document
    .querySelectorAll<HTMLButtonElement>(".increase")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.name!;
        updateQuantity(name, 1);
      });
    });

  // Decrease quantity
  document
    .querySelectorAll<HTMLButtonElement>(".decrease")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.name!;
        updateQuantity(name, -1);
      });
    });
}

// modal for order confirmation
// modal for order confirmation
async function showOrderModal() {
  const overlay = document.querySelector<HTMLDivElement>(".overlay");
  if (!overlay) return;

  overlay.classList.add("active");

  const items = await dbService.getAllItems();

  if (items.length > 0) {
    const modalItemsHTML = items.map((item) => `
      <div class="modal-content">
        <img src="${item.thumbnail}" alt="cart item thumbnail">
        <div class="modal-description">
          <p>${item.name}</p>
          <p>${item.quantity}x Price: $${item.price.toFixed(2)}</p>
        </div>
        <p>Total: $${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    `).join("");

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <img src="/icon-order-confirmed.svg" alt="close icon">
          <h2>Order Confirmed</h2>
          <p>We hope you enjoy your food.</p>
        </div>
        <div class="modal-items">
          ${modalItemsHTML}
        </div>
        <button id="continue-shopping">Continue Shopping</button>
      </div>
    `;
  } else {
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <img src="/icon-order-confirmed.svg" alt="close icon">
          <h2>No Items</h2>
          <p>Your cart is empty.</p>
        </div>
        <button id="continue-shopping">Continue Shopping</button>
      </div>
    `;
  }

  document
    .getElementById("continue-shopping")
    ?.addEventListener("click", closeOrderModal);
  overlay
    .querySelector(".modal-header img")
    ?.addEventListener("click", closeOrderModal);
}


// close modal
async function closeOrderModal() {
  const overlay = document.querySelector<HTMLDivElement>(".overlay");

  if (overlay) {
    overlay.classList.remove("active");
    overlay.innerHTML = ""; // Clear modal content
  }

  // Clear IndexedDB and in-memory cart
  try {
    await dbService.deleteAllItems();
    cart.length = 0;
    renderCart();
  } catch (error) {
    console.error("Failed to clear cart:", error);
  }
}


// load items from indexdb
export async function loadCartFromDB() {
  try {
    const itemsFromDB = await dbService.getAllItems();

    cart.length = 0; // clear existing cart
    for (const dbItem of itemsFromDB) {
      cart.push({
        id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        category: dbItem.category,
        image: {
          desktop: "",
          mobile: "",
          tablet: "",
          thumbnail: dbItem.thumbnail,
        },
        quantity: dbItem.quantity,
      });
    }

    renderCart();
  } catch (error) {
    console.error("Error loading cart from DB:", error);
  }
}
