import React, { useEffect, useState } from "react";
import { User, Phone, BadgeDollarSign, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import RepaymentCard from "../components/RepaymentCard";
import Navbar from "../components/Navbar";
import useLoanWithRepaymentsList from "../hooks/useLoanWithRepaymentsList";
import { useLoanListContext } from "../context/LoanListContext";
import Loader from "../components/Loader";
import { useForm } from "react-hook-form";
import Popup from "../components/Popup";
import { usePopupContext } from "../context/PopupContext";

const LoanRepayments = () => {
  const fetchLoanWithRepayments = useLoanWithRepaymentsList();
  const { loanId, hpNumber } = useParams();
  const { loanList } = useLoanListContext();

  const [loading, setLoading] = useState(false);
  const { setType, setMessage, setShowPopup } = usePopupContext();

  const [loanDetails, setLoanDetails] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const navigate = useNavigate();

  const { register, handleSubmit, reset } = useForm();

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
      console.log(data);
      setRepayments(data?.repayment_data || []);
    } catch (err) {
      setShowPopup(true);
      setType("error");
      setMessage(err.message);
      console.error("Error fetching repayment data:", err);
    }
  };

  const handleAutoPayment = async (data) => {
    try {
      const res = await fetch(
        "https://mariamma-finance.onrender.com/auto_update_repayments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "marikambafinance@123",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();

      if(!res.ok){
        throw new Error(result?.message);        
      }
      setShowPopup(true);
      setType(result?.status || "success");
      setMessage(result?.message);
      console.log(result);
    } catch (error) {
      setShowPopup(true);
      setType(error.status);
      setMessage(error.message);
      console.log(error.message);
    }
  };

  const onSubmit = async (data) => {
    if(!data.amount) return;
    setLoading(true);
    const extendedObj = { ...data, loanId: loanId };
    console.log(extendedObj);
    await handleAutoPayment(extendedObj);
    await fetchLoanWithRepayments(hpNumber);
    await fetchRepaymentDetails();
    reset();
    setLoading(false);
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
        {!loanDetails || !loanList?.customerDetails || loading ? (
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
                  value={`₹${
                    loanDetails.totalPaid
                      ? parseFloat(loanDetails?.totalPaid).toLocaleString(
                          "en-IN"
                        )
                      : 0
                  }`}
                  valueClass="text-green-500"
                />
                <InfoItem
                  icon={BadgeDollarSign}
                  label="Current Due"
                  value={`₹${parseFloat(
                    loanDetails?.totalAmountDue
                  ).toLocaleString("en-IN")}`}
                  valueClass="text-[#ff2b36]"
                />
                <form className="flex gap-4 w-3xl flex-col">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <label className="block mb-1">Payment Mode : </label>
                      <div>
                        <select
                          {...register("paymentMode")}
                          className="w-full p-2 rounded bg-gray-700 text-white"
                        >
                          <option>Card</option>
                          <option>UPI</option>
                          <option>Cash</option>
                          <option>Netbanking</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="block mb-1">Amount : </label>
                      <input
                        {...register("amount")}
                        type="number"
                        className="p-2 rounded bg-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    className="bg-teal-400 w-fit px-6 hover:bg-teal-500 cursor-pointer text-gray-900 font-semibold text-lg py-2 rounded-full shadow-xl transition duration-300"
                  >
                    Auto Payment
                  </button>
                </form>
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
      <Popup />
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
