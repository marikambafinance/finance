
export const useCreateCustomer = ()=>{
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
            console.log("Server response : ",data)
        } catch (error) {
            console.log("Error submitting the form : ",error)
        }  
    }
    
    return createCustomer;
}