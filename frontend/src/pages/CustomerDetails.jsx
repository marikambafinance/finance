import React, { useState } from "react";
import Navbar from "../components/Navbar";

const CustomerDetails = ({ customer }) => {
  const defaultCustomer = {
    firstName: "Nora",
    lastName: "Fatehi",
    dob: "1992-03-01",
    gender: "Female",
    maritalStatus: "Single",
    email: "nora.f@example.com",
    phone: "9876543210",
    address: "Mumbai, India",
    zip: "400001",
    hpNumber: "HP99321",
    aadhaarOrPan: "XYZPF1234L",
    employmentStatus: "Self-Employed",
    occupation: "Performer",
    annualIncome: 2500000,
  };

  const [data, setData] = useState(customer || defaultCustomer);

  const handleChange = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = () => {
    // Placeholder for update logic
    console.log("Updated data:", data);
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <Navbar />
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen p-8 text-white flex justify-center items-center">
        <div className="bg-gray-800 bg-opacity-90 rounded-2xl shadow-2xl p-10 w-full max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl text-teal-300 font-bold animate-pulse">
              {data.firstName} {data.lastName}
            </h2>
            <button
              onClick={handleUpdate}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full shadow"
            >
              Update
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <EditableField
              label="Date of Birth"
              value={data.dob}
              onChange={(v) => handleChange("dob", v)}
            />
            <EditableField
              label="Gender"
              value={data.gender}
              onChange={(v) => handleChange("gender", v)}
            />
            <EditableField
              label="Marital Status"
              value={data.maritalStatus}
              onChange={(v) => handleChange("maritalStatus", v)}
            />
            <EditableField
              label="Email"
              value={data.email}
              onChange={(v) => handleChange("email", v)}
            />
            <EditableField
              label="Phone"
              value={data.phone}
              onChange={(v) => handleChange("phone", v)}
            />
            <EditableField
              label="Address"
              value={data.address}
              onChange={(v) => handleChange("address", v)}
            />
            <EditableField
              label="ZIP Code"
              value={data.zip}
              onChange={(v) => handleChange("zip", v)}
            />
            <EditableField
              label="HP Number"
              value={data.hpNumber}
              onChange={(v) => handleChange("hpNumber", v)}
            />
            <EditableField
              label="Aadhaar / PAN"
              value={data.aadhaarOrPan}
              onChange={(v) => handleChange("aadhaarOrPan", v)}
            />
            <EditableField
              label="Employment Status"
              value={data.employmentStatus}
              onChange={(v) => handleChange("employmentStatus", v)}
            />
            <EditableField
              label="Occupation"
              value={data.occupation}
              onChange={(v) => handleChange("occupation", v)}
            />
            <EditableField
              label="Annual Income"
              value={data.annualIncome}
              onChange={(v) => handleChange("annualIncome", Number(v))}
              isCurrency
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const EditableField = ({ label, value, onChange, isCurrency }) => (
  <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg shadow">
    <div className="text-teal-400 font-semibold mb-1">{label}</div>
    <input
      type={typeof value === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-600 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
    />
    {isCurrency && (
      <div className="text-gray-400 text-xs mt-1">
        (₹ {Number(value).toLocaleString()})
      </div>
    )}
  </div>
);

export default CustomerDetails;
