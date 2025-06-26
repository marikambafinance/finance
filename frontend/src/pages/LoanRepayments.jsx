import React, { useEffect, useState } from "react";
import { User, Phone, BadgeDollarSign } from "lucide-react";
import { useLocation } from "react-router-dom";
import RepaymentCard from "../components/RepaymentCard";
import Navbar from "../components/Navbar";

const LoanRepayments = () => {
  const location = useLocation();
  const { loan, customerDetails } = location?.state;
  const fullName = customerDetails?.firstName + " " + customerDetails?.lastName;
  const [repayments, setRepayments] = useState([]);

  const fetchRepaymentDetails = async () => {
    const res = await fetch(
      "https://mariamma-finance.onrender.com/get_customer_repayment_info",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ loanId: loan?.loanId }),
      }
    );
    const data = await res.json();
    console.log(data);
    setRepayments([...data?.repayment_data]);
  };

  useEffect(() => {
    fetchRepaymentDetails();
  }, []);

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-8 flex flex-col items-center">
        <div className="w-full max-w-6xl">
          <h1 className="text-4xl font-bold text-center mb-10 tracking-tight">
            Loan Details for {fullName}
          </h1>

          <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-2xl rounded-3xl border border-gray-600 mb-10 p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-white">
              <div>
                <h4 className="text-lg text-gray-400 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4 text-teal-400" />
                  Full Name
                </h4>
                <p className="text-lg font-medium">{fullName}</p>
              </div>

              <div>
                <h4 className="text-lg text-gray-400 mb-1 flex items-center gap-1">
                  <BadgeDollarSign className="w-4 h-4 text-teal-400" />
                  HP Number
                </h4>
                <p className="text-lg font-medium">{loan?.hpNumber}</p>
              </div>

              <div>
                <h4 className="text-lg text-gray-400 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-teal-400" />
                  Phone
                </h4>
                <p className="text-lg font-medium">
                  {"+91 " + customerDetails?.phone}
                </p>
              </div>

              <div>
                <h4 className="text-lg text-gray-400 mb-1 flex items-center gap-1">
                  <BadgeDollarSign className="w-4 h-4 text-teal-400" />
                  Loan Amount
                </h4>
                <p className="text-xl text-[#88b8ff] font-bold">
                  ₹{parseFloat(loan?.loanAmount).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <h4 className="text-lg text-gray-400 mb-1 flex items-center gap-1">
                  <BadgeDollarSign className="w-4 h-4 text-teal-400" />
                  Total Payable
                </h4>
                <p className="text-xl text-red-500 font-bold">
                  ₹{parseFloat(loan?.totalPayable).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-2xl rounded-3xl border border-gray-600 p-8 space-y-6">
            {repayments?.map((item, idx) => (
              <RepaymentCard
                key={idx}
                repayment={item}
                onUpdateSuccess={fetchRepaymentDetails}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanRepayments;
