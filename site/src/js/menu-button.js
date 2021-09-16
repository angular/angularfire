customElements.define('eap-menu-button', class extends HTMLElement {
  connectedCallback() {
    const menuId = this.getAttribute('data-menu-id');
    const menuEl = document.getElementById(menuId);
    const button = document.createElement('button');
    button.classList.add('fixed', 'w-16', 'h-16', 'text-white', 'rounded-full', 'shadow-lg', 'bottom-6', 'right-6', 'bg-grey-700', 'focus:ring-grey-600' , 'z-50', 'focus:ring-4', 'md:hidden', 'lg:hidden', 'xl:hidden');
    button.textContent = '🔥';
    this.appendChild(button);
    button.addEventListener('click', clickEvent => {
      menuEl.classList.toggle('slideIn');
    });
  }
});
