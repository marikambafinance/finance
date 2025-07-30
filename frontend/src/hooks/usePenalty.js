import { useEffect } from "react";

const PAY_PENALTY = import.meta.env.VITE_PAY_PENALTY;
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;

const usePenalty = () => {
  const payPenalty = async (data) => {
    const res = await fetch(PAY_PENALTY, {
      method: "POST",
      headers: {
        "x-api-key": HEADER_VALUE,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    console.log(result);
  };

  return { payPenalty };
};

export default usePenalty;
