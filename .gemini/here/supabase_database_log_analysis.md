# Supabase 데이터베이스 로그 분석: Ambiguous "oid" 에러 보고서

제공해주신 Supabase PostgreSQL 서버 로그에서 발생한 `column reference "oid" is ambiguous` 에러에 대한 원인 분석 및 해결 방안 보고서입니다.

---

## 1. 에러의 의미 및 원인
PostgreSQL에서 `oid` (Object Identifier)는 시스템 카탈로그 테이블(예: `pg_class`, `pg_proc`, `pg_attribute` 등)에서 테이블, 뷰, 함수, 타입 등의 데이터베이스 객체를 식별하기 위해 사용하는 **내부 시스템 컬럼**입니다.

**`ERROR: column reference "oid" is ambiguous`** 에러는 여러 개의 카탈로그 테이블을 조인(JOIN)하여 쿼리를 수행할 때, 여러 소스에 동일한 `oid` 컬럼이 존재함에도 불구하고 이를 명확히 한정(Qualify)하지 않고 단순히 `oid`로만 조회(SELECT/WHERE 등)할 때 PostgreSQL 엔진이 모호성을 판별하여 에러를 던지는 현상입니다.

---

## 2. 발생 배경: DB 클라이언트 스키마 분석 (Introspection)
로그의 타임스탬프와 정황을 분석한 결과:
1. **연결 직후 실행:** 에러는 `postgres` 관리자 계정으로 접속 및 인증(Authenticated)이 완료된 후 **수십 밀리초(ms) 이내**에 즉시 발생합니다.
2. **메타데이터 조회 (Introspection):** **DBeaver**, **DataGrip**, **pgAdmin** 또는 이전 버전의 ORM 동기화 유틸리티와 같은 외부 DB 관리 도구는 데이터베이스에 접속하는 즉시 테이블 목록, 컬럼 사양, 함수 정의 등을 파악하기 위해 시스템 카탈로그에 대한 메타데이터 조회 쿼리를 자동으로 실행합니다.
3. **PostgreSQL 버전 호환성:** Supabase가 사용하는 PostgreSQL 15 및 16 버전에서 일부 시스템 카탈로그 뷰 구조가 변경되었습니다. 이로 인해 최신 PG 버전을 지원하지 않는 구버전 DB 클라이언트 도구가 예전 방식의 카탈로그 조회 쿼리를 보냈을 때 `oid` 컬럼 모호성 에러가 발생하여 로그에 기록되는 것입니다.

---

## 3. 웹 서비스 및 소스코드 영향도 검증
이 에러가 현재 개발 중인 Next.js 애플리케이션에 미치는 영향을 검증했습니다.

* **코드베이스 내 조회 부재:** 전체 소스코드(`src/`) 내에서 `"oid"` 문자열을 사용하는 데이터베이스 조회 쿼리가 존재하는지 검색한 결과, **애플리케이션 내에는 어떠한 `oid` 관련 쿼리도 없음**을 확인했습니다.
* **퍼블릭 스키마 검증:** `public` 스키마 내의 사용자 정의 테이블 및 뷰 컬럼들을 전수 검사한 결과, **사용자가 직접 생성한 테이블 중 `oid`라는 이름을 가진 컬럼은 존재하지 않습니다.**
* **구체화된 뷰(Materialized View) 확인:** `public.hot_posts_7d` 뷰 정의와 인덱스를 점검하고 수동으로 `REFRESH MATERIALIZED VIEW CONCURRENTLY` 명령을 수행해본 결과, 정상적으로 완료되었으며 본 에러는 발생하지 않았습니다.

> [!NOTE]  
> 결론적으로 이 에러는 **외부 DB 툴이 연결 직후 보내는 메타데이터 쿼리 때문에 기록된 것**이며, Next.js 웹 서비스 런타임이나 Supabase API 요청의 동작에는 **아무런 영향을 주지 않는 무해한 에러 로그**입니다.

---

## 4. 해결 및 예방 방법 (DB 클라이언트 설정)
만약 Supabase 데이터베이스 로그에 이 에러가 지속해서 찍히는 것을 방지하거나 사용 중인 DB 툴의 오류를 해결하려면 다음 조치를 취하십시오:

1. **DB 클라이언트 도구 업데이트:** DBeaver, DataGrip, pgAdmin 등을 최신 버전으로 업데이트하십시오. 최신 버전의 툴들은 PostgreSQL 15/16의 카탈로그 조회 쿼리 호환성 패치가 이미 적용되어 있습니다.
2. **JDBC 메타데이터 사용 설정 (DataGrip/IntelliJ):** DataGrip의 데이터 소스 속성(Data Source Properties)에서 **Advanced** 탭으로 이동한 뒤, **"Introspect using JDBC metadata"** 옵션을 `true`로 설정하십시오. 이 설정을 켜면 시스템 카탈로그를 직접 쿼리하는 대신 표준 JDBC 드라이버 API를 사용하게 되어 에러가 발생하지 않습니다.
3. **스키마 필터링 설정:** DB 툴의 연결 속성에서 전체 시스템 스키마(`pg_catalog`, `information_schema` 등) 대신 작업에 필요한 `public` 스키마만 조회하도록 메타데이터 범위를 제한하십시오.
