import { useEffect } from "react";
import { useLoanListContext } from "../context/LoanListContext";
let loanWithRepayments = null;
const useLoanWithRepaymentsList = ()=>{
    const {setLoanList} = useLoanListContext();

    const fetchLoanList = async (hpNumber)=>{
        const res = await fetch("https://mariamma-finance.onrender.com/get_customer_loans_with_repayments",{
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({hpNumber})
        })
        const data = await res.json();
        console.log(data)
        setLoanList(data)
    }

    useEffect(()=>{
        if(loanWithRepayments){
            setLoanList(loanWithRepayments);
        }
    },[])

    return fetchLoanList;
}

export default useLoanWithRepaymentsList;