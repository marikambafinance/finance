import { createContext, useContext, useState } from "react";

const TabButtonContext = createContext();

export const useTabButtonContext = () => useContext(TabButtonContext);

const TabButtonContextProvider = ({children}) =>{

    const [activeTab, setActiveTab] = useState("Customers");

    return (
        <TabButtonContext.Provider value={{activeTab, setActiveTab}}>
            {children}
        </TabButtonContext.Provider>
    )
}

export default TabButtonContextProvider;