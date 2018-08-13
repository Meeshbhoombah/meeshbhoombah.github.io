/*

index.js

*/ 

import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'

// Export as JSX for static rendering
export default App

if (typeof document !== 'undefined') {
  const renderMethod = module.hot ? ReactDOM.render : ReactDOM.hydrate || ReactDOM.render
  const render = Comp => {
    renderMethod(<Comp />, document.getElementById('root'))
  }

  render(App)
}
