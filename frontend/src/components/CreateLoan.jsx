import React from "react";
import { useForm } from "react-hook-form";

const CreateLoan = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log("Loan Application Data:", data);
  };
  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-8 mt-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-300">Create Loan</h2>
        </div>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label className="block mb-1">Customer ID</label>
            <input
              type="text"
              {...register("customerId", {
                required: "Customer ID is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.customerId && (
              <p className="text-red-400 text-sm">
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Loan Amount</label>
            <input
              type="number"
              {...register("loanAmount", {
                required: "Loan amount is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.loanAmount && (
              <p className="text-red-400 text-sm">
                {errors.loanAmount.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Interest Rate (%)</label>
            <input
              type="number"
              step="0.01"
              {...register("interestRate", {
                required: "Interest rate is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.interestRate && (
              <p className="text-red-400 text-sm">
                {errors.interestRate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Loan Term (Months)</label>
            <input
              type="number"
              {...register("loanTerm", {
                required: "Loan term is required",
                max: {
                  value: 48,
                  message: "Loan term cannot exceed 48 months",
                },
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.loanTerm && (
              <p className="text-red-400 text-sm">{errors.loanTerm.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1">Purpose</label>
            <textarea
              rows="3"
              {...register("purpose")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            ></textarea>
          </div>

          <div className="md:col-span-2 text-center mt-4">
            <button
              type="submit"
              className="bg-teal-400 cursor-pointer hover:bg-teal-500 text-gray-900 font-semibold py-3 px-8 rounded-full shadow-md transition duration-300"
            >
              Submit Loan
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateLoan;
