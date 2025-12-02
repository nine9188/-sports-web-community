import anthropic
import os
import json

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# 전체 선수 데이터 (Supabase에서 조회한 데이터)
players_data = {
    "Benfica": {"team_id": 211, "players": [
        {"id": 675, "name": "A. Trubin", "position": "Goalkeeper", "number": 1, "age": 24},
        {"id": 265722, "name": "Rafael Obrador", "position": "Defender", "number": 3, "age": 21},
        {"id": 331832, "name": "António Silva", "position": "Defender", "number": 4, "age": 22},
        {"id": 158378, "name": "E. Barrenechea", "position": "Midfielder", "number": 5, "age": 24},
        {"id": 15623, "name": "A. Bah", "position": "Defender", "number": 6, "age": 28},
        {"id": 287592, "name": "Manu", "position": "Midfielder", "number": 6, "age": 24},
        {"id": 142959, "name": "K. Aktürkoğlu", "position": "Midfielder", "number": 7, "age": 27},
        {"id": 39043, "name": "F. Aursnes", "position": "Midfielder", "number": 8, "age": 30},
        {"id": 202951, "name": "F. Ivanović", "position": "Attacker", "number": 9, "age": 22},
        {"id": 161945, "name": "Heorhii Sudakov", "position": "Midfielder", "number": 10, "age": 23},
        {"id": 25458, "name": "Dodi Lukebakio Ngandoli", "position": "Midfielder", "number": 11, "age": 28},
        {"id": 36798, "name": "V. Pavlidis", "position": "Attacker", "number": 14, "age": 27},
        {"id": 7318, "name": "A. Dedić", "position": "Defender", "number": 17, "age": 23},
        {"id": 25918, "name": "L. Barreiro", "position": "Midfielder", "number": 18, "age": 25},
        {"id": 195104, "name": "R. Rios", "position": "Midfielder", "number": 20, "age": 25},
        {"id": 301528, "name": "A. Schjelderup", "position": "Attacker", "number": 21, "age": 21},
        {"id": 162595, "name": "Samuel Soares", "position": "Goalkeeper", "number": 24, "age": 23},
        {"id": 362755, "name": "G. Prestianni", "position": "Attacker", "number": 25, "age": 19},
        {"id": 135505, "name": "S. Dahl", "position": "Defender", "number": 26, "age": 22},
        {"id": 1163, "name": "Bruma", "position": "Attacker", "number": 27, "age": 31},
        {"id": 624, "name": "N. Otamendi", "position": "Defender", "number": 30, "age": 37},
        {"id": 162098, "name": "Henrique Araújo", "position": "Attacker", "number": 39, "age": 23},
        {"id": 161939, "name": "Tomás Araújo", "position": "Defender", "number": 44, "age": 23},
        {"id": 158065, "name": "Tiago Gouveia", "position": "Attacker", "number": 47, "age": 24},
        {"id": 386314, "name": "Diogo Ferreira", "position": "Goalkeeper", "number": 50, "age": 18},
        {"id": 575, "name": "Florentino", "position": "Midfielder", "number": 61, "age": 26},
        {"id": 400525, "name": "Gonçalo Oliveira", "position": "Defender", "number": 64, "age": 19},
        {"id": 345390, "name": "João Veloso", "position": "Midfielder", "number": 68, "age": 20},
        {"id": 474842, "name": "Leandro Henrique Sousa Santos", "position": "Defender", "number": 71, "age": 20},
        {"id": 400513, "name": "Gonçalo Carvalho Moreira", "position": "Attacker", "number": 77, "age": 19},
        {"id": 460931, "name": "Gonçalo da Silva Sobral", "position": "Goalkeeper", "number": 80, "age": 19},
        {"id": 345427, "name": "João Pedro Seno Luís Rêgo", "position": "Midfielder", "number": 84, "age": 20},
        {"id": 364811, "name": "Diogo Ferreira Prioste", "position": "Midfielder", "number": 86, "age": 21},
        {"id": 345387, "name": "Ivan Correia Posser Lima", "position": "Attacker", "number": 90, "age": 20}
    ]},
    "FC Porto": {"team_id": 212, "players": [
        {"id": 61431, "name": "Jakub Piotr Kiwior", "position": "Defender", "number": 4, "age": 25},
        {"id": 2999, "name": "J. Bednarek", "position": "Defender", "number": 5, "age": 29},
        {"id": 35570, "name": "S. Eustáquio", "position": "Midfielder", "number": 6, "age": 29},
        {"id": 449243, "name": "William", "position": "Attacker", "number": 7, "age": 19},
        {"id": 388872, "name": "Victor Mow Froholdt", "position": "Midfielder", "number": 8, "age": 19},
        {"id": 358628, "name": "Samu", "position": "Attacker", "number": 9, "age": 21},
        {"id": 182504, "name": "Gabri Veiga", "position": "Midfielder", "number": 10, "age": 23},
        {"id": 10500, "name": "Pepê Aquino", "position": "Attacker", "number": 11, "age": 28},
        {"id": 126899, "name": "Z. Sanusi", "position": "Defender", "number": 12, "age": 28},
        {"id": 240, "name": "Pablo Paulino Rosario", "position": "Defender", "number": 13, "age": 28},
        {"id": 41432, "name": "Cláudio Ramos", "position": "Goalkeeper", "number": 14, "age": 34},
        {"id": 133453, "name": "Borja Sainz", "position": "Attacker", "number": 17, "age": 24},
        {"id": 37, "name": "N. Pérez", "position": "Defender", "number": 18, "age": 25},
        {"id": 19625, "name": "D. Namaso", "position": "Attacker", "number": 19, "age": 25},
        {"id": 330419, "name": "Alberto Baio", "position": "Defender", "number": 20, "age": 22},
        {"id": 130256, "name": "André Franco", "position": "Midfielder", "number": 20, "age": 27},
        {"id": 340572, "name": "D. Prpić", "position": "Defender", "number": 21, "age": 21},
        {"id": 278375, "name": "A. Varela", "position": "Midfielder", "number": 22, "age": 24},
        {"id": 96476, "name": "Andorinha", "position": "Goalkeeper", "number": 24, "age": 29},
        {"id": 246, "name": "L. de Jong", "position": "Attacker", "number": 26, "age": 35},
        {"id": 388570, "name": "D. Gül", "position": "Attacker", "number": 27, "age": 21},
        {"id": 449245, "name": "Pedro Henrique Cardoso de Lima", "position": "Defender", "number": 46, "age": 19},
        {"id": 294797, "name": "Ángel Alarcón Galiot", "position": "Attacker", "number": 47, "age": 19},
        {"id": 386827, "name": "Ángel Alarcón Galiot", "position": "Attacker", "number": 47, "age": 21},
        {"id": 345413, "name": "Diogo Fernandes", "position": "Goalkeeper", "number": 51, "age": 20},
        {"id": 336596, "name": "Martim Fernandes", "position": "Defender", "number": 52, "age": 19},
        {"id": 180235, "name": "Gabriel Veron", "position": "Attacker", "number": 70, "age": 23},
        {"id": 515008, "name": "André Alexandre Mendes Miranda", "position": "Attacker", "number": 72, "age": 18},
        {"id": 336683, "name": "Gabriel Costa Brás", "position": "Defender", "number": 73, "age": 21},
        {"id": 41966, "name": "Francisco Moura", "position": "Defender", "number": 74, "age": 26},
        {"id": 1278, "name": "Yann Dorgelès Isaac Karamoh", "position": "Attacker", "number": 75, "age": 27},
        {"id": 46828, "name": "Iván Jaime", "position": "Midfielder", "number": 77, "age": 25},
        {"id": 404097, "name": "Rodrigo Mora", "position": "Midfielder", "number": 86, "age": 18},
        {"id": 414430, "name": "Brayan Mateo Caicedo Ramos", "position": "Attacker", "number": 87, "age": 19},
        {"id": 400544, "name": "João Pedro Moreira Teixeira", "position": "Midfielder", "number": 92, "age": 19},
        {"id": 369, "name": "Diogo Costa", "position": "Goalkeeper", "number": 99, "age": 26}
    ]},
    "Sporting CP": {"team_id": 228, "players": [
        {"id": 46672, "name": "Rui Silva", "position": "Goalkeeper", "number": 1, "age": 31},
        {"id": 41179, "name": "Matheus Reis", "position": "Defender", "number": 2, "age": 30},
        {"id": 37148, "name": "J. St. Juste", "position": "Defender", "number": 3, "age": 29},
        {"id": 32960, "name": "H. Morita", "position": "Midfielder", "number": 5, "age": 30},
        {"id": 304228, "name": "Z. Debast", "position": "Defender", "number": 6, "age": 22},
        {"id": 419582, "name": "Geovany Tcherno Quenda", "position": "Midfielder", "number": 7, "age": 18},
        {"id": 18748, "name": "Pote", "position": "Midfielder", "number": 8, "age": 27},
        {"id": 419916, "name": "C. Harder", "position": "Attacker", "number": 9, "age": 20},
        {"id": 154839, "name": "Geny Catamo", "position": "Midfielder", "number": 10, "age": 24},
        {"id": 41194, "name": "Nuno Santos", "position": "Midfielder", "number": 11, "age": 30},
        {"id": 18755, "name": "João Virgínia", "position": "Goalkeeper", "number": 12, "age": 26},
        {"id": 135839, "name": "G. Vagiannidis", "position": "Defender", "number": 13, "age": 24},
        {"id": 119795, "name": "G. Kochorashvili", "position": "Midfielder", "number": 14, "age": 26},
        {"id": 41112, "name": "Trincão", "position": "Midfielder", "number": 17, "age": 26},
        {"id": 336575, "name": "Diogo Travassos", "position": "Defender", "number": 19, "age": 21},
        {"id": 51776, "name": "M. Araújo", "position": "Defender", "number": 20, "age": 25},
        {"id": 341641, "name": "Rodrigo Ribeiro", "position": "Attacker", "number": 20, "age": 20},
        {"id": 341700, "name": "Iván Fresneda", "position": "Defender", "number": 22, "age": 21},
        {"id": 41892, "name": "Daniel Bragança", "position": "Midfielder", "number": 23, "age": 26},
        {"id": 265595, "name": "Gonçalo Inácio", "position": "Defender", "number": 25, "age": 24},
        {"id": 354753, "name": "O. Diomande", "position": "Defender", "number": 26, "age": 22},
        {"id": 310943, "name": "Alisson Santos", "position": "Attacker", "number": 27, "age": 23},
        {"id": 330296, "name": "Diego Callai", "position": "Goalkeeper", "number": 41, "age": 21},
        {"id": 7712, "name": "M. Hjulmand", "position": "Midfielder", "number": 42, "age": 26},
        {"id": 400509, "name": "João Simões", "position": "Midfielder", "number": 52, "age": 18},
        {"id": 407958, "name": "Rayan Lucas Marques de Souza", "position": "Midfielder", "number": 60, "age": 20},
        {"id": 416862, "name": "Lucas Rodrigues Carvalho Anjos", "position": "Attacker", "number": 67, "age": 21},
        {"id": 262845, "name": "Eduardo Quaresma", "position": "Defender", "number": 72, "age": 23},
        {"id": 26965, "name": "Fotis Ioannidis", "position": "Attacker", "number": 89, "age": 25},
        {"id": 41324, "name": "Ricardo Mangas", "position": "Defender", "number": 91, "age": 27},
        {"id": 47237, "name": "L. Suárez", "position": "Attacker", "number": 97, "age": 28},
        {"id": 361417, "name": "Francisco Silva", "position": "Goalkeeper", "number": 99, "age": 20}
    ]},
    "SC Braga": {"team_id": 217, "players": [
        {"id": 269349, "name": "L. Horníček", "position": "Goalkeeper", "number": 1, "age": 23},
        {"id": 153290, "name": "Víctor Gómez", "position": "Midfielder", "number": 2, "age": 25},
        {"id": 10115, "name": "Robson Bambu", "position": "Defender", "number": 3, "age": 28},
        {"id": 20884, "name": "S. Niakaté", "position": "Defender", "number": 4, "age": 26},
        {"id": 142484, "name": "Leonardo Lelo", "position": "Midfielder", "number": 5, "age": 25},
        {"id": 9355, "name": "Vitor Carvalho", "position": "Defender", "number": 6, "age": 28},
        {"id": 325165, "name": "Roger Fernandes", "position": "Midfielder", "number": 7, "age": 20},
        {"id": 2677, "name": "João Moutinho", "position": "Midfielder", "number": 8, "age": 39},
        {"id": 193188, "name": "A. El Ouazzani", "position": "Attacker", "number": 9, "age": 24},
        {"id": 108563, "name": "R. Zalazar", "position": "Attacker", "number": 10, "age": 26},
        {"id": 310196, "name": "Ismaël Gharbi", "position": "Midfielder", "number": 11, "age": 21},
        {"id": 41090, "name": "Tiago Sá", "position": "Goalkeeper", "number": 12, "age": 30},
        {"id": 137721, "name": "G. Lagerbielke", "position": "Defender", "number": 14, "age": 25},
        {"id": 47383, "name": "Paulo Oliveira", "position": "Defender", "number": 15, "age": 33},
        {"id": 284795, "name": "A. Bellaarouch", "position": "Goalkeeper", "number": 16, "age": 23},
        {"id": 415089, "name": "Gabriel Moscardo", "position": "Midfielder", "number": 17, "age": 20},
        {"id": 263530, "name": "Pau Victor", "position": "Attacker", "number": 18, "age": 24},
        {"id": 380434, "name": "M. Dorgeles", "position": "Midfielder", "number": 20, "age": 21},
        {"id": 41103, "name": "Ricardo Horta", "position": "Attacker", "number": 21, "age": 31},
        {"id": 162535, "name": "B. Arrey-Mbi", "position": "Defender", "number": 26, "age": 22},
        {"id": 719, "name": "Florian Grillitsch", "position": "Midfielder", "number": 27, "age": 30},
        {"id": 330722, "name": "Jean-Baptiste Gorby", "position": "Midfielder", "number": 29, "age": 19},
        {"id": 330295, "name": "J. Gorby", "position": "Midfielder", "number": 29, "age": 23},
        {"id": 287583, "name": "João Marques", "position": "Midfielder", "number": 33, "age": 23},
        {"id": 936, "name": "Fran Navarro", "position": "Attacker", "number": 39, "age": 27},
        {"id": 406848, "name": "Yanis da Rocha", "position": "Midfielder", "number": 41, "age": 21},
        {"id": 361371, "name": "Diego Rodrigues", "position": "Midfielder", "number": 50, "age": 20},
        {"id": 426799, "name": "Francisco Chissumba", "position": "Defender", "number": 55, "age": 20},
        {"id": 441522, "name": "Nuno Miguel Ferreira Matos", "position": "Defender", "number": 62, "age": 21},
        {"id": 449102, "name": "Afonso Patrão", "position": "Attacker", "number": 67, "age": 18},
        {"id": 531324, "name": "João Aragão", "position": "Attacker", "number": 72, "age": None},
        {"id": 297303, "name": "Gabri Martínez", "position": "Attacker", "number": 77, "age": 22},
        {"id": 496703, "name": "Sandro Vidigal", "position": "Attacker", "number": 95, "age": 18}
    ]}
}

