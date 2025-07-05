const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const UPDATE_CUSTOMER_DETAILS = import.meta.env.VITE_UPDATE_CUSTOMER_DETAILS;

const useCustomerUpdate = ()=>{

    const updateCustomerData = async (data)=>{
        const res = await fetch(UPDATE_CUSTOMER_DETAILS,{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": HEADER_VALUE
            },
            body: JSON.stringify(data)
        })
        const result = await res.json();
        return result;
    }

    return {updateCustomerData}
}

export default useCustomerUpdate;