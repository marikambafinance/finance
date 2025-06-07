import React from "react";

const Loader = () => {
  return (
    <div className="flex justify-center items-center gap-4 py-6">
      <div className="w-10 h-10 border-4 border-teal-500 border-dashed rounded-full animate-spin"></div>
      <span className="text-teal-300">Loading...</span>
    </div>
  );
};

export default Loader;
