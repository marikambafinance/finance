import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  User,
  Bike,
  Calendar,
  Landmark,
  MapPin,
  IdCard,
  Briefcase,
  DollarSign,
  Heart,
  Edit3,
  Save,
  Watch,
} from "lucide-react";
import { useForm } from "react-hook-form";
import Navbar from "../components/Navbar";
import useCustomerDetails from "../hooks/useCustomerDetails";
import { useLocation } from "react-router-dom";
import EditableFieldWithIcon from "../components/EditableFieldWithIcon";

const CustomerDetails = () => {
  const location = useLocation();
  const { hpNumber } = location?.state || {};
  const { custDetails } = useCustomerDetails(hpNumber);

  const [isEditing, setIsEditing] = useState(false);

  const handleCancel = () => {
    reset(custDetails);
    setIsEditing(false);
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const editableFieldInfo = [
    {
      name: "firstName",
      label: "First Name",
      icon: <User />,
      value: watch("firstName"),
    },
    {
      name: "lastName",
      label: "Last Name",
      icon: <User />,
      value: watch("lastName"),
    },
    {
      name: "aadhaarOrPan",
      label: "Aadhaar/PAN",
      icon: <IdCard />,
      value: watch("aadhaarOrPan"),
    },
    {
      name: "address",
      label: "Address",
      icon: <Landmark />,
      value: watch("address"),
    },
    {
      name: "zip",
      label: "Zip Code",
      icon: <MapPin />,
      value: watch("zip"),
    },
    {
      name: "email",
      label: "Email ID",
      icon: <Mail />,
      value: watch("email"),
    },
    {
      name: "chasisNumber",
      label: "Chasis Number",
      icon: <MapPin />,
      value: watch("chasisNumber"),
      type: "number"
    },
    {
      name: "phone",
      label: "Phone Number",
      icon: <Phone />,
      value: watch("phone"),
      type: "number"
    },
    {
      name: "vehicleNumber",
      label: "Vehicle Number",
      icon: <Bike />,
      value: watch("vehicleNumber"),
    },
    {
      name: "occupation",
      label: "Occupation",
      icon: <Briefcase />,
      value: watch("occupation"),
    },
  ];

  useEffect(() => {
    if (custDetails) {
      reset(custDetails);
    }
  }, [custDetails]);

  const onSubmit = (data) => {
    console.log(data)
    reset(custDetails)
    setIsEditing(false);
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <Navbar />
      <div className="w-full text-white flex flex-col items-center p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-6xl mx-auto bg-gray-900 rounded-3xl shadow-2xl p-10 relative border border-gray-800"
        >
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              🧾 Customer Profile
            </h1>

            {isEditing ? (
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow transition"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl shadow hover:scale-105 transition"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 text-lg">
              {editableFieldInfo?.map(({ name, value, icon, label, type }) => (
                  <EditableFieldWithIcon
                    key={name}
                    name={name}
                    value={value}
                    icon={icon}
                    label={label}
                    register={register}
                    isEditing={isEditing}
                    type={type}
                  />
              ))}
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-cyan-300 mb-4 border-b border-gray-700 pb-2">
              💳 Loan Accounts
            </h2>
            <div className="space-y-4">
              {custDetails?.loans.map((loan) => (
                <div
                  key={loan?.loanId}
                  className="p-5 bg-gray-800 rounded-xl flex justify-between items-center border border-gray-700 hover:bg-gray-700 transition duration-300"
                >
                  <div>
                    <p className="text-white font-semibold text-lg">
                      Purpose: {loan.purpose}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Loan ID: {loan?.loanId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-lg">Total Amount</p>
                    <p className="text-cyan-400 font-bold text-xl">
                      ₹{parseFloat(loan?.totalPayable).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerDetails;
