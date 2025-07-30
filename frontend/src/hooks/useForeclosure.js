import { usePopupContext } from "../context/PopupContext";
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;
const FORECLOSE_LOAN = import.meta.env.VITE_FORECLOSE_LOAN;

const useForeclosure = (
  setLoading,
  setRefreshFlag,
  loanId,
  payMode,
  fetchForecloseBalance,
  partialFlag,
  hpNumber
) => {
  const { setType, setMessage, setShowPopup } = usePopupContext();

  const handleForeclose = async () => {
    console.log(partialFlag);
    if (partialFlag) {
      window.alert(
        "To proceed with loan foreclosure, kindly make at least one repayment or clear all partial dues."
      );
      return;
    }

    setLoading(true);

    try {
      const forecloseData = await fetchForecloseBalance();

      const confirm = window.confirm(
        `Your adjusted balance amount for foreclosure is ₹${forecloseData?.pendingBalance}. 
To proceed, please confirm by entering this exact amount in the next step, or choose to enter a custom amount instead.`
      );

      if (!confirm) {
        setLoading(false);
        return;
      }

      const minAcceptableAmount = Math.ceil(forecloseData.pendingBalance * 0.9);
      let customBalance;

      while (true) {
        const input = window.prompt(
          `Please enter ₹${forecloseData?.pendingBalance} or a custom Foreclosure Amount (≥ ₹${minAcceptableAmount}) to proceed.`
        );

        if (input === null) {
          // User cancelled prompt
          setLoading(false);
          return;
        }

        const trimmed = input.trim();

        if (trimmed === "" || isNaN(trimmed)) {
          alert("Please enter a valid numeric amount.");
          continue;
        }

        customBalance = Number(trimmed);

        if (customBalance < minAcceptableAmount) {
          alert(
            `Entered amount is too low. Minimum allowed is ₹${minAcceptableAmount}. Please try again.`
          );
          continue;
        }

        break; // valid amount entered
      }

      const modifiedforecloseData = {
        ...forecloseData,
        customBalance,
        paymentMode: payMode,
        hpNumber,
        loanId,
      };

      const res = await fetch(FORECLOSE_LOAN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": HEADER_VALUE,
        },
        body: JSON.stringify(modifiedforecloseData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || "Something went wrong during foreclosure."
        );
      }

      setRefreshFlag((prev) => prev + 1);
      setShowPopup(true);
      setType(data.status);
      setMessage(data.message);
      console.log(data);
    } catch (error) {
      console.error("Error:", error.message);
      setShowPopup(true);
      setType(error.status || "error");
      setMessage(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return { handleForeclose };
};

export default useForeclosure;
