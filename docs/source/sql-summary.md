# SQL 문법 요약 (SQLD 2과목, 1~18단원)

기준 DBMS는 Oracle이다. SQL Server와 동작이 다른 부분은 "🔹 SQL Server"로 표시한다. 시험에서 자주 틀리는 함정 포인트는 ⚠️로 표시한다.

---

## 1. SELECT 기본과 실행 순서

### 1.1 SELECT 문 논리적 실행 순서

```
FROM → ON → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → OFFSET/FETCH
```

- 작성 순서(SELECT ... FROM ... WHERE ...)와 실행 순서는 다르다.
- ⚠️ SELECT절에서 정의한 컬럼 별칭(alias)은 WHERE·GROUP BY·HAVING에서 쓸 수 없다. SELECT가 이들보다 나중에 실행되기 때문이다. 단 ORDER BY는 SELECT 이후에 실행되므로 별칭을 쓸 수 있다.
- WHERE는 그룹화 전 행을 거르고, HAVING은 그룹화 후 그룹을 거른다. ⚠️ 집계 함수(SUM, COUNT 등)는 WHERE절에 쓸 수 없고 HAVING에서 써야 한다.

### 1.2 ALIAS(별칭) 범위

- 테이블 별칭을 FROM절에서 지정하면, 그 쿼리 안에서는 원래 테이블명 대신 별칭만 써야 한다.
- 컬럼 별칭은 큰따옴표 없이 쓰면 대문자로 저장되고 공백·예약어 포함 시 큰따옴표가 필요하다.

### 1.3 ORDER BY

- 컬럼명, 별칭, SELECT절의 컬럼 순번(숫자)으로 정렬 지정 가능. 예: `ORDER BY 2 DESC`
- 여러 컬럼 정렬 시 왼쪽부터 우선순위를 가진다.

### 1.4 NULL 정렬

- ⚠️ Oracle은 기본적으로 ASC일 때 NULL을 가장 마지막에, DESC일 때 NULL을 가장 먼저 배치한다(NULLS LAST가 ASC 기본값).
- `NULLS FIRST` / `NULLS LAST`로 명시적으로 지정할 수 있다.
- 🔹 SQL Server는 기본적으로 NULL을 가장 작은 값처럼 취급해 ASC에서 가장 먼저 나온다. Oracle과 정반대이므로 자주 출제되는 비교 포인트다.

---

## 2. 연산자

### 2.1 비교 연산자

`=`, `!=` / `<>` / `^=`(동일 의미), `>`, `<`, `>=`, `<=`

### 2.2 SQL 연산자

- `BETWEEN a AND b` : a ≤ x ≤ b (양끝 포함)
- `IN (list)` : 목록 중 하나와 일치
- `LIKE` : 패턴 비교, `%`(0개 이상 임의 문자), `_`(정확히 1개 문자)
  - `ESCAPE` 절로 `%`, `_` 자체를 리터럴로 검색 가능: `LIKE '50\%' ESCAPE '\'`
- `IS NULL` / `IS NOT NULL` : NULL 비교는 반드시 이 연산자를 써야 한다. ⚠️ `= NULL`은 항상 UNKNOWN이라 결과가 없다.

### 2.3 NOT IN과 NULL

- ⚠️ `col NOT IN (10, NULL)` 처럼 IN 목록에 NULL이 하나라도 섞이면, 모든 비교가 UNKNOWN이 되어 결과가 0건이 된다.
- 반면 `col IN (10, NULL)`은 NULL 자체와는 매칭되지 않지만 나머지 값과는 정상 비교된다(다른 행은 정상적으로 10과 일치하면 조회됨).
- 서브쿼리로 만든 IN/NOT IN 목록에 NULL이 섞여 들어가는 경우도 같은 함정이 발생한다 (6단원 참고).

### 2.4 연산자 우선순위

```
1. 산술 연산자 (*, / ) > (+, -)
2. 연결 연산자 ( || )
3. 비교 연산자
4. NOT
5. AND
6. OR
```

- ⚠️ AND가 OR보다 먼저 계산된다. `WHERE a=1 OR b=2 AND c=3`은 `WHERE a=1 OR (b=2 AND c=3)`과 같다. 의도한 순서가 아니면 괄호로 명시해야 한다.

