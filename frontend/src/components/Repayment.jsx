import React, { useState } from "react";
import Popup from "./Popup";
import useLoanWithRepaymentsList from "../hooks/useLoanWithRepaymentsList";
import { useLoanListContext } from "../context/LoanListContext";
import LoanCard from "./LoanCard";
import Loader from "./Loader";

const Repayment = () => {
  const fetchLoanWithRepayments = useLoanWithRepaymentsList();
  const [loading, setLoading] = useState(false);
  const { loanList } = useLoanListContext();
  const [hasSearched, setHasSearched] = useState(false);
  const [hpNumber, setHpNumber] = useState("");

  const handleClick = async () => {
    if (!hpNumber) return;
    setLoading(true);
    await fetchLoanWithRepayments(hpNumber);
    setLoading(false);
    setHasSearched(true);
    setHpNumber("");
  };

  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mt-6 sm:mt-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-teal-300">
            Search Customer Repayments
          </h2>
        </div>

        <form className="mb-6">
          <label className="block mb-2 text-lg font-semibold text-white">
            Enter HP Number
          </label>
          <input
            value={hpNumber}
            onChange={(e) => setHpNumber(e.target.value)}
            type="text"
            placeholder="HP Number"
            className="w-full p-2 rounded bg-gray-700 text-white mb-4"
          />
          <button
            onClick={handleClick}
            type="button"
            className="bg-teal-400 hover:bg-teal-500 text-gray-900 font-semibold py-2 px-6 rounded shadow-md transition duration-300"
          >
            Search
          </button>
        </form>
        {loading ? (
          <Loader />
        ) : (
          <div>
            {loanList?.data?.length > 0 ? (
              loanList?.data?.map((item) => (
                <LoanCard
                  loan={item}
                  customerDetails={loanList?.customerDetails}
                />
              ))
            ) : hasSearched ? (
              <div className="text-gray-400 mt-4 text-center">
                No loan records found.
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
};

export default Repayment;
