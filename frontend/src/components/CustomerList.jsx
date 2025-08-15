import React, { useEffect, useState } from "react";
import CustomerDataCard from "./CustomerDataCard";
import Search from "./Search";
import Loader from "./Loader";
import { useCustomersList } from "../hooks/useCustomersList";
import { useCustomers } from "../context/CustomersContext";
import { useNavigate } from "react-router-dom";

const NEXT_ID = import.meta.env.VITE_NEXT_ID;
const PREV_ID = import.meta.env.VITE_PREV_ID;
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;

const CustomerList = () => {
  const { loading, error, setLoading, getCustomersList } = useCustomersList();
  const { customers, setCustomers } = useCustomers();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setLoading(true);
    await getCustomersList();
    setLoading(false);
  };

  const handleNext = async () => {
    if (!customers?.next_id) return;
    navigate(`?next_id=${customers?.next_id}`);

    const res = await fetch(NEXT_ID + customers?.next_id, {
      headers: {
        "x-api-key": HEADER_VALUE,
      },
    });
    const data = await res.json();
    setCustomers(data);
  };

  const handlePrev = async () => {
    if (!customers?.prev_id) return;
    navigate(`?prev_id=${customers?.prev_id}`);
    const res = await fetch(PREV_ID + customers?.prev_id, {
      headers: {
        "x-api-key": HEADER_VALUE,
      },
    });
    const data = await res.json();
    setCustomers(data);
  };

  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-8 mt-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-300">Customers List</h2>
        </div>
        <div className="flex justify-center items-center">
          <Search setLoading={setLoading} />
          <button
            onClick={handleRefresh}
            className="bg-teal-500 hover:bg-teal-600 mb-6 text-white px-6 py-2 rounded-full shadow"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="w-full mt-6">
            <div className="grid grid-cols-[minmax(150px,2fr)_minmax(200px,2fr)_minmax(150px,2fr)_minmax(160px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)] text-teal-300 font-semibold border-b border-teal-500 py-2 px-4">
              <div>Full Name</div>
              <div>HP Number</div>
              <div>Phone</div>
              <div>Aadhaar/PAN</div>
              <div>Income</div>
              <div>Action</div>
            </div>

            {loading ? (
              <Loader />
            ) : error ? (
              <div className="text-red-400 mt-4 text-center">
                Failed to load customers: {error}
              </div>
            ) : customers?.customers?.length > 0 ? (
              customers?.customers?.map((customer) => (
                <CustomerDataCard key={customer.hpNumber} customer={customer} />
              ))
            ) : (
              <div className="text-gray-400 mt-4 text-center">
                No customers found.
              </div>
            )}
          </div>
        </div>
      </main>
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          disabled={customers?.prev_id === null}
          onClick={handlePrev}
          className={`px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 ${
            customers?.prev_id ? "" : "cursor-not-allowed"
          }`}
        >
          Prev
        </button>

        <button
          disabled={customers?.next_id === null}
          onClick={handleNext}
          className={`px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50 ${
            customers?.next_id ? "" : "cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CustomerList;
