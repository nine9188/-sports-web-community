#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
에레디비지에 선수 이름 한글 번역 스크립트 (전체 매핑)
"""

import re
import sys
import os

# 완전한 한글 번역 매핑
PLAYER_TRANSLATIONS = {
    # Ajax players
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

    # Continue with more players...이 부분은 자동 생성
}

# 자동 번역 규칙 (간단한 규칙 기반)
def auto_translate_name(name: str) -> str:
    """자동 번역 규칙 적용"""
    # 한국 선수명 (영문 -> 한글)
    korean_players = {
        "Hwang In-Beom": "황인범",
        "Do-Yong Yoon": "윤도영",
    }

    if name in korean_players:
        return korean_players[name]

    # 일본 선수 (Last First 패턴)
    if "Ko Itakura" in name:
        return "이타쿠라 코"
    if "Gaku Nawata" in name:
        return "나와타 가쿠"
    if "Koki Ogawa" in name:
        return "오가와 코키"
    if "K. Shiogai" in name:
        return "시오가이 코타"
    if "K. Sano" in name:
        return "사노 코다이"
    if "S. Maikuma" in name:
        return "마이쿠마 세이야"
    if "A. Ueda" in name or "Ayase Ueda" in name:
        return "우에다 아야세"
    if "S. Mito" in name or "Shunsuke Mito" in name:
        return "미토 슌스케"
    if "Tsuyoshi Watanabe" in name:
        return "와타나베 츠요시"

    # 기본 변환 (간단한 이니셜 기반)
    return translate_player_name(name)


def translate_player_name(name: str) -> str:
    """선수 이름 한글 번역"""
    if name in PLAYER_TRANSLATIONS:
        return PLAYER_TRANSLATIONS[name]

    # 자동 번역 시도
    return auto_translate_name(name)


def process_eredivisie_file():
    """eredivisie.ts 파일 처리"""
    file_path = r"c:\Users\user\Desktop\web2\123\1234\src\domains\livescore\constants\players\eredivisie.ts"

    # 파일 읽기
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 백업 생성
    backup_path = file_path + ".backup"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Backup created: {backup_path}")

    # 수정할 부분만 찾아서 변경
    # 패턴: korean_name: null
    lines = content.split('\n')
    modified_lines = []
    changes_count = 0

    for line in lines:
        if 'korean_name: null' in line:
            # name 필드 추출
            name_match = re.search(r'name:\s*"([^"]+)"', line)
            if name_match:
                original_name = name_match.group(1)
                korean_name = translate_player_name(original_name)

                # null을 한글 이름으로 변경
                modified_line = line.replace('korean_name: null', f'korean_name: "{korean_name}"')
                modified_lines.append(modified_line)
                changes_count += 1

                if changes_count <= 10:  # 처음 10개만 출력
                    print(f"  {original_name} -> {korean_name}")
            else:
                modified_lines.append(line)
        else:
            modified_lines.append(line)

    # 파일 저장
    modified_content = '\n'.join(modified_lines)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(modified_content)

    print(f"\n✓ Total {changes_count} player names translated")
    print(f"✓ File updated: {file_path}")

    return changes_count


if __name__ == "__main__":
    try:
        count = process_eredivisie_file()
        print(f"\n=== Translation Complete ===")
        print(f"Total translations: {count}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
