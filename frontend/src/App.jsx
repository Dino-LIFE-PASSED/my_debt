import { BrowserRouter, Routes, Route } from "react-router-dom";
import DebtListPage from "./pages/DebtListPage";
import AddDebtPage from "./pages/AddDebtPage";
import DebtDetailPage from "./pages/DebtDetailPage";
import AddPaymentPage from "./pages/AddPaymentPage";
import SharePage from "./pages/SharePage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้า share ไม่มี Navbar - เป็นหน้าสาธารณะสำหรับเจ้าหนี้ */}
        <Route path="/share/:token" element={<SharePage />} />

        {/* หน้าอื่นๆ มี Navbar */}
        <Route path="/*" element={
          <>
            <Navbar />
            <div className="container">
              <Routes>
                <Route path="/" element={<DebtListPage />} />
                <Route path="/add-debt" element={<AddDebtPage />} />
                <Route path="/debt/:id" element={<DebtDetailPage />} />
                <Route path="/debt/:id/add-payment" element={<AddPaymentPage />} />
              </Routes>
            </div>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
