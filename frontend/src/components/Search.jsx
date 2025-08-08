import React, { useState } from "react";
import { useCustomers } from "../context/CustomersContext";
import { useCustomersList } from "../hooks/useCustomersList";

const SEARCH = import.meta.env.VITE_SEARCH;
const HEADER_VALUE = import.meta.env.VITE_API_HEADER_VALUE;

const Search = ({ setLoading }) => {
  const { customers, setCustomers } = useCustomers();
  const [search, setSearch] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const { customerList } = useCustomersList();

  const handleSearch = async () => {
    try {
      if (!search || !searchKey) {
        setCustomers(customerList);
        return;
      }
      setLoading(true);
      let data = { [searchKey]: search };
      const res = await fetch(SEARCH, {
        method: "POST",
        headers: {
          "x-api-key": HEADER_VALUE,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setLoading(false);
      setCustomers({ customers: result?.search_reponse });
      setSearch("");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-8/12 items-center gap-4 mb-6">
      <div className="flex flex-col gap-1 -mt-6">
        <label>Search By </label>
        <select
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        >
          <option value="" disabled hidden>
            Select
          </option>
          <option value="firstName">Firstname</option>
          <option value="lastName">Lastname</option>
          <option value="phone">Phone Number</option>
          <option value="hpNumber">HP Number</option>
          <option value="loanId">Loan ID</option>
        </select>
      </div>
      <input
        type="text"
        placeholder="Search by name, email, phone or Aadhaar"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-2/3 px-4 py-2 rounded-full text-black placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <button
        onClick={handleSearch}
        className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full shadow"
      >
        Search
      </button>
    </div>
  );
};

export default Search;
