import readline from 'readline'

class Keyboard {
  constructor () {
    this.stopIndexing = false
    this.initKeyboard = this.initKeyboard.bind(this)
    this.stopStatus = this.stopStatus.bind(this)
  }

  initKeyboard () {
    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) process.stdin.setRawMode(true)
    process.stdin.on('keypress', (str, key) => {
      if (key && key.name === 'q') {
        this.stopIndexing = true
      }
      if (key && key.ctrl && key.name === 'c') {
        process.exit(0)
      }
    })
  }

  stopStatus () {
    return this.stopIndexing
  }
}

export default Keyboard
