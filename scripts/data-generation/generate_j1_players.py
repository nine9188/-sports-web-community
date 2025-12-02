import os
from supabase import create_client

# Supabase 연결
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 일본어 이름 변환 매핑
def translate_to_korean(name, position=None):
    """선수 이름을 한국어로 변환"""

    # 한국 선수
    korean_names = {
        'Kim Jin-Hyeon': '김진현',
        'Kim Tae-Hyeon': '김태현',
        'Kim Seung-Gyu': '김승규',
        'Baek In-Hwan': '백인환',
        'Kim Moon-Hyeon': '김문현',
        'Cha Je-Hoon': '차재훈',
        'Na Sang-Ho': '나상호',
        'Oh Se-Hun': '오세훈',
        'Jung Sung-Ryong': '정성룡',
        'Gu Sung-Yun': '구성윤',
        'Yoon Sung-Jun': '윤성준',
        'Park Eui-Jeong': '박의정',
        'Park Il-Gyu': '박일규',
        'Jeong Min-Ki': '정민기',
        'Kim Ju-Sung': '김주성',
        'Kim Min-Tae': '김민태',
    }

    if name in korean_names:
        return korean_names[name]

    # 일본어 성씨 매핑
    japanese_surnames = {
        'Fujita': '후지타', 'Geria': '게리아', 'Okamoto': '오카모토', 'Fitzgerald': '피츠제럴드',
        'Taniguchi': '다니구치', 'Yamura': '야무라', 'Ochiai': '오치아이', 'Hayakawa': '하야카와',
        'Akiyama': '아키야마', 'Wakatsuki': '와카츠키', 'Hoshi': '호시', 'Tashiro': '타시로',
        'Arai': '아라이', 'Yoshimitsu': '요시미츠', 'Fujiwara': '후지와라', 'Okumura': '오쿠무라',
        'Horigome': '호리고메', 'Takagi': '타카기', 'Chiba': '치바', 'Mori': '모리',
        'Hasegawa': '하세가와', 'Hashimoto': '하시모토', 'Kasai': '카사이', 'Otake': '오타케',
        'Uemura': '우에무라', 'Boudah': '보우다', 'Ono': '오노', 'Uchiyama': '우치야마',
        'Yasuda': '야스다', 'Nagaishi': '나가이시', 'Yuzawa': '유자와', 'Nara': '나라',
        'Kamijima': '카미지마', 'Shigemi': '시게미', 'Konno': '콘노', 'Zahedi': '자헤디',
        'Jogo': '조고', 'Miki': '미키', 'Ben Khalifa': '벤 칼리파', 'Nago': '나고',
        'Akino': '아키노', 'Oda': '오다', 'Tanque': '탄케', 'Iwasaki': '이와사키',
        'Ando': '안도', 'Sugai': '스가이', 'Fujimoto': '후지모토', 'Obata': '오바타',
        'Kitajima': '키타지마', 'Usui': '우스이', 'Maejima': '마에지마', 'Murakami': '무라카미',
        'Tashiro': '타시로', 'Ikeda': '이케다', 'Sato': '사토', 'Suganuma': '스가누마',
        'Maeda': '마에다', 'Shichi': '시치', 'Matsuoka': '마츠오카', 'Takemoto': '타케모토',
        'Fukui': '후쿠이', 'Matsumoto': '마츠모토', 'Nakamura': '나카무라', 'Shindo': '신도',
        'Hirano': '히라노', 'Kida': '키다', 'Noborizato': '노보리자토', 'Uejo': '우에조',
        'Osako': '오사코', 'Kagawa': '카가와', 'Tanaka': '타나카', 'Funaki': '후나키',
        'Okuda': '오쿠다', 'Sakata': '사카타', 'Cendagorta': '센다고르타', 'Cools': '쿨스',
        'Furuyama': '후루야마', 'Nishio': '니시오', 'Yoshino': '요시노', 'Ezemuokwe': '에제무오퀘',
        'Hatanaka': '하타나카', 'Makiguchi': '마키구치', 'Shibayama': '시바야마', 'Ohata': '오하타',
        'Fernandes': '페르난데스', 'Kambayashi': '캄바야시', 'Isibor': '이시보르', 'Onoda': '오노다',
        'Sasaki': '사사키', 'Tatsuta': '타츠타', 'Abe': '아베', 'Yanagi': '야나기',
        'Wakasa': '와카사', 'Takeuchi': '타케우치', 'Esaka': '에사카', 'Ota': '오타',
        'Kanayama': '카나야마', 'Tabei': '타베이', 'Kudo': '쿠도', 'Iesaka': '이에사카',
        'Sueyoshi': '스에요시', 'Tagami': '타가미', 'Iwabuchi': '이와부치', 'Kawakami': '카와카미',
        'Ichimi': '이치미', 'Saga': '사가', 'Kimura': '키무라', 'Saito': '사이토',
        'Kamiya': '카미야', 'Miyamoto': '미야모토', 'Suzuki': '스즈키', 'Brodersen': '브로더센',
        'Kato': '카토', 'Popó': '포포', 'Lucão': '루카옹', 'Suemune': '스에무네',
        'Senda': '센다', 'Muroya': '무로야', 'Morishige': '모리시게', 'Kimoto': '키모토',
        'Nagatomo': '나가토모', 'Bangnagande': '방나간데', 'Anzai': '안자이', 'Ko': '코',
        'Higashi': '히가시', 'Ogashiwa': '오가시와', 'Hatano': '하타노', 'Yamashita': '야마시타',
        'Tsukagawa': '츠카가와', 'Terayama': '테라야마', 'Ryan': '라이언', 'Endo': '엔도',
        'Scholz': '숄츠', 'Kominato': '코미나토', 'Tokiwa': '토키와', 'Nozawa': '노자와',
        'Oka': '오카', 'Kobayashi': '코바야시', 'Doi': '도이', 'Tawaratsumida': '타와라츠미다',
        'Nishido': '니시도', 'Koizumi': '코이즈미', 'Nakagawa': '나카가와', 'Guilherme': '기예르메',
        'Trevisan': '트레비산', 'Kitahara': '키타하라', 'Yamaguchi': '야마구치', 'Galdino': '갈디노',
        'Shirai': '시라이', 'Goto': '고토', 'Higashiguchi': '히가시구치', 'Fukuoka': '후쿠오카',
        'Handa': '한다', 'Kurokawa': '쿠로카와', 'Miura': '미우라', 'Usami': '우사미',
        'Hayashi': '하야시', 'Meshino': '메시노', 'Kurata': '쿠라타', 'Jebali': '제발리',
        'Kishimoto': '키시모토', 'Nakatani': '나카타니', 'Hatsuse': '하츠세', 'Ichimori': '이치모리',
        'Hümmet': '휨메트', 'Egawa': '에가와', 'Mito': '미토', 'Ao lin': '아오린',
        'Yamamoto': '야마모토', 'Nawata': '나와타', 'Minamino': '미나미노', 'Nobata': '노바타',
        'Okunuki': '오쿠누키', 'Alano': '알라노', 'Felipe': '펠리페', 'Hata': '하타',
        'Anzai': '안자이', 'Sekigawa': '세키가와', 'Misao': '미사오', 'Ogawa': '오가와',
        'Ceará': '세아라', 'Shibasaki': '시바사키', 'Tagawa': '타가와', 'Chinen': '치넨',
        'Higuchi': '히구치', 'Talles': '탈레스', 'Morooka': '모로오카', 'Funabashi': '후나바시',
        'Nono': '노노', 'Tsukui': '츠쿠이', 'Koike': '코이케', 'Matsumura': '마츠무라',
        'Mizoguchi': '미조구치', 'Kajikawa': '카지카와', 'Yamada': '야마다', 'Tokuda': '토쿠다',
        'Sanada': '사나다', 'Takahashi': '타카하시', 'Ueda': '우에다', 'Araki': '아라키',
        'Čavrić': '차브리치', 'Motosuna': '모토스나', 'Yoshida': '요시다', 'Saruta': '사루타',
        'Mitsumaru': '미츠마루', 'Diego': '디에고', 'Koga': '코가', 'Koizumi': '코이즈미',
        'Hosoya': '호소야', 'Masa': '마사', 'Inukai': '이누카이', 'Koyamatsu': '코야마츠',
        'Komi': '코미', 'Katayama': '카타야마', 'Tezuka': '테즈카', 'Kakita': '카키타',
        'Mohamado': '모하마도', 'Nakama': '나카마', 'Konishi': '코니시', 'Noda': '노다',
        'Kubo': '쿠보', 'Kojima': '코지마', 'Sugioka': '스기오카', 'Kumasaka': '쿠마사카',
        'Toshima': '토시마', 'Nagai': '나가이', 'Shimamura': '시마무라', 'Naruse': '나루세',
        'Yamanouchi': '야마노우치', 'Nakajima': '나카지마', 'Harakawa': '하라카와', 'Sakata': '사카타',
        'Harada': '하라다', 'Kumasawa': '쿠마사와', 'Baba': '바바', 'Chonan': '초난',
        'Kuwata': '쿠와타', 'Furusawa': '후루사와', 'Kamo': '카모', 'Takai': '타카이',
        'Jesiel': '제시엘', 'Kurumaya': '쿠루마야', 'Tachibanada': '타치바나다', 'Erison': '에리손',
        'Oshima': '오시마', 'Wakizaka': '와키자카', 'Tanabe': '타나베', 'Ozeki': '오제키',
        'Ito': '이토', 'Segawa': '세가와', 'Kawahara': '카와하라', 'Uremović': '우레모비치',
        'Marcinho': '마르시뉴', 'Miyagi': '미야기', 'Yamauchi': '야마우치', 'Kamihashi': '카미하시',
        'Verhon': '베르혼', 'Myogan': '묘간', 'Wermeskerken': '베르메스케르켄', 'Maruyama': '마루야마',
        'Mochiyama': '모치야마', 'Tsuchiya': '츠치야', 'Haydar': '하이다르', 'Romanić': '로마니치',
        'Izawa': '이자와', 'Matsuzawa': '마츠자와', 'Iida': '이이다', 'Asada': '아사다',
        'William': '윌리엄', 'Tawiah': '타위아', 'Pedro': '페드루', 'Kawasaki': '카와사키',
        'Yonemoto': '요네모토', 'Elias': '엘리아스', 'Túlio': '툴리오', 'Hara': '하라',
        'Nagata': '나가타', 'Gomes': '고메스', 'Takeda': '타케다', 'Matsuda': '마츠다',
        'Kita': '키타', 'Kakoi': '카코이', 'Miyamoto': '미야모토', 'Okugawa': '오쿠가와',
        'Hiraga': '히라가', 'Hirato': '히라토', 'Nakano': '나카노', 'Barreto': '바헤투',
        'Nagasawa': '나가사와', 'Vito': '비토', 'Fantini': '판티니', 'Tani': '타니',
        'Shōji': '쇼지', 'Kikuchi': '키쿠치', 'Drešević': '드레셰비치', 'Mochizuki': '모치즈키',
        'Soma': '소마', 'Sento': '센토', 'Fujio': '후지오', 'Masuyama': '마스야마',
        'Morita': '모리타', 'Duke': '듀크', 'Mae': '마에', 'Shimoda': '시모다',
        'Nakayama': '나카야마', 'Nishimura': '니시무라', 'Numata': '누마타', 'Shirasaki': '시라사키',
        'Kuwayama': '쿠와야마', 'Burns': '번스', 'Okamura': '오카무라', 'Mayaka': '마야카',
        'Zan Mara': '잔 마라', 'Takasaki': '타카사키', 'Schmidt': '슈미트', 'Kodama': '코다마',
        'Nogami': '노가미', 'Kawazura': '카와즈라', 'Izumi': '이즈미', 'Shiihashi': '시이하시',
        'Asano': '아사노', 'Mateus': '마테우스', 'Yamagishi': '야마기시', 'Morishima': '모리시마',
        'Inagaki': '이나가키', 'Uchida': '우치다', 'Mikuni': '미쿠니', 'Sugimoto': '스기모토',
        'Nakayama': '나카야마', 'Sugiura': '스기우라', 'Kikuchi': '키쿠치', 'Pisano': '피사노',
        'Tokumoto': '토쿠모토', 'Yamanaka': '야마나카', 'Sakakibara': '사카키바라', 'Junker': '융커',
        'Lelê': '렐레', 'Mawuto': '마우토', 'Onishi': '오니시', 'Yamasaki': '야마사키',
        'Kawabe': '카와베', 'Germain': '제르맹', 'Júnior': '주니오르', 'Iyoha': '이요하',
        'Kinoshita': '키노시타', 'Suga': '스가', 'Inoue': '이노우에', 'Chajima': '차지마',
        'Arslan': '아르슬란', 'Koshimichi': '코시미치', 'Shiotani': '시오타니', 'Kominato': '코미나토',
        'Hill': '힐', 'Ohara': '오하라', 'Semba': '센바', 'Mitsuta': '미츠타',
        'Kawanami': '카와나미', 'Sota': '소타', 'Ogawa': '오가와', 'Oki': '오키',
        'Fukuda': '후쿠다', 'Hasukawa': '하스카와', 'Kitazume': '키타즈메', 'Capixaba': '카픽사바',
        'Kozuka': '코즈카', 'Nakahara': '나카하라', 'Yamahara': '야마하라', 'Umeda': '우메다',
        'Yumiba': '유미바', 'Matsuzaki': '마츠자키', 'Yajima': '야지마', 'Kitagawa': '키타가와',
        'Brunetti': '브루네티', 'Gunji': '군지', 'Ahmedov': '아흐메도프', 'Inui': '이누이',
        'Uno': '우노', 'Ohata': '오하타', 'Haneda': '하네다', 'Shimamoto': '시마모토',
        'Kotake': '코타케', 'Stephens': '스티븐스', 'Nishihara': '니시하라', 'Sumiyoshi': '스미요시',
        'Inokoshi': '이노코시', 'Bueno': '부에노', 'Iwanaga': '이와나가', 'Iwao': '이와오',
        'Kemmotsu': '켐모츠', 'Tachi': '타치', 'Ricardo': '히카르도', 'Onose': '오노세',
        'Ohno': '오노', 'Oda': '오다', 'Hiraoka': '히라오카', 'Barada': '바라다',
        'Okuno': '오쿠노', 'Nemoto': '네모토', 'Tamura': '타무라', 'Ishibashi': '이시바시',
        'Oiwa': '오이와', 'Phellype': '펠리페', 'Watanabe': '와타나베', 'Itohara': '이토하라',
        'Nakano': '나카노', 'Ishii': '이시이', 'Kamifukumoto': '카미후쿠모토', 'Honda': '혼다',
        'Vidotto': '비도토', 'Fukazawa': '후카자와', 'Hayashi': '하야시', 'Tsunashima': '츠나시마',
        'Chida': '치다', 'Miyahara': '미야하라', 'Someno': '소메노', 'Yamami': '야마미',
        'Fukuda': '후쿠다', 'Hirakawa': '히라카와', 'Inami': '이나미', 'Matsuhashi': '마츠하시',
        'Mawatari': '마와타리', 'Onaga': '오나가', 'Kumatoriya': '쿠마토리야', 'Uchida': '우치다',
        'Sako': '사코', 'Kawamura': '카와무라', 'Toyama': '토야마', 'Teranuma': '테라누마',
        'Mansour': '만수르', 'Hirao': '히라오', 'Nishikawa': '니시카와', 'Boza': '보자',
        'Ishihara': '이시하라', 'Høibråten': '회이브로텐', 'Sávio': '사비오', 'Haraguchi': '하라구치',
        'Gustafson': '구스타프손', 'Santana': '산타나', 'Sekine': '세키네', 'Niekawa': '니에카와',
        'Komori': '코모리', 'Homma': '혼마', 'Nagakura': '나가쿠라', 'Okubo': '오쿠보',
        'Shibato': '시바토', 'Matsuo': '마츠오', 'Yasui': '야스이', 'Ogiwara': '오기와라',
        'Teruuchi': '테루우치', 'Nemoto': '네모토', 'Fujiwara': '후지와라', 'Hayakawa': '하야카와',
        'Nitta': '닛타', 'Kaneko': '카네코', 'Naganuma': '나가누마', 'Thelin': '텔린',
        'Malcolm': '말콤', 'Hidano': '히다노', 'Wada': '와다', 'Maekawa': '마에카와',
        'Iino': '이이노', 'Thuler': '툴레르', 'Yamakawa': '야마카와', 'Ohgihara': '오기하라',
        'Ideguchi': '이데구치', 'Miyashiro': '미야시로', 'Muto': '무토', 'Yuruki': '유루키',
        'Caetano': '카이타노', 'Ide': '이데', 'Motoyama': '모토야마', 'Hirose': '히로세',
        'Sakai': '사카이', 'Kuwasaki': '쿠와사키', 'Patrick': '파트릭', 'Erik': '에리크',
        'Komatsu': '코마츠', 'Iwanami': '이와나미', 'Ubong': '우봉', 'Tominaga': '토미나가',
        'Hidaka': '히다카', 'Obi': '오비', 'Seguchi': '세구치', 'Hamasaki': '하마사키',
        'Satomi': '사토미', 'Irie': '이리에', 'Gonda': '곤다', 'Klismahn': '클리스만',
        'Megiolaro': '메지올라로', 'Ishii': '이시이', 'Nduka': '은두카', 'Lara': '라라',
        'Fukumori': '후쿠모리', 'Komai': '코마이', 'Takae': '타카에', 'Yamane': '야마네',
        'Sakuragawa': '사쿠라가와', 'Paulo': '파울로', 'Cendagorta': '센다고르타', 'Eerden': '에르덴',
        'Murata': '무라타', 'Ichikawa': '이치카와', 'Iwatake': '이와타케', 'Michel': '미셸',
        'Kubota': '쿠보타', 'Słowik': '스워비크', 'Bahia': '바이아', 'Kumakura': '쿠마쿠라',
        'Yamazaki': '야마자키', 'Muroi': '무로이', 'Ogura': '오구라', 'Shibuya': '시부야',
        'Miyata': '미야타', 'Shimbo': '심보', 'Komazawa': '코마자와', 'Hosoi': '호소이',
        'Adaílton': '아다일톤', 'Lukian': '루키안', 'Hata': '하타', 'Tsukuda': '츠쿠다',
        'Popp': '포프', 'Nagato': '나가토', 'Quiñónes': '키뇨네스', 'Uenaka': '우에나카',
        'Onaiwu': '오나이우', 'Iikura': '이이쿠라', 'Tsunoda': '츠노다', 'Miyaichi': '미야이치',
        'David': '다비드', 'Matsubara': '마츠바라', 'Araújo': '아라우조', 'Suwama': '스와마',
        'Sekitomi': '세키토미', 'Kanta': '칸타', 'Croux': '크루', 'Noguchi': '노구치',
        'Deng': '덩', 'Aziangbe': '아지앙베', 'Asada': '아사다', 'Yamamura': '야마무라',
        'Tanimura': '타니무라',
    }

    # 성으로 분리
    parts = name.split()
    if len(parts) > 0:
        surname = parts[0]
        if surname in japanese_surnames:
            # 성이 매핑에 있으면 사용
            korean_surname = japanese_surnames[surname]

            # 이름 부분 처리
            if len(parts) > 1:
                given_name = parts[1]
                # 이니셜인 경우 (예: K., Y.)
                if len(given_name) <= 2 and given_name.endswith('.'):
                    return f"{korean_surname} {given_name[0]}."
                else:
                    # 전체 이름 그대로 사용
                    return f"{korean_surname} {given_name}"
            else:
                return korean_surname

    # 매핑을 찾지 못한 경우 원본 반환
    return name

