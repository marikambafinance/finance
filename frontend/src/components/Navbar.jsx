import React from 'react'
import logo from '../assets/Logo.png'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <header className="w-full max-w-6xl flex justify-between items-center py-6 px-4 z-10">
        <Link to="/">
            <div className='flex flex-col justify-center items-center'>
                <img src={logo} className='w-[150px]' alt="Logo" />
            </div>
        </Link>
        <nav className="space-x-6 text-lg">
          <Link to="/" className="hover:text-teal-300">Home</Link>
          <Link to="/about" className="hover:text-teal-300">About</Link>
          <a href="#" className="hover:text-teal-300">Support</a>
        </nav>
    </header>
  )
}

export default Navbar