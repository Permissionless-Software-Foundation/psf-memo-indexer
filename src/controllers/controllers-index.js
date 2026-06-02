import Keyboard from './keyboard.js'
import TxRESTController from './tx-rest-api.js'

class Controllers {
  constructor (localConfig = {}) {
    if (!localConfig.useCases) throw new Error('Use cases required.')
    if (!localConfig.adapters) throw new Error('Adapters required.')
    this.useCases = localConfig.useCases
    this.adapters = localConfig.adapters
    this.keyboard = new Keyboard()
    this.txRESTController = new TxRESTController(localConfig)
    this.initControllers = this.initControllers.bind(this)
    this.startTxRESTController = this.startTxRESTController.bind(this)
  }

  async initControllers () {
    this.keyboard.initKeyboard()
  }

  async startTxRESTController () {
    this.txRESTController.start()
  }
}

export default Controllers