# 팀 정보
teams = [
    {'team_id': 311, 'name': 'Albirex Niigata', 'const_name': 'ALBIREX_NIIGATA'},
    {'team_id': 316, 'name': 'Avispa Fukuoka', 'const_name': 'AVISPA_FUKUOKA'},
    {'team_id': 291, 'name': 'Cerezo Osaka', 'const_name': 'CEREZO_OSAKA'},
    {'team_id': 310, 'name': 'Fagiano Okayama', 'const_name': 'FAGIANO_OKAYAMA'},
    {'team_id': 292, 'name': 'FC Tokyo', 'const_name': 'FC_TOKYO'},
    {'team_id': 293, 'name': 'Gamba Osaka', 'const_name': 'GAMBA_OSAKA'},
    {'team_id': 290, 'name': 'Kashima', 'const_name': 'KASHIMA'},
    {'team_id': 281, 'name': 'Kashiwa Reysol', 'const_name': 'KASHIWA_REYSOL'},
    {'team_id': 294, 'name': 'Kawasaki Frontale', 'const_name': 'KAWASAKI_FRONTALE'},
    {'team_id': 302, 'name': 'Kyoto Sanga', 'const_name': 'KYOTO_SANGA'},
    {'team_id': 303, 'name': 'Machida Zelvia', 'const_name': 'MACHIDA_ZELVIA'},
    {'team_id': 288, 'name': 'Nagoya Grampus', 'const_name': 'NAGOYA_GRAMPUS'},
    {'team_id': 282, 'name': 'Sanfrecce Hiroshima', 'const_name': 'SANFRECCE_HIROSHIMA'},
    {'team_id': 283, 'name': 'Shimizu S-pulse', 'const_name': 'SHIMIZU_S_PULSE'},
    {'team_id': 284, 'name': 'Shonan Bellmare', 'const_name': 'SHONAN_BELLMARE'},
    {'team_id': 306, 'name': 'Tokyo Verdy', 'const_name': 'TOKYO_VERDY'},
    {'team_id': 287, 'name': 'Urawa', 'const_name': 'URAWA'},
    {'team_id': 289, 'name': 'Vissel Kobe', 'const_name': 'VISSEL_KOBE'},
    {'team_id': 307, 'name': 'Yokohama FC', 'const_name': 'YOKOHAMA_FC'},
    {'team_id': 296, 'name': 'Yokohama F. Marinos', 'const_name': 'YOKOHAMA_F_MARINOS'},
]

