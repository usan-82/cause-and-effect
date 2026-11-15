"""그림 지시문(epNN.prompts.md)을 만든다.

시대 블록과 인물 블록을 한곳에 두고 모든 지시문에 끼워 넣는다. 그리고 검사(lint)를 돌려,
시대 블록이 빠졌거나 인물·시대를 이름 없이 뭉뚱그린 지시문이 있으면 파일을 쓰지 않고 멈춘다.

    python3 build.py        # ../ep01.prompts.md, ../ep02.prompts.md 를 다시 쓴다
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)

STYLE = ("Flat vector-style illustration with large areas of solid color, no gradients, no texture, no grain, "
         "no brush strokes. Limited palette: deep indigo, vermilion red, ochre, teal, off-white and charcoal. "
         "Simple shapes, thin clean outlines, simplified faces with minimal features. Not photorealistic.")
TAIL = ("No text, letters, numbers, captions or watermark anywhere in the image. Wide landscape image, 16:9. "
        "Keep the main subject inside the central 60% of the frame.")

# ---- 시대 블록: 긍정(무엇을 그릴지) + 부정(무엇과 헷갈리면 안 되는지) ----
MING = ("Setting: early Ming dynasty China, early 15th century. Use only Ming dynasty dress and buildings. "
        "Do not use Qing dynasty (Manchu, after 1644) conventions: no shaved forehead with a braided queue, "
        "no official hats with a top knob or peacock feather, no horse-hoof shaped cuffs, no court bead necklaces.")
PORT = ("Setting: Portugal in the 1490s. Use only late 15th-century Iberian dress, ships and buildings. "
        "No later fashions: no ruff collars, no wide feathered hats, no puffed breeches; "
        "no galleons with rows of gun ports, no ship's wheel.")
KERALA = ("Setting: Calicut on the Malabar coast of India in 1498, before the Mughal era. "
          "No Mughal-style domes, onion arches or costumes, no stone quays, no European forts.")
LANKA = "Setting: the coast of Sri Lanka around 1410."
SEA = "Setting: the open ocean in the late 15th century."

# ---- 인물 블록 (근거: research/05의 V·D 항목) ----
ZH_SHEET = ("An imagined likeness of Zheng He, a palace eunuch who served the Yongle Emperor of the Ming dynasty "
            "and rose to be a grand eunuch (taijian), director of a palace directorate. He came from a Hui Muslim "
            "family in Yunnan whose ancestors had come from Central Asia (Bukhara) under the Yuan dynasty; give him "
            "features that could suit mixed Central Asian and Chinese ancestry, without caricature. About 35 years "
            "old, beardless clean face, calm steady expression. He wears an early Ming eunuch's dress: a small black "
            "gauze cap with two short curved wings at the back with gold-painted details (not the long straight "
            "wings of civil officials), a long round-collared robe with narrow sleeves in vermilion red with a "
            "floral panel on the chest, a loose black horn hoop belt, and black boots with red uppers. No dragon "
            "motifs, no bird badge, no armor.")
ZH = ("Zheng He from the reference image (beardless, small black gauze cap with short curved wings, "
      "narrow-sleeved round-collared vermilion robe with a floral chest panel, black hoop belt)")
VG_SHEET = ("An imagined likeness of Vasco da Gama, a Portuguese nobleman and sea captain, in 1497: about 30 years "
            "old, short trimmed dark beard, stern expression. He wears a fitted dark doublet and hose, a "
            "knee-length jerkin, a short cape, and a soft round bonnet with an upturned brim, with a sword at his "
            "hip. No cross emblem on his clothes, no armor, not an old man.")
VG = ("Vasco da Gama from the reference image (about 30, short trimmed dark beard, dark doublet, short cape, "
      "soft round bonnet)")
OFF = ("Ming civil officials in black gauze hats with two stiff horizontal wings and wide-sleeved round-collared "
       "robes in red and indigo with large square badges on the chest and hoop belts")
EUNUCH = ("a Ming palace eunuch in a small black gauze cap with short curved wings and a narrow-sleeved "
          "round-collared robe with a floral chest panel")
YONGLE = ("the Yongle Emperor (Zhu Di), third emperor of the Ming dynasty, newly enthroned, seated on a dragon "
          "throne in a court robe embroidered with dragon roundels; he is small, far away and in shadow so his "
          "face cannot be seen")
PRINCE_YAN = ("Zhu Di, Prince of Yan (the future Yongle Emperor of the Ming dynasty), seen only from behind in a "
              "long red round-collared robe")
MANUEL = "King Manuel I of Portugal, seen only from behind so his face is not visible"
JUNK = ("early Ming ocean-going junks: deep wooden hulls with a flat blunt bow and a high stern, three to five "
        "slightly tilted masts, tan matting sails stiffened by horizontal bamboo battens, plain colored pennants "
        "without emblems")
NAU = ("small three-masted Portuguese ships of the 1490s, broad and tubby, with square white sails on the front "
       "and middle masts each bearing a red cross with flared arms, a triangular sail on the rear mast, raised "
       "castles at bow and stern, dark hulls")
PT_HALL = "a plain stone hall in the Portuguese royal palace with a wooden ceiling and tall narrow windows"
PT_COURT = ("Portuguese noblemen in 1490s dress: long dark gowns or knee-length jerkins over fitted doublets, soft "
            "round bonnets with upturned brims")

# (제목, 참고 이미지, 메모, [시대 블록], 본문, 근거, 검수)
EP01 = [
 ("설정화 A — 정화", "없음", "가장 먼저 뽑는다. 승인한 그림을 정화가 나오는 모든 컷에 참고 이미지로 올린다. 2번 컷은 이 그림의 정면을 잘라 쓴다.",
  [MING], "Character reference sheet on a plain off-white background showing the same man three times: front view, side view, full-body view. " + ZH_SHEET + " Same face, clothes and proportions in all three views.",
  "V1 V2 V4 · A1 · D28 · D33", "청나라식(변발, 구슬 달린 모자)이 아닌가 · 모자의 뿔이 짧고 굽었는가 · 수염이 없는가 · 얼굴이 특정 민족을 과장해 그리지 않았는가"),
 ("컷 4 — 윈난의 소년", "없음", "정화의 어린 시절이라 설정화를 올리지 않는다.",
  [MING], "A lakeside village in the mountains of Yunnan in southwest China, 1381. Chinese-style timber houses with tiled roofs and a small courtyard mosque that looks like a local temple hall, with no dome. In the foreground a boy of about ten from a Hui Muslim family of Central Asian descent, in simple plain clothes, looks back over his shoulder toward the village. Far away on a road, a column of Ming soldiers with spears and plain banners is shown only as tiny dark silhouettes. No minarets, no desert, no camels.",
  "V16 · A1 · D33", "돔이나 첨탑, 사막이 없는가 · 병사가 자세히 그려지지 않았는가"),
 ("컷 5 — 내전의 밤", "설정화 A", "젊은 정화. 옷 색만 다르다.",
  [MING], "A night military camp in northern China, 1399. Under a hanging lantern beside a plain tent, a young man of about 28, a younger version of Zheng He in the reference image (beardless, small black gauze cap with short curved wings, narrow-sleeved round-collared robe, here in dark indigo), kneels on one knee before " + PRINCE_YAN + ". Far in the background, soldiers appear only as tiny dark silhouettes with spears and plain banners. No detailed armor, no dragons.",
  "V2 V16 · D2", "청나라식 옷이 없는가 · 병사가 자세히 그려지지 않았는가 · 왕자의 얼굴이 보이지 않는가"),
 ("컷 6 — 새 황제", "없음", "황제의 얼굴은 그리지 않는다.",
  [MING], "Interior of a large palace hall in Nanjing, the Ming capital, in 1402: a timber hall on a stone terrace with red columns and a sweeping tiled roof seen through the open doors. Far away on a raised platform sits " + YONGLE + ". In the foreground rows of " + OFF + " kneel and bow. No large gate towers, no yellow dragon flags.",
  "V3 V7 · D1", "청나라식 옷(변발, 구슬 달린 모자, 말굽 소매)이 없는가 · 황제의 얼굴이 보이지 않는가 · 자금성의 큰 문루가 없는가"),
 ("컷 8 — 함대를 맡기다", "설정화 A", "황제는 옷자락만 보인다.",
  [MING], "At the foot of wide stone palace steps in Nanjing, " + ZH + " kneels and receives a plain rolled scroll with both hands. Above him on the steps only the lower hem of the Yongle Emperor's robe is visible; his body and face are out of the frame. A few " + OFF + " stand to the sides. The scroll shows no readable writing.",
  "V2 V3 V7 · D3", "황제의 얼굴이나 몸이 보이지 않는가 · 두루마리에 글자가 없는가 · 청나라식 옷이 없는가"),
 ("컷 11 — 1405년 출항 ▶", "설정화 A", "뒷모습이라 얼굴은 보이지 않는다.",
  [MING], "Wide shot from behind " + ZH + ", who stands at the bow of a large wooden ship; we do not see his face. Ahead of him a broad river mouth is crowded with " + JUNK + ", raising their sails. Sailors are small figures on the decks. Misty dawn.",
  "V5 V6", "깃발에 글자나 문양이 없는가 · 유럽식 배가 없는가"),
 ("컷 14 — 스리랑카의 비석", "설정화 A", "비석의 모양과 스리랑카 사람들의 옷은 조사하지 않았다. 멀리 작게 그린다.",
  [LANKA, MING], "A small coastal temple in Sri Lanka. In front of it stands an upright carved stone tablet with a rounded top. Its surface shows three separate blocks of carved inscription drawn only as abstract rows of small marks, not real or readable script. " + ZH + " stands beside the tablet with a few attendants. A few local people watch from a distance. Palm trees and a calm sea behind.",
  "A7", "비석에 읽을 수 있는 글자가 생기지 않았는가 · 세 덩어리의 글이 서로 다른 모양인가"),
 ("컷 15 — 기린", "없음", "",
  [MING], "A palace courtyard in Ming China, 1415. A tall real giraffe in profile is led by a single plainly dressed foreign groom holding a rope tied to the giraffe's head. Facing them, a row of " + OFF + " bow in congratulation. Behind them a timber hall on a stone terrace with red columns and a tiled roof. The giraffe is an ordinary giraffe, not a mythical creature.",
  "V3 V8 · A6", "기린이 전설 속 동물로 바뀌지 않았는가 · 끄는 사람이 한 명인가 · 청나라식 옷이 없는가"),
 ("컷 16 — 후추 창고", "없음", "",
  [MING], "Inside a Ming palace storehouse in the 1420s: timber pillars and a dim tiled roof. Stacks of sacks of black pepper and bundles of reddish logs fill the room. " + EUNUCH[0].upper() + EUNUCH[1:] + " stands guard holding a closed ledger. Two " + OFF + " carry sacks away toward the bright doorway. No readable writing anywhere.",
  "V2 V3 · D5 D6", "환관과 관리의 모자가 서로 다른가 · 글자가 없는가 · 청나라식 옷이 없는가"),
 ("컷 17 — 밤의 항구", "없음", "사람을 그리지 않는다.",
  [MING], "A harbor in Southeast Asia at night, 1407, seen from far away across dark water. In the distance several small ships burn with tall flames reflected on the water. In the middle distance large Ming Chinese junks with battened sails stand as dark silhouettes. Palm-lined shore. No people visible anywhere.",
  "V5 · A5", "사람이 보이지 않는가"),
 ("컷 18 — 비용을 걱정한 신하들", "없음", "",
  [MING], "A covered walkway in a Ming palace in the 1420s. Three " + OFF + " stand around a long account scroll unrolled on a low table, frowning and pointing at it with worried faces. The scroll shows only plain wavy lines, no readable characters. Red columns and a tiled roof.",
  "V3 · A9", "두루마리에 글자가 없는가 · 관리의 모자가 길고 곧은 날개인가 · 청나라식 옷이 없는가"),
 ("컷 19 — 빈 옥좌", "없음", "황제는 그리지 않는다.",
  [MING], "Interior of a Ming palace hall, 1424, after the death of the Yongle Emperor. On a raised platform in the background stands a large empty wooden throne, dim and in shadow. In the foreground a Ming court official in a black gauze hat with two stiff horizontal wings and a wide-sleeved indigo robe kneels at a low table, writing on a long paper scroll with a brush. The scroll shows only plain wavy lines, no readable characters. Red columns.",
  "V3 · A8", "두루마리에 글자가 없는가 · 옥좌가 비어 있는가 · 청나라식 옷이 없는가"),
 ("컷 20 — 조용한 조선소 ▶", "없음", "상상한 장면이다.",
  [MING], "A riverside shipyard on the Yangzi near Nanjing, some years after 1433. Long narrow water-filled building basins lie side by side. Beside one of them stand the bare wooden ribs of an unfinished ship hull, with grass and weeds growing through it. Stacks of weathered logs, empty timber scaffolding. No workers. A city wall far in the distance. Quiet overcast light. No tall pagoda.",
  "V7", "높은 탑이나 현대식 크레인이 없는가"),
]
EP02 = [
 ("설정화 B — 바스쿠 다 가마", "없음", "가장 먼저 뽑는다. 승인한 그림을 다 가마가 나오는 모든 컷에 참고 이미지로 올린다. 2번 컷은 이 그림의 정면을 잘라 쓴다.",
  [PORT], "Character reference sheet on a plain off-white background showing the same man three times: front view, side view, full-body view. " + VG_SHEET + " Same face, clothes and proportions in all three views.",
  "V9 V10 V17", "노인이 아닌가 · 옷에 십자가가 없는가 · 주름 깃(러프)이나 깃털 모자가 없는가"),
 ("컷 3 — 큰 함대와 작은 배", "없음", "화면이 둘로 나뉜다.",
  [MING, PORT], "Split composition divided by a thin vertical line, both halves seen from high above the sea in the same morning light. Left half: a vast fleet of " + JUNK + ", filling the sea to the horizon. Right half: only four " + NAU + ", alone on a wide empty ocean. The contrast in number is the point of the image. The Chinese ships are larger than the Portuguese ships but not gigantic.",
  "V5 V11", "중국 배에 유럽식 돛이 섞이지 않았는가 · 중국 배가 터무니없이 크지 않은가 · 돛대가 다섯을 넘지 않는가"),
 ("컷 9 — 왕과 신하들", "없음", "왕의 얼굴은 그리지 않는다(마누엘 1세의 모습은 조사하지 않았다).",
  [PORT], "Inside " + PT_HALL + ", 1495. " + MANUEL[0].upper() + MANUEL[1:] + ", sits in a high-backed wooden chair. Around him stand a few " + PT_COURT + ". Two of them shake their heads and raise their hands as if objecting; the others listen. No crowns on the advisers.",
  "V17 · D11", "왕의 얼굴이 보이지 않는가 · 16세기 후반 옷이 없는가"),
 ("컷 13 — 깃발을 받다", "설정화 B", "",
  [PORT], "Inside " + PT_HALL + ", 1497. " + VG + " kneels on one knee and receives from " + MANUEL + " a silk banner: white with a red cross with flared arms in the center. A few " + PT_COURT + " watch. He is not an old man and wears no cross emblem on his clothes.",
  "V10 V17", "십자가가 깃발에만 있고 옷에는 없는가 · 다 가마가 설정화와 같은가"),
 ("컷 16 — 리스본 출항", "없음", "",
  [PORT], "A sandy beach on a wide river below Lisbon, July 1497. A small plain whitewashed chapel stands on the shore. A small crowd of townspeople and a few priests watch from the sand; some cover their faces and weep. On the river four " + NAU + " lie at anchor, and rowing boats carry men out to them. No stone tower, no large monastery, no bridge.",
  "V11 V15 · D17", "벨렝탑이나 큰 수도원이 없는가 · 배가 네 척인가"),
 ("컷 18 — 초라한 선물", "설정화 B", "",
  [KERALA, PORT], "Inside a simple lodging room in Calicut, 1498, warm daylight through a doorway. Laid out on a cloth on the floor are modest gifts: rolls of striped cloth, four red hoods, six hats, strings of red coral, a few brass wash basins, a box of sugar, and small casks of oil and honey. Beside them stands " + VG + ", stiff and uneasy. Facing him two men look at the gifts and laugh: a Muslim merchant-official in a long robe and turban with a full beard, and a Malabar official who is bare-chested with a white cotton cloth from waist to knee and gold earrings. The gifts look plain, not rich.",
  "V13 · B3", "선물이 화려하지 않은가 · 웃는 사람들이 우스꽝스럽게 그려지지 않았는가 · 다 가마가 설정화와 같은가"),
 ("컷 19 — 캘리컷 바닷가", "없음", "",
  [KERALA], "The open sandy shore of Calicut, 1498. There is no quay or harbor wall: single-masted wooden trading boats with planks sewn together by rope are hauled up on the beach among coconut palms. Merchants of several origins talk and trade in the foreground: Arab and Gujarati merchants in long robes and turbans or small round caps with full beards, and local Malabar men bare-chested in white waist-cloths with gold earrings. Low palm-thatched houses and one stone building with a steep tiled roof behind. Sacks and baskets of pepper. No European or East Asian ships.",
  "V13 V14", "무굴풍 돔이나 큰 터번이 없는가 · 어느 한쪽이 낮춰 보이게 그려지지 않았는가"),
 ("컷 20 — 돌아가는 배", "설정화 B", "",
  [SEA, PORT], "The deck of a small Portuguese ship at sea, 1499, seen from the stern. The deck is nearly empty: only three thin tired sailors handle the ropes. Sacks and bundles of spices are stacked by the mast. " + VG + ", now with a longer untrimmed beard, stands at the rail looking ahead. Above them a square white sail bearing a red cross with flared arms. Grey sea, low sun.",
  "V10 V11 · D18", "갑판에 사람이 적은가 · 조타륜이 없는가"),
 ("컷 22 — 상을 받다", "설정화 B", "왕의 얼굴은 그리지 않는다.",
  [PORT], "Inside " + PT_HALL + ", 1502. " + VG + ", now with a longer beard, bows slightly as he receives a folded parchment document with a hanging wax seal from " + MANUEL + ". A few " + PT_COURT + " look on. He is not an old man and wears no cross emblem on his clothes. No readable writing on the document.",
  "V10 V17 · D19", "옷에 십자가가 없는가 · 문서에 글자가 없는가"),
 ("컷 23 — 1502년 ▶", "없음", "확정한 수위: 멀리서 본 연기만, 사람은 그리지 않는다.",
  [KERALA, PORT], "Seen from a palm-lined beach near Calicut, 1502. Far out at sea lies a fleet of more than ten " + NAU + "; small white puffs of smoke rise from guns on their decks. Much farther away a single ship burns, a tall column of dark smoke rising into the sky. The beach in the foreground is empty. No people visible anywhere, on shore, on the ships or in the water.",
  "V11 V12 · B6", "사람이 전혀 보이지 않는가 · 배 옆구리에 포문이 줄지어 있지 않은가"),
 ("컷 27 — 두 사람의 뒷모습", "설정화 A(1편), 설정화 B", "두 설정화를 함께 올린다. 설정화 A는 1편에서 뽑은 것을 쓴다.",
  [MING, PORT], "Two men seen from behind, standing apart on a wide empty plain at dusk, each facing away from us toward a faint pale building far on the horizon. On the left, " + ZH + " faces a distant Ming Chinese palace hall with a sweeping tiled roof. On the right, " + VG + " faces a distant Portuguese hilltop castle. The two buildings are small, pale and hazy. We do not see either man's face.",
  "V2 V10", "두 사람의 옷이 설정화와 같은가 · 건물이 흐릿하고 작은가"),
]

# ---- 검사: 이번에 나온 오류(청나라식 복색, 인물·시대를 뭉뚱그림)가 다시 들어가지 않게 ----
CHINA_WORDS = r"\b(Ming|Chinese|China|Nanjing|Yunnan|junk|eunuch|emperor|Zheng He)\b"
PORT_WORDS = r"\b(Portuguese|Portugal|Lisbon|Vasco da Gama|King Manuel)\b"
INDIA_WORDS = r"\b(Calicut|Malabar)\b"

def lint(ep, items):
    errs = []
    for title, ref, note, blocks, body, src, chk in items:
        text = " ".join(blocks) + " " + body
        if re.search(CHINA_WORDS, body) and MING not in blocks:
            errs.append(f"{ep} {title}: 중국 장면인데 명나라 시대 블록이 없다")
        if re.search(PORT_WORDS, body) and PORT not in blocks:
            errs.append(f"{ep} {title}: 포르투갈 장면인데 포르투갈 시대 블록이 없다")
        if re.search(INDIA_WORDS, body) and KERALA not in blocks:
            errs.append(f"{ep} {title}: 캘리컷 장면인데 캘리컷 시대 블록이 없다")
        if re.search(r"\b(a|the) (newly enthroned )?emperor\b", body, re.I) and "Yongle" not in body:
            errs.append(f"{ep} {title}: 황제를 이름 없이 썼다")
        if re.search(r"\bking\b", body) and "Manuel" not in body and "Calicut" not in body:
            errs.append(f"{ep} {title}: 왕을 이름 없이 썼다")
        if re.search(r"\bChinese, about\b|\bChinese court official\b", body):
            errs.append(f"{ep} {title}: 인물을 'Chinese'로만 뭉뚱그렸다")
        if "Qing" in body:
            errs.append(f"{ep} {title}: 본문에 청나라를 넣지 말고 시대 블록의 부정 조건에 맡긴다")
    return errs

def write(ep, items, sheet, maps, cards):
    n = len(items)
    head = f"""# {ep}편 그림 지시문

