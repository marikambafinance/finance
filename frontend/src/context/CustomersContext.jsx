import { createContext, useContext, useState } from "react";

export const CustomerContext = createContext();

const CustomerProvider = ({children})=>{
    const [customers, setCustomers] = useState(null);

    return (
        <CustomerContext.Provider value={{customers, setCustomers}}>
            {children}
        </CustomerContext.Provider>
    )
}

export default CustomerProvider;

export const useCustomers = ()=> useContext(CustomerContext);