---

## 3. 단일행 함수

### 3.1 문자 함수

| 함수 | 설명 | 예시 |
| --- | --- | --- |
| `LOWER` / `UPPER` / `INITCAP` | 소문자/대문자/첫글자만 대문자 | `INITCAP('seoul')` → `'Seoul'` |
| `SUBSTR(str, start, len)` | 부분 문자열 | `SUBSTR('ABCDEF', 2, 3)` → `'BCD'` |
| `LENGTH` / `LENGTHB` | 문자 수 / 바이트 수 | 한글은 LENGTH와 LENGTHB 결과가 다름 |
| `INSTR(str, substr, [start], [occur])` | 위치 찾기 | `INSTR('ABCABC','B',1,2)` → `5` |
| `LPAD` / `RPAD` | 왼쪽/오른쪽 채움 | `LPAD('5', 3, '0')` → `'005'` |
| `LTRIM` / `RTRIM` / `TRIM` | 좌/우/양쪽 제거 | `TRIM('  ab  ')` → `'ab'` |
| `REPLACE(str, old, new)` | 치환 | `REPLACE('ABCA','A','X')` → `'XBCX'` |
| `CONCAT(a, b)` | 문자열 연결(인자 2개만) | 3개 이상 연결은 `\|\|` 사용 |

- ⚠️ `SUBSTR`의 시작 위치가 음수이면 문자열 뒤에서부터 센다. `SUBSTR('ABCDEF', -3, 2)` → 뒤에서 3번째 'D'부터 2글자 → `'DE'`.
- ⚠️ `CONCAT`은 인자를 2개까지만 받는다. 3개 이상을 연결하려면 `||`를 쓰거나 `CONCAT`을 중첩해야 한다.

### 3.2 숫자 함수

| 함수 | 설명 | 예시 |
| --- | --- | --- |
| `ROUND(n, [d])` | 반올림(d자리) | `ROUND(123.456, 1)` → `123.5` |
| `TRUNC(n, [d])` | 버림(d자리) | `TRUNC(123.456, 1)` → `123.4` |
| `MOD(n, m)` | 나머지 | `MOD(10, 3)` → `1` |
| `CEIL` / `FLOOR` | 올림/내림(정수) | `CEIL(4.1)` → `5`, `FLOOR(4.9)` → `4` |
| `POWER(n, m)` | 거듭제곱 | `POWER(2,3)` → `8` |
| `SIGN(n)` | 부호(1/0/-1) | |
| `ABS(n)` | 절댓값 | |

- ⚠️ `ROUND`와 `TRUNC`에 음수 자릿수(d)를 주면 소수점이 아니라 정수부 자리에서 반올림/버림한다. `ROUND(1250, -2)` → `1300`, `TRUNC(1250, -2)` → `1200`.
- ⚠️ `ROUND`는 반올림(0.5는 올림), `TRUNC`는 무조건 버림이라는 점이 자주 헷갈린다.

### 3.3 날짜 함수

| 함수 | 설명 |
| --- | --- |
| `SYSDATE` | 현재 날짜·시각 |
| `ADD_MONTHS(d, n)` | n개월 후(음수면 이전) |
| `MONTHS_BETWEEN(d1, d2)` | 두 날짜 사이의 개월 수(소수 가능) |
| `NEXT_DAY(d, '요일')` | d 이후 가장 가까운 지정 요일 |
| `LAST_DAY(d)` | 해당 월의 마지막 날 |
| `EXTRACT(YEAR/MONTH/DAY FROM d)` | 날짜 구성요소 추출 |

- 날짜 연산: `날짜 + 숫자` = 숫자만큼 날짜가 더해진 날짜. `날짜 - 날짜` = 두 날짜 사이의 일수(숫자).
- ⚠️ `날짜 + 날짜`는 불가능하다(에러). 반드시 날짜±숫자, 날짜-날짜 형태여야 한다.

### 3.4 변환 함수

