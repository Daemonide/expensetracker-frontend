import { Routes, Route } from "react-router-dom"

import Layout from "./layout"
import ExpensesPage from "@/pages/ExpensesPage"
import LoginPage from "@/pages/LoginPage.tsx"
import CategoriesPage from "@/pages/CategoriesPage.tsx"
import PrivateRoute from "@/components/PrivateRoute"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<Layout />}>
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
