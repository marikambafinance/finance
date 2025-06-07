import Home from './pages/Home'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Customer from './pages/Customer'
import About from './pages/About'
import CustomerProvider from './context/CustomersContext'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "/customer",
    element: <Customer />
  },
  {
    path: "/about",
    element: <About />
  }
])

const App = () => {
  return (
    <CustomerProvider>
      <RouterProvider router={router}/>
    </CustomerProvider>
  )
}

export default App