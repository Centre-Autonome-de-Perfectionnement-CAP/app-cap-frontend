import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import App from './App.tsx'
import store from './store.ts'
import { setupAxiosInterceptors } from './services/interceptor.ts'
setupAxiosInterceptors(() => {
  localStorage.clear()
  window.location.href = '/login'
})

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
