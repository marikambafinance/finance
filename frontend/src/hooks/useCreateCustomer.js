import { useState } from "react";

const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const REGISTER_USER = import.meta.env.VITE_REGISTER_USER;

export const useCreateCustomer = () => {
  const [loading, setLoading] = useState(false);

  const createCustomer = async (formData) => {
    try {
      const res = await fetch(REGISTER_USER, {
        method: "POST",
        headers: {
          "x-api-key": HEADER_VALUE,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      console.log("Error submitting the form : ", error.message);
    }
  };

  return { createCustomer, loading, setLoading };
};
