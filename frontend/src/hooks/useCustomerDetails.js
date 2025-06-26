import { useEffect, useState } from "react"

const useCustomerDetails = (hpNumber)=>{
    const [custDetails, setCustDetails] = useState(null);

    const getCustomerDetails = async ()=>{
        const res = await fetch("https://mariamma-finance.onrender.com/only_customer_and_loans",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({hpNumber})
        })
        const data = await res.json();
        setCustDetails(data?.customers_data[0])
    }
    useEffect(()=>{
        if(hpNumber){
            getCustomerDetails();
        }
    },[]);

    return {custDetails}

}

export default useCustomerDetails;