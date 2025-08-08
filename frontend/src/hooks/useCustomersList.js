import { useEffect, useState } from "react";
import { useCustomers } from "../context/CustomersContext";

const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const GET_CUSTOMERS_LIST = import.meta.env.VITE_GET_CUSTOMERS_LIST;

let customerList;

export const useCustomersList = () => {
  const { customers, setCustomers } = useCustomers();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCustomersList = async () => {
    try {
      const res = await fetch(GET_CUSTOMERS_LIST, {
        headers: {
          "x-api-key": HEADER_VALUE,
        },
      });
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
    if (customers) {
      setCustomers(customers);
      setLoading(false);
      return;
    }
    getCustomersList();
  }, []);

  return { loading, error, setLoading, getCustomersList, customerList };
};
