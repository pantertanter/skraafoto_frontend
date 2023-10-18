import { queryItems } from '../modules/api.js'
import store from '../store'

/**
 * Web component that fetches a list of items covering a specific collection, coordinate, and orientation.
 * Enables user to select an item for view by its date.
 * @prop {string} dataset.index - `data-index` attribute used to look up state by viewport index.
 * @fires updateItemId - New item ID selected by user.
 */
export class SkraaFotoDateViewer extends HTMLElement {

  items = []
  #selectElement
  #buttonDown
  #buttonUp
  #styles = `
    skraafoto-date-viewer {
      z-index: 1;
      position: absolute;
      bottom: 1rem;
      pointer-events: none;
      height: 5rem;
      width: 100%;
      display: flex;
      justify-content: space-around;
    }
    .ds-button-group button, .ds-button-group  {
      padding: 0;
      pointer-events: all;
    }
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
        margin: 6px !important;
      }

      select:focus {
        box-shadow: 0 0 0 3px var(--highlight);
      }

    }
  `

  constructor() {
    super()
  }

  connectedCallback() {

    this.innerHTML = this.#renderTemplate()

    this.#selectElement = this.querySelector('select')
    this.#buttonDown = this.querySelector('.button-down')
    this.#buttonUp = this.querySelector('.button-up')
    let isOptionClicked = false

    // Add event listener to the button-down
    this.#buttonDown.addEventListener('click', () => {
      const selectedIndex = this.#selectElement.selectedIndex
      const lastIndex = this.#selectElement.options.length - 1
      const nextIndex = selectedIndex === lastIndex ? 0 : selectedIndex + 1
      this.#selectElement.selectedIndex = nextIndex
      this.#selectElement.dispatchEvent(new Event('change')) // Trigger change event manually
    })

    // Add event listener to the button-up
    this.#buttonUp.addEventListener('click', () => {
      const selectedIndex = this.#selectElement.selectedIndex
      const lastIndex = this.#selectElement.options.length - 1
      const prevIndex = selectedIndex === 0 ? lastIndex : selectedIndex - 1
      this.#selectElement.selectedIndex = prevIndex
      this.#selectElement.dispatchEvent(new Event('change')) // Trigger change event manually
    })

    // When an option is clicked, set the flag to prevent focus removal
    this.#selectElement.addEventListener('mousedown', () => {
      isOptionClicked = true
    })

    // When the select element loses focus, remove focus if no option is selected
    this.#selectElement.addEventListener('blur', () => {
      if (!isOptionClicked) {
        this.#selectElement.selectedIndex = -1 // Deselect any selected option
      }
      isOptionClicked = false // Reset the flag
    })

    // Add global listener for state changes
    window.addEventListener('updateItem', this.#update.bind(this))

    // Add event listener to the document for arrow key navigation
    window.addEventListener('imageshift', this.shiftItemHandler.bind(this))

    // When an option is selected, update the store with the new item
    this.#selectElement.addEventListener('change', (event) => {
      store.dispatch('updateItemId', {
        index: this.dataset.index,
        itemId: event.target.value
      })
      this.#selectElement.blur() // Remove focus from the select element
    })

    this.#update()
  }

  disconnectedCallback() {
    window.removeEventListener(this.dataset.viewportId, this.#update)
    window.removeEventListener('imageshift', this.shiftItemHandler)
  }

  #update() {
    const item = store.state.viewports[this.dataset.index]
    const collection = item.collection
    const year = collection.match(/\d{4}/g)[0]
    const orientation = item.orientation
    const center = store.state.marker.center
    
    queryItems(center, orientation, `skraafotos${ year }`, 50).then((response) => {
      this.items = response.features
      this.#selectElement.innerHTML = this.#renderOptions()
      this.#selectElement.value = item.itemId
    })
  }

  #renderTemplate() {
    return `
      <style>
        ${ this.#styles }
      </style>
      <nav class="ds-nav-tools">
        <div class="ds-button-group">
          <button class="button-down ds-icon-icon-arrow-single-down"></button>
          <hr>
          <select class="sf-date-viewer" id="date">
            ${ this.#renderOptions() }
          </select>
          <hr>
          <button class=" button-up ds-icon-icon-arrow-single-up"></button>
        </div>
      </nav>
    `
  }

  #renderOptions() {
    return this.items.map((i) => {
      const datetime = new Date(i.properties.datetime)
      const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
      const europeanDatetime = datetime.toLocaleString('en-GB', options)
      return `
      <option value="${i.id}">
        ${europeanDatetime}
      </option>
    `
    })
  }

  shiftItemHandler(event) {
    if (event.detail === -1) {
      this.#buttonDown.click()
    } else if (event.detail === 1) {
      this.#buttonUp.click()
    }
  }

}