상태: 2026-11-15 그림 검토(청나라식 복색, 정화의 출신) 반영. 이 파일은 [`prompts/build.py`](prompts/build.py)가 만든다. 직접 고치지 말고 `build.py`를 고친 뒤 다시 만든다. 컷 번호는 [`ep{ep:02d}.md`](ep{ep:02d}.md)를 따른다. 새로 뽑을 그림은 {n}장이다(설정화 1 + 컷 {n-1}).

## 쓰는 법

1. **설정화 {sheet}를 먼저 뽑는다.** 각 항목 아래 회색 상자의 글을 통째로 복사해 그림 도구(ChatGPT, 제미나이 등)에 붙여 넣는다. 상자 오른쪽 위의 복사 단추를 누르면 한 번에 복사된다. 상자 안의 글은 "Flat vector-style illustration"으로 시작해 "central 60% of the frame."으로 끝난다. 그림체, 시대 조건, 공통 조건이 이미 들어 있으니 다른 말을 덧붙이지 않아도 된다.
2. 마음에 들 때까지 다시 뽑고, 고른 한 장을 저장한다. 세로나 정사각형으로 나오면 "가로로 긴 그림으로 다시 그려 줘"라고 한 번 더 요청한다.
3. 같은 대화창에서 여러 장을 이어 뽑으면 앞 그림의 잘못(예: 청나라식 옷)이 다음 그림으로 옮겨 갈 수 있다. 시대가 틀린 그림이 한 번 나왔으면 새 대화창에서 다시 뽑는다.
4. 컷 지시문을 차례로 뽑는다. "참고 이미지"에 설정화가 적힌 컷은 그 그림 파일을 먼저 올린 뒤 지시문을 붙여 넣는다.
5. 파일 이름은 `ep{ep:02d}_sheet{sheet}.png`, `ep{ep:02d}_c03.png`처럼 컷 번호를 두 자리로 적는다.
6. 뽑은 그림은 GitHub의 `hegemony-video-assets` 브랜치에 `_src/hegemony/video/assets/ep{ep:02d}/` 폴더로 올린다(Add file → Upload files). 시대가 틀리게 나온 그림도 올려 주면 원인을 찾는 데 쓴다.

