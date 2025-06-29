import { useEffect, useState } from "react"

const useDashboardStats = ()=>{
    const [financeData, setFinanceData] = useState(null);

    const getDashboardStats = async ()=>{
        try {
            const res = await fetch("https://mariamma-finance.onrender.com//dashboard-stats",{
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": "marikambafinance@123"
                }
            });

            const result = await res.json();
            setFinanceData(result);
            console.log(result)
        } catch (error) {
            console.log(error.message);
        }
    }

    useEffect(()=>{
        getDashboardStats();
    },[])

    return {getDashboardStats, financeData}
}

export default useDashboardStats;