| 함수 | 설명 |
| --- | --- |
| `TO_CHAR(값, [포맷])` | 숫자·날짜 → 문자 |
| `TO_NUMBER(문자, [포맷])` | 문자 → 숫자 |
| `TO_DATE(문자, [포맷])` | 문자 → 날짜 |

- 날짜 포맷 모델 예: `YYYY-MM-DD`, `HH24:MI:SS`, `YYYY"년" MM"월"`
- ⚠️ 암시적 형변환(implicit conversion): Oracle이 타입을 자동으로 맞춰주지만, 조건에 따라 인덱스를 못 쓰거나 의도와 다른 비교가 될 수 있어 명시적 변환이 안전하다.

### 3.5 NULL 처리 함수

| 함수 | 설명 | 비고 |
| --- | --- | --- |
| `NVL(expr1, expr2)` | expr1이 NULL이면 expr2 반환 | |
| `NVL2(expr1, expr2, expr3)` | expr1이 NULL이 아니면 expr2, NULL이면 expr3 | |
| `NULLIF(expr1, expr2)` | expr1 = expr2이면 NULL, 다르면 expr1 반환 | ⚠️ `NULLIF(a,b)` → a=b이면 NULL, 다르면 a |
| `COALESCE(e1, e2, ...)` | 인자 중 첫 번째 NULL이 아닌 값 반환 | 인자 여러 개 가능(NVL의 확장판) |

### 3.6 CASE / DECODE

```sql
-- DECODE: 값이 완전히 같을 때만 매칭, 범위 비교 불가
DECODE(status, 'A', '정상', 'B', '보류', '기타')

-- CASE: 조건식(비교/범위) 사용 가능
CASE WHEN score >= 90 THEN 'A'
     WHEN score >= 80 THEN 'B'
     ELSE 'C' END
```

- ⚠️ `DECODE`는 NULL과 NULL을 같다고 취급해 매칭시키는 유일한 비교 함수다. 반면 `CASE`는 표준 비교를 쓰므로 `CASE WHEN col = NULL`은 항상 거짓이며, NULL을 확인하려면 `CASE WHEN col IS NULL`을 써야 한다.
- `DECODE`는 Oracle 전용 함수이고, `CASE`는 표준 SQL이라 SQL Server에서도 그대로 쓸 수 있다.

---

## 4. 집계 함수와 GROUP BY/HAVING

### 4.1 집계 함수와 NULL

- `COUNT(*)` : NULL을 포함한 전체 행 수.
- `COUNT(컬럼)` : 해당 컬럼이 NULL이 아닌 행만 센다.
- ⚠️ `COUNT(*)`와 `COUNT(컬럼)`은 NULL이 있는 컬럼일 경우 결과가 다르다.
- `SUM`, `AVG`, `MAX`, `MIN`은 모두 NULL을 계산에서 제외한다.
- ⚠️ `AVG(컬럼)`은 NULL인 행을 분모에서 제외한 평균이다. 전체 행 수로 나눈 평균이 아니다. (`SUM(col) / COUNT(*)`와 `AVG(col)`은 NULL이 있으면 값이 달라질 수 있다.)

### 4.2 GROUP BY / HAVING

- SELECT절에 집계되지 않은 컬럼은 반드시 GROUP BY에 포함돼야 한다.
- GROUP BY 기준 컬럼에 NULL이 있으면, 모든 NULL 값을 하나의 그룹으로 묶는다.
- HAVING은 그룹화된 결과(집계값)에 대한 조건이며, WHERE보다 늦게(그룹화 이후) 실행된다.

---

## 5. 조인

### 5.1 INNER JOIN

```sql
SELECT * FROM A JOIN B ON A.id = B.id;
-- 구식 표기(Oracle):
SELECT * FROM A, B WHERE A.id = B.id;
```

양쪽 테이블에서 조건을 만족하는 행만 반환한다.

### 5.2 OUTER JOIN

```sql
SELECT * FROM A LEFT OUTER JOIN B ON A.id = B.id;
-- Oracle 전통 표기: 조건이 없는(기준) 쪽 반대편에 (+)를 붙인다
SELECT * FROM A, B WHERE A.id = B.id(+);   -- A LEFT OUTER JOIN B
```

