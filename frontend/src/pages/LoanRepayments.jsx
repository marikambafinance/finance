import React from "react";
import { User, Phone, BadgeDollarSign } from "lucide-react";
import { useLocation } from "react-router-dom";
import RepaymentCard from "../components/RepaymentCard";
import Navbar from "../components/Navbar";

const LoanRepayments = () => {
  const location = useLocation();
  const {loan, customerDetails} = location?.state;
  const fullName = customerDetails?.firstName + " " +customerDetails?.lastName;
  console.log("Loan Details",loan);
  console.log("Customer Details",customerDetails)
  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-8 flex flex-col items-center">
        <div className="w-full max-w-6xl">
          <h1 className="text-4xl font-bold text-center mb-10 tracking-tight">
            Loan Details for {fullName}
          </h1>

          <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-2xl rounded-3xl border border-gray-600 mb-10 p-8 space-y-4">
            <div className="flex flex-wrap gap-8 items-center text-white">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium">{fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium">{loan?.hpNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium">{'+91 '+customerDetails?.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-2xl rounded-3xl border border-gray-600 p-8 space-y-6">
            {loan?.repayments?.map((item, idx) => <RepaymentCard key={idx} repayment={item}/>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanRepayments;
