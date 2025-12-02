#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MLS Player Data Processor
Converts player data from SQL queries to TypeScript constants
"""

import json
import re

def transliterate_to_korean(name):
    """
    Simple transliteration of English names to Korean phonetics
    This is a basic implementation - real names should be verified
    """
    # Common name mappings
    name_map = {
        'Alex': '알렉스', 'Andrew': '앤드루', 'Anthony': '앤서니', 'Antonio': '안토니오',
        'Benjamin': '벤자민', 'Brandon': '브랜던', 'Brian': '브라이언', 'Carlos': '카를로스',
        'Christian': '크리스티안', 'Christopher': '크리스토퍼', 'Daniel': '다니엘', 'David': '데이비드',
        'Diego': '디에고', 'Eduard': '에두아르드', 'Eric': '에릭', 'Francisco': '프란시스코',
        'Gabriel': '가브리엘', 'George': '조지', 'Gustavo': '구스타보', 'Isaac': '아이작',
        'Jack': '잭', 'Jacob': '제이콥', 'James': '제임스', 'Jason': '제이슨',
        'John': '존', 'Jonathan': '조나단', 'Jordan': '조던', 'Jorge': '호르헤',
        'Jose': '호세', 'Joseph': '조셉', 'Juan': '후안', 'Julian': '훌리안',
        'Kevin': '케빈', 'Kyle': '카일', 'Leonardo': '레오나르도', 'Luis': '루이스',
        'Marco': '마르코', 'Marcos': '마르코스', 'Mario': '마리오', 'Martin': '마르틴',
        'Matthew': '매튜', 'Michael': '마이클', 'Miguel': '미구엘', 'Nathan': '네이선',
        'Nicholas': '니콜라스', 'Oliver': '올리버', 'Oscar': '오스카르', 'Pablo': '파블로',
        'Patrick': '패트릭', 'Paul': '폴', 'Pedro': '페드로', 'Rafael': '라파엘',
        'Ricardo': '리카르도', 'Robert': '로버트', 'Samuel': '사무엘', 'Sebastian': '세바스티안',
        'Sergio': '세르히오', 'Steven': '스티븐', 'Thomas': '토마스', 'Timothy': '티모시',
        'Victor': '빅토르', 'William': '윌리엄'
    }

    # Try to match first name
    parts = name.split()
    if parts and parts[0] in name_map:
        return name_map[parts[0]]

    # Simple phonetic conversion for common patterns
    korean = name
    korean = re.sub(r'[Aa]', 'ㅏ', korean)
    korean = re.sub(r'[Ee]', 'ㅔ', korean)
    korean = re.sub(r'[Ii]', 'ㅣ', korean)
    korean = re.sub(r'[Oo]', 'ㅗ', korean)
    korean = re.sub(r'[Uu]', 'ㅜ', korean)

    # Return simplified version - in production, use proper transliteration
    # For now, just return a placeholder that can be manually corrected
    return f"{name} (한글명 필요)"

def generate_player_mapping(player_data):
    """Generate TypeScript player mapping from player data"""
    player_id = player_data['player_id']
    name = player_data['name']
    korean_name = player_data['korean_name'] if player_data['korean_name'] else transliterate_to_korean(name)
    team_id = player_data['team_id']
    position = player_data['position'] if player_data['position'] else 'Unknown'

    return f'  {{ id: {player_id}, name: "{name}", korean_name: "{korean_name}", team_id: {team_id}, position: "{position}" }}'

def main():
    print("MLS Player Data Processor")
    print("This script helps generate TypeScript constants from SQL query results")
    print("\nPaste your JSON data below (Ctrl+D when done):")

    # In a real implementation, this would read from the SQL results
    # For now, we'll manually process the data in the main script

if __name__ == "__main__":
    main()