- ⚠️ `(+)`는 "값이 없을 수도 있는(결과가 부족한) 쪽" 컬럼에 붙인다. `A.id = B.id(+)`는 B가 없어도 A는 모두 나오는 LEFT OUTER JOIN이다. 반대로 붙이면 RIGHT가 된다.
- ⚠️ `(+)`는 한쪽에만 붙일 수 있다. 양쪽에 붙이면(Oracle은 FULL OUTER를 (+)로 표현 불가) 에러가 난다. FULL OUTER JOIN이 필요하면 `FULL OUTER JOIN` 키워드를 쓰거나 LEFT UNION RIGHT로 구성해야 한다.
- 🔹 SQL Server는 `(+)` 문법을 지원하지 않는다. `LEFT/RIGHT/FULL OUTER JOIN` 키워드만 사용한다.

### 5.3 NATURAL JOIN / USING

- `NATURAL JOIN` : 두 테이블의 이름과 타입이 같은 모든 컬럼을 자동으로 조인 조건에 사용한다. ⚠️ 의도치 않은 컬럼까지 조인 조건에 끼면 결과가 틀어질 수 있어 실무에서는 잘 안 쓴다.
- `JOIN ... USING(컬럼명)` : 특정 공통 컬럼만 지정해 조인. ⚠️ USING에 쓰인 컬럼은 테이블 별칭을 붙여 참조할 수 없다(`A.id`처럼 쓰면 에러).

### 5.4 CROSS JOIN / SELF JOIN

- `CROSS JOIN` : 두 테이블의 카티션 곱(모든 조합).
- SELF JOIN : 같은 테이블을 별칭으로 두 번 참조해 조인(예: 사원-관리자 관계).

---

## 6. 서브쿼리

### 6.1 종류

| 종류 | 설명 |
| --- | --- |
| 단일행 서브쿼리 | 결과가 1행. `=`, `>`, `<` 등으로 비교 |
| 다중행 서브쿼리 | 결과가 여러 행. `IN`, `ANY`, `ALL`, `EXISTS`로 비교 |
| 연관(상관) 서브쿼리 | 내부 쿼리가 외부 쿼리의 컬럼을 참조, 외부 행마다 재실행되는 개념 |
| 스칼라 서브쿼리 | SELECT절에 들어가는, 결과가 단일 값인 서브쿼리 |

### 6.2 ANY / ALL / EXISTS

- `컬럼 > ANY (서브쿼리)` : 서브쿼리 결과 중 "하나라도" 작은 값이 있으면 참 (= 최솟값보다 큼)
- `컬럼 > ALL (서브쿼리)` : 서브쿼리 결과 "전부"보다 커야 참 (= 최댓값보다 큼)
- `컬럼 = ANY (서브쿼리)` : `IN`과 동일한 의미
- `EXISTS (서브쿼리)` : 서브쿼리 결과가 한 건이라도 있으면 참(값 자체가 아니라 존재 여부만 확인)
- ⚠️ `NOT IN` 서브쿼리 결과에 NULL이 하나라도 섞이면(2.3절과 동일한 이유로) 결과가 0건이 된다. `NOT EXISTS`는 이 문제가 없어 더 안전하다.

### 6.3 WITH절(CTE)

```sql
WITH dept_avg AS (
  SELECT deptno, AVG(sal) avg_sal FROM emp GROUP BY deptno
)
SELECT * FROM emp e, dept_avg d
WHERE e.deptno = d.deptno AND e.sal > d.avg_sal;
```

- 서브쿼리에 이름을 붙여 재사용성과 가독성을 높인다.
- Oracle은 `WITH` 안에서 자기 자신을 참조하는 재귀 쿼리(RECURSIVE WITH)도 지원한다.

---

## 7. 집합 연산자

| 연산자 | 설명 |
| --- | --- |
| `UNION` | 두 결과를 합치고 중복 제거 |
| `UNION ALL` | 두 결과를 합치되 중복 제거 안 함(더 빠름) |
| `INTERSECT` | 양쪽에 공통으로 있는 행만 |
| `MINUS` | 첫 번째 결과에서 두 번째 결과에 있는 행 제외 |

