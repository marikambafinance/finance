import { useForm } from "react-hook-form";
import { useCreateCustomer } from "../hooks/useCreateCustomer";
import Loader from "./Loader";
import Popup from "./Popup";
import { usePopupContext } from "../context/PopupContext";

const AddCustomer = () => {
  const { createCustomer, loading, setLoading } = useCreateCustomer();
  const { showPopup, setShowPopup, setType, setMessage } = usePopupContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const res = await createCustomer(data);

      if (!res?.status || res.status !== "success") {
        throw new Error(res?.message || "Failed to create customer");
      }

      setType("success");
      setMessage("Customer created successfully!");
      setShowPopup(true);
      reset();
    } catch (error) {
      setType("error");
      setMessage(error.message || "Something went wrong during submission.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="bg-gradient-to-b w-full max-w-6xl from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <main className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-lg p-8 mt-10">
        <Popup />
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-teal-300">
            Register a Customer
          </h2>
        </div>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label className="block mb-1">First Name</label>
            <input
              {...register("firstName", { required: "First Name is required" })}
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.firstName && (
              <p className="text-red-400 text-sm">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1">Last Name</label>
            <input
              {...register("lastName")}
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block mb-1">Date of Birth</label>
            <input
              type="date"
              {...register("dob", { required: "Date of birth is required" })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.dob && (
              <p className="text-red-400 text-sm">{errors.dob.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1">Gender</label>
            <select
              {...register("gender")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Marital Status</label>
            <select
              {...register("maritalStatus")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            >
              <option>Single</option>
              <option>Married</option>
              <option>Divorced</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1">Vehicle Make</label>
            <input
              type="text"
              placeholder="Ex: Hero, Yamaha"
              {...register("vehicleMake", {
                required: "Vehicle Make is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.vehicleMake && (
              <p className="text-red-400 text-sm">
                {errors.vehicleMake.message}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1">Vehicle Model</label>
            <input
              type="number"
              placeholder="Ex: 2016"
              onWheel={(e) => e.target.blur()}
              {...register("vehicleModel", {
                required: "Vehicle Model is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.vehicleModel && (
              <p className="text-red-400 text-sm">
                {errors.vehicleModel.message}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1">Vehicle Number</label>
            <input
              type="text"
              placeholder="Ex: KA01BR1234"
              {...register("vehicleNumber")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1">Chassis Number</label>
            <input
              type="text"
              {...register("chassisNumber")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block mb-1">Phone Number</label>
            <input
              type="tel"
              {...register("phone", { required: "Phone is required" })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.phone && (
              <p className="text-red-400 text-sm">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1">Engine Number</label>
            <input
              type="text"
              {...register("engineNumber", {
                required: "Engine Number is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.engineNumber && (
              <p className="text-red-400 text-sm">
                {errors.engineNumber.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1">Address</label>
            <textarea
              rows="2"
              {...register("address")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            ></textarea>
          </div>

          <div>
            <label className="block mb-1">Zip Code</label>
            <input
              type="text"
              {...register("zip", { required: "Zip code is required" })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.zip && (
              <p className="text-red-400 text-sm">{errors.zip.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1">Aadhaar / PAN</label>
            <input
              type="text"
              {...register("aadhaarOrPan", {
                required: "Aadhaar/PAN is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.aadhaar_pan && (
              <p className="text-red-400 text-sm">
                {errors.aadhaar_pan.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Employment Status</label>
            <select
              {...register("employment")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            >
              <option>Employed</option>
              <option>Unemployed</option>
              <option>Self-Employed</option>
              <option>Student</option>
              <option>Retired</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Occupation</label>
            <input
              type="text"
              {...register("occupation")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1">Annual Income</label>
            <input
              type="number"
              onWheel={(e) => e.target.blur()}
              {...register("annualIncome")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-teal-300 w-fit border-b-2 mb-2">
              Guarantor Details
            </h2>
          </div>

          <div>
            <label className="block mb-1">First Name</label>
            <input
              {...register("guarantor.firstName", {
                required: "First Name is required",
              })}
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors?.guarantor?.firstName && (
              <p className="text-red-400 text-sm">
                {errors.guarantor.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Last Name</label>
            <input
              {...register("guarantor.lastName")}
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block mb-1">Phone Number</label>
            <input
              type="tel"
              {...register("guarantor.phone", {
                required: "Phone is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors?.guarantor?.phone && (
              <p className="text-red-400 text-sm">
                {errors.guarantor.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1">Aadhaar / PAN</label>
            <input
              type="text"
              {...register("guarantor.aadhaarOrPan", {
                required: "Aadhaar/PAN is required",
              })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            {errors.guarantor?.aadhaar_pan && (
              <p className="text-red-400 text-sm">
                {errors.guarantor?.aadhaar_pan.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1">Address</label>
            <textarea
              rows="2"
              {...register("guarantor.address")}
              className="w-full p-2 rounded bg-gray-700 text-white"
            ></textarea>
          </div>

          <div className="md:col-span-2 text-center mt-4">
            <button
              type="submit"
              className="bg-teal-400 cursor-pointer hover:bg-teal-500 text-gray-900 font-semibold py-3 px-8 rounded-full shadow-md transition duration-300"
            >
              Submit
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddCustomer;