## 알아 둘 것

- 모든 지시문에 장면의 **시대 조건**(명나라 초, 1490년대 포르투갈, 1498년 캘리컷)이 들어 있다. 중국 장면에는 청나라식(변발, 구슬 달린 모자, 말굽 소매, 조주)을 쓰지 말라는 조건이 붙는다.
- 인물은 이름과 시대로 지칭한다(영락제는 명나라 3대 황제, 정화는 색목인 후손인 회족 무슬림 출신 태감). 얼굴은 상상이다. 영락제와 마누엘 1세는 얼굴을 그리지 않는다.
- 고증은 글 자료만으로 했다. 당시의 그림은 직접 보지 못했다. 근거 번호는 [`research/05-패권-영상-근거.md`](../../../research/05-패권-영상-근거.md)의 항목이다.
- `▶`가 붙은 컷은 나중에 돈을 써서 움직임을 더한다면 먼저 할 컷이다. 지금은 정지 그림만 뽑는다.
- 지도 컷({maps})과 카드 컷({cards})은 이 세션에서 만든다. 인물 소개 컷(2)은 설정화를 잘라 쓴다.
"""
    out = [head]
    for title, ref, note, blocks, body, src, chk in items:
        out.append(f"## {title}\n")
        out.append(f"- 참고 이미지: {ref}")
        if note: out.append(f"- {note}")
        out.append(f"- 근거: {src}")
        out.append(f"- 검수할 때 볼 것: {chk}\n")
        out.append("```\n" + " ".join([STYLE] + blocks + [body, TAIL]) + "\n```\n")
    out.append("""## 모든 그림에서 볼 것