- 규칙: 각 SELECT의 컬럼 개수가 같아야 하고, 컬럼별 데이터 타입이 호환돼야 한다. 결과의 컬럼명은 첫 번째 SELECT절 기준을 따른다.
- `ORDER BY`는 집합 연산 전체의 맨 마지막에 한 번만 쓸 수 있다.
- 🔹 SQL Server에는 `MINUS`가 없고 같은 기능의 `EXCEPT`를 쓴다.
- ⚠️ `UNION`은 중복 제거 과정에서 결과가 정렬된 것처럼 보일 수 있지만, 정렬이 보장되는 것은 아니므로 순서가 필요하면 반드시 `ORDER BY`를 명시해야 한다.

---

## 8. 그룹 함수 (ROLLUP/CUBE/GROUPING SETS)

```sql
GROUP BY ROLLUP(A, B, C)   -- 소계: (A,B,C),(A,B),(A),() → n+1개 그룹
GROUP BY CUBE(A, B, C)     -- 모든 조합: 2^n개 그룹
GROUP BY GROUPING SETS((A,B), (A), ())   -- 지정한 조합만
```

- ⚠️ `ROLLUP(A, B, C)`는 오른쪽부터 하나씩 제거하며 소계를 만든다: `(A,B,C)`, `(A,B)`, `(A)`, `()` 총 4개(=n+1개) 그룹. 예) `ROLLUP(A, B, C)`가 만드는 그룹 수는 4개.
- `CUBE`는 모든 조합의 소계·합계를 만든다(2ⁿ개 그룹).
- `GROUPING(컬럼)` : 그 행이 ROLLUP/CUBE가 만든 소계·총계 행이면 1, 일반 데이터 행이면 0을 반환한다. 실제 데이터의 NULL과 소계로 생긴 NULL을 구분할 때 쓴다.
- ⚠️ `ROLLUP(A, (B, C))`처럼 괄호로 묶으면 B와 C를 하나의 단위로 취급해 함께 사라지거나 함께 남는다(부분 롤업).

---

## 9. 윈도우 함수

### 9.1 기본 구조

```sql
함수(...) OVER (PARTITION BY 그룹컬럼 ORDER BY 정렬컬럼 [프레임])
```

- `PARTITION BY`로 그룹을 나누고, 그룹 안에서 `ORDER BY` 기준으로 계산한다. `PARTITION BY`가 없으면 전체를 한 그룹으로 본다.

### 9.2 순위 함수

| 함수 | 동점 처리 |
| --- | --- |
| `RANK()` | 동점에 같은 순위를 주고, 다음 순위는 동점 개수만큼 건너뜀 (1,1,3) |
| `DENSE_RANK()` | 동점에 같은 순위를 주되, 다음 순위는 건너뛰지 않음 (1,1,2) |
| `ROW_NUMBER()` | 동점이어도 무조건 고유한 순번 부여 (1,2,3) |

⚠️ 동점이 있을 때 `RANK`와 `DENSE_RANK`의 차이가 시험에 자주 나온다.

### 9.3 집계·분석 함수

- `SUM/AVG/COUNT/MAX/MIN(...) OVER(...)` : 누적 합계, 그룹별 평균 등.
- `LAG(컬럼, n, 기본값) OVER(...)` : n행 이전 값.
- `LEAD(컬럼, n, 기본값) OVER(...)` : n행 이후 값.
- `RATIO_TO_REPORT(컬럼) OVER(...)` : 파티션 합계 대비 현재 행의 비율.
- `NTILE(n) OVER(...)` : 파티션을 n개의 버킷으로 나눠 각 행에 버킷 번호 부여.
- `FIRST_VALUE` / `LAST_VALUE` : 파티션 내 첫/마지막 값.
  - ⚠️ `ORDER BY`가 있을 때 기본 프레임은 "처음부터 현재 행까지"이므로, `LAST_VALUE`가 파티션의 진짜 마지막 값을 가져오려면 프레임을 `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`으로 명시해야 한다.

### 9.4 프레임(Frame)

```sql
SUM(sal) OVER (ORDER BY hiredate ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
```

