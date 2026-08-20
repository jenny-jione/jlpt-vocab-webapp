import { useState, useEffect } from "react";
import WordTable from "./WordTable";
import "../App.css";
import { API_URL } from "../constants";


function Home() {
  const [words, setWords] = useState([]);
  const [search, setSearch] = useState("");


  const fetchAllWords = async () => {
    const res = await fetch(`${API_URL}/words_list`);
    const data = await res.json();
    setWords(data);
  };

  useEffect(() => {
    fetchAllWords();
  }, []);

  const filteredWords = words.filter((word) =>
    word.word.includes(search) ||
    word.hiragana.includes(search) ||
    word.meaning.includes(search) ||
    word.korean.includes(search)
  );

  return (
    <div style={{ padding: "20px" }}>
      <div class="section-header">
        <h1 className="section-title">전체 단어 목록</h1>
        <div className="search-box">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="단어 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.target.blur();
              }
            }}
          />

          {search && (
            <button onClick={() => setSearch("")}>×</button>
          )}
        </div>
        <div className="detail">(total: {words.length})</div>
      </div>

      {/* ✅ 갱신 함수도 props로 전달 */}
      <WordTable
        words={filteredWords}
        refreshWords={fetchAllWords}
        />
      {/* <WordTable words={words} refreshWords={fetchAllWords} /> */}
    </div>
  );
}

export default Home;
