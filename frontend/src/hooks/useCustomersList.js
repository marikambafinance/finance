import { useEffect, useState } from "react";
import { useCustomers } from "../context/CustomersContext";

let customersCache = null;

export const useCustomersList = () => {
    const { setCustomers} = useCustomers();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCustomersList = async () => {
    try {
      const res = await fetch(
        "https://mariamma-finance.onrender.com/customers"
      );
      const result = await res.json();
      customersCache = result?.customers_data;
      setCustomers(result?.customers_data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(customersCache){
        setCustomers(customersCache);
        setLoading(false);
        return;
    }
    getCustomersList();
  }, []);

  return { loading, error, setLoading, getCustomersList};
};
