import { useEffect, useState } from "react";
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const DASHBOARD_STATS = import.meta.env.VITE_DASHBOARD_STATS;

const useDashboardStats = ()=>{
    const [financeData, setFinanceData] = useState(null);

    const getDashboardStats = async ()=>{
        try {
            const res = await fetch(DASHBOARD_STATS,{
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": HEADER_VALUE
                }
            });

            const result = await res.json();
            setFinanceData(result);
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