
const useCustomerUpdate = ()=>{

    const updateCustomerData = async (data)=>{
        const res = await fetch("https://mariamma-finance.onrender.com/update_customer",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "marikambafinance@123"
            },
            body: JSON.stringify(data)
        })
        const result = await res.json();
        console.log(result)
    }

    return {updateCustomerData}
}

export default useCustomerUpdate;