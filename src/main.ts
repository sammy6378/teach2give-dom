import './style.css'
import data from '../data.json'
import { renderCart, addToCart,loadCartFromDB } from './cart'


import { DbServive } from './actions';

export const dbService = new DbServive();
await dbService.initDatabase(); // database is ready



document.addEventListener('DOMContentLoaded', () => {
  loadCartFromDB();
});



document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="header">
    <h1>Deserts</h1>
  </header>
  <div class="wrapper"> 
    <div class="container">
      ${data.map((item, index) => `
        <div class="desert-card">
          <div class="img-section">
            <img src="${item.image.desktop}" alt="Desert ${index + 1}">
          </div>
          <button class="add-to-cart" data-index="${index}">
            <img src="/icon-add-to-cart.svg" alt="cart icon"> Add to cart
          </button>
          <div class="description-section">
            <p>${item.name}</p>
            <p>${item.category}</p>
            <small>Price: $${item.price}</small>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="cart"></div>
    <div class="overlay"></div>
  </div>
`

// Attach event listeners
document.querySelectorAll<HTMLButtonElement>('.add-to-cart').forEach(button => {
  button.addEventListener('click', () => {
    const index = parseInt(button.dataset.index!);
    addToCart({
      ...data[index],
      quantity: 1,
  });
  });
});


renderCart();
