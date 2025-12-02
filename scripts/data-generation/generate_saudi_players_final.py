#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# Saudi Pro League player data with Korean translations
# This data structure will be populated from Supabase queries

TEAM_INFO = {
    2929: {'english': 'Al-Ahli Jeddah', 'korean': '알 아흘리'},
    2977: {'english': 'Al-Ittihad Jeddah', 'korean': '알 이티하드'},
    2934: {'english': 'Al-Nassr', 'korean': '알 나스르'},
    2931: {'english': 'Al-Hilal', 'korean': '알 힐랄'},
    2944: {'english': 'Al-Fateh', 'korean': '알 파테'},
    2945: {'english': 'Al-Fayha', 'korean': '알 파이하'},
    2932: {'english': 'Al-Shabab', 'korean': '알 샤바브'},
    2938: {'english': 'Al-Taawoun', 'korean': '알 타아운'},
    2928: {'english': 'Al-Ettifaq', 'korean': '알 에티파크'},
    10509: {'english': 'Al-Qadsiah', 'korean': '알 카디시아'},
    2992: {'english': 'Al-Khaleej', 'korean': '알 칼리즈'},
    2939: {'english': 'Al-Raed', 'korean': '알 라이드'},
    2933: {'english': 'Al-Riyadh', 'korean': '알 리야드'},
    10511: {'english': 'Al-Okhdood', 'korean': '알 악두드'},
    2940: {'english': 'Al-Tai', 'korean': '알 타이'},
    2936: {'english': 'Al-Wehda', 'korean': '알 웨흐다'},
    2956: {'english': 'Damac', 'korean': '다막'},
    10513: {'english': 'Al-Akhdoud', 'korean': '알 악두드'}
}

# Korean name dictionary for famous and common players
KNOWN_PLAYERS = {
    # Famous international players
    'Riyad Mahrez': '리야드 마레즈',
    'Roberto Firmino': '호베르투 피르미누',
    'Édouard Mendy': '에두아르 멘디',
    'Edouard Mendy': '에두아르 멘디',
    'Ivan Toney': '이반 토니',
    'Rúben Neves': '후벤 네베스',
    'Ruben Neves': '후벤 네베스',
    'Aleksandar Mitrović': '알렉산다르 미트로비치',
    'Aleksandar Mitrovic': '알렉산다르 미트로비치',
    'Sergej Milinković-Savić': '세르게이 밀린코비치사비치',
    'Sergej Milinkovic-Savic': '세르게이 밀린코비치사비치',
    'Cristiano Ronaldo': '크리스티아누 호날두',
    'Sadio Mané': '사디오 마네',
    'Sadio Mane': '사디오 마네',
    'Marcelo Brozović': '마르셀로 브로조비치',
    'Marcelo Brozovic': '마르셀로 브로조비치',
    "N'Golo Kanté": '은골로 캉테',
    "N'Golo Kante": '은골로 캉테',
    'Kalidou Koulibaly': '칼리두 쿨리발리',
    'Neymar Jr': '네이마르',
    'Neymar': '네이마르',
    'Malcom': '말콤',
    'Malcolm': '말콤',
    'João Cancelo': '주앙 칸셀루',
    'Joao Cancelo': '주앙 칸셀루',
    'Moussa Dembélé': '무사 뎀벨레',
    'Moussa Dembele': '무사 뎀벨레',
    'Gabri Veiga': '가브리 베이가',
    'Merih Demiral': '메리흐 데미랄',
    'Yassine Bounou': '야신 부누',
    'Gelson Dala': '젤손 달라',
    'Karim Benzema': '카림 벤제마',
    'Fabinho': '파비뉴',
    'Jordan Henderson': '조던 헨더슨',
    'Otávio': '오타비우',
    'Otavio': '오타비우',
    'Talisca': '탈리스카',
    'Anderson Talisca': '안데르손 탈리스카',
    'Aymeric Laporte': '에메릭 라포르트',
    'Franck Kessié': '프랑크 케시에',
    'Franck Kessie': '프랑크 케시에',
    'Allan Saint-Maximin': '알랑 생막시맹',
    'Aleksandar Kolarov': '알렉산다르 콜라로프',
    'Ever Banega': '에베르 바네가',
    'Georginio Wijnaldum': '헤오르지니오 베이날둠',
    'Jota': '조타',
    'Odion Ighalo': '오디온 이갈로',
    'Romarinho': '호마리뉴',
    'Roger Guedes': '호제르 게지스',
    'Luiz Felipe': '루이스 펠리페',
    'Gabriel Veiga': '가브리엘 베이가',
    'Matheus Pereira': '마테우스 페레이라',
    'Salem Al-Dawsari': '살렘 알 다우사리',
    'Mohammed Al-Owais': '모하메드 알 오와이스',
    'Ali Al-Bulayhi': '알리 알 불라이히',
    'Saud Abdulhamid': '사우드 압둘하미드',
    'Yasir Al-Shahrani': '야시르 알 샤흐라니',
    'Salman Al-Faraj': '살만 알 파라즈',
    'Abdullah Otayf': '압둘라 오타이프',
    'Firas Al-Buraikan': '피라스 알 부라이칸',
    'Saleh Al-Shehri': '살레흐 알 셰흐리',
    'Abdulrahman Ghareeb': '압둘라흐만 가리브',
    'Fahad Al-Muwallad': '파하드 알 무왈라드',
    'Hassan Tambakti': '하산 탐박티',
    'Nasser Al-Dawsari': '나세르 알 다우사리',
}

