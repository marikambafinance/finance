import { useEffect, useState } from "react";
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const GET_CUSTOMER_DETAILS = import.meta.env.VITE_GET_CUSTOMER_DETAILS;

const useCustomerDetails = (hpNumber)=>{
    const [custDetails, setCustDetails] = useState(null);

    const getCustomerDetails = async ()=>{
        const res = await fetch(GET_CUSTOMER_DETAILS,{
            method: "POST",
            headers: {
                'x-api-key': HEADER_VALUE,
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

    return {custDetails, getCustomerDetails}

}

export default useCustomerDetails;