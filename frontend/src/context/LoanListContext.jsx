import { createContext, useContext, useState } from "react";

const LoanListContext = createContext();

export const useLoanListContext = () => useContext(LoanListContext);

const LoanListContextProvider = ({children})=>{
    const [loanList, setLoanList] = useState(null)

    return (
        <LoanListContext.Provider value={{loanList, setLoanList}}>
            {children}
        </LoanListContext.Provider>
    )
}

export default LoanListContextProvider;