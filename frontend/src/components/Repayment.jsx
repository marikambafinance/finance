import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useLoanWithRepaymentsList from "../hooks/useLoanWithRepaymentsList";
import { useLoanListContext } from "../context/LoanListContext";
import LoanCard from "./LoanCard";
import Loader from "./Loader";

const Repayment = () => {
  const fetchLoanWithRepayments = useLoanWithRepaymentsList();
  const { loanList } = useLoanListContext();

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ hpNumber }) => {
    setLoading(true);
    await fetchLoanWithRepayments(hpNumber.trim());
    setHasSearched(true);
    setLoading(false);
    reset();
  };

  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-teal-300 mb-6">
          Search Customer Repayments
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
          <label className="block mb-1 font-semibold">Enter HP Number</label>
          <input
            {...register("hpNumber", { required: "HP Number is required" })}
            className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
            placeholder="HP Number"
          />
          {errors.hpNumber && (
            <p className="text-red-400 text-sm mb-2">
              {errors.hpNumber.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-teal-400 hover:bg-teal-500 text-gray-900 font-semibold py-2 px-6 rounded transition"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {loading ? (
          <Loader />
        ) : hasSearched ? (
          Array.isArray(loanList?.data) && loanList.data.length > 0 ? (
            loanList.data.map((item) => (
              <LoanCard
                key={item.loanId}
                loan={item}
                customerDetails={loanList.customerDetails}
              />
            ))
          ) : (
            <div className="text-center text-gray-400">
              No loan records found.
            </div>
          )
        ) : null}
      </main>
    </div>
  );
};

export default Repayment;