- `ROWS` : 물리적 행 단위. `RANGE` : 정렬 기준 값 단위(동점을 같은 그룹으로 묶음).
- `UNBOUNDED PRECEDING` ~ `CURRENT ROW` : 누적합 계산에 자주 쓰는 기본 패턴.

---

## 10. Top-N 쿼리

### 10.1 ROWNUM (전통적 Oracle 방식)

```sql
SELECT * FROM (
  SELECT * FROM emp ORDER BY sal DESC
) WHERE ROWNUM <= 5;
```

- ⚠️ `ROWNUM`은 결과가 만들어지는 순서대로 1부터 부여되는 pseudo 컬럼이라, `ORDER BY`로 정렬하기 *전에* 조건을 걸면 정렬 전 순서 기준으로 번호가 매겨진다. 그래서 반드시 정렬된 결과를 서브쿼리로 감싼 뒤 바깥에서 `ROWNUM` 조건을 걸어야 한다.
- ⚠️ `WHERE ROWNUM > 1`처럼 1보다 큰 값으로 시작하는 조건은 항상 거짓이 되어 결과가 0건이다. ROWNUM은 1부터 순차 부여되는데, 첫 행에서 조건이 거짓이 되면 그 뒤 행들도 번호가 할당되지 않기 때문이다.

### 10.2 FETCH FIRST (Oracle 12c 이상)

```sql
SELECT * FROM emp ORDER BY sal DESC
FETCH FIRST 5 ROWS ONLY;

SELECT * FROM emp ORDER BY sal DESC
OFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY;

-- 동점까지 포함
FETCH FIRST 5 ROWS WITH TIES;
```

### 10.3 🔹 SQL Server

```sql
SELECT TOP 5 WITH TIES * FROM emp ORDER BY sal DESC;
-- 또는 2012 이상
SELECT * FROM emp ORDER BY sal DESC OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY;
```

---

## 11. 계층형 질의

```sql
SELECT LEVEL, empno, mgr,
       SYS_CONNECT_BY_PATH(ename, '/') AS path
FROM emp
START WITH mgr IS NULL
CONNECT BY PRIOR empno = mgr
ORDER SIBLINGS BY ename;
```

- `START WITH` : 계층의 최상위(루트) 행을 지정.
- `CONNECT BY PRIOR 부모컬럼 = 자식컬럼` : 부모-자식 관계 정의. `PRIOR`가 붙은 쪽이 상위(부모) 행의 컬럼이다.
- `LEVEL` : 루트를 1로 하는 깊이.
- `ORDER SIBLINGS BY` : 계층 구조(부모-자식 순서)는 유지하면서 형제 노드끼리만 정렬. ⚠️ 그냥 `ORDER BY`를 쓰면 트리 구조가 깨지고 LEVEL 순서와 무관하게 재정렬된다.
- `CONNECT_BY_ROOT 컬럼` : 각 행의 최상위 루트 값을 가져온다.
- `SYS_CONNECT_BY_PATH(컬럼, 구분자)` : 루트부터 현재 행까지의 경로 문자열.
- `NOCYCLE` + `CONNECT_BY_ISCYCLE` : 순환 참조(무한루프) 방지.
- 🔹 SQL Server는 `CONNECT BY` 문법이 없고, 재귀 CTE(`WITH ... AS (초기쿼리 UNION ALL 재귀쿼리)`)로 계층 구조를 구현한다.

---

## 12. PIVOT / UNPIVOT

```sql
SELECT * FROM (
  SELECT deptno, job, sal FROM emp
)
PIVOT (
  SUM(sal) FOR job IN ('CLERK' AS clerk, 'MANAGER' AS manager)
);
```

- `PIVOT` : 행 값을 컬럼으로 회전. `UNPIVOT`은 그 반대(컬럼을 행으로).
- ⚠️ `PIVOT`은 PIVOT절에 쓰이지 않은 나머지 컬럼을 기준으로 암묵적으로 `GROUP BY`를 수행한다. 명시적으로 GROUP BY를 쓰지 않아도 자동 그룹화가 일어난다는 점이 함정이다.

---

## 13. 정규 표현식 함수 (REGEXP_ 5종)

