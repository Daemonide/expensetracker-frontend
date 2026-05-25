import { Routes, Route } from "react-router-dom"

import Layout from "./layout"
import ExpensesPage from "@/pages/ExpensesPage"
import LoginPage from "@/pages/LoginPage.tsx"
import CategoriesPage from "@/pages/CategoriesPage.tsx"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<Layout />}>
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Route>
    </Routes>
  )
}

export default App