# 첫 번째 배치 (4개 팀)
teams_batch_1 = ["Benfica", "FC Porto", "Sporting CP", "SC Braga"]

all_translations = {}

for team_name in teams_batch_1:
    team_data = players_data[team_name]
    players = team_data["players"]

    # 선수 이름 리스트 생성
    player_names = [f"{p['name']}" for p in players]

    prompt = f"""다음은 {team_name} 소속 선수들의 이름입니다. 각 선수 이름을 포르투갈어 발음 기준으로 한국어로 번역해주세요.

**번역 규칙:**
1. 포르투갈 이름 → 포르투갈어 발음 (예: "João" → "조앙", "Gonçalo" → "곤살루", "ç" → "ㅅ" 발음)
2. 브라질 선수 → 포르투갈어 발음 (예: "Pepê" → "페페")
3. 스페인 이름 → 스페인어 발음 (예: "Ángel" → "앙헬")
4. 기타 외국인 → 해당 언어 발음

**선수 목록:**
{chr(10).join([f"{i+1}. {name}" for i, name in enumerate(player_names)])}

**응답 형식 (JSON):**
{{
  "선수이름1": "한국어번역1",
  "선수이름2": "한국어번역2",
  ...
}}

중요: 반드시 JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요."""

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text.strip()

    # JSON 파싱
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    response_text = response_text.strip()

    translations = json.loads(response_text)
    all_translations[team_name] = translations
    print(f"✓ {team_name} 완료 ({len(translations)}명)")

# 결과 저장
with open("c:\\Users\\user\\Desktop\\web2\\primeira_translations_batch1.json", "w", encoding="utf-8") as f:
    json.dump(all_translations, f, ensure_ascii=False, indent=2)

print(f"\n배치 1 번역 완료! 파일 저장됨: primeira_translations_batch1.json")
