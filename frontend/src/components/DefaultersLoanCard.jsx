import React from "react";
import { useNavigate } from "react-router-dom";

const DefaulterLoanCard = ({ loan }) => {

    const navigate = useNavigate();

    const handleNavigation = ()=>{
        navigate(`/customer/${loan?.hpNumber}/loan/${loan?.loanId}`)
    }

  return (
    <div className="bg-gray-800 my-2 rounded-2xl p-6 text-white shadow-xl w-full border border-gray-600 backdrop-blur-md">
      <div className="flex flex-col md:flex-row justify-between items-start w-full gap-4">
        {/* Loan Info Grid */}
        <div className="flex justify-between w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 flex-grow">
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest">
                Loan ID
              </span>
              <span className="text-base font-medium text-[#88b8ff]">
                {loan.loanId}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest">
                HP Number
              </span>
              <span className="text-base font-medium">{loan.hpNumber}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400 uppercase tracking-widest">
                Overdue Amount
              </span>
              <span className="text-base font-bold text-red-500">
                ₹{parseFloat(loan.overdueAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* View Button */}
          <div className="flex-shrink-0 self-center md:self-start">
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
    </div>
  );
};

export default DefaulterLoanCard;
