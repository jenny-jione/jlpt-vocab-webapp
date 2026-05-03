import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";

function WordEditModal({ editingWord, setEditingWord, refreshWords }) {
  const navigate = useNavigate();
  const [editedData, setEditedData] = useState({ ...editingWord });
  const [relatedList, setRelatedList] = useState([]);
  const autoFocusRef = useRef(null);

  // 날짜 포맷 함수
  const formatKST = (utc) => {
    if (!utc) return "";
    return new Date(utc.replace(" ", "T")).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });
  };

  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/kanji/${editingWord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });
      if (!response.ok) throw new Error("수정 실패");
      setEditingWord(null);
      if (refreshWords) await refreshWords(); // 수정 후 목록 갱신 (선택 사항)
    } catch (error) {
      console.error(error);
    }
  };

  // 관련 한자 리스트 로드
  useEffect(() => {
    if (!editingWord) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/word/${editingWord.id}`);
        const data = await res.json();
        setRelatedList(data);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [editingWord]);

  // ESC 키 이벤트 & 포커스
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") setEditingWord(null); };
    document.addEventListener("keydown", handleKeyDown);
    if (autoFocusRef.current) autoFocusRef.current.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setEditingWord]);

  if (!editingWord) return null;

  return (
    <div className="modal-overlay" onClick={() => setEditingWord(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>단어 수정</h2>
        <div className="form-row meta">
          단어 체크 횟수: {editedData.wrong_count} <br />
          {formatKST(editedData.created_at)} <br />
          {formatKST(editedData.updated_at)} <br />
          <div>
            {relatedList.map((item, index) => (
              <button
                key={`${item.word_id}-${index}`}
                onClick={() => navigate(`/kanji/${item.kanji}`)}
                className="word-btn"
              >
                {item.kanji}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label>단어</label>
          <input value={editedData.word} onChange={(e) => handleChange("word", e.target.value)} />
        </div>
        <div className="form-row">
          <label>히라가나</label>
          <input value={editedData.hiragana} onChange={(e) => handleChange("hiragana", e.target.value)} />
        </div>
        <div className="form-row">
          <label>뜻</label>
          <input value={editedData.meaning} onChange={(e) => handleChange("meaning", e.target.value)} />
        </div>
        <div className="form-row">
          <label>한국어 발음</label>
          <input value={editedData.korean} onChange={(e) => handleChange("korean", e.target.value)} />
        </div>
        <div className="form-row">
          <label>분류</label>
          <input
            ref={autoFocusRef}
            value={editedData.category ? editedData.category.join(",") : ""}
            onChange={(e) => handleChange("category", e.target.value.split(",").map((v) => v.trim()))}
          />
        </div>

        <button className="add-btn" onClick={handleSave}>저장</button>
        <button
          className="add-btn"
          style={{ backgroundColor: "#ccc", marginTop: "10px" }}
          onClick={() => setEditingWord(null)}
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default WordEditModal;