import React from "react";
import logo from "../assets/Logo1.png";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate()

  const handleLogin = ()=>{
    navigate("/login")
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
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
        {user && (
          <Link to="/customer" className="hover:text-teal-300">
            Customer
          </Link>
        )}

        {user ? (
          <button
            onClick={handleLogout}
            className="bg-teal-400 text-[#264848] px-3 text-md font-semibold py-1 rounded-md cursor-pointer"
          >
            Logout
          </button>
        ) : (<button
            onClick={handleLogin}
            className="bg-teal-400 text-[#264848] px-3 py-1 text-md font-semibold rounded-md cursor-pointer"
          >
            Login
          </button>)}
      </nav>
    </header>
  );
};

export default Navbar;
