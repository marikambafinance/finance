import React from "react";

const CustomerDataCard = ({ customer }) => {
  return (
    <div className="grid grid-cols-[minmax(150px,2fr)_minmax(200px,2fr)_minmax(150px,2fr)_minmax(160px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)] text-sm text-gray-300 px-4 py-3 border-b border-gray-700 items-center">
      <div className="text-teal-300 font-semibold">
        {customer.firstName} {customer.lastName}
      </div>
      <div>{customer.CustomerID}</div>
      <div>{customer.phone}</div>
      <div>{customer.aadhaarOrPan}</div>
      <div>₹{customer.annualIncome}</div>
      <div>
        <button className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-full shadow">
          View
        </button>
      </div>
    </div>
  );
};

export default CustomerDataCard;
