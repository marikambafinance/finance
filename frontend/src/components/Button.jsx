import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

const Button = ({ title, path }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(path);
  };
  return (
    <button 
        className="bg-teal-400 hover:bg-teal-500 cursor-pointer text-gray-900 font-semibold text-lg py-3 px-8 rounded-full shadow-xl transition duration-300"
        onClick={handleClick}>
      ➕ {title}
    </button>
  );
};

export default Button;
