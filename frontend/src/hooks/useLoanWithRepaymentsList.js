import { useEffect } from "react";
import { useLoanListContext } from "../context/LoanListContext";
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const GET_CUSTOMER_LOANS = import.meta.env.VITE_GET_CUSTOMER_LOANS;

let loanWithRepayments = null;
const useLoanWithRepaymentsList = ()=>{
    const {setLoanList} = useLoanListContext();

    const fetchLoanList = async (hpNumber)=>{
        const res = await fetch(GET_CUSTOMER_LOANS,{
            method: 'POST',
            headers: {
                'x-api-key': HEADER_VALUE,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({hpNumber})
        })
        const data = await res.json();
        setLoanList(data);
    }

    useEffect(()=>{
        if(loanWithRepayments){
            setLoanList(loanWithRepayments);
        }
    },[])

    return fetchLoanList;
}

export default useLoanWithRepaymentsList;