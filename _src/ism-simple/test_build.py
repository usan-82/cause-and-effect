"""규칙 검사와 화면 그리기 검사: python3 _src/ism-simple/test_build.py"""
import copy, os, sys, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build

ISM = build.load_ism("struct.json")
PG = {"maxSentence": 45, "maxYears": 3, "explain": []}
STRUCT = {"chapters": [
    {"id": "premodern", "tp": 0}, {"id": "science", "tp": 1}, {"id": "french", "tp": 2},
    {"id": "industrial", "tp": 3, "arrows": ["sure", "sure", "sure"],
     "duels": [{"a": "classical", "b": "socialism", "grade": "part"},
               {"a": "imperialism", "b": None, "grade": "part"}],
     "next": "part"},
    {"id": "worldwar", "tp": 4}, {"id": "coldwar", "tp": 5}, {"id": "digital", "tp": 6}, {"id": "ai", "tp": 7},
]}
CHAPTER = {
    "title": "기계가 일을 시작했어요",
    "q": "왜 종이 울리면 시작할까요?",
    "event": "공장이 생겼어요.",
    "shift": {"before": "땅이 힘이었어요.", "after": "기계가 힘이 됐어요."},
    "people": {"good": [{"who": "물건을 사는 사람들", "text": "값이 싸졌어요."}],
               "bad": [{"who": "공장의 아이들", "text": "오래 일했어요."}]},
    "why": ["첫째 이유예요.", "둘째 이유예요.", "셋째 이유예요.", "넷째 이유예요."],
    "whyOthers": [None, None, None],
    "duels": [
        {"a": "맡겨 두면 돼요", "b": "함께 가져야 해요", "clash": "둘 다 될 수는 없었어요.",
         "events": ["노동조합", "혁명"], "others": "흉년도 있었어요."},
        {"a": "더 넓혀야 해요", "b": "여기는 남의 땅이 아니에요", "clash": "땅은 하나였어요.",
         "events": ["땅 나누기"], "others": "경쟁심도 있었어요."},
    ],
    "result": "여러 일이 벌어졌어요.",
    "today": "그래서 오늘도 그래요.",
    "next": "힘이 밖으로 나갔어요.",
    "nextOthers": "다른 까닭도 있었어요.",
    "words": [["공장", "물건을 만드는 곳이에요."]],
}


def good():
    return copy.deepcopy(STRUCT), {"chapters": {"industrial": copy.deepcopy(CHAPTER)}}, copy.deepcopy(PG)


def ind(st):
    return st["chapters"][3]


def fatal(errs):
    return [e for e in errs if not e.endswith("글 없음")]


class CheckTest(unittest.TestCase):
    def run_check(self, st, tx, pg):
        return build.check("ko", st, tx, pg, ISM)

    def assertHas(self, errs, sub):
        self.assertTrue(any(sub in e for e in errs), f"{sub!r} not in {errs}")

    def test_good_chapter_passes(self):
        self.assertEqual(fatal(self.run_check(*good())), [])

    def test_missing_text_is_not_fatal(self):
        st, tx, pg = good()
        tx["chapters"] = {}
        errs = self.run_check(st, tx, pg)
        self.assertEqual(len(errs), 8)
        self.assertEqual(fatal(errs), [])

    def test_missing_field(self):
        st, tx, pg = good()
        del tx["chapters"]["industrial"]["q"]
        self.assertHas(self.run_check(st, tx, pg), "industrial: q 없음")

    def test_why_needs_four(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["why"].pop()
        self.assertHas(self.run_check(st, tx, pg), "why는 4개")

    def test_empty_reason(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["why"][1] = ""
        self.assertHas(self.run_check(st, tx, pg), "why[1] 비어 있음")

    def test_part_arrow_needs_others(self):
        st, tx, pg = good()
        ind(st)["arrows"][0] = "part"
        self.assertHas(self.run_check(st, tx, pg), "whyOthers[0] 필요")

    def test_part_duel_needs_others(self):
        st, tx, pg = good()
        del tx["chapters"]["industrial"]["duels"][0]["others"]
        self.assertHas(self.run_check(st, tx, pg), "duels[0].others 필요")

    def test_part_next_needs_others(self):
        st, tx, pg = good()
        del tx["chapters"]["industrial"]["nextOthers"]
        self.assertHas(self.run_check(st, tx, pg), "nextOthers 필요")

    def test_next_required_except_last(self):
        st, tx, pg = good()
        del tx["chapters"]["industrial"]["next"]
        del tx["chapters"]["industrial"]["nextOthers"]
        self.assertHas(self.run_check(st, tx, pg), "next 없음")
        # 같은 글을 마지막 장(ai)에 넣으면 next가 없어도 된다
        last = st["chapters"][7]
        for k in ("arrows", "duels"):
            last[k] = ind(st).pop(k)
        ind(st).pop("next")
        tx["chapters"] = {"ai": tx["chapters"]["industrial"]}
        self.assertEqual(fatal(self.run_check(st, tx, pg)), [])

    def test_people_need_who(self):
        st, tx, pg = good()
        del tx["chapters"]["industrial"]["people"]["bad"][0]["who"]
        self.assertHas(self.run_check(st, tx, pg), "people.bad[0].who 없음")

    def test_people_need_both(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["people"]["good"] = []
        self.assertHas(self.run_check(st, tx, pg), "people.good 1개 이상")

    def test_duel_count_matches(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["duels"].pop()
        self.assertHas(self.run_check(st, tx, pg), "duels 개수")

    def test_max_two_duels(self):
        st, tx, pg = good()
        ind(st)["duels"].append({"a": None, "b": None, "grade": "sure"})
        tx["chapters"]["industrial"]["duels"].append(
            {"a": "이래요", "b": "저래요", "clash": "부딪쳤어요.", "events": ["일"]})
        self.assertHas(self.run_check(st, tx, pg), "대결은 2쌍 이하")

    def test_unknown_ism(self):
        st, tx, pg = good()
        ind(st)["duels"][0]["a"] = "nope"
        self.assertHas(self.run_check(st, tx, pg), "사상 id nope 없음")

    def test_null_ism_allowed(self):
        st, tx, pg = good()
        self.assertIsNone(ind(st)["duels"][1]["b"])
        self.assertEqual(fatal(self.run_check(st, tx, pg)), [])

    def test_bad_grade(self):
        st, tx, pg = good()
        ind(st)["duels"][0]["grade"] = "maybe"
        self.assertHas(self.run_check(st, tx, pg), "grade 값")

    def test_long_sentence(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["event"] = "가" * 43 + "어요."
        self.assertHas(self.run_check(st, tx, pg), "문장이 김(46>45)")

    def test_too_many_years(self):
        st, tx, pg = good()
        c = tx["chapters"]["industrial"]
        c["event"] = "1769년에 공장이 생겼어요."
        c["result"] = "1848년에 일이 벌어졌어요."
        c["today"] = "1917년에도 그랬어요."
        c["next"] = "1914년으로 이어졌어요."
        self.assertHas(self.run_check(st, tx, pg), "연도가 많음")

    def test_duel_text_counted(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["duels"][0]["events"] = ["1811년 일", "1833년 일", "1848년 일", "1917년 일"]
        self.assertHas(self.run_check(st, tx, pg), "연도가 많음")

    def test_explain_needs_word(self):
        st, tx, pg = good()
        pg["explain"] = ["자본"]
        tx["chapters"]["industrial"]["event"] = "자본이 힘이 됐어요."
        self.assertHas(self.run_check(st, tx, pg), "'자본' 낱말 풀이 필요")


if __name__ == "__main__":
    unittest.main()
