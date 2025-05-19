import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // ここでTailwindのCSSを読み込んでいる

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