| 함수 | 역할 |
| --- | --- |
| `REGEXP_LIKE(문자열, 패턴, [match_param])` | 조건식(WHERE절에서 사용), 참/거짓 |
| `REGEXP_REPLACE(문자열, 패턴, 치환문자, [위치], [출현순번], [match_param])` | 패턴에 맞는 부분을 치환 |
| `REGEXP_INSTR(문자열, 패턴, ...)` | 패턴이 매칭된 위치 반환 |
| `REGEXP_SUBSTR(문자열, 패턴, ...)` | 패턴에 매칭된 부분 문자열 추출 |
| `REGEXP_COUNT(문자열, 패턴, ...)` | 패턴과 일치하는 횟수 |

- `LIKE`는 `%`, `_` 두 가지 와일드카드만 지원하지만, `REGEXP_` 계열은 메타문자(19단원)를 활용한 훨씬 복잡한 패턴 매칭이 가능하다.
- match_param 종류는 19단원(정규식 메타문자)에서 다룬다.

---

## 14. DML

### 14.1 INSERT / UPDATE / DELETE / MERGE

```sql
INSERT INTO emp (empno, ename) VALUES (1001, '홍길동');
INSERT INTO emp SELECT * FROM emp_bak;         -- 다중 행 삽입
INSERT ALL
  INTO emp_a VALUES (empno, ename)
  INTO emp_b VALUES (empno, sal)
  SELECT empno, ename, sal FROM emp_src;        -- 다중 테이블 삽입

UPDATE emp SET sal = sal * 1.1 WHERE deptno = 10;
DELETE FROM emp WHERE empno = 1001;

MERGE INTO emp e
USING emp_new n ON (e.empno = n.empno)
WHEN MATCHED THEN UPDATE SET e.sal = n.sal
WHEN NOT MATCHED THEN INSERT (empno, sal) VALUES (n.empno, n.sal);
```

- ⚠️ `UPDATE`/`DELETE`에서 `WHERE`절을 빠뜨리면 테이블의 모든 행이 바뀌거나 삭제된다.
- `MERGE` : `USING ... ON` 조건으로 매칭 여부에 따라 INSERT/UPDATE(그리고 Oracle은 `DELETE`절도 추가 가능)를 한 문장으로 처리(upsert).

### 14.2 DELETE vs TRUNCATE vs DROP

| 구분 | 분류 | 되돌리기(ROLLBACK) | 속도 | 비고 |
| --- | --- | --- | --- | --- |
| `DELETE` | DML | 가능 | 느림(행 단위) | WHERE로 일부만 삭제 가능, 트리거 발생 |
| `TRUNCATE` | DDL | 불가(자동 커밋) | 빠름 | 테이블 구조는 유지, 전체 행 삭제, 트리거 미발생 |
| `DROP` | DDL | 불가(자동 커밋) | - | 테이블 자체(구조+데이터)를 삭제 |

⚠️ 이 셋의 차이는 시험에 매우 자주 나온다. 특히 `TRUNCATE`가 DML이 아니라 **DDL**이라는 점, 자동 커밋되어 롤백할 수 없다는 점이 핵심 함정이다.

---

## 15. TCL

- `COMMIT` : 트랜잭션의 변경 사항을 영구 반영.
- `ROLLBACK [TO SAVEPOINT 이름]` : 변경 사항을 취소(지정 세이브포인트까지만 취소 가능).
- `SAVEPOINT 이름` : 트랜잭션 중간에 되돌아갈 지점을 표시.
- **ACID**: Atomicity(원자성), Consistency(일관성), Isolation(고립성), Durability(지속성).
- ⚠️ `CREATE`, `ALTER`, `DROP`, `TRUNCATE` 같은 **DDL 문은 실행되는 순간 암묵적으로 COMMIT**된다(그 전에 대기 중이던 DML도 함께 커밋됨).
- 🔹 SQL Server는 기본적으로 각 문장이 자동 커밋(autocommit) 모드로 동작하고, 명시적 트랜잭션을 쓰려면 `BEGIN TRAN ... COMMIT/ROLLBACK`을 직접 써야 한다. Oracle은 세션에서 DML 수행 시 명시적으로 COMMIT/ROLLBACK 하기 전까지 트랜잭션이 유지된다.