- 시대가 맞는가: 중국 장면에 청나라식 옷(변발, 구슬 달린 모자, 말굽 소매, 조주)이 없는가, 포르투갈 장면에 16세기 후반 옷이 없는가, 캘리컷 장면에 무굴풍 건물이 없는가
- 화면에 글자나 글자 비슷한 무늬가 생기지 않았는가
- 질감이나 그러데이션이 들어가지 않았는가 (영상 용량이 커진다)
- 한쪽을 우스꽝스럽거나 야만스럽게 그리지 않았는가, 얼굴을 특정 민족의 고정관념으로 과장하지 않았는가
""")
    s = "\n".join(out)
    assert "{{" not in s
    open(os.path.join(OUT, f"ep{ep:02d}.prompts.md"), "w").write(s)

def selftest():
    """2026-11-15에 실제로 나온 오류를 검사가 잡는지 확인한다."""
    old = [
        ("옛 설정화 A", "", "", [], "An imagined likeness of an early Ming dynasty palace eunuch and fleet commander around 1405: Chinese, about 35 years old.", "", ""),
        ("옛 컷 6", "", "", [], "Interior of a large Ming palace hall in Nanjing, 1402. Far away on a raised platform a newly enthroned emperor sits.", "", ""),
    ]
    errs = lint("selftest", old)
    assert any("명나라 시대 블록" in e and "옛 설정화 A" in e for e in errs), errs
    assert any("'Chinese'" in e for e in errs), errs
    assert any("황제를 이름 없이" in e for e in errs), errs
    assert any("명나라 시대 블록" in e and "옛 컷 6" in e for e in errs), errs

if __name__ == "__main__":
    selftest()
    errs = lint("1편", EP01) + lint("2편", EP02)
    if errs:
        print("\n".join(errs)); sys.exit(1)
    write(1, EP01, "A", "1, 13, 23", "3, 7, 9, 10, 12, 21, 22, 밝힘")
    write(2, EP02, "B", "1, 5, 7, 8, 12, 17, 21, 24, 28", "4, 6, 10, 11, 14, 15, 25, 26, 밝힘")
    print("ok", len(EP01), len(EP02))
