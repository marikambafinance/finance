import React, { useEffect, useState } from "react";
import moment from "moment-timezone";
import { useForm } from "react-hook-form";
import Loader from "./Loader";

const RepaymentCard = ({ repayment, onUpdateSuccess, updateLoans, hpNumber }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      loanId: repayment?.loanId,
      installmentNumber: repayment?.installmentNumber,
      amountDue: repayment?.amountDue,
      amountPaid: repayment?.amountPaid,
      totalAmountDue: parseFloat(parseFloat(repayment?.amountDue) + parseFloat(repayment?.penalty)),
      recoveryAgent: repayment?.recoveryAgent || false,
      status: repayment?.status,
      paymentMode: repayment?.paymentMode || "-",
    },
  });

  const handleStatusChange = (e) => {
    const selected = e.target.value;

    if (selected === "paid") {
      setValue("status", "paid");
      setValue("amountPaid", watch("totalAmountDue"));
    } else {
      setValue("status", "pending");
      setValue("amountPaid", 0);
    }
  };

  const updateRepayment = async (data) => {
    const res = await fetch(
      "https://mariamma-finance.onrender.com/update_repayment",
      {
        method: "POST",
        headers: {
          'x-api-key': 'marikambafinance@123',
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    const result = await res.json();
    console.log(result);
  };

  const handleCheckboxChange = ()=>{
    if(editMode){
      setValue("recoveryAgent", !watch("recoveryAgent"))
      
      if(watch("recoveryAgent")){ 
        const totalAmount = parseFloat(watch("totalAmountDue")) + 500;
        setValue("totalAmountDue", totalAmount)
        if(watch("status") === "paid"){
          setValue("amountPaid", totalAmount);
        }
      }else{
        const totalAmount = parseFloat(watch("totalAmountDue")) - 500;
        setValue("totalAmountDue", totalAmount)
        if(watch("status") === "paid"){
          setValue("amountPaid", totalAmount);
        }
      }
    }
  }

  useEffect(() => {
    reset({
      loanId: repayment?.loanId,
      installmentNumber: repayment?.installmentNumber,
      amountPaid: repayment?.amountPaid,
      totalAmountDue: repayment?.totalAmountDue,
      recoveryAgent: repayment?.recoveryAgent || false,
      status: repayment?.status,
      paymentMode: repayment?.paymentMode || "-",
    });
  }, [repayment, reset]);

  const onSubmit = async (data) => {
    console.log(data);
    setLoading(true);
    await updateRepayment(data);
    await updateLoans(hpNumber);
    setLoading(false);
    reset();
    setEditMode(false); // Exit edit mode after update
    onUpdateSuccess();
  };

  const handleCancel = () => {
    reset(); // reset form fields to original
    setEditMode(false);
  };

  if (loading) return <Loader />;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
    >
      <div className="flex flex-wrap p-6 gap-6">
        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Installment #</span>
          <span>{watch("installmentNumber")}</span>
        </div>
        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Due Date</span>
          <span>
            {moment
              .tz(repayment?.dueDate, "GMT")
              .tz("Asia/Kolkata")
              .format("DD-MM-YYYY")}
          </span>
        </div>
        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Amount Due</span>
          <span>₹{parseFloat(repayment?.amountDue).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Amount Paid</span>
          <span>₹{parseFloat(watch("amountPaid")).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Penalty</span>
          <span>₹{repayment?.penalty}</span>
        </div>
        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Total Amount Due</span>
          <span>₹{parseFloat(watch("totalAmountDue")).toLocaleString("en-IN")}</span>
        </div>

        {/* STATUS */}
        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Status</span>
          {editMode ? (
            <select
              {...register("status")}
              onChange={handleStatusChange}
              className={`p-2 rounded ${
                watch("status") === "pending" ? "bg-amber-600" : "bg-green-500"
              } text-white`}
            >
              <option value="pending">pending</option>
              <option value="paid">paid</option>
            </select>
          ) : (
            <span
              className={`p-2 rounded text-sm ${
                watch("status") === "pending" ? "bg-amber-600" : "bg-green-500"
              } text-white`}
            >
              {watch("status")}
            </span>
          )}
        </div>

        {/* PAYMENT MODE */}
        <div className="flex flex-col w-48">
          <span className="text-xs text-gray-400">Payment Mode</span>
          {editMode ? (
            <select
              {...register("paymentMode")}
              className="p-2 rounded bg-gray-700 text-white"
            >
              <option value="">Select</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="NetBanking">Net Banking</option>
            </select>
          ) : (
            <span className="text-sm p-2 rounded bg-gray-700 text-white">
              {watch("paymentMode")}
            </span>
          )}
        </div>

        {/* Recovery Agent (only visual, not editable here) */}
        <div className="flex items-center gap-2 w-48">
          <input
            className="w-5 h-5 accent-green-500 border-green-500"
            type="checkbox"
            {...register("recoveryAgent")}
            checked={watch("recoveryAgent")}
            onChange={handleCheckboxChange}
            onClick={(e)=> {
              if(editMode === false){
                e.preventDefault();
              }
            }}
          />

          <span className="text-sm">Recovery Agent</span>
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-2 w-full flex gap-4">
          {editMode ? (
            <div className="pt-2 w-full flex gap-4">
              <button
                type="submit"
                className={`bg-teal-500 hover:bg-teal-600 text-gray-900 font-semibold py-2 px-4 rounded-full transition duration-300`}
              >
                Update
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default RepaymentCard;
