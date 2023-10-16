import { getYearFromCollection } from '../modules/utilities.js'
import store from '../store'

/**
 * Web component that enables the user to select from a list of available years.
 * Looks up `store.state[this.dataset.viewportId].collection` on connectedCallback to get available years.
 * @prop {string} dataset.viewportId - `data-viewport-id` attribute used to look up state by viewport ID.
 * @fires updateCollection - New collection (`skraafotos` + year) selected by user.
 */
export class SkraaFotoYearSelector extends HTMLElement {

  // private properties
  #selectElement
  #styles = `
    select {
      background-color: var(--hvid);
      border: none;
      cursor: pointer;
      box-shadow: none;
    }

    @media screen and (max-width: 50rem) {

      select {
        text-indent: -10000em;
        width: 3.25rem;
        height: 3rem;
        border: none;
        padding: 0 !important;
        position: relative;
        background: var(--ds-hentdata-icon-pending);
        background-size: 2rem auto !important;
        background-repeat: no-repeat;
        background-position: 0.75rem center !important;
        background-color: transparent;
        margin: 0 !important;
        border-radius: 2.5rem 0 0 2.5rem;
      }
      select:hover,
      select:active {
        background-color: var(--aktion) !important;
        background-blend-mode: difference;
      }
      select:focus {
        box-shadow: inset 0 0 0 3px var(--highlight);
      }
    }

    @media screen and (min-width: 50.1rem) {

      select {
        width: auto;
        background-position: center right .25rem !important;
        margin: 0 !important;
      }

      select:focus {
        box-shadow: 0 0 0 3px var(--highlight);
      }

    }
  `
  #template = `
    <style>
      ${ this.#styles }
    </style>
    <label hidden>Vælg en årgang</label>
    <select class="sf-date-selector" title="Vælg en årgang"></select>
  `

  constructor() {
    super()
  }

  connectedCallback() {
    this.createDOM()

    // Listen for user change
    this.#selectElement.addEventListener('change', this.selectionChangeHandler.bind(this))    

    window.addEventListener('updateCollection', this.collectionUpdatedHandler.bind(this))
  }

  // methods

  createDOM() {
    this.innerHTML = this.#template

    this.#selectElement = this.querySelector('select')

    // Create the year options from the list of collections
    for (const c of store.state.collections) {
      const year = getYearFromCollection(c)
      const optionElement = document.createElement('option')
      optionElement.value = year
      optionElement.innerText = year
      this.#selectElement.appendChild(optionElement)
    }
    
    // Setup select element value from state
    this.#selectElement.value = getYearFromCollection(store.state[this.dataset.viewportId].collection)
  }

  selectionChangeHandler(event) {
    store.dispatch('updateCollection', {
      id: this.dataset.viewportId, 
      collection: `skraafotos${event.target.value}`
    })
  }

  collectionUpdatedHandler(event) {
    // Only update if the right viewport state was updated
    if (event.detail.id === this.dataset.viewportId) {
      this.#selectElement.value = getYearFromCollection(event.detail.collection)
    }
  }

  disconnectedCallback() {
    window.removeEventListener('updateCollection', this.collectionUpdatedHandler)
  }

}
