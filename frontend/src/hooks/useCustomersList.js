import { useEffect, useState } from "react";

export const useCustomersList = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getCustomersList = async () => {
      try {
        const res = await fetch(
          "https://mariamma-finance.onrender.com/customers"
        );
        const result = await res.json();
        setData(result?.customers_data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    getCustomersList();
  }, []);

  return { data, loading, error };
};
