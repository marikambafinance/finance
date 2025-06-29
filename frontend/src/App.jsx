import Home from "./pages/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Customer from "./pages/Customer";
import About from "./pages/About";
import CustomerProvider from "./context/CustomersContext";
import CustomerDetails from "./pages/CustomerDetails";
import LoanListContextProvider from "./context/LoanListContext";
import LoanRepayments from "./pages/LoanRepayments";
import TabButtonContextProvider from "./context/TabButtonContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/customer",
    element: <Customer />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/customer/customer-details/:hpNumber",
    element: <CustomerDetails />,
  },
  {
    path: "/customer/:hpNumber/loan/:loanId",
    element: <LoanRepayments />,
  },
]);

const App = () => {
  return (
    <TabButtonContextProvider>
      <CustomerProvider>
        <LoanListContextProvider>
          <RouterProvider router={router} />
        </LoanListContextProvider>
      </CustomerProvider>
    </TabButtonContextProvider>
  );
};

export default App;
