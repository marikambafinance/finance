import { useEffect, useState } from "react";
import { usePopupContext } from "../context/PopupContext";
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const GET_CUSTOMER_REPAYMENTS_INFO = import.meta.env
  .VITE_GET_CUSTOMER_REPAYMENTS_INFO;

const useRepaymentDetails = (loanId, setLoading) => {
  const [repayments, setRepayments] = useState([]);
  const { setType, setMessage, setShowPopup } = usePopupContext();

  const fetchRepaymentDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(GET_CUSTOMER_REPAYMENTS_INFO, {
        method: "POST",
        headers: {
          "x-api-key": HEADER_VALUE,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ loanId }),
      });

      const data = await res.json();
      setRepayments(data?.repayment_data || []);
    } catch (err) {
      setShowPopup(true);
      setType("error");
      setMessage(err.message);
      console.error("Error fetching repayment data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loanId) {
      fetchRepaymentDetails();
    }
  }, [loanId]);

  return { repayments, fetchRepaymentDetails };
};

export default useRepaymentDetails;
