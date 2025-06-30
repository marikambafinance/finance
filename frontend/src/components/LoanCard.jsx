import React from "react";
import { useNavigate } from "react-router-dom";

const LoanCard = ({ loan }) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(`/customer/${loan.hpNumber}/loan/${loan.loanId}`);
  };

  return (
    <div className="bg-gray-800 my-1 rounded-2xl p-6 text-white shadow-xl w-full border border-gray-600 backdrop-blur-md">
      <div className="flex justify-between items-start w-full">

        {/* Evenly Distributed Fields */}
        <div className="grid grid-cols-4 w-full gap-4 pr-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Loan ID</span>
            <span className="text-base font-medium text-[#88b8ff]">{loan.loanId}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">HP Number</span>
            <span className="text-base font-medium">{loan.hpNumber}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Total Payable</span>
            <span className="text-base font-bold text-red-500">
              ₹{parseFloat(loan.totalPayable).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Loan Term</span>
            <span className="text-base font-medium">{loan.loanTerm} months</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Months Paid</span>
            <span className="text-base font-medium">{loan.paidCount} months</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Total Amount Paid</span>
            <span className="text-base font-medium text-green-400">₹{loan.totalPaid ? parseFloat(loan.totalPaid).toLocaleString("en-IN") : 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Missed Repayment Count</span>
            <span className="text-base font-medium">{loan.missedCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Late Payment</span>
            <span className="text-base font-medium">{loan.latePaymentCount}</span>
          </div>
        </div>

        {/* Button aligned right */}
        <div className="flex-shrink-0 pl-4">
          <button
            onClick={handleNavigation}
            type="button"
            className="bg-teal-400 hover:bg-teal-500 text-gray-900 font-semibold py-2 px-6 rounded-full transition duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanCard;
