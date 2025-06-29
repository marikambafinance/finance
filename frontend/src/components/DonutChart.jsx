import { PieChart, Pie, Cell, Legend } from "recharts";
import { useState } from "react";

const DonutChart = ({ rate }) => {
  const repaid = +rate.toFixed(2);
  const remaining = +(100 - rate).toFixed(2);

  const data = [
    { name: "Repaid", value: repaid },
    { name: "Remaining", value: remaining },
  ];

  const COLORS = {
    Repaid: "#4ade80", // Green
    Remaining: "#facc15", // Orange
  };

  const [hovered, setHovered] = useState(null); // null | "Repaid" | "Remaining"

  return (
    <div className="relative bg-gray-800 rounded-2xl shadow p-4 w-full flex flex-col items-center justify-center">
      <h3 className="text-center font-semibold text-gray-200 mb-2">
        Repayment Rate
      </h3>

      {/* Center Tooltip Box */}
      {hovered && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg shadow-md text-sm font-semibold z-10"
          style={{
            backgroundColor: COLORS[hovered],
            color: hovered === "Repaid" ? "#ffffff" : "#1f2937", // 🧠 Smart contrast
          }}
        >
          {hovered}: {hovered === "Repaid" ? repaid : remaining}%
        </div>
      )}

      <div className="flex justify-center">
        <PieChart width={280} height={280}>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={100}
            dataKey="value"
            paddingAngle={2}
            labelLine={false}
            onMouseLeave={() => setHovered(null)}
          >
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={COLORS[entry.name]}
                onMouseEnter={() => setHovered(entry.name)}
              />
            ))}
          </Pie>
          <Legend wrapperStyle={{ color: "#fff" }} />
        </PieChart>
      </div>
    </div>
  );
};

export default DonutChart;
