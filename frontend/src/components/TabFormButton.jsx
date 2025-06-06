import React from "react";

const TabFormButton = ({tabName, activeTab, setActiveTab}) => {
  return (
    <button
      className={`py-2 px-4 rounded-t-lg text-lg font-semibold transition duration-300 ${
        activeTab === tabName
          ? "bg-teal-400 text-gray-900"
          : "bg-gray-700 hover:bg-gray-600"
      }`}
      onClick={() => setActiveTab(tabName)}
    >
      {tabName}
    </button>
  );
};

export default TabFormButton;
