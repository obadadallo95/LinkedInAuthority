import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './application/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { PostsProvider } from './contexts/PostsContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <PostsProvider>
          <App />
        </PostsProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
)
