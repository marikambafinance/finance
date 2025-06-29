import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const CustomBarChart = ({ customers, loans }) => {
  const data = [
    { name: "Active Customers", value: customers },
    { name: "Active Loans", value: loans },
  ];

  return (
    <div className="bg-gray-800 rounded-2xl shadow p-4 w-full flex flex-col justify-center items-center">
      <h3 className="text-center font-semibold text-gray-200 mb-2">
        Customers & Loans
      </h3>
      <div className="w-full max-w-md">
        <ResponsiveContainer width="90%" height={250}>
          <BarChart data={data} barSize={50}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="name" stroke="#d1d5db" tick={{ fontSize: 12 }} />
            <YAxis
              stroke="#d1d5db"
              domain={[0, (max) => Math.ceil(max + 2)]}
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderColor: "#4b5563",
                color: "#f9fafb",
              }}
            />
            <Bar
              dataKey="value"
              fill="#60a5fa"
              activeBar={false}  // 💡 custom hover color (Sky-400)
            >
              <LabelList dataKey="value" position="top" fill="#fff" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomBarChart;
