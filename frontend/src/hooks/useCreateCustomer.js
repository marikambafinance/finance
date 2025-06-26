import { useState } from "react";

export const useCreateCustomer = ()=>{
    const [loading, setLoading] = useState(false);

    const createCustomer = async (formData)=>{
        try {
            const res = await fetch('https://mariamma-finance.onrender.com/submit',{
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const data = await res.json();
            setLoading(false)
            return data;
        } catch (error) {
            setLoading(false)
            console.log("Error submitting the form : ",error.message)
        }  
    }
    
    return {createCustomer, loading, setLoading};
}