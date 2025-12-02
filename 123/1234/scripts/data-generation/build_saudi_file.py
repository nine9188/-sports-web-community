#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate Saudi Pro League player mapping TypeScript file
This script processes player data and creates properly formatted TypeScript exports
"""

import json
import sys

# Team information mapping
TEAM_INFO = {
    2929: {'english': 'Al-Ahli Jeddah', 'korean': '알 아흘리', 'const_name': 'AL_AHLI_JEDDAH'},
    2977: {'english': 'Al-Ittihad Jeddah', 'korean': '알 이티하드', 'const_name': 'AL_ITTIHAD_JEDDAH'},
    2934: {'english': 'Al-Nassr', 'korean': '알 나스르', 'const_name': 'AL_NASSR'},
    2931: {'english': 'Al-Hilal', 'korean': '알 힐랄', 'const_name': 'AL_HILAL'},
    2944: {'english': 'Al-Fateh', 'korean': '알 파테', 'const_name': 'AL_FATEH'},
    2945: {'english': 'Al-Fayha', 'korean': '알 파이하', 'const_name': 'AL_FAYHA'},
    2932: {'english': 'Al-Shabab', 'korean': '알 샤바브', 'const_name': 'AL_SHABAB'},
    2938: {'english': 'Al-Taawoun', 'korean': '알 타아운', 'const_name': 'AL_TAAWOUN'},
    2928: {'english': 'Al-Ettifaq', 'korean': '알 에티파크', 'const_name': 'AL_ETTIFAQ'},
    10509: {'english': 'Al-Qadsiah', 'korean': '알 카디시아', 'const_name': 'AL_QADSIAH'},
    2992: {'english': 'Al-Khaleej', 'korean': '알 칼리즈', 'const_name': 'AL_KHALEEJ'},
    2939: {'english': 'Al-Raed', 'korean': '알 라이드', 'const_name': 'AL_RAED'},
    2933: {'english': 'Al-Riyadh', 'korean': '알 리야드', 'const_name': 'AL_RIYADH'},
    10511: {'english': 'Al-Okhdood', 'korean': '알 악두드', 'const_name': 'AL_OKHDOOD'},
    2940: {'english': 'Al-Tai', 'korean': '알 타이', 'const_name': 'AL_TAI'},
    2936: {'english': 'Al-Wehda', 'korean': '알 웨흐다', 'const_name': 'AL_WEHDA'},
    2956: {'english': 'Damac', 'korean': '다막', 'const_name': 'DAMAC'},
    10513: {'english': 'Al-Akhdoud', 'korean': '알 악두드', 'const_name': 'AL_AKHDOUD'}
}

# Famous player name translations (comprehensive list)
KNOWN_PLAYERS = {
    # Top stars
    'Cristiano Ronaldo': '크리스티아누 호날두',
    'Neymar Jr': '네이마르',
    'Neymar': '네이마르',
    'Karim Benzema': '카림 벤제마',
    'Sadio Mané': '사디오 마네',
    'Sadio Mane': '사디오 마네',
    "N'Golo Kanté": '은골로 캉테',
    "N'Golo Kante": '은골로 캉테',
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
    'Marcelo Brozović': '마르셀로 브로조비치',
    'Marcelo Brozovic': '마르셀로 브로조비치',
    'Kalidou Koulibaly': '칼리두 쿨리발리',
    'Malcom': '말콤',
    'Malcolm': '말콤',
    'João Cancelo': '주앙 칸셀루',
    'Joao Cancelo': '주앙 칸셀루',
    'Moussa Dembélé': '무사 뎀벨레',
    'Moussa Dembele': '무사 뎀벨레',
    'Gabri Veiga': '가브리 베이가',
    'Gabriel Veiga': '가브리엘 베이가',
    'Merih Demiral': '메리흐 데미랄',
    'Yassine Bounou': '야신 부누',
    'Gelson Dala': '젤손 달라',
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
    'Matheus Pereira': '마테우스 페레이라',
    'Roger Guedes': '호제르 게지스',
    'Luiz Felipe': '루이스 펠리페',
    'Odion Ighalo': '오디온 이갈로',
    'Georginio Wijnaldum': '헤오르지니오 베이날둠',
    'Ever Banega': '에베르 바네가',
    'Jota': '조타',
    'Romarinho': '호마리뉴',

    # Saudi national team players
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

def translate_to_korean(name):
    """Translate player name to Korean"""

    # Check known players first
    if name in KNOWN_PLAYERS:
        return KNOWN_PLAYERS[name]

    # Handle Al- prefix names (common in Saudi Arabia)
    if name.startswith('Al-') or name.startswith('Al '):
        # Split and translate
        parts = name.replace('Al-', 'Al ').split()
        if len(parts) >= 2:
            # Basic translation for Al- names
            return '알 ' + ' '.join(parts[1:])

    # Handle Abdul- names
    if 'Abdul' in name or 'Abd' in name:
        replacements = {
            'Abdulrahman': '압둘라흐만',
            'Abdullah': '압둘라',
            'Abdulaziz': '압둘아지즈',
            'Abdulfattah': '압둘파타흐',
            'Abdulelah': '압둘엘라',
            'Abdulhamid': '압둘하미드',
        }
        for eng, kor in replacements.items():
            if eng in name:
                name = name.replace(eng, kor)
                return name

    # Handle common Arabic first names
    arabic_names = {
        'Mohammed': '모하메드',
        'Muhammad': '무함마드',
        'Ahmad': '아흐마드',
        'Ahmed': '아흐메드',
        'Hassan': '하산',
        'Hussein': '후세인',
        'Khalid': '칼리드',
        'Salman': '살만',
        'Salem': '살렘',
        'Fahad': '파하드',
        'Faisal': '파이살',
        'Omar': '오마르',
        'Ali': '알리',
        'Nasser': '나세르',
        'Saud': '사우드',
        'Yasir': '야시르',
        'Yasser': '야세르',
        'Firas': '피라스',
        'Nawaf': '나와프',
        'Walid': '왈리드',
        'Saad': '사드',
        'Ziyad': '지야드',
        'Majed': '마제드',
        'Turki': '투르키',
    }

    for eng, kor in arabic_names.items():
        if eng in name:
            name = name.replace(eng, kor)
            return name

    # Return original name if no translation found
    # (will need manual review for these)
    return name

def generate_typescript_file(all_teams_data, output_path):
    """Generate the TypeScript file with all player mappings"""

    lines = []
    lines.append("import { PlayerMapping } from './index';")
    lines.append("")
    lines.append("// Saudi Pro League (사우디 프로리그) Player Mappings")
    lines.append("// Auto-generated file - Korean names translated based on pronunciation rules")
    lines.append("")

    all_const_names = []

    # Generate each team's player array
    for team_data in all_teams_data:
        team_id = team_data['team_id']
        players = team_data['players']
        team_info = TEAM_INFO[team_id]

        const_name = f"{team_info['const_name']}_PLAYERS"
        all_const_names.append(const_name)

        lines.append(f"// {team_info['english']} ({team_info['korean']}) - Team ID: {team_id} - {len(players)}명")
        lines.append(f"export const {const_name}: PlayerMapping[] = [")

        for player in players:
            # Translate Korean name
            korean_name = translate_to_korean(player['name'])

            # Format player entry
            number = player.get('number')
            number_str = str(number) if number is not None else 'null'

            age = player.get('age')
            age_str = str(age) if age is not None else 'null'

            position = player.get('position', 'Unknown')

            line = f"  {{ id: {player['id']}, name: \"{player['name']}\", korean_name: \"{korean_name}\", team_id: {team_id}, position: \"{position}\", number: {number_str}, age: {age_str} }},"
            lines.append(line)

        lines.append("];")
        lines.append("")

    # Generate combined export
    lines.append("// 사우디 프로리그 전체 선수 통합")
    lines.append("export const SAUDI_PRO_LEAGUE_PLAYERS: PlayerMapping[] = [")
    for const_name in all_const_names:
        lines.append(f"  ...{const_name},")
    lines.append("];")
    lines.append("")

    # Write to file
    content = '\n'.join(lines)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    return len(all_const_names), sum(len(team['players']) for team in all_teams_data)

def main():
    """Main function to read JSON data and generate file"""

    # Read JSON data from stdin (will be provided by calling script)
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            all_teams_data = json.load(f)
    else:
        print("Usage: python build_saudi_file.py <input_json_file>")
        print("JSON format: [{'team_id': 2929, 'players': [{'id': 123, 'name': '...', ...}]}]")
        sys.exit(1)

    # Output path
    output_path = r"c:\Users\user\Desktop\web2\123\1234\src\domains\livescore\constants\players\saudi-pro-league.ts"

    # Generate file
    num_teams, num_players = generate_typescript_file(all_teams_data, output_path)

    print(f"✅ Successfully generated saudi-pro-league.ts")
    print(f"   Teams: {num_teams}")
    print(f"   Players: {num_players}")
    print(f"   File: {output_path}")

if __name__ == '__main__':
    main()
