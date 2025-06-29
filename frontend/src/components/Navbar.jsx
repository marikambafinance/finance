import React from "react";
import logo from "../assets/Logo1.png";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="w-full max-w-6xl flex justify-between items-center py-6 px-4 z-10">
      <Link to="/">
        <div className="flex flex-col justify-center items-center">
          <img src={logo} className="w-[120px]" alt="Logo" />
          <div className="text-sm flex font-bold flex-col items-center justify-center">
            <p className=" text-amber-400">
              ಮಾರಿಕಾಂಬ <span className="text-white">ಜೊತೆ</span>
            </p>
            <p>
              ಸವಾರಿಯ ಹೊಸ <span className="text-amber-400">ಅಧ್ಯಾಯ!</span>
            </p>
          </div>
        </div>
      </Link>
      <nav className="space-x-6 text-lg">
        <Link to="/" className="hover:text-teal-300">
          Home
        </Link>
        <Link to="/about" className="hover:text-teal-300">
          About
        </Link>
        <Link to="/customer" className="hover:text-teal-300">
          Customer
        </Link>
        <a href="#" className="hover:text-teal-300">
          Support
        </a>
      </nav>
    </header>
  );
};

export default Navbar;
