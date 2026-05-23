import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Synthesis from "@/pages/Synthesis";
import Chat from "@/pages/Chat";
import Analysis from "@/pages/Analysis";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="library" element={<Library />} />
        <Route path="synthesis" element={<Synthesis />} />
        <Route path="chat" element={<Chat />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="analysis/:paperId" element={<Analysis />} />
      </Route>
    </Routes>
  );
}