print("J1 League 선수 데이터 가져오는 중...")

# 모든 선수 데이터 가져오기
all_players = []
for team in teams:
    response = supabase.table('football_players').select('*').eq('team_id', team['team_id']).eq('is_active', True).order('number.nullslast', desc=False).order('name').execute()

    players = response.data
    print(f"{team['name']}: {len(players)}명")

    for player in players:
        player['korean_name'] = translate_to_korean(player['name'], player.get('position'))
        player['team_name'] = team['name']
        player['const_name'] = team['const_name']

    all_players.extend(players)

print(f"\n총 {len(all_players)}명 처리 완료")

# TypeScript 파일 생성
output_path = r"c:\Users\user\Desktop\web2\123\1234\src\domains\livescore\constants\players\j1-league.ts"

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("import { PlayerMapping } from './index';\n\n")
    f.write("// J1 League Players\n\n")

    # 팀별로 그룹화
    for team in teams:
        team_players = [p for p in all_players if p['const_name'] == team['const_name']]

        if not team_players:
            continue

        f.write(f"// {team['name']}\n")
        f.write(f"export const {team['const_name']}_PLAYERS: PlayerMapping[] = [\n")

        for player in team_players:
            number_str = str(player['number']) if player['number'] is not None else 'null'
            age_str = str(player['age']) if player['age'] is not None else 'null'
            position_str = f'"{player["position"]}"' if player['position'] else 'null'

            f.write(f'  {{ id: {player["player_id"]}, name: "{player["name"]}", korean_name: "{player["korean_name"]}", team_id: {player["team_id"]}, position: {position_str}, number: {number_str}, age: {age_str} }},\n')

        f.write("];\n\n")

    # 전체 배열 생성
    f.write("export const J1_LEAGUE_PLAYERS: PlayerMapping[] = [\n")
    for team in teams:
        f.write(f"  ...{team['const_name']}_PLAYERS,\n")
    f.write("];\n")

print(f"\n파일 생성 완료: {output_path}")
