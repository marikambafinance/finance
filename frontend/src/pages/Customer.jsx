import React, { Suspense } from "react";
import TabFormButton from "../components/TabFormButton";
import { tabFormButtons } from "../utils/buttonsConfig";
import Navbar from "../components/Navbar";
import { PopupProvider } from "../context/PopupContext";
import { useTabButtonContext } from "../context/TabButtonContext";
import { Loader2 } from "lucide-react";
import Loader from "../components/Loader";

const AddCustomer = React.lazy(() => import("../components/AddCustomer"));
const CreateLoan = React.lazy(() => import("../components/CreateLoan"));
const CustomerList = React.lazy(() => import("../components/CustomerList"));
const Repayment = React.lazy(() => import("../components/Repayment"));
const Summary = React.lazy(() => import("../components/Summary"));

const Customer = () => {
  const { activeTab, setActiveTab } = useTabButtonContext();

  return (
    <PopupProvider>
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
        <Navbar />
        <div className="flex w-full max-w-6xl gap-2 justify-start">
          {tabFormButtons.map((item, idx) => (
            <TabFormButton
              key={idx}
              tabName={item.tabName}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>

        <Suspense fallback={<Loader />}>
          {activeTab === "Customers" && <AddCustomer />}
          {activeTab === "Customers List" && <CustomerList />}
          {activeTab === "Loans" && <CreateLoan />}
          {activeTab === "Repayments" && <Repayment />}
          {activeTab === "Summary" && <Summary />}
        </Suspense>
      </div>
    </PopupProvider>
  );
};

export default Customer;
