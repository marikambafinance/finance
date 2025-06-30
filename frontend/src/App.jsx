import Home from "./pages/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Customer from "./pages/Customer";
import About from "./pages/About";
import CustomerProvider from "./context/CustomersContext";
import CustomerDetails from "./pages/CustomerDetails";
import LoanListContextProvider from "./context/LoanListContext";
import LoanRepayments from "./pages/LoanRepayments";
import TabButtonContextProvider from "./context/TabButtonContext";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { PopupProvider } from "./context/PopupContext";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/customer",
    element: (
      <ProtectedRoute>
        <Customer />
      </ProtectedRoute>
    ),
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/customer/customer-details/:hpNumber",
    element: (
      <ProtectedRoute>
        <CustomerDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/customer/:hpNumber/loan/:loanId",
    element: (
      <ProtectedRoute>
        <LoanRepayments />
      </ProtectedRoute>
    ),
  },
]);

const App = () => {
  return (
    <PopupProvider>
      <AuthProvider>
        <TabButtonContextProvider>
          <CustomerProvider>
            <LoanListContextProvider>
              <RouterProvider router={router} />
            </LoanListContextProvider>
          </CustomerProvider>
        </TabButtonContextProvider>
      </AuthProvider>
    </PopupProvider>
  );
};

export default App;
