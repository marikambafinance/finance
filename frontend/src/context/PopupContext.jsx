import { createContext, useContext, useState } from "react";

const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [type, setType] = useState("success"); // 'success' | 'error'
  const [message, setMessage] = useState("");

  return (
    <PopupContext.Provider
      value={{ showPopup, setShowPopup, type, setType, message, setMessage }}
    >
      {children}
    </PopupContext.Provider>
  );
};

export const usePopupContext = () => useContext(PopupContext);
