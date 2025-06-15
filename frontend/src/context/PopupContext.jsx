import { createContext, useContext, useState } from "react";

const PopupContext = createContext();

export const usePopupContext = () => useContext(PopupContext);

const PopupContextProvider = ({children}) =>{
    const [showPopup, setShowPopup] = useState(false);
    const [type, setType] = useState(null)

    return (
        <PopupContext.Provider value={{showPopup, setShowPopup, type, setType}}>
            {children}
        </PopupContext.Provider>
    )
}

export default PopupContextProvider;