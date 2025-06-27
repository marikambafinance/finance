import { useEffect, useState } from "react"
let repaymentsList = null;

const useRepayment = ()=>{

    const [repaymentDetails, setRepaymentDetails] = useState([]);

    const searchRepayment = async (hpNumber)=>{
        const res = await fetch("https://mariamma-finance.onrender.com/get_customer_loans_with_repayments",{
            method: 'POST',
            headers: {
                'x-api-key': 'marikambafinance@123',
                "Content-Type": "application/json"
            },
            body: JSON.stringify({hpNumber})
        })
        const data = await res.json();
        console.log(data)
        repaymentsList = data?.data[0]?.repayments;
        setRepaymentDetails(data?.data[0]?.repayments);
    }

    useEffect(()=>{
        if(repaymentsList){
            setRepaymentDetails(repaymentsList);
        }
    },[])

    return {repaymentDetails, setRepaymentDetails, searchRepayment}

}

export default useRepayment;