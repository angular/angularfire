customElements.define('eap-tab-switcher', class extends HTMLElement {});
customElements.define('eap-tab-list', class extends HTMLElement {
  connectedCallback() {
    this.buttonTabs = this.querySelectorAll('button');
    for(let button of this.buttonTabs) {
      button.addEventListener('click', clickEvent => {
        const activeButton = this.querySelector('button[aria-selected="true"]');
        const activePanelId = activeButton.dataset.panel;
        const panelToDisplayId = button.dataset.panel;
        const panelToDisplay = document.querySelector(`#${panelToDisplayId}`);
        const activePanel = document.querySelector(`#${activePanelId}`);
        if(activeButton.id !== button.id) {
          button.setAttribute('aria-selected', true);
          activeButton.setAttribute('aria-selected', false);
          panelToDisplay.classList.add('block');
          panelToDisplay.classList.remove('hidden');
          activePanel.classList.remove('block');
          activePanel.classList.add('hidden');
        }
      });
    }
  }
});
customElements.define('eap-tab-panel-list', class extends HTMLElement {});
customElements.define('eap-tab-panel', class extends HTMLElement { });