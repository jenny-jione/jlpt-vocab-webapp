import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./components/Home";
import KanjiPage from "./components/KanjiPage";
import Categories from "./components/Categories";
import CategoryPage from "./components/CategoryPage";
import NewWord from "./components/NewWord";
import RandomKanji from "./components/RandomKanji";
import WordTest from "./components/WordTest";
import "./App.css";  // CSS 파일 import


function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const navigate = useNavigate();
  const bookmarks = ["예문"]

  useEffect(() => {
    const keyMap = {
      "0": "/",
      "a": "/add",
      "t": "/test",
      "e": "/category/예문", // Example (예문)
    };

    const handleKeyDown = (e) => {
      // Input이나 TextArea 입력 중에는 단축키가 작동하지 않도록 방지
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const path = keyMap[e.key.toLowerCase()];
      if (path) {
        navigate(path);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      {/* 상단 네비게이션바 */}
      <nav className="navbar">
        <button onClick={() => navigate("/")}>전체목록</button>
        <button onClick={() => navigate("/kanji")}>랜덤한자</button>
        <button onClick={() => navigate("/test")}>테스트</button>
        <button onClick={() => navigate("/categories")}>카테고리</button>
        {bookmarks.map((item) => (
          <button onClick={() => navigate(`/category/${item}`)}>
            {item}
          </button>
        ))}
        <button onClick={() => navigate("/add")}>단어 추가</button>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kanji/:kanji" element={<KanjiPage />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/kanji" element={<RandomKanji />} />
        <Route path="/test" element={<WordTest />} />
        <Route path="/add" element={<NewWord />} />
      </Routes>
    </>
  );
}

export default AppWrapper;
