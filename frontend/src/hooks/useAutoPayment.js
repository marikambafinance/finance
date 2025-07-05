import { usePopupContext } from "../context/PopupContext";
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const AUTO_UPDATE_PAYMENTS = import.meta.env.VITE_AUTO_UPDATE_PAYMENTS;

const useAutoPayment = (setLoading) => {
  const { setType, setMessage, setShowPopup } = usePopupContext();

  const handleAutoPayment = async (data) => {
    try {
      const res = await fetch(AUTO_UPDATE_PAYMENTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": HEADER_VALUE,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      setLoading();
      if (!res.ok) {
        throw new Error(result?.message);
      }
      setShowPopup(true);
      setType(result?.status || "success");
      setMessage(result?.message);
      console.log(result);
    } catch (error) {
      setShowPopup(true);
      setType(error.status);
      setMessage(error.message);
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { handleAutoPayment };
};

export default useAutoPayment;
