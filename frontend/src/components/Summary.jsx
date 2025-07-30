import useDashboardStats from "../hooks/useDashboardStats";
import DonutChart from "./DonutChart";
import CustomBarChart from "./CustomBarChart";
import Loader from "./Loader";
import DefaultersLoanCard from "./DefaultersLoanCard";
import { AlertTriangle } from "lucide-react";
import CustomersPopup from "./CustomersPopup";
import { useState } from "react";

const StatCard = ({ label, value, onClick }) => (
  <div
    className="rounded-2xl bg-gray-800 shadow p-4 w-full text-center"
    onClick={onClick}
  >
    <div className="cursor-pointer">
      <h2 className="text-sm text-gray-400 cursor-pointer">{label}</h2>
      <p className="text-2xl font-bold text-green-400">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { financeData } = useDashboardStats();
  const [show, setShow] = useState(false);

  if (!financeData) {
    return <Loader />;
  }

  const { totals, averages, recent, breakdown, defaulters } = financeData;

  return (
    financeData && (
      <div className="w-full max-w-6xl mx-auto bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
        <h1 className="text-3xl font-bold mb-6">Finance Dashboard</h1>
        {show && (
          <CustomersPopup
            show={show}
            close={() => setShow(false)}
            customers={[
              { name: "Abhi", phone: "9876543210" },
              { name: "Madan", phone: "9999999999" },
              { name: "Sagar", phone: "8888888888" },
            ]}
          />
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 w-[100%]">
          <StatCard
            label="Amount Issued"
            value={`₹${totals?.amountIssued.toLocaleString("en-IN") || 0}`}
          />
          <StatCard
            label="Amount Disbursed"
            value={`₹${totals?.actualAmountIssued.toLocaleString("en-IN") || 0}`}
          />
          <StatCard
            label="Amount Received"
            value={`₹${totals?.amountReceived.toLocaleString("en-IN") || 0}`}
          />
          <StatCard
            label="Interest Amount Collected"
            value={`₹${totals?.interestCollected?.toLocaleString("en-IN") || 0}`}
          />
          <StatCard label="Total Loans" value={totals?.loans || 0} />
          <StatCard label="Closed Loans" value={totals?.closedLoans || 0} />
          <StatCard label="Penalty Collected" value={totals?.penaltyAmount || 0} />
          <StatCard
            onClick={() => setShow(true)}
            label="Total Customers"
            value={`${totals?.customers || 0}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 w-full">
          <DonutChart rate={averages?.repaymentRatePercent} />
          <CustomBarChart
            customers={breakdown?.customersWithActiveLoans}
            loans={totals?.activeLoans}
          />
          <div className="bg-gray-800 rounded-2xl shadow p-4">
            <h3 className="font-semibold text-gray-200 mb-2">
              Recent Activity
            </h3>
            <p>
              New Customers This Month:{" "}
              <strong>{recent?.newCustomersThisMonth}</strong>
            </p>
            <p>
              Repayments This Month:{" "}
              <strong>{recent?.repaymentsThisMonth}</strong>
            </p>
            <p>
              Repeat Customers: <strong>{breakdown?.repeatCustomers}</strong>
            </p>
            <p>
              Defaulters: <strong>{defaulters?.count}</strong>
            </p>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-amber-300 border-b border-gray-700 pb-2 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-amber-300" />
          Defaulters
        </h3>

        {defaulters?.loans.map((loan, index) => (
          <DefaultersLoanCard key={index} loan={loan} />
        ))}
      </div>
    )
  );
};

export default Dashboard;
