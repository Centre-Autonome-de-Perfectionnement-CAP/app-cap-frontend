import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import App from './App.tsx'
import store from './store.ts'
import { setupAxiosInterceptors } from './services/interceptor.ts'

// window.location.href = '/login' contourne le basename="/services" du BrowserRouter
// et provoque une page blanche. On utilise un CustomEvent à la place :
// AuthContext l'écoute et appelle navigate() qui respecte le basename.
setupAxiosInterceptors(() => {
  localStorage.clear()
  window.dispatchEvent(new CustomEvent('session-expired'))
})

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
