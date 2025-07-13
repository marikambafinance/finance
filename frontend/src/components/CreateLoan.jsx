import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { usePopupContext } from "../context/PopupContext";
import Popup from "./Popup";
import Loader from "./Loader";

const CreateLoanPage = () => {
  const { showPopup, setShowPopup, setType, setMessage } = usePopupContext();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      hpNumber: "",
      loanAmount: "",
      interestRate: 0,
      loanTerm: "",
      purpose: "",
      interestAmount: "",
      totalPayable: "",
      monthlyEMI: "",
    },
  });

  const loanAmount = parseFloat(watch("loanAmount"));
  const interestRate = parseFloat(watch("interestRate"));
  const loanTerm = parseFloat(watch("loanTerm"));

  useEffect(() => {
    if (!loanAmount || !interestRate || !loanTerm) {
      setValue("interestAmount", "");
      setValue("totalPayable", "");
      setValue("monthlyEMI", "");
      return;
    }

    const interestAmount = ((loanAmount * loanTerm * interestRate))/100;
      
    const totalPayable = loanAmount + interestAmount;
    const monthlyEMI = totalPayable / loanTerm;

    setValue("interestAmount", interestAmount.toFixed(2));
    setValue("totalPayable", totalPayable.toFixed(2));
    setValue("monthlyEMI", monthlyEMI.toFixed(2));
  }, [loanAmount, interestRate, watch("loanTerm"), setValue]);

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const res = await fetch("https://mariamma-finance.onrender.com/loan", {
        method: "POST",
        headers: {
          "x-api-key": "marikambafinance@123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result?.status || result.status !== "success") {
        throw new Error(result?.message || "Loan creation failed.");
      }

      setType("success");
      setMessage("Loan created successfully!");
      reset();
    } catch (err) {
      setType("error");
      setMessage(
        err.message || "Something went wrong while creating the loan."
      );
    } finally {
      setLoading(false);
      setShowPopup(true);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-8 mt-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-300">Apply Loan</h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block mb-1">HP Number</label>
            <input
              type="text"
              placeholder="HP Number"
              {...register("hpNumber", {
                required: "Customer ID is required.",
              })}
              className="p-2 rounded bg-gray-700 w-full"
            />
            {errors.hpNumber && (
              <p className="text-red-400 text-sm mt-1">
                {errors.hpNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Loan Amount</label>
            <input
              type="number"
              placeholder="Loan Amount"
              {...register("loanAmount", {
                required: "Loan amount is required.",
                min: {
                  value: 1,
                  message: "Loan amount must be greater than 0.",
                },
              })}
              className="p-2 rounded bg-gray-700 w-full"
            />
            {errors.loanAmount && (
              <p className="text-red-400 text-sm mt-1">
                {errors.loanAmount.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Interest Rate</label>
            <input
              placeholder="Interest Rate"
              type="number"
              {...register("interestRate")}
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Loan Term</label>
            <select
              {...register("loanTerm", { required: "Loan term is required." })}
              className="p-2 rounded bg-gray-700 w-full"
            >
              <option value="">Select Loan Term</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="10">10 Months</option>
              <option value="12">12 Months</option>
              <option value="18">18 Months</option>
              <option value="24">24 Months</option>
              <option value="36">36 Months</option>
            </select>
            {errors.loanTerm && (
              <p className="text-red-400 text-sm mt-1">
                {errors.loanTerm.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Interest Amount</label>
            <input
              type="text"
              readOnly
              value={
                watch("interestAmount")
                  ? `₹${parseFloat(watch("interestAmount")).toLocaleString(
                      "en-IN"
                    )}`
                  : ""
              }
              placeholder="Interest Amount"
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Total Payable</label>
            <input
              type="text"
              readOnly
              value={watch("totalPayable") ? `₹${parseFloat(watch("totalPayable")).toLocaleString("en-IN")}` : ""}
              placeholder="Total Payable"
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div>
            <label className="block mb-1">Monthly EMI</label>
            <input
              type="text"
              readOnly
              value={watch("monthlyEMI") ? `₹${parseFloat(watch("monthlyEMI")).toLocaleString("en-IN")}` : ""}
              placeholder="Monthly EMI"
              className="p-2 rounded bg-gray-700 w-full"
            />
          </div>

          <div className="md:col-span-2">
            <textarea
              placeholder="Purpose"
              rows="3"
              {...register("purpose", { required: "Purpose is required." })}
              className="p-2 rounded bg-gray-700 w-full"
            />
            {errors.purpose && (
              <p className="text-red-400 text-sm mt-1">
                {errors.purpose.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="bg-teal-400 hover:bg-teal-500 text-black font-bold py-2 px-6 rounded-full md:col-span-2"
          >
            Submit Loan
          </button>
        </form>
        <Popup />
      </main>
    </div>
  );
};

export default CreateLoanPage;
