from fastapi import APIRouter, HTTPException, Path, Body
from models import Word, WordUpdate
from repository import WordRepository

router = APIRouter()


@router.get("/kanji")
def get_all_kanji():
    """모든 한자 조회"""
    return WordRepository.get_all_kanji()


@router.get("/words_list")
def get_all_words():
    """모든 단어 리스트 조회 (최신순)"""
    return WordRepository.get_all_words()


@router.get("/word/{word_id}")
def get_words_by_kanji(
    word_id: int = Path(
        ...,
        description="조회할 단어의 ID (예: 73, 2071)",
        example="73",
    )
):
    """특정 단어 ID에 포함된 모든 한자를 조회"""
    kanjis = WordRepository.get_kanjis_by_word_id(word_id)
    if not kanjis:
        return []
    return kanjis


@router.get("/kanji/{kanji}")
def get_words_by_kanji(
    kanji: str = Path(
        ...,
        description="검색할 한자 (예: 日, 月, 水 등)",
        example="行",
    )
):
    """특정 한자로 단어 검색"""
    words = WordRepository.get_words_by_kanji(kanji)
    if not words:
        return []
    return words


@router.get("/categories")
def get_all_categories():
    """모든 카테고리 조회"""
    return WordRepository.get_all_categories()


@router.get("/category/{category}")
def get_words_by_category(
    category: str = Path(
        ...,
        description="카테고리 (예: 자연물, 방향, 시간 등)",
        example="방향",
    )
):
    """특정 카테고리로 단어 검색"""
    words = WordRepository.get_words_by_category(category)
    if not words:
        return []
    return words


@router.post("/kanji")
def add_word(
    input_word: Word = Body(
        description="추가할 단어의 정보를 입력합니다.",
        example={
            "word": "先生",
            "hiragana": "せんせい",
            "meaning": "선생님",
            "korean": "센세이",
        },
    )
):
    """새로운 단어를 추가합니다. 이미 존재하는 단어는 중복 추가되지 않습니다."""
    result = WordRepository.add_word(input_word)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result


@router.put("/kanji/{word_id}")
def update_word(
    word_id: int = Path(..., description="수정할 단어의 ID"),
    updated_word: WordUpdate = Body(
        example={
            "word": "記者",
            "hiragana": "きしゃ",
            "meaning": "기자",
            "korean": "キシャ",
            "category": ["직업", "언론"],
        }
    ),
):
    """이미 존재하는 단어 정보를 수정합니다."""
    result = WordRepository.update_word(word_id, updated_word)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


@router.delete("/kanji/{word_id}")
def delete_word(word_id: int = Path(..., description="삭제할 단어의 ID")):
    """단어를 삭제합니다."""
    result = WordRepository.delete_word(word_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result
