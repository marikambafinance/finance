import React from "react";
import { useNavigate } from "react-router-dom";

const LoanCard = ({ loan, customerDetails }) => {
  console.log(loan)
  console.log(customerDetails)

  const navigate = useNavigate();

  const handleNavigation = ()=>{
    navigate(`/customer/loan/${loan.loanId}`,{state: {loan: loan, customerDetails: customerDetails}})
  }

  return (
    <div className="bg-gray-800 my-1 rounded-2xl p-6 text-white shadow-xl w-full overflow-x-auto hover:shadow-2xl transition-shadow duration-500 border border-gray-600 backdrop-blur-md">
      <div className="flex items-center justify-between gap-10 max-w-[1100px]">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            Loan ID
          </span>
          <span className="text-base font-medium">{loan.loanId}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            HP Number
          </span>
          <span className="text-base font-medium">{loan.hpNumber}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            Total Payable
          </span>
          <span className="text-base font-medium text-green-400">
            ₹{loan.totalPayable}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            Loan Term
          </span>
          <span className="text-base font-medium">{loan.loanTerm} months</span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleNavigation}
            type="button"
            className="bg-teal-400 hover:bg-teal-500 text-gray-900 cursor-pointer font-semibold py-2 px-6 rounded-full transition duration-300 shadow-md hover:shadow-lg"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanCard;
