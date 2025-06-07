import React, { useState } from "react";

const Search = () => {

    const [search, setSearch] = useState("");

    const handleSearch = ()=>{
        
    }

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
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
