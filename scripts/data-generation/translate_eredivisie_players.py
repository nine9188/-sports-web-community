#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
에레디비지에 선수 이름 한글 번역 스크립트
"""

import re
import sys

# 한글 번역 매핑 (축구 선수 이름 표준 발음)
PLAYER_TRANSLATIONS = {
    # Ajax (Team ID: 194)
    "Matheus": "마테우스",
    "Vítězslav Jaroš": "비테즐라프 야로시",
    "C. Setford": "찰리 셋포드",
    "Joeri Jesse Heerkens": "요에리 예세 헤르켄스",
    "G. Rulli": "헤로니모 룰리",
    "R. Pasveer": "렘코 파스페르",
    "D. Ramaj": "디오니시스 라마이",
    "P. Reverson": "파울루 레베르손",
    "D. Rensch": "데빗 렌시",
    "Lucas Rosa": "루카스 호사",
    "A. Gaaei": "안톤 가에이",
    "J. Hato": "요리엘 하토",
    "Ko Itakura": "이타쿠라 코",
    "J. Medić": "요시프 메디치",
    "O. Wijndal": "오웬 베인달",
    "Y. Baas": "요프 바스",
    "B. Sosa": "보르나 소사",
    "D. Rugani": "다니엘레 루가니",
    "J. Mokio": "제이 모키오",
    "L. Jetten": "라이언 예텐",
    "A. Bouwman": "아리 바우만",
    "G. Ávila": "가스톤 아빌라",
    "J. Šutalo": "요시프 슈탈로",
    "J. Henderson": "조던 헨더슨",
    "B. Tahirović": "벤자민 타히로비치",
    "K. Taylor": "케네스 테일러",
    "Oscar Gloukh": "오스카르 글루크",
    "James McConnell": "제임스 맥코넬",
    "D. Klaassen": "다비 클라센",
    "B. van den Boomen": "브랑코 판 덴 보먼",
    "K. Fitz-Jim": "크리스티안 핏츠-짐",
    "Sean Steur": "숀 스퇴르",
    "Raul Moro Prescoli": "라울 모로 프레스콜리",
    "B. Brobbey": "브라이언 브로베이",
    "Carlos Forbs": "카를루스 포르브스",
    "Kasper Dolberg Rasmussen": "카스퍼 돌베르그",
    "M. Godts": "밀란 고츠",
    "C. Akpom": "치바 아크폼",
    "O. Edvardsen": "오슬로 에드바르센",
    "Don-Angelo Christoffel Annum-Assamoah Konadu": "돈-안젤로 코나두",
    "B. Traoré": "베르트랑 트라오레",
    "Julian Dean Rijkhoff": "율리안 딘 라이크호프",
    "S. Berghuis": "스티븐 베르하위스",
    "W. Weghorst": "바우트 베흐호르스트",
    "Gaku Nawata": "나와타 가쿠",
    "C. Rasmussen": "크리스티안 라스무센",
    "J. Banel": "제이든 바넬",
    "S. Bergwijn": "스티븐 베르흐베인",
    "Rayane Bounida": "라얀 부니다",

    # AZ Alkmaar (Team ID: 201)
    "R. Owusu-Oduro": "롬-메일론 오우수-오두로",
    "H. Verhulst": "후프 페르훌스트",
    "T. Kuijsten": "티스 카위스턴",
    "D. Deen": "다닐 덴",
    "J. Zoet": "예런 조이트",
    "W. Goes": "볼프 호스",
    "M. Dekker": "막심 데커",
    "Alexandre Penetra": "알렉상드르 페네트라",
    "Mateo Chávez García": "마테오 차베스 가르시아",
    "S. Maikuma": "마이쿠마 세이야",
    "D. Møller Wolfe": "다비드 뫼얼러 볼페",
    "E. Dijkstra": "언 데이크스트라",
    "Billy van Duijl": "빌리 판 다일",
    "D. Kasius": "데니스 카시우스",
    "M. de Wit": "마텐 더 비트",
    "E. Mastoras": "에르네스토 마스토라스",
    "P. Koopmeiners": "페어 쿱메이너르스",
    "J. Clasie": "요르디 클라시",
    "S. Mijnans": "사니 메이난스",
    "J. Oerip": "저스틴 외립",
    "D. Kwakman": "다비드 크바크만",
    "K. Smit": "크리스티안 스미트",
    "K. Boogaard": "케스 보가르트",
    "E. Poku": "어니스트 포쿠",
    "Weslley Pinto Batista": "베슬리 핀투 바티스타",
    "T. Parrott": "트로이 패럿",
    "I. Sadiq": "우마르 사디크",
    "Isak Steiner Jensen": "이사크 슈타이너 옌센",
    "J. Addai": "제이든 아다이",
    "M. Lahdo": "마헤르 라흐도",
    "W. Bouziane": "와심 부지안",
    "R. van Bommel": "루벤 판 보멜",
    "D. de Wit": "데니 더 비트",
    "M. Meerdink": "메스 메이르딩크",
    "M. Stam": "막스 스탐",
    "L. Hoedemakers": "페어 회데마커르스",

    # Feyenoord (Team ID: 195)
    "T. Wellenreuther": "티몬 벨렌로이터",
    "J. Bijlow": "유스틴 베일로",
    "M. Nier": "미카일 니어",
    "I. Read": "이삭 레드",
    "B. Nieuwkoop": "바르트 니우코프",
    "G. Smal": "히스 스말",
    "T. Beelen": "토마스 벨런",
    "D. Hancko": "다비드 한츠코",
    "Gijs Smal": "하이스 스말",
    "H. Nadje": "후고 나제",
    "F. Redmond": "파쿤도 레드몬드",
    "J. Read": "제이콥 레드",
    "Josip Mitrović": "요시프 미트로비치",
    "D. Lotomba": "조던 로톰바",
    "Q. Timber": "킴 팀버",
    "G. Trauner": "그레고르 트라우너",
    "M. López": "마테오 로페스",
    "C. Stengs": "칼빈 스텡스",
    "Q. Hartman": "킴 하르트만",
    "L. Giménez": "산티아고 히메네스",
    "H. Zerrouki": "라미즈 제루키",
    "I. Hwang": "황인범",
    "A. Milambo": "안토니 밀람보",
    "Igor Paixão": "이고르 파이샹",
    "A. Hadj Moussa": "아니스 하즈 무사",
    "L. Ivanušec": "로브로 이바누셰츠",
    "Ayase Ueda": "우에다 아야세",
    "J. Carranza": "줄리안 카란사",
    "J. Giménez": "산티아고 히메네스",
    "A. Milambo": "안토니 밀람보",
    "F. Zechiël": "팔크 제키엘",
    "C. Ueda": "우에다 아야세",
    "A. Bullaude": "안데르 불라우데",
    "T. Beelen": "토마스 벨런",
    "A. Milambo": "안토니 밀람보",
    "Gjivai Zechiël": "히바이 제키엘",
    "Anis Hadj-Moussa": "아니스 하즈 무사",

    # PSV Eindhoven (Team ID: 202)
    "W. Benítez": "발터 베니테스",
    "J. Drommel": "요엘 드로멜",
    "N. Schiks": "니키 스키크스",
    "M. Huiberts": "마테 호이베르츠",
    "Matteo Dams": "마테오 담스",
    "R. Pepi": "리카르도 페피",
    "R. Flamingo": "라이언 플라밍호",
    "M. Bos": "마테 보스",
    "O. Boscagli": "올리비에 보스칼리",
    "A. Karsdorp": "릭 카르스도르프",
    "R. Ledezma": "리카르도 레데스마",
    "F. Oppegård": "프레드릭 오페고르",
    "M. Tillman": "말리크 틸만",
    "J. Bakayoko": "요한 바카요코",
    "I. Saibari": "이스마일 사이바리",
    "G. Til": "기소 틸",
    "J. Schouten": "헤레미 쇼우턴",
    "I. Babadi": "이사크 바바디",
    "N. Lang": "노아 랑",
    "J. Veerman": "요이 페이르만",
    "M. Kohn": "마티아스 콘",
    "C. Perisic": "이반 페리시치",
    "H. Lozano": "이르빙 로사노",
    "R. Thomas": "라이언 토마스",
    "L. de Jong": "뤼크 더 용",
    "Couhaib Driouech": "쿠아이브 드리우에크",
    "I. Dest": "세르히뇨 데스트",
    "E. Babadi": "에스마일 바바디",
    "Tygo Land": "타이고 란트",
    "Jason van Duiven": "야손 판 다위번",
    "Matteo Dams": "마테오 담스",
    "Edon Zhegrova": "에돈 제그로바",

    # FC Twente (Team ID: 200)
    "L. Unnerstall": "라르스 운네르스탈",
    "P. Tyton": "프셰미슬라프 티톤",
    "I. Dominguez": "이사크 도밍게스",
    "M. Hilgers": "막스 힐허르스",
    "A. Salah-Eddine": "아노우아르 살라에딘",
    "B. Ltaief": "바실 르타이에프",
    "M. van Rooij": "마르텐 판 로이",
    "S. Eiting": "샘 에이팅",
    "Y. Regeer": "욘 레헤이르",
    "M. Rots": "미헬 로츠",
    "S. Steijn": "셈 스테인",
    "D. van de Beek": "도니 판 더 벡",
    "M. Vlap": "미헬 플라프",
    "M. Sadilek": "미할 사딜레크",
    "A. Kjølø": "알렉스 철뢰",
    "Y. Taha": "요세프 타하",
    "Sem Steijn": "셈 스테인",
    "S. van Wolfswinkel": "리키 판 볼프스빙컬",
    "D. Rots": "다안 로츠",
    "N. Kuhn": "니콜라스 퀸",
    "A. El Kadiri": "아이먼 엘 카디리",
    "Y. Regeer": "욘 레헤이르",
    "G. Besselink": "헤리트 베설링크",
    "T. Oosterwolde": "토마스 오스테르볼더",
    "Mees Hilgers": "메이스 힐허르스",
    "Carel Eiting": "카렐 에이팅",
    "Mathias Kjølø": "마티아스 철뢰",
    "Sayfallah Ltaief": "사이팔라 르타이에프",

    # FC Utrecht (Team ID: 197)
    "V. Barkas": "바실리오스 바르카스",
    "M. Paes": "마테우스 파이스",
    "T. Horemans": "토미 호레만스",
    "M. Vidović": "마티아스 비도비치",
    "N. Viergever": "니콜라스 비르헤이버",
    "S. van der Maarel": "숀 판 더 마렐",
    "O. Fraulo": "오스카르 프라울로",
    "M. Cathline": "말론 카틀린",
    "C. Makenda": "크리스 마켄다",
    "Z. Aaronson": "피스톤 아론손",
    "P. Aaronson": "피스톤 아론손",
    "V. Jensen": "빅토르 옌센",
    "T. Booth": "테일러 부스",
    "S. Toornstra": "옌스 토른스트라",
    "O. El Azzouzi": "오타이 엘 아주지",
    "S. van de Streek": "심 판 더 스트레이크",
    "Y. Cathline": "욘 카틀린",
    "D. Min": "데이비드 민",
    "N. Ohio": "노아 오하이오",
    "R. Vloet": "라파엘 플루트",
    "M. Vesterlund": "미케 베스테를룬트",
    "A. Edvardsen": "아드리안 에드바르센",
    "J. Jensen": "요나스 옌센",
    "Hidde ter Avest": "히더 테르 아페스트",
    "Can Bozdogan": "잔 보즈도간",
    "Miguel Rodríguez": "미겔 로드리게스",
    "Kolbeinn Finnsson": "콜베인 핀손",

    # Go Ahead Eagles (Team ID: 206)
    "L. Meulensteen": "루크 믈런스틴",
    "M. Noppert": "안드리스 노페르트",
    "J. De Lange": "야이 더 랑허",
    "G. Nauber": "헤리트 나우버",
    "M. Adekanye": "보비 아데칸예",
    "O. Edvardsen": "올라 에드바르센",
    "E. Llansana": "에탄 란사나",
    "E. Lucassen": "언 뤼카선",
    "B. Deijl": "보이트 데일",
    "O. Antman": "올리버 안트만",
    "V. Edvardsen": "빅토르 에드바르센",
    "J. Tengstedt": "야코브 텡스테트",
    "M. Koenigsmann": "막스 쾨닉스만",
    "E. Aoulad": "엘리야스 아울라드",
    "J. Lidberg": "야콥 리드베리",
    "V. Rommens": "피터르 로멘스",
    "O. Velanas": "올리비에 벨라나스",
    "D. Adekanye": "데이비드 아데칸예",
    "F. Kramer": "프란크 크라머",
    "M. Deijl": "마르코 데일",
    "J. Bradbury": "제이미 브래드버리",
    "A. Breum": "안톤 브로임",
    "E. Kramer": "에리크 크라머",

    # Heracles Almelo (Team ID: 205)
    "F. Brouwer": "파비안 브라우어",
    "M. Brouwer": "마이클 브라우어",
    "I. Azzagari": "야신 아자가리",
    "B. Mesik": "브라이언 메식",
    "D. de Keersmaecker": "다안 더 케이르스마커",
    "J. Talvitie": "유호 탈비티에",
    "R. Roosken": "루벤 로스켄",
    "D. van Kaam": "다니 판 캄",
    "I. Benita": "이반 베니타",
    "L. Schoofs": "루카스 스호프스",
    "S. Kulenović": "시메 쿨레노비치",
    "B. Engels": "브야른 엥겔스",
    "Mimeirhel Benita": "미메이르헬 베니타",
    "T. Hornkamp": "토마스 호른캄프",
    "J. Hoogma": "야이슨 호흐마",
    "M. Rente": "마르코 렌테",
    "S. Hilić": "사바 힐리치",
    "J. Talvitie": "유호 탈비티에",
    "D. Oudheusden": "다니 아우더휘스덴",

    # NEC Nijmegen (Team ID: 208)
    "R. Roefs": "로빈 뢰프스",
    "S. Cillessen": "야스퍼 실레선",
    "M. Brouwer": "스탄 브라우어",
    "B. Nuytinck": "브람 나위팅크",
    "P. Sandler": "필립 산들러",
    "C. Verdonk": "칼빈 페르동크",
    "B. Ogawa": "오가와 바루",
    "K. Hansen": "칼븐 한센",
    "M. Hoedemakers": "메스 회데마커르스",
    "D. Proper": "디르크 프로퍼",
    "S. Ouaissa": "사미 와이사",
    "M. Márquez": "매너 마르케스",
    "K. Sano": "사노 코다이",
    "R. Vente": "로브 펜터",
    "I. Ouattara": "이사크 와타라",
    "B. Vet": "바스 페트",
    "L. Strijdonck": "라르스 스트레이동크",
    "M. Olde Loohuis": "믹 올더 로후이스",
    "S. Cissé": "수마일라 시세",
    "T. Ouwejan": "토마스 아우에얀",
    "I. Márquez": "이냐시오 마르케스",

    # PEC Zwolle (Team ID: 209)
    "J. Schendelaar": "야스퍼 스헨들라르",
    "K. MacNulty": "켄네트 맥널티",
    "M. Keller": "미하엘 켈러",
    "A. Lutonda": "안세 루톤다",
    "S. Reith": "샴 레이트",
    "T. van den Belt": "티제르 판 덴 벨트",
    "D. Vente": "다미안 펜터",
    "J. Monteiro": "자메이 몬테이루",
    "F. Redmond": "필립 레드몬드",
    "N. Fichtinger": "니콜라스 피히팅거",
    "Anouar El Azzouzi": "아누아르 엘 아주지",
    "Dylan Mbayo": "딜런 음바요",
    "Odysseus Velanas": "오디세우스 벨라나스",
    "Teun Gijselhart": "턴 하이셀하르트",
    "Thomas Buitink": "토마스 바위팅크",
    "Dylan Vente": "딜런 펜터",
    "Apostolos Vellios": "아포스톨로스 벨리오스",
    "Anselmo García MacNulty": "안셀모 가르시아 맥널티",

    # SC Heerenveen (Team ID: 198)
    "A. Noppert": "안드리스 노페르트",
    "M. de Boer": "미키 더 부르",
    "N. Chalmer": "니콜라스 샬머",
    "P. Kersten": "파웰 케르스턴",
    "O. Braude": "올리버 브라우데",
    "S. Hopland": "샘 홉란",
    "L. Smans": "루크 스만스",
    "M. Köhlert": "마티아스 쾰러트",
    "D. Kalokoh": "다닐로 칼로코",
    "E. Nunnely": "이산 눈넬리",
    "L. Trenskiy": "레브 트렌스키",
    "S. Nahounou": "시몬 나후누",
    "I. Sel": "일리아스 셀",
    "J. Tsoungui": "자콥 충기",
    "C. McLennan": "코너 맥레넌",
    "D. Sauer": "다니엘 자우어",
    "N. van Ee": "니키 판 에",
    "M. Sarr": "마메 사르",
    "E. Resink": "에스거 레싱크",
    "I. Sel": "일리아스 셀",
    "A. Robinet": "아민 로비네",

    # Sparta Rotterdam (Team ID: 203)
    "N. Olij": "닉 올레이",
    "Y. Schoonderwoerd": "예네 스혼데르부르트",
    "K. Coremans": "킴 코레만스",
    "M. Neghli": "모함메드 네글리",
    "B. Vriends": "바르트 브린츠",
    "R. Eerdhuijzen": "릭 에이르트하위전",
    "S. Kleijn": "사이드 클레인",
    "M. Bakari": "메타스 바카리",
    "D. Nassoh": "도안 나소",
    "J. Lauritsen": "욘 라우리첸",
    "C. Clement": "카밀로 클레멘트",
    "J. Kitolano": "조슈아 키톨라노",
    "P. Clement": "피트 클레멘트",
    "A. Tiéhi": "아르눔 티에이",
    "K. Meerdink": "카이 메이르딩크",
    "M. Verschueren": "마이크 페르스휴런",
    "T. Denkey": "토비아스 덴키",
    "Shunsuke Mito": "미토 슌스케",
    "Camiel Neghli": "카미엘 네글리",
    "Julian Baas": "율리안 바스",

    # Willem II (Team ID: 204)
    "T. Didillon-Hödl": "토마스 디디용-휘들",
    "J. Lammers": "요슈아 람메르스",
    "T. Owusu": "토미 오우수",
    "R. Behounek": "라파일 베호우넥",
    "M. Kreekels": "막심 크레켈스",
    "K. Lachkar": "킬리안 라샤르",
    "R. Boymans": "루벤 보이만스",
    "T. Hülsmann": "팀 훌스만",
    "N. Vaesen": "니키 파이선",
    "C. Keijzer": "카스퍼 케이저르",
    "J. Nassoh": "제시 나소",
    "R. El Biache": "라얀 엘 비아슈",
    "E. Bosch": "에밀 보시",
    "M. St. Jago": "미셸 생자고",
    "J. Mirani": "야니크 미라니",
    "Emilio Kehrer": "에밀리오 케러",
    "Amine Lachkar": "아민 라샤르",
    "Mickaël Tirpan": "미카엘 티르팡",
    "Jesse Bosch": "예세 보시",
    "Raffael Behounek": "라파엘 베호우넥",
    "Patrick Joosten": "파트리크 요스턴",

    # RKC Waalwijk (Team ID: 207)
    "J. Vaessen": "야넥 페선",
    "M. Houwen": "마르크 하우언",
    "L. Nieuwpoort": "레빈 니우포르트",
    "L. Van den Berg": "룩 판 덴 베르흐",
    "R. Hendriks": "루벤 헨드릭스",
    "D. Min": "다리오 민",
    "G. Roemeratoe": "고드윈 루메라투",
    "R. Cleonise": "리차드 클레오니제",
    "D. van der Haar": "다안 판 더 하르",
    "Y. Namli": "야시네 남리",
    "R. Zawada": "리하르트 자바다",
    "O. Oukili": "오스카르 우킬리",
    "M. Ihattaren": "모함메드 이하타렌",
    "L. Bullaude": "루안 불라우더",
    "D. Roymans": "데닐 로이만스",
    "M. Kramer": "미헬 크라머",
    "T. Felida": "티무르 펠리다",
    "S. Lambrix": "실반 람브릭스",

    # Fortuna Sittard (Team ID: 210)
    "M. Fossum": "마티아스 포숨",
    "L. Koopmans": "레이몬트 코프만스",
    "S. Pinto": "시몬 핀투",
    "R. Tirpan": "로드리구 티르팡",
    "S. Sow": "시세 소",
    "Kristoffer Peterson": "크리스토페르 페테르손",
    "M. Halilović": "라니 할릴로비치",
    "A. Noslin": "티자니 노슬린",
    "A. Zaroury": "아민 자루리",
    "E. Mitrović": "에즈기얀 미트로비치",
    "L. Bullaude": "루안 불라우더",
    "S. Rosier": "사뮈엘 로지에",
    "M. Dijks": "미첼 데이크스",
    "I. Pinto": "이사크 핀투",
    "K. Belghali": "카림 벨갈리",
    "N. Marijnissen": "니크 마레이니선",
    "A. Ferati": "알비온 페라티",
    "T. Robberechts": "티보 로베레흐츠",

    # Almere City (Team ID: 2790)
    "N. Bakker": "노르딘 바커",
    "S. Stijnen": "샴 스테이넨",
    "L. Floranus": "로렌초 플로라누스",
    "H. Akujobi": "함자 아쿠요비",
    "J. Jacobs": "제이 야콥스",
    "T. Barbet": "테오 바르베",
    "J. Kwakman": "야니크 크바크만",
    "K. Mitov": "코르넬리우스 미토프",
    "V. Zagaritis": "바실리오스 자가리티스",
    "J. Linthorst": "요스트 린토르스트",
    "P. Kaied": "파베르 카이드",
    "A. Kadijević": "알렉산다르 카디예비치",
    "J. Ejuke": "제임스 에주케",
    "R. Mühren": "로날트 뮈렌",
    "A. Verhulst": "아르노 페르훌스트",
    "B. Kaib": "바드르 카입",
    "L. Robinet": "로익 로비네",
    "C. Mulder": "케빈 뮐더",
    "K. Mitrov": "크리스티안 미트로프",

    # NAC Breda (Team ID: 196)
    "D. Bielica": "다니엘 비엘리차",
    "R. de Vos": "로이 더 포스",
    "F. Gravenberch": "풀리안 그라번베르흐",
    "J. Janosek": "얀 야노섹",
    "C. Greiml": "클라우디오 그라이믈",
    "L. Strijdonck": "레오 스트레이동크",
    "B. van den Heuvel": "바우트 판 덴 헤이벌",
    "M. Batzner": "마르셀 바츠너",
    "E. Llansana": "얄 란사나",
    "S. El Kadiri": "사이드 엘 카디리",
    "M. Makhachev": "막심 마카체프",
    "D. Mahi": "다미앙 마이",
    "I. Mar": "이반 마르",
    "L. Mol": "로이 몰",
    "C. Kemper": "클라스 켐퍼",
    "R. Kaied": "라얀 카이드",
    "F. Augustijns": "프레드릭 아우흐스테인스",

    # FC Groningen (Team ID: 199)
    "E. van der Hart": "이탄 판 더 하르트",
    "H. Vaessen": "히데 페선",
    "M. Schreuders": "마르코 슈뢰더르스",
    "J. Blanco": "후안 블랑코",
    "M. Peersman": "마르셀 페이르스만",
    "L. Postema": "요르헨 포스테마",
    "J. Resink": "요스 레싱크",
    "T. Suslov": "티카 수슬로프",
    "L. Valente": "루시아누 발렌테",
    "B. van Hintum": "바르트 판 힌툼",
    "M. Rui Mendes": "마르쿠 루이 멘데스",
    "D. van Kaam": "다니 판 캄",
    "Thijmen Blokzijl": "테이먼 블록제일",
    "Luciano Valente": "루시아누 발렌테",
    "Brynjolfur Willumsson": "브륀욜퓌르 빌룸손",
    "Thom van Bergen": "톰 판 베르헌",
    "Romano Postema": "로마노 포스테마",
    "Joey Pelupessy": "요이 펠루페시",

    # Additional common names that might appear
    "Do-Yong Yoon": "윤도영",
    "Hwang In-Beom": "황인범",
}


def translate_player_name(name: str) -> str:
    """선수 이름을 한글로 번역"""
    # 직접 매핑이 있는 경우
    if name in PLAYER_TRANSLATIONS:
        return PLAYER_TRANSLATIONS[name]

    # 매핑이 없는 경우 알림
    print(f"Warning: No translation found for '{name}'")
    return name  # 원래 이름 반환


def process_file(input_path: str) -> str:
    """파일을 읽고 모든 korean_name을 번역"""
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 정규식으로 모든 선수 엔트리 찾기
    # 패턴: { id: ..., name: "...", korean_name: null, ... }
    pattern = r'\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*korean_name:\s*(null|"[^"]*"),\s*team_id:\s*(\d+),\s*position:\s*([^,]+),\s*number:\s*([^,]+),\s*age:\s*([^}]+)\}'

    def replace_korean_name(match):
        id_num = match.group(1)
        name = match.group(2)
        current_korean = match.group(3)
        team_id = match.group(4)
        position = match.group(5)
        number = match.group(6)
        age = match.group(7)

        # 한글 이름 번역
        korean_name = translate_player_name(name)

        # null이 아닌 경우도 업데이트
        if current_korean == "null" or True:  # 모든 경우 업데이트
            return f'{{ id: {id_num}, name: "{name}", korean_name: "{korean_name}", team_id: {team_id}, position: {position}, number: {number}, age: {age}}}'

        return match.group(0)

    # 모든 매칭 항목 교체
    modified_content = re.sub(pattern, replace_korean_name, content)

    return modified_content


def main():
    input_file = r"c:\Users\user\Desktop\web2\123\1234\src\domains\livescore\constants\players\eredivisie.ts"

    print(f"Processing {input_file}...")

    try:
        modified_content = process_file(input_file)

        # 백업 생성
        import shutil
        backup_file = input_file + '.backup'
        shutil.copy2(input_file, backup_file)
        print(f"Backup created: {backup_file}")

        # 수정된 내용 저장
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(modified_content)

        print(f"✓ File updated successfully: {input_file}")
        print(f"✓ Total translations applied")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
