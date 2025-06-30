import React, { useEffect, useState } from "react";
import { User, Phone, BadgeDollarSign, ArrowLeft} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import RepaymentCard from "../components/RepaymentCard";
import Navbar from "../components/Navbar";
import useLoanWithRepaymentsList from "../hooks/useLoanWithRepaymentsList";
import { useLoanListContext } from "../context/LoanListContext";
import Loader from "../components/Loader";

const LoanRepayments = () => {
  const fetchLoanWithRepayments = useLoanWithRepaymentsList();
  const { loanId, hpNumber } = useParams();
  const { loanList } = useLoanListContext();
  console.log(loanList)

  const [loanDetails, setLoanDetails] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const navigate = useNavigate();

  const fetchRepaymentDetails = async () => {
    try {
      const res = await fetch(
        "https://mariamma-finance.onrender.com/get_customer_repayment_info",
        {
          method: "POST",
          headers: {
            "x-api-key": "marikambafinance@123",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ loanId }),
        }
      );
      const data = await res.json();
      setRepayments(data?.repayment_data || []);
    } catch (err) {
      console.error("Error fetching repayment data:", err);
    }
  };

  useEffect(() => {
    fetchLoanWithRepayments(hpNumber);
    fetchRepaymentDetails();
  }, [hpNumber, loanId]);

  useEffect(() => {
    if (loanList?.data?.length > 0) {
      const matchedLoan = loanList.data.find((item) => item.loanId === loanId);
      setLoanDetails(matchedLoan);
    }
  }, [loanList, loanId]);

  const fullName =
    loanList?.customerDetails?.firstName +
    " " +
    loanList?.customerDetails?.lastName;
  const phone = loanList?.customerDetails?.phone;

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <Navbar />
      <div className="max-w-6xl min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-8 flex flex-col items-center w-full">
        {!loanDetails || !loanList?.customerDetails ? (
          <Loader />
        ) : (
          <div className="w-full max-w-6xl">
            <h1 className="text-4xl font-bold text-center mb-4 tracking-tight">
              Loan Details for {fullName}
            </h1>

            {/* Back Button */}
            <div className="mb-8 flex justify-start">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full transition duration-300 shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {/* Loan Info */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-2xl rounded-3xl border border-gray-600 mb-10 p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-white">
                <InfoItem icon={User} label="Full Name" value={fullName} />
                <InfoItem
                  icon={BadgeDollarSign}
                  label="Loan ID"
                  value={loanId}
                  valueClass="text-[#88b8ff]"
                />
                <InfoItem
                  icon={BadgeDollarSign}
                  label="HP Number"
                  value={hpNumber}
                />
                <InfoItem icon={Phone} label="Phone" value={`+91 ${phone}`} />
                <InfoItem
                  icon={BadgeDollarSign}
                  label="Loan Amount Issued"
                  value={`₹${parseFloat(loanDetails.loanAmount).toLocaleString(
                    "en-IN"
                  )}`}
                  valueClass="text-[#88b8ff]"
                />
                <InfoItem
                  icon={BadgeDollarSign}
                  label="Total Payable"
                  value={`₹${parseFloat(
                    loanDetails.totalPayable
                  ).toLocaleString("en-IN")}`}
                  valueClass="text-yellow-500"
                />
                <InfoItem
                  icon={BadgeDollarSign}
                  label="Total Amount Paid"
                  value={`₹${loanDetails.totalPaid ? parseFloat(loanDetails?.totalPaid).toLocaleString("en-IN") : 0}`}
                  valueClass="text-green-500"
                />
                <InfoItem
                  icon={BadgeDollarSign}
                  label="Current Due"
                  value={`₹${parseFloat(loanDetails?.totalAmountDue).toLocaleString("en-IN")}`}
                  valueClass="text-[#ff2b36]"
                />
              </div>
            </div>

            {/* Repayment Cards */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 shadow-2xl rounded-3xl border border-gray-600 p-8 space-y-6">
              {repayments.map((item, idx) => (
                <RepaymentCard
                  key={idx}
                  repayment={item}
                  onUpdateSuccess={fetchRepaymentDetails}
                  updateLoans={fetchLoanWithRepayments}
                  hpNumber={hpNumber}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted UI block
const InfoItem = ({ icon: Icon, label, value, valueClass = "" }) => (
  <div>
    <h4 className="text-lg text-gray-400 mb-1 flex items-center gap-1">
      <Icon className="w-4 h-4 text-teal-400" />
      {label}
    </h4>
    <p className={`text-lg font-medium ${valueClass}`}>{value}</p>
  </div>
);

export default LoanRepayments;
