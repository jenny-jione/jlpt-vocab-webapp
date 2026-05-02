import { useState, useRef, useEffect } from "react";
import "./WordTest.css";

const WordTest = () => {
  const [step, setStep] = useState(1);
  // 초기값을 첫 번째 모드로 설정
  const [testMode, setTestMode] = useState({
    key: "word_to_meaning",
    label: "단어 ➔ 뜻",
    question: "word",
    answer: "meaning",
  });
  // 입력 방식 ('input' 또는 'self')
  const [inputMethod, setInputMethod] = useState("self");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [testWords, setTestWords] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef(null);

  const API_URL = "http://127.0.0.1:8000";

  // 테스트 모드 정의
    const TEST_MODES = [
      { key: "word_to_meaning", label: "단어 ➔ 뜻", question: "word", answer: "meaning" },
      { key: "word_to_hira", label: "단어 ➔ 히라가나", question: "word", answer: "hiragana" },
      { key: "meaning_to_word", label: "뜻 ➔ 단어", question: "meaning", answer: "word" },
      { key: "meaning_to_hira", label: "뜻 ➔ 히라가나", question: "meaning", answer: "hiragana" },
  ];

  // 현재 필드(word, meaning 등)의 한글 라벨 찾기
  const getLabel = (key) => {
    const labels = { word: "단어", hiragana: "히라가나", meaning: "뜻", korean: "한국어 발음" };
    return labels[key] || key;
  };

  useEffect(() => {
    if (step === 2 && !showResult) {
      inputRef.current?.focus();
    }
  }, [step, showResult, currentIdx]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.nativeEvent?.isComposing) return;

      if (e.key === "Enter") {
        e.preventDefault();
        if (step === 1) startTest();
        else if (step === 2) {
          if (showResult) nextQuestion();
          else if (inputMethod === "input") checkAnswer();
          else setShowResult(true); // 자가테스트 모드일 때 엔터 치면 정답 보기
        }
      }
      
      // 자가테스트 모드 단축키 추가 (1: 안다, 2: 모른다)
      if (step === 2 && showResult && inputMethod === "self") {
        if (e.key === "1") nextQuestion();
        if (e.key === "2") handleSelfWrong();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, showResult, currentIdx, userAnswer]);

  const startTest = async () => {
    try {
      const response = await fetch(`${API_URL}/words_list`);
      if (!response.ok) throw new Error("네트워크 응답 에러");
      const allData = await response.json();
      const shuffled = allData.sort(() => Math.random() - 0.5);

      setTestWords(shuffled);
      setCurrentIdx(0);
      setStep(2);
    } catch (error) {
      console.error("데이터 로딩 실패", error);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < testWords.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setUserAnswer("");
      setShowResult(false);
    } else {
      alert("모든 문제를 다 풀었습니다!");
      setStep(1);
    }
  };

  const checkAnswer = async () => {
    // 선택된 모드의 answer 키 값을 가져와서 비교
    const isRight = testWords[currentIdx][testMode.answer] === userAnswer;
    if (!isRight) {
      await handleCheckCount(testWords[currentIdx]);
    }
    setShowResult(true);
  };

  // 자가테스트에서 '모름'을 눌렀을 때 처리
  const handleSelfWrong = async () => {
    await handleCheckCount(testWords[currentIdx]);
    nextQuestion();
  };

  const handleCheckCount = async (item) => {
    try {
      const updated = { ...item, wrong_count: (item.wrong_count || 0) + 1 };
      await fetch(`${API_URL}/kanji/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (error) {
      console.error("오답 API 호출 에러:", error);
    }
  };

  // --- 렌더링 ---

  // 1단계: 모드 선택
  if (step === 1) {
    return (
      <div className="test-container">
        <h3 className="step1-header">테스트 설정</h3>
        
        <div className="option-group">
          <p className="option-label">유형 선택</p>
          <div className="column-selector">
            {TEST_MODES.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setTestMode(mode)}
                className={`target-btn ${testMode.key === mode.key ? "active" : ""}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <p className="option-label">방식 선택</p>
          <div className="column-selector" style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`target-btn ${inputMethod === "self" ? "active" : ""}`}
              onClick={() => setInputMethod("self")}
            >
              자가 테스트
            </button>
            <button 
              className={`target-btn ${inputMethod === "input" ? "active" : ""}`}
              onClick={() => setInputMethod("input")}
            >
              직접 입력
            </button>
          </div>
        </div>
      
        <button className="action-btn" onClick={startTest}>
          시험 시작 (Enter)
        </button>
      </div>
    );
  }

  // 2단계: 시험 진행
  const currentWord = testWords[currentIdx];
  const isCorrect = currentWord[testMode.answer] === userAnswer;

  return (
    <div className="test-container">
      <div style={{ marginBottom: "20px", color: "#888", fontSize: "14px" }}>
        문제 {currentIdx + 1} / {testWords.length} ({inputMethod === 'input' ? '입력' : '자가진단'})
      </div>

      <div className="question-card">
        <div className="question-row">
          <span className="label">{getLabel(testMode.question)}</span>
          <span className="value-text highlight">{currentWord[testMode.question]}</span>
        </div>

        <hr style={{ border: '0.5px solid #eee', margin: '15px 0' }} />

        <div className="question-row">
          <span className="label">{getLabel(testMode.answer)}</span>
          {inputMethod === "input" ? (
            <input
              ref={inputRef}
              // className={`answer-input ${showResult ? "readonly" : ""}`}
              className={`answer-input ${showResult ? "readonly" : ""}`}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={showResult}
              placeholder="정답을 입력하세요"
            />
          ) : (
            <span className={`value-text ${showResult ? "" : "gray"}`}>
              {showResult 
                ? currentWord[testMode.answer] 
                : "생각해본 뒤 아래 버튼을 누르세요"
              }
            </span>
          )}
        </div>
      </div>

      {showResult && (
        <div className={`result-box ${inputMethod === 'input' ? (isCorrect ? "correct" : "wrong") : "info"}`}>
          {inputMethod === 'input' && <h4>{isCorrect ? "⭕ 정답입니다!" : "❌ 틀렸습니다!"}</h4>}
          
          {/* 전체 정보를 보여주는 상세 영역 */}
          <div className="word-detail-view">
            <div className="detail-item">
              <span className="detail-label">단어</span>
              <span className="detail-value">{currentWord.word}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">히라가나</span>
              <span className="detail-value">{currentWord.hiragana}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">뜻</span>
              <span className="detail-value">{currentWord.meaning}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">발음</span>
              <span className="detail-value">{currentWord.korean}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">카테고리</span>
              <span className="detail-value">{currentWord.category.join(', ')}</span>
            </div>
          </div>

          <div className="self-check-buttons">
            <button className="action-btn info-btn">
              단어정보 확인
            </button>
            <button 
              className="action-btn dic-btn" 
              onClick={() => window.open(`https://ja.dict.naver.com/#/search?range=word&query=${currentWord.word}`, '_blank')}>
              사전에서 보기
            </button>
          </div>          


        </div>
      )}

      <div className="action-area">
        {!showResult ? (
          <button className="action-btn" onClick={() => (inputMethod === 'input' ? checkAnswer() : setShowResult(true))}>
            {inputMethod === 'input' ? "정답 확인 (Enter)" : "정답 보기 (Enter)"}
          </button>
        ) : (
          inputMethod === "input" ? (
            <button className="action-btn secondary" onClick={nextQuestion}>다음 문제 (Enter)</button>
          ) : (
            <div className="self-check-buttons">
              <button className="action-btn correct-btn" onClick={nextQuestion}>
                알아요 (1)
              </button>
              <button className="action-btn wrong-btn" onClick={handleSelfWrong}>
                몰라요 (2)
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default WordTest;