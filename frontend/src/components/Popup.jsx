import SuccessIcon from "./SuccessIcon";
import ErrorIcon from "./ErrorIcon";
import { usePopupContext } from "../context/PopupContext";

const Popup = () => {
  const { showPopup, setShowPopup, type, message } = usePopupContext();

  return (
    showPopup && (
      <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
        <div
          className={`rounded-lg shadow-lg p-6 text-center w-80 ${
            type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div className="text-4xl mb-2 flex items-center justify-center">
            {type === "success" ? <SuccessIcon /> : <ErrorIcon />}
          </div>
          <h3 className="text-lg font-semibold mb-4">{message}</h3>
          <button
            className={`${
              type === "success"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white px-4 py-2 rounded`}
            onClick={() => setShowPopup(false)}
          >
            Close
          </button>
        </div>
      </div>
    )
  );
};

export default Popup;
