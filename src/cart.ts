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
const cart: CartItem[] = []

// add item to cart
export async function addToCart(item: {
id: number;
  name: string;
  price: number;
  category: string;
  image: {
    thumbnail: string;
    mobile: string;
    tablet: string;
    desktop: string;
  };
}) {
  const existingItem = cart.find(cartItem => cartItem.name === item.name);

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
  };

  try {
    const allItems = await dbService.getAllItems();
    const exists = allItems.some(i => i.name === dbItem.name);

    if (!exists) {
      await dbService.addItem(dbItem);
    } else {
      await dbService.updateItem(dbItem);
    }
  } catch (error) {
    console.error('DB error during addToCart:', error);
  }

  renderCart();
}


// remove item from cart
export function removeFromCart(itemName: string) {
  const itemIndex = cart.findIndex(item => item.name === itemName);

  if (itemIndex !== -1) {
    cart[itemIndex].quantity -= 1;

    if (cart[itemIndex].quantity === 0) {
      cart.splice(itemIndex, 1);
    }
  }

  renderCart();
}

// populate cart
export function renderCart() {
  const cartContainer = document.querySelector<HTMLDivElement>('.cart')!;

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartContainer.innerHTML = `
    <h2>Your Cart (${totalQuantity})</h2>
    <div class="cart-items">
      ${cart.length === 0
        ? `
          <img src="../assets/images/illustration-empty-cart.svg" alt="empty cart icon">
          <p>Your added items will appear here</p>
        `
        : `
          ${cart.map(item => `
            <div class="cart-item">
              <img src="${item.image.thumbnail}" alt="cart item">
              <div class="cart-item-description">
                <p>${item.name}</p>
                <p>$${item.price.toFixed(2)} x ${item.quantity} 
                  <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </p>
              </div>
              <button class="delete-icon" data-name="${item.name}">
              <img src="../assets/images/icon-remove-item.svg" alt="delete icon">
            </button>
            </div>
          `).join('')}
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

  // event listener for the checkout button
  document.getElementById('checkout')?.addEventListener('click', showOrderModal);

   // ✅ Event listeners for delete icons
  document.querySelectorAll<HTMLImageElement>('.delete-icon').forEach(button => {
    const name = button.dataset.name;
    if (name) {
      button.addEventListener('click', () => {
        removeFromCart(name);
      });
    }
  });
}

// modal for order confirmation
function showOrderModal() {
  const overlay = document.querySelector<HTMLDivElement>('.overlay');
  if (!overlay) return;

  overlay.classList.add('active');

  if (cart.length > 0) {
    cart.map(item => {
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <img src="../assets/images/icon-order-confirmed.svg" alt="close icon">
          <h2>Order Confirmed</h2>
          <p>We hope you enjoy your food.</p>
        </div>
        <div class="modal-content">
          <img src="${item.image.thumbnail}" alt="cart item thumbnail">
          <div class="modal-description">
            <p>${item.name}</p>
            <p>${item.quantity}x Price: $${item.price.toFixed(2)}</p>
          </div>
          <p>Total: $${(item.price * item.quantity).toFixed(2)}</p>
        </div>
        <button id="continue-shopping">Continue Shopping</button>
      </div>
    `;
    })
  } else {
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <img src="../assets/images/icon-order-confirmed.svg" alt="close icon">
          <h2>No Items</h2>
          <p>Your cart is empty.</p>
        </div>
        <button id="continue-shopping">Continue Shopping</button>
      </div>
    `;
  }

  document.getElementById('continue-shopping')?.addEventListener('click', closeOrderModal);
  overlay.querySelector('.modal-header img')?.addEventListener('click', closeOrderModal);
}


// close modal
function closeOrderModal() {
  const overlay = document.querySelector<HTMLDivElement>('.overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}
