import React, { useState } from "react";
import TabFormButton from "../components/TabFormButton";
import { tabFormButtons } from "../utils/buttonsConfig";
import Navbar from "../components/Navbar";
import AddCustomer from "../components/AddCustomer";
import CreateLoan from "../components/CreateLoan";
import CustomerList from "../components/CustomerList";
import Repayment from "../components/Repayment";
import PopupContextProvider from "../context/PopupContext";
import { useTabButtonContext } from "../context/TabButtonContext";

const Customer = () => {
  const {activeTab, setActiveTab} = useTabButtonContext();
  
  return (
    <PopupContextProvider>
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
        <Navbar />
        <div className="flex w-full max-w-6xl gap-2 justify-start">
          {tabFormButtons.map((item, idx) => (
            <TabFormButton
              key={idx}
              tabName={item.tabName}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
        {activeTab === "Customers" && <AddCustomer />}
        {activeTab === "Customers List" && <CustomerList />}
        {activeTab === "Loans" && <CreateLoan />}
        {activeTab === "Repayments" && <Repayment />}
      </div>
    </PopupContextProvider>
  );
};

export default Customer;
