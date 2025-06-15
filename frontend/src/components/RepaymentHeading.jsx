import React from "react";

const RepaymentHeading = () => {
  return (
    <div className="flex items-center justify-start gap-10 min-w-[1000px] mb-4">
      <span className="text-sm font-semibold text-teal-400 w-32">
        Installment #
      </span>
      <span className="text-sm font-semibold text-teal-400 w-32">Due Date</span>
      <span className="text-sm font-semibold text-teal-400 w-32">Amount Due</span>
      <span className="text-sm font-semibold text-teal-400 w-32">Amount Paid</span>
      <span className="text-sm font-semibold text-teal-400 w-32">Status</span>
      <span className="text-sm font-semibold text-teal-400 w-40">Payment Mode</span>
      <span className="text-sm font-semibold text-teal-400 w-40">Recovery Agent</span>
      <span className="text-sm font-semibold text-teal-400 w-32">Actions</span>
    </div>
  );
};

export default RepaymentHeading;
