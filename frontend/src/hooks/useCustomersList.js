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
        "https://mariamma-finance.onrender.com/customers"
      );
      const result = await res.json();
      setCustomers(result?.customers_data);
      customerList = result?.customers_data;
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
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
