customElements.define('eap-click-card', class extends HTMLElement {
  connectedCallback() {
    let down;
    let up;
    // Enhance to a pointer only if the JavaScript applies
    this.style.cursor = 'pointer';
    // Note: This only works for a single link or the first one.
    const firstOrOnlyLink = this.querySelector('a');
    this.onmousedown = () => down = +new Date();
    this.onmouseup = () => {
      up = +new Date();
      if ((up - down) < 200) {
        firstOrOnlyLink.click();
      }
    }
  }
});