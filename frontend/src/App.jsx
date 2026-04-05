import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewBill from './pages/NewBill';
import Bills from './pages/Bills';
import BillDetail from './pages/BillDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Returns from './pages/Returns';
import Settings from './pages/Settings';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            borderRadius: '12px',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                        },
                    }}
                />
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="bills" element={<Bills />} />
                        <Route path="bills/new" element={<NewBill />} />
                        <Route path="bills/:id" element={<BillDetail />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="customers/:id" element={<CustomerDetail />} />
                        <Route path="returns" element={<Returns />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* 404 catch-all */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;