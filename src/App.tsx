import { Navigate, Route, Routes } from "react-router-dom";

import { ShowcasePage } from "./pages/ShowcasePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/internal/showcase" replace />} />
      <Route path="/internal/showcase" element={<ShowcasePage />} />
      <Route path="*" element={<Navigate to="/internal/showcase" replace />} />
    </Routes>
  );
}
