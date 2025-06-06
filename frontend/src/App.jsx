import Home from './components/Home'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Customer from './pages/Customer'
import About from './pages/About'

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
    <RouterProvider router={router}/>
  )
}

export default App