// WordTable.js
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./WordTable.css";
import { API_URL } from "../constants";
import WordEditModal from "./WordEditModal";


function WordTable({ words, refreshWords }) {
  const navigate = useNavigate();
  const [editingWord, setEditingWord] = useState(null);
  const [editedData, setEditedData] = useState({});
  const autoFocusRef = useRef(null);
  const [relatedList, setRelatedList] = useState([]); // 선택된 단어(word_id)에 해당하는 한자 리스트 (버튼으로 표시용)

  const handleEditClick = (item) => {
    setEditingWord(item);
    setEditedData({ ...item });
  };


  const handleCheckCount = async (item, mode) => {
    try {
      const updatedCount =
        mode === "increase"
          ? (item.wrong_count || 0) + 1
          : Math.max((item.wrong_count || 0) - 1, 0); // 0 이하로 내려가지 않게

      const updated = {
        ...item,                       // 전체 필드 채움
        wrong_count: updatedCount,
      };

      const response = await fetch(`${API_URL}/kanji/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!response.ok) throw new Error("카운트 수정 실패");

      await refreshWords();
    } catch (error) {
      console.error(error);
    }
  };


  // 테이블에서 표시할 컬럼 옵션과 컬럼 표시 여부를 관리하는 상태 및 토글 함수
  const COLUMN_OPTIONS = [
    { key: "word", label: "단어", defaultVisible: true },
    { key: "hiragana", label: "히라가나", defaultVisible: true },
    { key: "meaning", label: "뜻", defaultVisible: true },
    { key: "korean", label: "한국어 발음", defaultVisible: true },
    { key: "category", label: "분류", defaultVisible: true },
    { key: "edit", label: "수정", defaultVisible: false },
    { key: "date", label: "날짜", defaultVisible: false }
  ];

  const [visibleColumns, setVisibleColumns] = useState(
    COLUMN_OPTIONS
      .filter((col) => col.defaultVisible)
      .map((col) => col.key)
  );

  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key)
        ? prev.filter((col) => col !== key)
        : [...prev, key]
    );
  };



  useEffect(() => {
    if (editingWord && autoFocusRef.current) {
      autoFocusRef.current.focus();
    }
  }, [editingWord]);

  const formatKST = (utc) => {
  if (!utc) return "";
  return new Date(utc.replace(" ", "T")).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
};


  return (
    <>
    {/* 사용자가 표시할 컬럼을 선택할 수 있는 체크박스 UI */}
      <div className="column-selector">
        {COLUMN_OPTIONS.map((col) => (
          <label key={col.key} className="checkbox-label">
            <input
              type="checkbox"
              checked={visibleColumns.includes(col.key)}
              onChange={() => toggleColumn(col.key)}
            />
            <span>{col.label}</span>
          </label>
        ))}
      </div>

      {/* 선택된 컬럼(visibleColumns)에 따라 테이블 헤더와 데이터 행을 동적으로 렌더링 */}
      <table className="word-table">
        <thead>
          <tr>
            {visibleColumns.includes("word") && <th>단어</th>}
            {visibleColumns.includes("hiragana") && <th>히라가나</th>}
            {visibleColumns.includes("meaning") && <th>뜻</th>}
            {visibleColumns.includes("korean") && <th>한국어 발음</th>}
            {visibleColumns.includes("category") && <th>분류</th>}
            {visibleColumns.includes("edit") && <th>수정</th>}
            {visibleColumns.includes("date") && <th>날짜</th>}
          </tr>
        </thead>

        <tbody>
          {words.map((item) => (
            <tr
              key={`${item.word}-${item.hiragana}-${item.meaning}`}
              onClick={() => handleEditClick(item)}
            >

              {visibleColumns.includes("word") && (
                <td>{item.word}</td>
              )}

              {visibleColumns.includes("hiragana") && (
                <td>{item.hiragana}</td>
              )}

              {visibleColumns.includes("meaning") && (
                <td>{item.meaning}</td>
              )}

              {visibleColumns.includes("korean") && (
                <td className="korean-cell">{item.korean}</td>
              )}

              {visibleColumns.includes("kanji_list") && (
                <td>
                  <div>
                    {item.kanji_list.map((kanji) => (
                      <button
                        key={kanji}
                        className="word-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/kanji/${kanji}`);
                        }}
                      >
                        {kanji}
                      </button>
                    ))}
                  </div>
                </td>
              )}

              {visibleColumns.includes("category") && (
                <td>
                  <div>
                    <span className="check-badge">{item.wrong_count}</span>
                    {item.category.map((c) => (
                      <button
                        key={c}
                        className="word-btn category-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/category/${c}`);
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </td>
              )}

              {visibleColumns.includes("edit") && (
                <td>
                  <button
                    className="word-btn category-btn"
                    onClick={() => handleCheckCount(item, "increase")}
                  >
                    ✅
                  </button>

                  <button
                    className="word-btn category-btn"
                    onClick={() => handleCheckCount(item, "decrease")}
                  >
                    👏🏻
                  </button>
                </td>
              )}

              {visibleColumns.includes("date") && (
                <td className="korean-cell">{formatKST(item.updated_at)}</td>
              )}

            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ 모달창 */}
      {editingWord && (<WordEditModal 
        editingWord={editingWord} 
        setEditingWord={setEditingWord} 
        refreshWords={refreshWords} 
      />)}

    </>
  );
}

export default WordTable;
