import { usePopupContext } from "../context/PopupContext";
import ErrorIcon from "./ErrorIcon";
import SuccessIcon from "./SuccessIcon";

const Popup = ({title}) => {

    const {showPopup, setShowPopup, type} = usePopupContext();

  return showPopup && (
    <div className="w-full h-full mt-5 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-green-100 text-green-800 rounded-lg shadow-lg p-6 text-center w-80">
        <div className="text-4xl mb-2 flex items-center justify-center">
            {type === "success" ? <SuccessIcon /> : <ErrorIcon />}
        </div>
        <h3 className="text-lg font-semibold mb-4">
          {type === "success" ? title : "Something went wrong!"}
        </h3>
        <button
          className={`${type === "success" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white px-4 py-2 rounded`}
          onClick={() => setShowPopup(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Popup;
