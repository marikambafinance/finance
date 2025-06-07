import React, { useEffect, useState } from "react";
import CustomerDataCard from "./CustomerDataCard";
import Search from "./Search";
import Loader from "./Loader";
import { useCustomersList } from "../hooks/useCustomersList";

const CustomerList = () => {
  const { data: customers, loading, error } = useCustomersList();
  console.log(customers)

  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-8 mt-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-300">Customers List</h2>
        </div>
        <Search />

        <div className="overflow-x-auto">
          <div className="w-full mt-6">
            <div className="grid grid-cols-[minmax(150px,2fr)_minmax(200px,2fr)_minmax(150px,2fr)_minmax(160px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)] text-teal-300 font-semibold border-b border-teal-500 py-2 px-4">
              <div>Full Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Aadhaar</div>
              <div>Income</div>
              <div>Action</div>
            </div>

            {loading ? (
              <Loader />
            ) : error ? (
              <div className="text-red-400 mt-4 text-center">
                Failed to load customers: {error}
              </div>
            ) : customers?.length > 0 ? (
              customers.map((customer) => (
                <CustomerDataCard
                  key={customer.CustomerID}
                  customer={customer}
                />
              ))
            ) : (
              <div className="text-gray-400 mt-4 text-center">
                No customers found.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerList;
