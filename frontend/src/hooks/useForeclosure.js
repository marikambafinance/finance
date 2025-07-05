import { usePopupContext } from "../context/PopupContext";
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const FORECLOSE_LOAN = import.meta.env.VITE_FORECLOSE_LOAN;

const useForeclosure = (setLoading, setRefreshFlag, loanId, payMode) => {
  const { setType, setMessage, setShowPopup } = usePopupContext();

  const handleForeclose = async () => {
    const confirm = window.confirm(
      "Are you sure you want to foreclose this loan?"
    );
    if (!confirm) return;
    setLoading(true);
    try {
      const res = await fetch(FORECLOSE_LOAN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": HEADER_VALUE,
        },
        body: JSON.stringify({ loanId, paymentMode: payMode }),
      });
      const data = await res.json();
      setRefreshFlag((prev) => prev + 1);
      if (!res.ok) {
        throw new Error(data?.message);
      }
      setLoading(false);
      setShowPopup(true);
      setType(data.status);
      setMessage(data.message);
      console.log(data);
    } catch (error) {
      setShowPopup(true);
      setType(error.status || "error");
      setMessage(error.message);
      console.log("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return { handleForeclose };
};

export default useForeclosure;
