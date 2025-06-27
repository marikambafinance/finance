import { useEffect, useState } from "react";
import { useCustomers } from "../context/CustomersContext";

let customerList;

export const useCustomersList = () => {
  const { customers, setCustomers} = useCustomers();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCustomersList = async () => {
    try {
      const res = await fetch(
        "https://mariamma-finance.onrender.com/customers",{
          headers: {
            "x-api-key": "marikambafinance@123",
          }
        }
      );
      const result = await res.json();
      setCustomers(result);
      customerList = result;
      setError(null);
    } catch (err) {
      setError(err.message);
      setCustomers(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(customers){
        setCustomers(customers);
        setLoading(false);
        return;
    }
    getCustomersList();
  }, []);

  return { loading, error, setLoading, getCustomersList, customerList};
};
