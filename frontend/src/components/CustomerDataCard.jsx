import React from "react";
import { useNavigate } from "react-router-dom";

const CustomerDataCard = ({ customer }) => {

    const navigate = useNavigate();

    const handleCustomer = ()=>{
        navigate(`/customer/customer-details/${customer?.hpNumber}`,{state: {hpNumber: customer?.hpNumber}})
    }

  return (
    <div className="grid grid-cols-[minmax(150px,2fr)_minmax(200px,2fr)_minmax(150px,2fr)_minmax(160px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)] text-sm text-gray-300 px-4 py-3 border-b border-gray-700 items-center">
      <div className="text-teal-300 font-semibold">
        {customer.firstName} {customer.lastName}
      </div>
      <div>{customer.hpNumber}</div>
      <div>{customer.phone}</div>
      <div>{customer.aadhaarOrPan}</div>
      <div className="font-bold text-green-400">₹ {parseFloat(customer.annualIncome).toLocaleString("en-IN")}</div>
      <div>
        <button 
            onClick={handleCustomer}
            className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-full shadow">
          View
        </button>
      </div>
    </div>
  );
};

export default CustomerDataCard;
