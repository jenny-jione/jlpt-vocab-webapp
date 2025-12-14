import sqlite3
from datetime import datetime, timezone
from typing import List, Optional
from models import Word, WordUpdate, WordResponse
from database import get_db_connection
from utils import extract_kanji_from_word


class WordRepository:
    """단어 데이터베이스 접근 계층"""

    @staticmethod
    def add_word(word: Word) -> dict:
        """새로운 단어 추가"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # 단어 추가
            cursor.execute(
                """
                INSERT INTO words (word, hiragana, meaning, korean, wrong_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    word.word,
                    word.hiragana,
                    word.meaning,
                    word.korean,
                    word.wrong_count,
                    word.created_at,
                    word.updated_at,
                ),
            )
            word_id = cursor.lastrowid

            # 카테고리 추가
            WordRepository._add_categories_to_word(cursor, word_id, word.category)

            # 한자 인덱스 추가
            kanji_list = extract_kanji_from_word(word.word)
            for kanji in kanji_list:
                cursor.execute(
                    "INSERT INTO word_kanji (word_id, kanji) VALUES (?, ?)",
                    (word_id, kanji),
                )

            conn.commit()
            return {"status": "success"}

        except sqlite3.IntegrityError:
            conn.rollback()
            return {"status": "error", "message": "이미 존재하는 단어입니다."}
        finally:
            conn.close()

    @staticmethod
    def get_all_words() -> List[dict]:
        """모든 단어 조회 (최신순)"""
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT w.id, w.word, w.hiragana, w.meaning, w.korean, w.wrong_count, w.created_at, w.updated_at
            FROM words w
            WHERE NOT EXISTS
                (
                SELECT 1
                FROM word_categories wc
                JOIN categories c
                    ON wc.category_id = c.id
                WHERE wc.word_id = w.id
                    AND c.name = "예문"
                )
            ORDER BY updated_at DESC;
            """
        )

        rows = cursor.fetchall()
        result = []

        for row in rows:
            word_dict = dict(row)
            # 카테고리 조회
            cursor.execute(
                """
                SELECT c.name FROM categories c
                JOIN word_categories wc ON c.id = wc.category_id
                WHERE wc.word_id = ?
                """,
                (row["id"],),
            )
            categories = [cat_row["name"] for cat_row in cursor.fetchall()]
            word_dict["category"] = categories
            result.append(word_dict)

        conn.close()
        return result

    @staticmethod
    def get_words_by_kanji(kanji: str) -> List[dict]:
        """한자로 단어 검색"""
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT DISTINCT w.id, w.word, w.hiragana, w.meaning, w.korean, w.wrong_count, w.created_at, w.updated_at
            FROM words w
            JOIN word_kanji wk ON w.id = wk.word_id
            WHERE wk.kanji = ?
            ORDER BY w.word
            """,
            (kanji,),
        )

        rows = cursor.fetchall()
        result = []

        for row in rows:
            word_dict = dict(row)
            cursor.execute(
                """
                SELECT c.name FROM categories c
                JOIN word_categories wc ON c.id = wc.category_id
                WHERE wc.word_id = ?
                """,
                (row["id"],),
            )
            categories = [cat_row["name"] for cat_row in cursor.fetchall()]
            word_dict["category"] = categories
            result.append(word_dict)

        conn.close()
        return result

    @staticmethod
    def get_all_kanji() -> List[str]:
        """모든 한자 리스트 조회"""
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT DISTINCT kanji FROM word_kanji ORDER BY kanji")
        result = [row["kanji"] for row in cursor.fetchall()]
        conn.close()
        return result

    @staticmethod
    def get_all_categories() -> List[str]:
        """모든 카테고리 조회"""
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM categories ORDER BY name")
        result = [row["name"] for row in cursor.fetchall()]
        conn.close()
        return result

    @staticmethod
    def get_words_by_category(category: str) -> List[dict]:
        """카테고리로 단어 검색"""
        conn = get_db_connection()
        cursor = conn.cursor()

        # 카테고리 ID 조회
        cursor.execute("SELECT id FROM categories WHERE name = ?", (category,))
        cat_row = cursor.fetchone()

        if not cat_row:
            conn.close()
            return []

        category_id = cat_row["id"]

        # 해당 카테고리의 단어 조회
        sort_key = "updated_at DESC" if category == "예문" else "word ASC"
        cursor.execute(
            f"""
            SELECT w.id, w.word, w.hiragana, w.meaning, w.korean, w.wrong_count, w.created_at, w.updated_at
            FROM words w
            JOIN word_categories wc ON w.id = wc.word_id
            WHERE wc.category_id = ?
            ORDER BY {sort_key}
            """,
            (category_id,),
        )

        rows = cursor.fetchall()
        result = []

        for row in rows:
            word_dict = dict(row)
            # 카테고리 조회
            cursor.execute(
                """
                SELECT c.name FROM categories c
                JOIN word_categories wc ON c.id = wc.category_id
                WHERE wc.word_id = ?
                """,
                (row["id"],),
            )
            categories = [cat_row["name"] for cat_row in cursor.fetchall()]
            word_dict["category"] = categories
            result.append(word_dict)

        conn.close()
        return result

    @staticmethod
    def update_word(word_id: int, updated_word: WordUpdate) -> dict:
        """단어 정보 수정"""
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # 단어 존재 여부 확인
            cursor.execute("SELECT id FROM words WHERE id = ?", (word_id,))
            if not cursor.fetchone():
                return {"status": "error", "message": "해당 단어를 찾을 수 없습니다."}

            # 단어 정보 수정
            update_time = datetime.now(timezone.utc)
            cursor.execute(
                """
                UPDATE words
                SET word = ?, hiragana = ?, meaning = ?, korean = ?, wrong_count = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    updated_word.word,
                    updated_word.hiragana,
                    updated_word.meaning,
                    updated_word.korean,
                    updated_word.wrong_count or 0,
                    update_time,
                    word_id,
                ),
            )

            # 기존 카테고리 제거
            cursor.execute("DELETE FROM word_categories WHERE word_id = ?", (word_id,))

            # 새로운 카테고리 추가
            WordRepository._add_categories_to_word(cursor, word_id, updated_word.category)

            # 기존 한자 인덱스 제거
            cursor.execute("DELETE FROM word_kanji WHERE word_id = ?", (word_id,))

            # 새로운 한자 인덱스 추가
            kanji_list = extract_kanji_from_word(updated_word.word)
            for kanji in kanji_list:
                cursor.execute(
                    "INSERT INTO word_kanji (word_id, kanji) VALUES (?, ?)",
                    (word_id, kanji),
                )

            conn.commit()
            return {"status": "success", "message": f"'{updated_word.word}' 단어 정보가 수정되었습니다."}

        except sqlite3.IntegrityError:
            conn.rollback()
            return {"status": "error", "message": "중복된 단어입니다."}
        finally:
            conn.close()

    @staticmethod
    def delete_word(word_id: int) -> dict:
        """단어 삭제"""
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT word FROM words WHERE id = ?", (word_id,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return {"status": "error", "message": "해당 단어를 찾을 수 없습니다."}

        word_name = row["word"]

        # 카스케이드 삭제 (외래키 제약으로 자동 삭제됨)
        cursor.execute("DELETE FROM words WHERE id = ?", (word_id,))
        conn.commit()
        conn.close()

        return {"status": "success", "message": f"'{word_name}' 단어가 삭제되었습니다."}

    @staticmethod
    def _add_categories_to_word(cursor, word_id: int, categories: List[str]):
        """단어에 카테고리 추가 (헬퍼 메서드)"""
        for category in categories:
            # 카테고리 존재 여부 확인, 없으면 생성
            cursor.execute("SELECT id FROM categories WHERE name = ?", (category,))
            cat_row = cursor.fetchone()

            if cat_row:
                category_id = cat_row["id"]
            else:
                cursor.execute("INSERT INTO categories (name) VALUES (?)", (category,))
                category_id = cursor.lastrowid

            # 매핑 테이블에 추가
            cursor.execute(
                "INSERT OR IGNORE INTO word_categories (word_id, category_id) VALUES (?, ?)",
                (word_id, category_id),
            )