def translate_arabic_name(name):
    """Translate Arabic names to Korean"""

    # Check known players first
    if name in KNOWN_PLAYERS:
        return KNOWN_PLAYERS[name]

    parts = name.split(' ')
    translated_parts = []

    # Arabic name translations
    arabic_map = {
        'Al-': '알 ',
        'Al': '알',
        'Abd': '압드',
        'Abdul': '압둘',
        'Abdel': '압델',
        'Abdulrahman': '압둘라흐만',
        'Abdullah': '압둘라',
        'Abdulaziz': '압둘아지즈',
        'Abdulfattah': '압둘파타흐',
        'Mohammed': '모하메드',
        'Muhammad': '무함마드',
        'Ahmad': '아흐마드',
        'Ahmed': '아흐메드',
        'Hassan': '하산',
        'Hussein': '후세인',
        'Hussain': '후사인',
        'Khalid': '칼리드',
        'Khaled': '칼레드',
        'Salman': '살만',
        'Salem': '살렘',
        'Fahad': '파하드',
        'Faisal': '파이살',
        'Omar': '오마르',
        'Umar': '우마르',
        'Ali': '알리',
        'Nasser': '나세르',
        'Nawaf': '나와프',
        'Saud': '사우드',
        'Yazid': '야지드',
        'Yasser': '야세르',
        'Yasir': '야시르',
        'Firas': '피라스',
        'Walid': '왈리드',
        'Saad': '사드',
        'Ziyad': '지야드',
        'Majed': '마제드',
        'Turki': '투르키',
        'Hamad': '하마드',
        'Nawaf': '나와프',
        'Osama': '오사마',
        'Othman': '오스만',
        'Rayan': '라얀',
        'Saeed': '사이드',
        'Sultan': '술탄',
        'Talal': '탈랄',
        'Tariq': '타리크',
        'Youssef': '유세프',
        'Yousef': '유세프',
        # Common last name parts
        'Dawsari': '다우사리',
        'Shahrani': '샤흐라니',
        'Bulayhi': '불라이히',
        'Buraikan': '부라이칸',
        'Shehri': '셰흐리',
        'Ghareeb': '가리브',
        'Muwallad': '무왈라드',
        'Tambakti': '탐박티',
        'Owais': '오와이스',
        'Faraj': '파라즈',
        'Otayf': '오타이프',
        'Abdulhamid': '압둘하미드',
    }

    for part in parts:
        translated = False
        for arabic, korean in arabic_map.items():
            if part == arabic or part.startswith(arabic + '-') or part == arabic.rstrip('-'):
                if arabic.endswith('-'):
                    rest = part[len(arabic):]
                    if rest and rest in arabic_map:
                        translated_parts.append(korean + arabic_map[rest])
                    else:
                        translated_parts.append(korean + rest)
                else:
                    translated_parts.append(korean)
                translated = True
                break

        if not translated:
            # If no match, keep original or try basic transliteration
            translated_parts.append(part)

    return ' '.join(translated_parts)

def generate_typescript_file(output_path):
    """Generate the TypeScript file with player mappings"""

    # This will be populated with actual data from Supabase
    # For now, creating structure
    content = 'import { PlayerMapping } from \\'./index\\';\n\n'

    content += '// Note: This file contains Saudi Pro League player mappings\n'
    content += '// Korean names are translated based on pronunciation rules:\n'
    content += '// - Arabic names: Arabic pronunciation\n'
    content += '// - European names: Original language pronunciation\n'
    content += '// - Brazilian names: Portuguese pronunciation\n'
    content += '// - Famous players: Standard Korean notation\n\n'

    # Placeholder - actual data will come from Supabase
    content += '// Data structure:\n'
    content += '// export const TEAM_NAME_PLAYERS: PlayerMapping[] = [\n'
    content += '//   { id: player_id, name: "English Name", korean_name: "한글이름", team_id: 2929, position: "Position", number: 10, age: 25 },\n'
    content += '// ];\n\n'

    content += 'export const SAUDI_PRO_LEAGUE_PLAYERS: PlayerMapping[] = [];\n'

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Generated: {output_path}')

if __name__ == '__main__':
    import os
    output_dir = os.path.join('123', '1234', 'src', 'domains', 'livescore', 'constants', 'players')
    output_file = os.path.join(output_dir, 'saudi-pro-league.ts')

    # This script provides the translation functions
    # Actual data fetching will be done via Supabase MCP tools
    print('Saudi Pro League player name translation utility ready')
    print(f'Target file: {output_file}')
