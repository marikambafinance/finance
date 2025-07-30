import React, { useEffect, useState } from "react";
import moment from "moment-timezone";
import { useForm } from "react-hook-form";
import Loader from "./Loader";
import { usePopupContext } from "../context/PopupContext";
import Popup from "./Popup";

const RepaymentCard = ({
  repayment,
  onUpdateSuccess,
  updateLoans,
  hpNumber,
  penaltyPaid
}) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setShowPopup, setType, setMessage } = usePopupContext();
  const paidAmount = repayment?.amountPaid;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      loanId: repayment?.loanId || "",
      installmentNumber: repayment?.installmentNumber || "",
      amountDue: Number(repayment?.amountDue || 0),
      amountPaid: Number(repayment?.amountPaid),
      totalAmountDue: Number(repayment?.totalAmountDue),
      recoveryAgent: repayment?.recoveryAgent || false,
      status: repayment?.status,
      paymentMode: repayment?.paymentMode || "Cash",
      previousDues: repayment?.previousDues,
      penalty:
        Number(repayment?.penalty || 0) +
        (Number(repayment?.previousDues) || 0),
      recoveryAgentAmount: Number(repayment?.recoveryAgentAmount || 0),
      totalPenalty: Number(repayment?.totalPenalty || 0),
      customPenaltyCheck: false,
      customPenalty: repayment?.customPenalty,
      remainingPayment:
        Number(repayment?.totalAmountDue) - Number(repayment?.amountPaid),
    },
  });

  const status = watch("status");
  const penalty = Number(watch("penalty")) || 0;
  const recoveryAgentAmount = Number(watch("recoveryAgentAmount"));
  const recoveryAgent = watch("recoveryAgent");
  const totalPenalty = Number(watch("totalPenalty")) || 0;
  const totalAmountDue = Number(watch("totalAmountDue"));
  const customPenalty = Number(watch("customPenalty"));
  const customPenaltyCheck = watch("customPenaltyCheck");

  // useEffect(() => {
  //   if (!editMode) return;
  //   const amountDue = parseFloat(watch("amountDue")) || 0;
  //   const newTotalAmountDue = amountDue + totalPenalty;
  //   setValue("totalAmountDue", newTotalAmountDue);
  //   setValue("remainingPayment", newTotalAmountDue - paidAmount);
  //   if (watch("status") === "paid") {
  //     setValue("amountPaid", newTotalAmountDue);
  //   }
  // }, [totalPenalty, watch("amountDue"), watch("status")]);

  // useEffect(() => {
  //   if (customPenaltyCheck) {
  //     setValue("totalPenalty", customPenalty);
  //   } else {
  //     setValue("customPenalty", 0);
  //     const recoveryFee = recoveryAgent ? 500 : 0;
  //     const newTotalPenalty = penalty + recoveryFee;
  //     setValue("totalPenalty", newTotalPenalty);
  //   }
  // }, [customPenalty, recoveryAgent, customPenaltyCheck]);

  // useEffect(() => {
  //   if (!editMode) return;
  //   const recoveryFee = recoveryAgentAmount;
  //   const newTotalPenalty = penalty + recoveryFee;
  //   recoveryAgent
  //     ? setValue("totalPenalty", newTotalPenalty)
  //     : setValue("totalPenalty", repayment?.totalPenalty);
  // }, [penalty, recoveryAgent, setValue]);

  useEffect(() => {
    reset({
      loanId: repayment?.loanId || "",
      installmentNumber: repayment?.installmentNumber || "",
      amountDue: Number(repayment?.amountDue || 0),
      amountPaid: Number(repayment?.amountPaid),
      totalAmountDue: Number(repayment?.totalAmountDue),
      recoveryAgent: repayment?.recoveryAgent || false,
      status: repayment?.status,
      paymentMode: repayment?.paymentMode || "Cash",
      previousDues: repayment?.previousDues,
      penalty: Number(repayment?.penalty || 0),
      recoveryAgentAmount: Number(repayment?.recoveryAgentAmount || 0),
      totalPenalty: Number(repayment?.totalPenalty || 0),
      customPenaltyCheck: repayment?.customPenaltyCheck || false,
      customPenalty: repayment?.customPenalty,
      remainingPayment:
        Number(repayment?.totalAmountDue) - Number(repayment?.amountPaid),
    });
  }, [repayment]);

  // const handleCustomPenalty = () => {
  //   if (editMode) {
  //     const isCustomPenaltyCheck = !customPenaltyCheck;

  //     setValue("customPenaltyCheck", isCustomPenaltyCheck);
  //     if (isCustomPenaltyCheck) {
  //       setValue("totalPenalty", customPenalty);
  //     } else {
  //       setValue("remainingPayment", totalAmountDue - paidAmount);
  //     }
  //   }
  // };

  const handleStatusChange = (e) => {
    const selected = e.target.value;
    if (selected === "paid") {
      setValue("status", "paid");
      setValue("amountPaid", watch("totalAmountDue"));
    } else if (selected === "pending") {
      setValue("status", "pending");
      setValue("amountPaid", 0);
    } else {
      setValue("status", "partial");
    }
  };

  useEffect(() => {
    if (editMode && repayment?.status !== "paid") {
      setValue("amountPaid", 0);
      setValue("remainingPayment", totalAmountDue - repayment?.amountPaid);
    }
  }, [editMode]);

  const updateRepayment = async (data) => {
    data.penaltyPaid = penaltyPaid;
    try {
      const res = await fetch(
        "https://mariamma-finance-4d56.onrender.com/update_repayment",
        {
          method: "POST",
          headers: {
            "x-api-key": "marikambafinance@123",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message);
      setShowPopup(true);
      setType(result?.status);
      setMessage(result?.message);
    } catch (error) {
      setType("error");
      setShowPopup(true);
      setMessage(error.message);
    }
  };

  const handleCheckboxChange = () => {
    if (editMode) {
      const isAgent = !recoveryAgent;
      setValue("recoveryAgent", isAgent);
      setValue("remainingPayment", totalAmountDue - repayment?.amountPaid);
      // setValue("recoveryAgentAmount", isAgent ? recoveryAgentAmount + 500 : recoveryAgentAmount);
      isAgent
        ? setValue("recoveryAgentAmount", 500)
        : setValue("recoveryAgentAmount", 0);
    }
  };

  const onSubmit = async (data) => {
    console.log(data);
    setLoading(true);
    await updateRepayment(data);
    await updateLoans(hpNumber); // <- This should update parent and pass new `repayment`
    setLoading(false);
    setEditMode(false); // remove reset()
    onUpdateSuccess();
  };

  const handleCancel = () => {
    reset();
    setEditMode(false);
  };

  if (loading) return <Loader />;

  // UI rendering left untouched. It will use correct values now
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
    >
      <Popup />
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
          <input type="hidden" {...register("amountDue")} />
          <span>
            ₹{parseFloat(watch("amountDue") || 0).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Amount Paid</span>
          {status === "partial" && editMode ? (
            <input
              className="px-4 py-1 bg-gray-700 text-white rounded"
              type="text"
              {...register("amountPaid")}
            />
          ) : (
            <span>
              ₹{parseFloat(watch("amountPaid")).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Penalty</span>
          <span>₹{watch("penalty").toLocaleString("en-IN")}</span>
        </div>

        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Recovery Agent Fees</span>
          <input type="hidden" {...register("recoveryAgentAmount")} />
          <span>₹{watch("recoveryAgentAmount")}</span>
        </div>

        {/* {customPenaltyCheck && (
          <div className="flex flex-col w-40">
            <span className="text-xs text-gray-400">Custom Penalty</span>
            {editMode ? (
              <>
                <input
                  type="number"
                  className="px-4 py-1 bg-gray-700 text-white rounded"
                  {...register("customPenalty", {
                    validate: (value) => {
                      if (repayment?.previousDues > 0 && value < repayment?.previousDues) {
                        return `₹${repayment?.previousDues} Recovery Agent Fee is pending from previous month!`;
                      }
                      return true;
                    },
                  })}
                />
                {errors.customPenalty && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.customPenalty.message}
                  </p>
                )}
              </>
            ) : (
              <span>₹{customPenalty}</span>
            )}
          </div>
        )}

        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Total Penalty</span>

          <input
            type="hidden"
            className="px-4 py-1 bg-gray-700 text-white rounded"
            {...register("totalPenalty")}
          />

          <span>₹{totalPenalty}</span>
        </div> */}

        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Total Amount Due</span>
          <input type="hidden" {...register("totalAmountDue")} />
          <span>₹{totalAmountDue}</span>
        </div>

        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Remaining Payment</span>
          <input type="hidden" {...register("remainingPayment")} />
          <span>₹{watch("remainingPayment").toFixed(2)}</span>
        </div>

        <div className="flex flex-col w-40">
          <span className="text-xs text-gray-400">Status</span>
          {repayment?.status === "partial" ? (
            <span
              className={`p-2 rounded text-sm ${
                status === "pending"
                  ? "bg-amber-600"
                  : watch("status") === "paid"
                  ? "bg-green-500"
                  : "bg-[#007292]"
              } text-white`}
            >
              {watch("status")}
            </span>
          ) : repayment?.status === "paid" ? (
            <span
              className={`p-2 rounded text-sm ${
                status === "pending"
                  ? "bg-amber-600"
                  : watch("status") === "paid"
                  ? "bg-green-500"
                  : "bg-[#007292]"
              } text-white`}
            >
              {watch("status")}
            </span>
          ) : (
            <select
              {...register("status")}
              onChange={handleStatusChange}
              className={`p-2 rounded ${
                status === "pending"
                  ? "bg-amber-600"
                  : watch("status") === "paid"
                  ? "bg-green-500"
                  : "bg-[#007292]"
              } text-white`}
            >
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="partial">partial</option>
            </select>
          )}
        </div>

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

        <div className="flex items-center gap-2 w-48">
          <input
            className="w-5 h-5 accent-green-500 border-green-500"
            type="checkbox"
            {...register("recoveryAgent")}
            checked={recoveryAgent}
            onChange={handleCheckboxChange}
            onClick={(e) => {
              if (editMode === false) {
                e.preventDefault();
              }
            }}
          />
          <span className="text-sm">Recovery Agent</span>
        </div>

        {/* <div className="flex items-center gap-2 w-48">
          <input
            className="w-5 h-5 accent-green-500 border-green-500"
            type="checkbox"
            {...register("customPenaltyCheck")}
            checked={customPenaltyCheck}
            onChange={handleCustomPenalty}
            onClick={(e) => {
              if (editMode === false) {
                e.preventDefault();
              }
            }}
          />
          <span className="text-sm">Custom Penalty</span>
        </div> */}

        <div className="pt-2 w-full flex gap-4">
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
            ) : status === "pending" || status === "partial" ? (
              <button
                type="button"
                onClick={() => setEditMode(!editMode)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300"
              >
                Edit
              </button>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default RepaymentCard;
