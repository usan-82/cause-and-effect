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

    # ----- 최종 검토에서 나온 빈틈 -----
    def test_blank_text_is_missing(self):
        for f in ("title", "q", "event", "result", "today"):
            st, tx, pg = good()
            tx["chapters"]["industrial"][f] = "  "
            self.assertHas(self.run_check(st, tx, pg), f"{f} 없음")

    def test_shift_needs_both(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["shift"] = {"before": "전에는 그랬어요."}
        self.assertHas(self.run_check(st, tx, pg), "shift.after 없음")

    def test_blank_others_not_enough(self):
        st, tx, pg = good()
        c = tx["chapters"]["industrial"]
        ind(st)["arrows"][0] = "part"
        c["whyOthers"][0] = c["duels"][0]["others"] = c["nextOthers"] = "  "
        errs = self.run_check(st, tx, pg)
        for sub in ("whyOthers[0] 필요", "duels[0].others 필요", "nextOthers 필요"):
            self.assertHas(errs, sub)

    def test_blank_who_and_event(self):
        st, tx, pg = good()
        c = tx["chapters"]["industrial"]
        c["people"]["good"][0]["who"] = " "
        c["duels"][0]["events"] = [""]
        errs = self.run_check(st, tx, pg)
        self.assertHas(errs, "people.good[0].who 없음")
        self.assertHas(errs, "duels[0].events")

    def test_why_must_be_list(self):
        st, tx, pg = good()
        tx["chapters"]["industrial"]["why"] = "네글자예"
        self.assertHas(self.run_check(st, tx, pg), "why는 4개")

    def test_bad_shapes_report_instead_of_crash(self):
        for mutate, sub in (
            (lambda st, c: c["people"].__setitem__("good", ["x"]), "people.good[0]"),
            (lambda st, c: c.__setitem__("words", [["가", "나", "다"]]), "words[0]"),
            (lambda st, c: ind(st).__setitem__("tp", "3"), "분기점 번호"),
        ):
            st, tx, pg = good()
            mutate(st, tx["chapters"]["industrial"])
            self.assertHas(self.run_check(st, tx, pg), sub)

    def test_unwritten_chapter_tp_checked(self):
        st, tx, pg = good()
        st["chapters"][0]["tp"] = 99
        self.assertHas(self.run_check(st, tx, pg), "premodern: 분기점 번호 99 없음")


class CliTest(unittest.TestCase):
    def test_check_only_writes_nothing(self):
        import contextlib, io, tempfile
        with tempfile.TemporaryDirectory() as d, contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(build.main([d, "ko", "--check"]), 0)
            self.assertEqual(os.listdir(d), [])


PGK = build.load("ko.page.json")
NAMES = {"classical": "고전경제학·자본주의", "socialism": "초기 사회주의", "imperialism": "제국주의·사회진화론"}
BOXES = ["box-event", "box-shift", "box-people", "box-duel", "box-result"]


class RenderTest(unittest.TestCase):
    def render(self, mutate=None, inherit=None):
        st, tx, _ = good()
        ch, c = ind(st), tx["chapters"]["industrial"]
        if mutate:
            mutate(ch, c)
        return build.render_chapter(ch, c, inherit, PGK, NAMES)

    def test_chain_order(self):
        h = self.render()
        pos = [h.index(f'class="box {b}"') for b in BOXES]
        self.assertEqual(pos, sorted(pos))

    def test_four_arrows_with_reasons(self):
        def one_duel(ch, c):
            ch["duels"].pop(); c["duels"].pop()
        h = self.render(one_duel)
        self.assertEqual(h.count('class="reason"'), 4)
        for w in CHAPTER["why"]:
            self.assertIn(w, h)

    def test_part_arrow_shows_others(self):
        def m(ch, c):
            ch["arrows"][0] = "part"; c["whyOthers"][0] = "흉년도 있었어요."
        h = self.render(m)
        self.assertIn('class="arrow part"', h)
        self.assertIn("흉년도 있었어요.", h)

    def test_sure_arrow_has_no_others(self):
        def m(ch, c):
            ch["next"] = "sure"
            for d in ch["duels"]:
                d["grade"] = "sure"
        h = self.render(m)
        self.assertEqual(h.count('class="others"'), 0)
        self.assertNotIn('class="arrow part"', h)

    def test_third_arrow_says_but(self):
        import re
        words = re.findall(r'<div class="arrow (?:sure|part)"><b>(.*?)</b>', self.render())
        self.assertEqual(words, ["그래서", "그래서", "그런데", "그래서"])

    def sides(self, h):
        import re
        return re.findall(r'<div class="side">(.*?)</div>', h, re.S)

    def test_ism_link(self):
        s = self.sides(self.render())[0]
        self.assertIn('href="../ism/#ism-classical"', s)
        self.assertIn("고전경제학·자본주의", s)

    def test_easy_name_overrides(self):
        def m(ch, c):
            c["duels"][0]["aName"] = "자본주의"
        s = self.sides(self.render(m))[0]
        self.assertIn(">자본주의</a>", s)
        self.assertNotIn("고전경제학", s)

    def test_null_ism_has_no_link(self):
        s = self.sides(self.render())
        self.assertEqual(len(s), 4)
        self.assertNotIn('class="ism"', s[3])
        self.assertIn("<q>여기는 남의 땅이 아니에요</q>", s[3])

    def test_people_show_who(self):
        h = self.render()
        for side in ("good", "bad"):
            for r in CHAPTER["people"][side]:
                self.assertIn(r["who"], h)
                self.assertIn(r["text"], h)

    def test_no_inherit_box_without_prev(self):
        self.assertNotIn("앞에서 넘겨받은 것", self.render())
        h = self.render(inherit="앞 장이 넘겨준 말이에요.")
        self.assertIn("앞에서 넘겨받은 것", h)
        self.assertIn("앞 장이 넘겨준 말이에요.", h)

    def test_inherit_parallel_is_not_a_cause(self):
        h = build.render_chapter(*self.args(), pg=PGK, names=NAMES, inherit="같은 때 벌어진 일이에요.", inherit_kind="parallel")
        self.assertIn("같은 때 다른 곳에서", h)
        self.assertNotIn("앞에서 넘겨받은 것", h)

    def test_inherit_part_shows_others(self):
        h = build.render_chapter(*self.args(), pg=PGK, names=NAMES, inherit="넘겨준 말이에요.", inherit_kind="part",
                                 inherit_others="다른 까닭도 있었어요.")
        self.assertIn('class="inherit part"', h)
        self.assertIn("다른 까닭도 있었어요.", h)

    def args(self):
        st, tx, _ = good()
        return ind(st), tx["chapters"]["industrial"]

    def test_escapes_text(self):
        def m(ch, c):
            c["event"] = '<b>1 & 2 "셋"</b>'
        h = self.render(m)
        self.assertIn("&lt;b&gt;1 &amp; 2 &quot;셋&quot;&lt;/b&gt;", h)
        self.assertNotIn("<b>1 &", h)

    def test_rail_marks_unwritten(self):
        names = ["근대 이전", "과학혁명", "프랑스혁명", "산업혁명", "세계대전", "냉전", "디지털", "AI"]
        h = build.render_rail(STRUCT, {"industrial"}, names)
        self.assertEqual(h.count('href="#industrial"'), 1)
        self.assertEqual(h.count('class="off"'), 7)


class PageTest(unittest.TestCase):
    ISM_TXT = build.load_ism("ko.json")

    def page(self, st, tx):
        return build.render_page("ko", st, tx, PGK, self.ISM_TXT, "<x>{{css}}{{chapters}}{{rail}}</x>", "", ["ko"])[0]

    def test_null_previous_chapter_does_not_crash(self):
        st, tx, _ = good()
        tx["chapters"]["french"] = None
        h = self.page(st, tx)
        self.assertIn('id="industrial"', h)
        self.assertNotIn("앞에서 넘겨받은 것", h)

    def test_inherit_carries_previous_link_kind(self):
        st, tx, _ = good()
        st["chapters"][2].update(arrows=["sure"] * 3, duels=[{"a": None, "b": None, "grade": "sure"}], next="parallel")
        prev = copy.deepcopy(CHAPTER)
        prev["duels"] = prev["duels"][:1]
        prev["next"] = "먼저 시작된 일이에요."
        tx["chapters"]["french"] = prev
        h = self.page(st, tx)
        ind_html = h[h.index('id="industrial"'):]
        self.assertIn("먼저 시작된 일이에요.", ind_html)
        self.assertIn('class="inherit parallel"', ind_html)


if __name__ == "__main__":
    unittest.main()
