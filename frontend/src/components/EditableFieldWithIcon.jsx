import React from "react";

const EditableFieldWithIcon = ({
  icon,
  label,
  name,
  isEditing,
  register,
  type,
  value,
  options = [],
}) => {
  return (
    <div className="flex items-center gap-4 w-full text-white">
      <div className="p-2 bg-gray-800 rounded-full border border-gray-700">
        {React.cloneElement(icon, {
          className: "text-cyan-400 w-5 h-5",
        })}
      </div>

      <div className="flex-1/3">
        <label className="block text-sm font-medium text-gray-400 mb-1 whitespace-nowrap">
          {label}
        </label>

        {isEditing ? (
          type === "select" ? (
            <select
              {...register(name)}
              className="w-full px-2 py-1 my-1 border border-gray-500 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {options.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type || "text"}
              {...register(name)}
              className="w-full px-2 py-1 my-1 border border-gray-500 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          )
        ) : (
          <span className="text-base font-medium text-gray-100 truncate">
            {value || "-"}
          </span>
        )}
      </div>
    </div>
  );
};

export default EditableFieldWithIcon;
