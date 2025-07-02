import { useEffect, useState } from "react";

const CustomersPopup = ({ show, close, customers }) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setAnimateOut(false);
    } else {
      setAnimateOut(true);
      const timeout = setTimeout(() => setShouldRender(false), 400); // match .4s popup-out
      return () => clearTimeout(timeout);
    }
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/25 bg-opacity-50"
        onClick={close}
      ></div>

      {/* Popup */}
      <div
        className={`relative bg-gray-800 text-white rounded-2xl shadow-xl w-[90%] max-w-md p-6
          ${animateOut ? "animate-popup-out" : "animate-popup-in"}`}
      >
        <h2 className="text-xl font-semibold mb-4">Customer List</h2>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {customers.map((cust, idx) => (
            <li key={idx} className="p-3 bg-gray-700 rounded-md">
              <div className="font-medium">{cust.name}</div>
              <div className="text-sm">{cust.phone}</div>
            </li>
          ))}
        </ul>
        <button
          onClick={close}
          className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CustomersPopup;
