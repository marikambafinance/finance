import React, { useState } from "react";
import { useCustomersList } from "../hooks/useCustomersList";
import { useCustomers } from "../context/CustomersContext";

const Search = () => {
    const {customers, setCustomers} = useCustomers();

    const [search, setSearch] = useState("");

    console.log(customers)
    const handleSearch = ()=>{
        if(customers){
            setCustomers(customers.filter((item) => {
                if(item.CustomerID.includes(search)){
                    return true;
                }else if(item.firstName.toLowerCase().includes(search.toLowerCase())){
                    console.log(item.firstName.toLowerCase())
                    return true;
                }else if(item.lastName.toLowerCase().includes(search.toLowerCase())){
                    return true;
                }else if(item.phone.includes(search)){
                    return true;
                }
            }))
        }
        setSearch("");
    }

  return (
    <div className="flex flex-col md:flex-row flex-8/12 items-center gap-4 mb-6">
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
