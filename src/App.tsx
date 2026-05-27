import { Navigate, Route, Routes } from "react-router-dom"
import Layout from "./layout"
import DashboardPage from "@/pages/DashboardPage"
import ExpensesPage from "@/pages/ExpensesPage"
import CategoriesPage from "@/pages/CategoriesPage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import PrivateRoute from "@/components/PrivateRoute"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<Layout />}>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <PrivateRoute>
              <ExpensesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <CategoriesPage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