---

## 16. DDL과 제약조건

### 16.1 기본 명령어

```sql
CREATE TABLE emp (...);
ALTER TABLE emp ADD (bonus NUMBER);
ALTER TABLE emp MODIFY (ename VARCHAR2(50));
ALTER TABLE emp RENAME COLUMN ename TO emp_name;
RENAME emp TO employee;
DROP TABLE emp;
```

### 16.2 제약조건

| 제약조건 | 설명 |
| --- | --- |
| `PRIMARY KEY` | 유일성 + NOT NULL (UNIQUE + NOT NULL의 결합) |
| `UNIQUE` | 유일성만 보장 |
| `NOT NULL` | NULL 금지 |
| `CHECK` | 지정한 조건을 만족해야 함 |
| `FOREIGN KEY` | 다른 테이블의 PK/UNIQUE 컬럼을 참조 |

- ⚠️ `UNIQUE` 제약은 **NULL을 허용**한다(NULL끼리는 서로 같다고 비교되지 않으므로 여러 행이 NULL이어도 유일성 위반이 아니다). "UNIQUE는 NULL을 허용하지 않는다"는 설명은 틀렸다.
- FK 옵션: `ON DELETE CASCADE`(부모 삭제 시 자식도 삭제), `ON DELETE SET NULL`(부모 삭제 시 자식의 FK를 NULL로). 옵션이 없으면 자식 행이 있는 부모는 삭제할 수 없다(기본 제한).

### 16.3 CTAS (CREATE TABLE AS SELECT)

```sql
CREATE TABLE emp_bak AS SELECT * FROM emp;
```

- ⚠️ CTAS는 쿼리 결과의 데이터와 컬럼 구조(이름·타입)는 복사하지만, 원본 테이블의 **제약조건(PK, FK, UNIQUE, CHECK 등)·인덱스·트리거는 복사되지 않는다** (NOT NULL은 일부 유지되는 경우가 있으나 PK 등 주요 제약은 별도로 다시 추가해야 한다).

---

## 17. DCL

```sql
GRANT SELECT, INSERT ON emp TO scott;
GRANT SELECT ON emp TO scott WITH GRANT OPTION;
REVOKE SELECT ON emp FROM scott;

GRANT emp_role TO scott WITH ADMIN OPTION;
```

- `GRANT` / `REVOKE` : 권한(객체 권한·시스템 권한)을 부여/회수.
- `ROLE` : 여러 권한을 묶어서 한 번에 부여/회수할 수 있는 권한 그룹.
- ⚠️ **GRANT OPTION**(객체 권한에 부여)과 **ADMIN OPTION**(시스템 권한·롤에 부여)의 차이:
  - `WITH GRANT OPTION`으로 받은 권한을 다른 사람에게 다시 부여할 수 있다. 원 권한자가 `REVOKE`하면 그 사람이 재부여한 권한까지 **연쇄적으로(cascade) 회수**된다.
  - `WITH ADMIN OPTION`으로 받은 롤/시스템 권한도 다른 사람에게 재부여할 수 있지만, 원 권한자가 `REVOKE`해도 재부여된 권한은 **연쇄적으로 회수되지 않는다**(그대로 유지).

---

## 18. SQL 명령어 분류

| 분류 | 명령어 | 비고 |
| --- | --- | --- |
| DML(데이터 조작어) | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE` | SELECT를 별도로 DQL이라 부르기도 하나 SQLD 시험은 DML로 분류 |
| DDL(데이터 정의어) | `CREATE`, `ALTER`, `DROP`, `RENAME`, `TRUNCATE` | 실행 즉시 자동 COMMIT |
| DCL(데이터 제어어) | `GRANT`, `REVOKE` | 권한 관리 |
| TCL(트랜잭션 제어어) | `COMMIT`, `ROLLBACK`, `SAVEPOINT` | DML 트랜잭션 제어 |

- ⚠️ `TRUNCATE`를 DML로 착각하기 쉽지만 **DDL**이다(14.2절 참고). 이 분류 문제가 시험에 자주 나온다.
