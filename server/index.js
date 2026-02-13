const pool = require("./db");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const app = express();

// ===== 보안 미들웨어 =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // 이미지 제공을 위해 필요
}));

// CORS 설정 - 허용된 도메인만
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map(s => s.trim());
app.use(cors({
  origin: function (origin, callback) {
    // origin이 없는 경우 (서버 간 요청, curl 등) 허용
    if (!origin) return callback(null, true);
    // 명시적으로 허용된 도메인
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    // Vercel 프리뷰/배포 URL 허용 (.vercel.app 서브도메인)
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    // localhost 개발 환경 허용
    if (origin.startsWith("http://localhost:")) {
      return callback(null, true);
    }
    callback(new Error("CORS 정책에 의해 차단되었습니다."));
  },
  credentials: true,
}));

// API 요청 제한 (무차별 공격 방지)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 200, // IP당 최대 200회
  message: { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
});
app.use(generalLimiter);

// 로그인 시도 제한 (무차별 대입 공격 방지)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // IP당 최대 10회
  message: { error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요." },
});

app.use(express.json());

// ===== 관리자 인증 시스템 =====
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_change_me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

// 관리자 로그인
app.post("/admin/login", loginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "비밀번호를 입력해주세요." });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
  }

  // JWT 토큰 발급 (24시간 유효)
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, message: "로그인 성공" });
});

// 관리자 인증 확인
app.get("/admin/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "인증이 필요합니다." });
  }

  try {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
});

// 인증 미들웨어 (관리자 API 보호용)
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "관리자 인증이 필요합니다." });
  }

  try {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "인증이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요." });
  }
};

// ===== ROUTES =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Realtor API running");
});

// DB 연결 테스트
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("DB 연결 테스트 성공");
    
    // property 테이블 존재 여부 확인
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'property'
      );
    `);
    
    console.log("property 테이블 존재 여부:", tableCheck.rows[0].exists);
    
    res.json({
      now: result.rows[0].now,
      propertyTableExists: tableCheck.rows[0].exists
    });
  } catch (err) {
    console.error("DB 테스트 에러:", err);
    res.status(500).json({ error: "DB connection failed", details: err.message });
  }
});

app.post("/properties", requireAdmin, async (req, res) => {
  console.log("=== POST /properties 요청 받음 ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  const {
    realtor_id,
    type,
    category, // category 추가
    price,
    area,
    rooms,
    bathrooms,
    sido,
    sigungu,
    dong,
    address,
    lat,
    lng,
    description,
    deal_type,
    maintenance_fee,
    direction,
    floor_info,
    usage_type,
    parking,
    elevator,
    move_in_date,
  } = req.body;

  // deposit과 monthly_rent는 별도로 선언 (재할당 가능하도록)
  let { deposit, monthly_rent } = req.body;

  console.log("Extracted values:", {
    realtor_id, type, category, price, address, deal_type
  });

  // 필수값 검증 - price는 월세의 경우 0일 수 있으므로 null/undefined만 체크
  if (!realtor_id || !type || !address || !deal_type) {
    console.log("필수값 누락 - realtor_id:", realtor_id, "type:", type, "address:", address, "deal_type:", deal_type);
    return res.status(400).json({ error: "필수 값 누락 (realtor_id, type, address, deal_type)" });
  }

  // category 자동 매핑 (category가 없으면 type에 따라 자동 설정)
  let finalCategory = category;
  if (!finalCategory) {
    if (['아파트', '오피스텔', '원룸', '투룸', '빌라'].includes(type)) {
      finalCategory = 'RESIDENTIAL';
    } else if (['상가', '사무실'].includes(type)) {
      finalCategory = 'COMMERCIAL';
    } else if (['공장', '창고'].includes(type)) {
      finalCategory = 'INDUSTRIAL';
    } else if (type === '토지') {
      finalCategory = 'LAND';
    } else {
      return res.status(400).json({ error: `알 수 없는 매물 종류: ${type}` });
    }
    console.log(`category 자동 매핑: ${type} → ${finalCategory}`);
  }

  // 도메인 규칙 검증 (책임 분리 - 서버에서 비즈니스 로직 검증)
  if (deal_type === "매매") {
    // 매매: price 필수, deposit과 monthly_rent는 NULL이어야 함
    if (!price || price <= 0) {
      return res.status(400).json({ error: "매매: 매매가(price)는 필수입니다" });
    }
    if (deposit !== null || monthly_rent !== null) {
      console.log("매매 도메인 규칙 위반 - deposit/monthly_rent를 NULL로 설정");
      // 자동으로 NULL로 설정 (관대한 처리)
      deposit = null;
      monthly_rent = null;
    }
  } else if (deal_type === "전세") {
    // 전세: price 필수, monthly_rent는 NULL이어야 함
    if (!price || price <= 0) {
      return res.status(400).json({ error: "전세: 전세금(price)은 필수입니다" });
    }
    if (monthly_rent !== null) {
      console.log("전세 도메인 규칙 위반 - monthly_rent를 NULL로 설정");
      monthly_rent = null;
    }
  } else if (deal_type === "월세") {
    // 월세: deposit과 monthly_rent 필수, price는 NULL이어야 함
    if (!deposit || deposit < 0 || !monthly_rent || monthly_rent <= 0) {
      return res.status(400).json({ error: "월세: 보증금(deposit)과 월세(monthly_rent)는 필수입니다" });
    }
    if (price !== null && price !== 0) {
      console.log("월세 도메인 규칙 위반 - price를 NULL로 설정");
      price = null;
    }
  }

  try {
    console.log("SQL 실행 전 - values:", [
      realtor_id, type, finalCategory, price, deposit, monthly_rent, area, rooms, bathrooms,
      sido, sigungu, dong, address, lat, lng, description, deal_type, 
      maintenance_fee, direction, floor_info, usage_type, parking, elevator, move_in_date
    ]);
    
    const result = await pool.query(
      `
      INSERT INTO property
      (realtor_id, type, category, price, deposit, monthly_rent, area, rooms, bathrooms,
       sido, sigungu, dong, address, lat, lng, description, deal_type,
       maintenance_fee, direction, floor_info, usage_type, parking, elevator, move_in_date)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *
      `,
      [
        realtor_id,
        type,
        finalCategory, // category 추가
        price,
        deposit,
        monthly_rent,
        area,
        rooms,
        bathrooms,
        sido,
        sigungu,
        dong,
        address,
        lat,
        lng,
        description,
        deal_type,
        maintenance_fee,
        direction,
        floor_info,
        usage_type,
        parking,
        elevator,
        move_in_date,
      ]
    );

    console.log("SQL 실행 성공:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("SQL 실행 에러:", err);
    console.error("에러 스택:", err.stack);
    res.status(500).json({ error: "매물 등록 실패" });
  }
});

// 추천매물 조회 (메인 페이지용) - 구체적인 경로를 먼저 정의
app.get("/properties/featured", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        (SELECT pi.image_url 
         FROM property_image pi 
         WHERE pi.property_id = p.id AND pi.is_main = true 
         LIMIT 1) AS main_image
      FROM property p
      WHERE p.is_featured = true AND p.status = '거래중'
      ORDER BY p.created_at DESC
      LIMIT 6
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("추천매물 조회 에러:", err);
    res.status(500).json({ error: "추천매물 조회 실패" });
  }
});

// 카테고리별 매물 조회 (메인 페이지용)
app.get("/properties/category/:category", async (req, res) => {
  const { category } = req.params;
  const { limit, featured } = req.query; // limit, featured 쿼리 파라미터 추가
  
  try {
    let query = `
      SELECT 
        p.*,
        (SELECT pi.image_url 
         FROM property_image pi 
         WHERE pi.property_id = p.id AND pi.is_main = true 
         LIMIT 1) AS main_image
      FROM property p
      WHERE p.category = $1 AND p.status = '거래중'
    `;
    
    const params = [category];
    let paramIndex = 2;
    
    // featured가 true인 경우 추천매물만 필터링
    if (featured === 'true') {
      query += ` AND p.is_featured = true`;
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    // limit이 제공된 경우에만 LIMIT 추가
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }
    // limit이 없으면 전체 반환 (매물 더보기 페이지용)

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("카테고리별 매물 조회 에러:", err);
    res.status(500).json({ error: "카테고리별 매물 조회 실패" });
  }
});

// 매물 조회 
app.get("/properties", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        (SELECT pi.image_url 
         FROM property_image pi 
         WHERE pi.property_id = p.id AND pi.is_main = true 
         LIMIT 1) AS main_image
      FROM property p
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("매물 조회 에러:", err);
    res.status(500).json({ error: "매물 조회 실패" });
  }
});

// 특정 매물 이미지 조회
app.get("/properties/:id/images", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, image_url, is_main
      FROM property_image
      WHERE property_id = $1
      ORDER BY is_main DESC, id ASC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "이미지 조회 실패" });
  }
});



// 매물 수정
app.put("/properties/:id", requireAdmin, async (req, res) => {
  console.log("=== PUT /properties/:id 요청 받음 ===");
  console.log("매물 ID:", req.params.id);
  console.log("요청 body:", req.body);
  
  const { id } = req.params;

  const {
    type,
    category, // category 추가
    price,
    deposit,
    monthly_rent,
    area,
    rooms,
    bathrooms,
    sido,
    sigungu,
    dong,
    address,
    lat,
    lng,
    description,
    status,
    deal_type,
    maintenance_fee,
    direction,
    floor_info,
    usage_type,
    parking,
    elevator,
    move_in_date,
  } = req.body;

  // category 자동 매핑 (category가 없으면 type에 따라 자동 설정)
  let finalCategory = category;
  if (type && !finalCategory) {
    if (['아파트', '오피스텔', '원룸', '투룸', '빌라'].includes(type)) {
      finalCategory = 'RESIDENTIAL';
    } else if (['상가', '사무실'].includes(type)) {
      finalCategory = 'COMMERCIAL';
    } else if (['공장', '창고'].includes(type)) {
      finalCategory = 'INDUSTRIAL';
    } else if (type === '토지') {
      finalCategory = 'LAND';
    }
    console.log(`PUT - category 자동 매핑: ${type} → ${finalCategory}`);
  }

  // 도메인 규칙 검증 (거래유형이 변경되는 경우에만)
  if (deal_type) {
    let updatedPrice = price;
    let updatedDeposit = deposit;
    let updatedMonthlyRent = monthly_rent;
    
    if (deal_type === "매매") {
      // 매매: price 필수, deposit과 monthly_rent는 NULL이어야 함
      if (price !== undefined && (!price || price <= 0)) {
        return res.status(400).json({ error: "매매: 매매가(price)는 필수입니다" });
      }
      // 도메인 규칙 강제 적용
      updatedDeposit = null;
      updatedMonthlyRent = null;
      console.log("매매 도메인 규칙 적용 - deposit/monthly_rent NULL로 설정");
    } else if (deal_type === "전세") {
      // 전세: price 필수, monthly_rent는 NULL이어야 함
      if (price !== undefined && (!price || price <= 0)) {
        return res.status(400).json({ error: "전세: 전세금(price)은 필수입니다" });
      }
      // 도메인 규칙 강제 적용
      updatedMonthlyRent = null;
      console.log("전세 도메인 규칙 적용 - monthly_rent NULL로 설정");
    } else if (deal_type === "월세") {
      // 월세: deposit과 monthly_rent 필수, price는 NULL이어야 함
      if (deposit !== undefined && (!deposit || deposit < 0)) {
        return res.status(400).json({ error: "월세: 보증금(deposit)은 필수입니다" });
      }
      if (monthly_rent !== undefined && (!monthly_rent || monthly_rent <= 0)) {
        return res.status(400).json({ error: "월세: 월세(monthly_rent)는 필수입니다" });
      }
      // 도메인 규칙 강제 적용
      updatedPrice = null;
      console.log("월세 도메인 규칙 적용 - price NULL로 설정");
    }
    
    // 검증된 값으로 override
    req.body.price = updatedPrice;
    req.body.deposit = updatedDeposit;
    req.body.monthly_rent = updatedMonthlyRent;
  }

  try {
    console.log("매물 존재 여부 확인 중...");
    // 존재 여부 확인
    const exists = await pool.query(
      "SELECT id FROM property WHERE id = $1",
      [id]
    );

    if (exists.rows.length === 0) {
      console.log("매물이 존재하지 않음:", id);
      return res.status(404).json({ error: "매물 없음" });
    }

    console.log("매물 존재 확인됨, 업데이트 필드 구성 중...");
    // 동적 업데이트 (보낸 값만 수정)
    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (key, value) => {
      if (value !== undefined && value !== null) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
        console.log(`필드 추가: ${key} = ${value}`);
      }
    };

    addField("type", type);
    addField("category", finalCategory); // category 추가
    addField("price", price);
    addField("deposit", deposit);
    addField("monthly_rent", monthly_rent);
    addField("area", area);
    addField("rooms", rooms);
    addField("bathrooms", bathrooms);
    addField("address", address);
    addField("description", description);
    addField("deal_type", deal_type);
    addField("maintenance_fee", maintenance_fee);
    addField("direction", direction);
    addField("floor_info", floor_info);
    addField("usage_type", usage_type);
    addField("parking", parking);
    addField("elevator", elevator);
    addField("move_in_date", move_in_date);

    // 선택적 필드들 (프론트에서 보내지 않을 수 있음)
    if (sido !== undefined) addField("sido", sido);
    if (sigungu !== undefined) addField("sigungu", sigungu);
    if (dong !== undefined) addField("dong", dong);
    if (lat !== undefined) addField("lat", lat);
    if (lng !== undefined) addField("lng", lng);
    if (status !== undefined) addField("status", status);

    if (fields.length === 0) {
      console.log("수정할 필드가 없음");
      return res.status(400).json({ error: "수정할 값 없음" });
    }

    const query = `
      UPDATE property
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(id);

    console.log("실행할 SQL 쿼리:", query);
    console.log("SQL 매개변수:", values);

    const result = await pool.query(query, values);
    console.log("SQL 실행 성공:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("=== 매물 수정 에러 ===");
    console.error("에러 메시지:", err.message);
    console.error("에러 코드:", err.code);
    console.error("에러 스택:", err.stack);
    console.error("에러 세부사항:", err.detail);
    res.status(500).json({ error: "매물 수정 실패", details: err.message });
  }
});

// 매물 삭제 (단건 조회보다 먼저 정의해야 함)
app.delete("/properties/:id", requireAdmin, async (req, res) => {
  console.log("=== DELETE /properties/:id 요청 받음 ===");
  console.log("매물 ID:", req.params.id);
  
  const { id } = req.params;

  try {
    // 매물 존재 여부 확인
    const propertyResult = await pool.query(
      "SELECT id FROM property WHERE id = $1",
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ error: "매물을 찾을 수 없음" });
    }

    // 매물에 연결된 이미지들 조회
    const imagesResult = await pool.query(
      "SELECT image_url FROM property_image WHERE property_id = $1",
      [id]
    );

    // 파일 시스템에서 이미지 파일들 삭제
    for (const image of imagesResult.rows) {
      try {
        const filePath = path.join(__dirname, image.image_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("파일 삭제 완료:", filePath);
        }
      } catch (fileError) {
        console.error("파일 삭제 실패:", fileError);
      }
    }

    // 데이터베이스에서 이미지들 삭제 (외래키 때문에 먼저 삭제)
    await pool.query(
      "DELETE FROM property_image WHERE property_id = $1",
      [id]
    );

    // 매물 삭제
    await pool.query(
      "DELETE FROM property WHERE id = $1",
      [id]
    );

    res.json({ message: "매물 삭제 완료" });
  } catch (err) {
    console.error("매물 삭제 에러:", err);
    res.status(500).json({ error: "매물 삭제 실패" });
  }
});

// 추천매물 설정/해제
app.patch("/properties/:id/featured", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_featured } = req.body;

  try {
    // 먼저 매물 정보 가져오기 (카테고리 확인용)
    const propertyResult = await pool.query(
      "SELECT category FROM property WHERE id = $1",
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ error: "매물 없음" });
    }

    const category = propertyResult.rows[0].category;

    // 추천매물로 설정하려는 경우, 해당 카테고리 내 추천매물 개수 확인
    if (is_featured) {
      const featuredCount = await pool.query(
        "SELECT COUNT(*) as count FROM property WHERE is_featured = true AND category = $1",
        [category]
      );
      
      if (parseInt(featuredCount.rows[0].count) >= 8) {
        return res.status(400).json({ 
          error: "해당 카테고리의 추천매물은 최대 8개까지만 설정할 수 있습니다." 
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE property
      SET is_featured = $1
      WHERE id = $2
      RETURNING *
      `,
      [is_featured, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "매물 없음" });
    }

    res.json({ message: is_featured ? "추천매물로 설정 완료" : "추천매물 해제 완료" });
  } catch (err) {
    console.error("추천매물 설정 에러:", err);
    res.status(500).json({ error: "추천매물 설정 실패" });
  }
});

// 매물 상태 변경 (거래중, 거래완료)
app.patch("/properties/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // 허용 상태만
  if (!["거래중", "거래완료"].includes(status)) {
    return res.status(400).json({ error: "잘못된 상태 값" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE property
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "매물 없음" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "상태 변경 실패" });
  }
});
const upload = require("./upload");


// 매물 이미지 업로드
app.post(
  "/properties/:id/images",
  requireAdmin,
  upload.array("images", 5),
  async (req, res) => {
    const { id } = req.params;

    try {
      const files = req.files;

      for (let i = 0; i < files.length; i++) {
        await pool.query(
          `
          INSERT INTO property_image (property_id, image_url, is_main)
          VALUES ($1, $2, $3)
          `,
          [
            id,
            `/uploads/${files[i].filename}`,
            i === 0, // 첫 번째 이미지를 대표로
          ]
        );
      }

      res.json({ message: "이미지 업로드 완료" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "이미지 업로드 실패" });
    }
  }
);

// 매물 이미지 삭제
app.delete("/properties/:propertyId/images/:imageId", requireAdmin, async (req, res) => {
  const { propertyId, imageId } = req.params;

  try {
    // 삭제할 이미지 정보 조회
    const imageResult = await pool.query(
      `
      SELECT image_url 
      FROM property_image 
      WHERE id = $1 AND property_id = $2
      `,
      [imageId, propertyId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: "이미지를 찾을 수 없음" });
    }

    const imageUrl = imageResult.rows[0].image_url;

    // 데이터베이스에서 이미지 삭제
    await pool.query(
      `
      DELETE FROM property_image 
      WHERE id = $1 AND property_id = $2
      `,
      [imageId, propertyId]
    );

    // 파일 시스템에서 실제 이미지 파일 삭제
    try {
      const filePath = path.join(__dirname, imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("파일 삭제 완료:", filePath);
      }
    } catch (fileError) {
      console.error("파일 삭제 실패:", fileError);
      // 파일 삭제 실패해도 DB에서는 삭제되었으므로 계속 진행
    }

    res.json({ message: "이미지 삭제 완료" });
  } catch (err) {
    console.error("이미지 삭제 에러:", err);
    res.status(500).json({ error: "이미지 삭제 실패" });
  }
});

// 대표 이미지 설정
app.patch("/properties/:propertyId/images/:imageId/main", requireAdmin, async (req, res) => {
  const { propertyId, imageId } = req.params;

  try {
    // 해당 매물의 모든 이미지를 대표가 아니게 설정
    await pool.query(
      `
      UPDATE property_image 
      SET is_main = false 
      WHERE property_id = $1
      `,
      [propertyId]
    );

    // 선택한 이미지를 대표 이미지로 설정
    const result = await pool.query(
      `
      UPDATE property_image 
      SET is_main = true 
      WHERE id = $1 AND property_id = $2
      RETURNING *
      `,
      [imageId, propertyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "이미지를 찾을 수 없음" });
    }

    res.json({ message: "대표 이미지 설정 완료" });
  } catch (err) {
    console.error("대표 이미지 설정 에러:", err);
    res.status(500).json({ error: "대표 이미지 설정 실패" });
  }
});


// 매물 단건 조회 (상세 페이지용) - 맨 마지막에 위치
app.get("/properties/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        p.*,
        (SELECT pi.image_url 
         FROM property_image pi 
         WHERE pi.property_id = p.id AND pi.is_main = true 
         LIMIT 1) AS main_image
      FROM property p
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "매물 없음" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "매물 조회 실패" });
  }
});

// ===== 문의 관련 API =====

// 문의 테이블 생성 (서버 시작 시 자동 생성)
const createInquiryTable = async () => {
  try {
    // 먼저 테이블이 존재하는지 확인
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inquiry'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("inquiry 테이블이 이미 존재함. 컬럼 확인 중...");
      
      // 컬럼 존재 여부 확인
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'inquiry'
      `);
      
      console.log("현재 inquiry 테이블 컬럼:", columns.rows.map(r => r.column_name));
      
      const columnNames = columns.rows.map(r => r.column_name);
      
      // contact 컬럼이 없으면 추가
      if (!columnNames.includes('contact')) {
        console.log("contact 컬럼이 없어서 추가 중...");
        try {
          // 먼저 NULL 허용으로 추가
          await pool.query(`
            ALTER TABLE inquiry 
            ADD COLUMN contact VARCHAR(50)
          `);
          // 기존 데이터가 있으면 빈 문자열로 업데이트
          await pool.query(`
            UPDATE inquiry SET contact = '' WHERE contact IS NULL
          `);
          // NOT NULL 제약조건 추가
          await pool.query(`
            ALTER TABLE inquiry 
            ALTER COLUMN contact SET NOT NULL
          `);
          console.log("contact 컬럼 추가 완료");
        } catch (alterErr) {
          console.error("contact 컬럼 추가 실패:", alterErr.message);
        }
      }
      
      // message 컬럼이 없으면 추가
      if (!columnNames.includes('message')) {
        console.log("message 컬럼이 없어서 추가 중...");
        try {
          await pool.query(`
            ALTER TABLE inquiry 
            ADD COLUMN message TEXT
          `);
          await pool.query(`
            UPDATE inquiry SET message = '' WHERE message IS NULL
          `);
          await pool.query(`
            ALTER TABLE inquiry 
            ALTER COLUMN message SET NOT NULL
          `);
          console.log("message 컬럼 추가 완료");
        } catch (alterErr) {
          console.error("message 컬럼 추가 실패:", alterErr.message);
        }
      }
      
      // property_id 컬럼이 없으면 추가
      if (!columnNames.includes('property_id')) {
        console.log("property_id 컬럼이 없어서 추가 중...");
        try {
          await pool.query(`
            ALTER TABLE inquiry 
            ADD COLUMN property_id INTEGER
          `);
          await pool.query(`
            UPDATE inquiry SET property_id = 0 WHERE property_id IS NULL
          `);
          await pool.query(`
            ALTER TABLE inquiry 
            ALTER COLUMN property_id SET NOT NULL
          `);
          console.log("property_id 컬럼 추가 완료");
        } catch (alterErr) {
          console.error("property_id 컬럼 추가 실패:", alterErr.message);
        }
      }
      
      // is_read 컬럼이 없으면 추가
      if (!columnNames.includes('is_read')) {
        console.log("is_read 컬럼이 없어서 추가 중...");
        try {
          await pool.query(`
            ALTER TABLE inquiry 
            ADD COLUMN is_read BOOLEAN DEFAULT false
          `);
          await pool.query(`
            UPDATE inquiry SET is_read = false WHERE is_read IS NULL
          `);
          console.log("is_read 컬럼 추가 완료");
        } catch (alterErr) {
          console.error("is_read 컬럼 추가 실패:", alterErr.message);
        }
      }
      
      // Foreign key가 없으면 추가 (property_id가 있을 때만)
      if (columnNames.includes('property_id')) {
        try {
          await pool.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'inquiry_property_id_fkey'
              ) THEN
                ALTER TABLE inquiry 
                ADD CONSTRAINT inquiry_property_id_fkey 
                FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE;
              END IF;
            END $$;
          `);
          console.log("Foreign key 제약조건 확인 완료");
        } catch (fkErr) {
          console.log("Foreign key 제약조건 추가 중 오류 (무시 가능):", fkErr.message);
        }
      }
      
      console.log("inquiry 테이블 구조 확인/수정 완료");
    } else {
      // 테이블이 없으면 새로 생성
      console.log("inquiry 테이블이 없어서 생성 중...");
      await pool.query(`
        CREATE TABLE inquiry (
          id SERIAL PRIMARY KEY,
          property_id INTEGER NOT NULL REFERENCES property(id) ON DELETE CASCADE,
          contact VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("inquiry 테이블 생성 완료");
    }
  } catch (err) {
    console.error("inquiry 테이블 생성/수정 에러:", err);
    console.error("에러 상세:", err.message);
    console.error("에러 스택:", err.stack);
  }
};

// 서버 시작 시 테이블 생성 (비동기 처리)
(async () => {
  await createInquiryTable();
})();

// 전화번호 형식 검증 함수
const validatePhoneNumber = (phone) => {
  // 하이픈 제거한 숫자만 추출
  const numbersOnly = phone.replace(/-/g, "");
  
  // 숫자만 있는지 확인
  if (!/^\d+$/.test(numbersOnly)) {
    return false;
  }
  
  // 한국 전화번호 형식 검증
  // 휴대폰: 010, 011, 016, 017, 018, 019로 시작하는 10-11자리
  // 지역번호: 02(서울), 031(경기), 032(인천), 033(강원), 041(충남), 042(대전), 043(충북), 044(세종), 051(부산), 052(울산), 053(대구), 054(경북), 055(경남), 061(전남), 062(광주), 063(전북), 064(제주)
  const mobilePattern = /^(010|011|016|017|018|019)\d{7,8}$/;
  const landlinePattern = /^(02|031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)\d{6,8}$/;
  
  return mobilePattern.test(numbersOnly) || landlinePattern.test(numbersOnly);
};

// 문의 생성
app.post("/inquiries", async (req, res) => {
  console.log("=== POST /inquiries 요청 받음 ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  const { property_id, contact, message } = req.body;

  if (!property_id || !contact || !message) {
    console.log("필수 값 누락:", { property_id, contact, message });
    return res.status(400).json({ error: "필수 값 누락 (property_id, contact, message)" });
  }

  // 전화번호 형식 검증
  if (!validatePhoneNumber(contact.trim())) {
    console.log("전화번호 형식이 올바르지 않음:", contact);
    return res.status(400).json({ 
      error: "올바른 전화번호 형식을 입력해주세요. 예: 010-1234-5678, 02-1234-5678" 
    });
  }

  // property_id를 숫자로 변환
  const propertyIdNum = parseInt(property_id);
  if (isNaN(propertyIdNum)) {
    console.log("property_id가 유효한 숫자가 아님:", property_id);
    return res.status(400).json({ error: "property_id는 유효한 숫자여야 합니다." });
  }

  try {
    // inquiry 테이블 존재 여부 확인 (없으면 생성 시도)
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inquiry'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("inquiry 테이블이 없음. 생성 시도...");
      await createInquiryTable();
    }

    // 매물 존재 여부 확인
    const propertyCheck = await pool.query(
      "SELECT id FROM property WHERE id = $1",
      [propertyIdNum]
    );

    if (propertyCheck.rows.length === 0) {
      console.log("매물이 존재하지 않음:", propertyIdNum);
      return res.status(404).json({ error: "매물을 찾을 수 없습니다." });
    }

    console.log("문의 생성 시도:", { propertyIdNum, contact, message });
    const result = await pool.query(
      `
      INSERT INTO inquiry (property_id, contact, message)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [propertyIdNum, contact.trim(), message.trim()]
    );

    console.log("문의 생성 성공:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("========== 문의 생성 에러 발생 ==========");
    console.error("에러 타입:", err.constructor.name);
    console.error("에러 메시지:", err.message);
    console.error("에러 코드:", err.code);
    console.error("에러 상세:", err.detail);
    console.error("에러 스택:", err.stack);
    console.error("==========================================");
    
    // PostgreSQL 에러 코드별 처리
    if (err.code === '42P01') {
      // 테이블이 존재하지 않음
      console.log("테이블이 없어서 생성 시도...");
      try {
        await createInquiryTable();
        // 재시도
        const retryResult = await pool.query(
          `INSERT INTO inquiry (property_id, contact, message) VALUES ($1, $2, $3) RETURNING *`,
          [propertyIdNum, contact.trim(), message.trim()]
        );
        console.log("재시도 성공!");
        return res.status(201).json(retryResult.rows[0]);
      } catch (retryErr) {
        console.error("재시도 실패:", retryErr);
        return res.status(500).json({ 
          error: "문의 생성 실패 (테이블 생성 후 재시도 실패)",
          details: retryErr.message,
          code: retryErr.code
        });
      }
    } else if (err.code === '23503') {
      // Foreign key violation
      console.log("Foreign Key 위반 - 매물이 존재하지 않음");
      return res.status(400).json({ 
        error: "존재하지 않는 매물입니다.",
        details: err.detail || err.message,
        code: err.code
      });
    } else if (err.code === '23502') {
      // NOT NULL violation
      console.log("NOT NULL 위반 - 필수 필드 누락");
      return res.status(400).json({ 
        error: "필수 필드가 누락되었습니다.",
        details: err.detail || err.message,
        code: err.code
      });
    } else if (err.code === '23505') {
      // Unique violation
      return res.status(400).json({ 
        error: "중복된 데이터입니다.",
        details: err.detail || err.message,
        code: err.code
      });
    }
    
    // 기타 에러
    res.status(500).json({ 
      error: "문의 생성 실패",
      details: err.message || "알 수 없는 오류가 발생했습니다.",
      code: err.code || "UNKNOWN",
      type: err.constructor.name
    });
  }
});

// 매물별 문의 목록 조회
app.get("/inquiries/property/:propertyId", async (req, res) => {
  const { propertyId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT * FROM inquiry
      WHERE property_id = $1
      ORDER BY created_at DESC
      `,
      [propertyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("문의 목록 조회 에러:", err);
    res.status(500).json({ error: "문의 목록 조회 실패" });
  }
});

// 문의 상세 조회 (자동으로 읽음 처리)
app.get("/inquiries/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM inquiry WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "문의 없음" });
    }

    // 읽지 않은 문의면 자동으로 읽음 처리
    if (!result.rows[0].is_read) {
      await pool.query(
        "UPDATE inquiry SET is_read = true WHERE id = $1",
        [id]
      );
      result.rows[0].is_read = true;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("문의 조회 에러:", err);
    res.status(500).json({ error: "문의 조회 실패" });
  }
});

// 매물별 문의 개수 조회 (관리자 페이지용)
app.get("/inquiries/property/:propertyId/count", async (req, res) => {
  const { propertyId } = req.params;

  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM inquiry WHERE property_id = $1",
      [propertyId]
    );
    
    // 안읽은 문의 개수도 함께 반환
    const unreadResult = await pool.query(
      "SELECT COUNT(*) as count FROM inquiry WHERE property_id = $1 AND (is_read IS NULL OR is_read = false)",
      [propertyId]
    );

    res.json({ 
      count: parseInt(result.rows[0].count),
      unreadCount: parseInt(unreadResult.rows[0].count)
    });
  } catch (err) {
    console.error("문의 개수 조회 에러:", err);
    res.status(500).json({ error: "문의 개수 조회 실패" });
  }
});

// 문의 읽음 처리
app.patch("/inquiries/:id/read", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_read } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE inquiry
      SET is_read = $1
      WHERE id = $2
      RETURNING *
      `,
      [is_read !== undefined ? is_read : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "문의 없음" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("문의 읽음 처리 에러:", err);
    res.status(500).json({ error: "문의 읽음 처리 실패" });
  }
});

// 문의 삭제
app.delete("/inquiries/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM inquiry WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "문의 없음" });
    }

    res.json({ message: "문의 삭제 완료" });
  } catch (err) {
    console.error("문의 삭제 에러:", err);
    res.status(500).json({ error: "문의 삭제 실패" });
  }
});

// ===== 간편 상담 문의 관련 API =====

// 상담 문의 테이블 생성
const createConsultationTable = async () => {
  try {
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consultation'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("consultation 테이블이 이미 존재함. 컬럼 확인 중...");
      
      const columns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'consultation'
      `);
      
      const columnNames = columns.rows.map(r => r.column_name);
      
      // name 컬럼이 없으면 추가
      if (!columnNames.includes('name')) {
        await pool.query(`
          ALTER TABLE consultation 
          ADD COLUMN name VARCHAR(50)
        `);
        await pool.query(`UPDATE consultation SET name = '' WHERE name IS NULL`);
        await pool.query(`ALTER TABLE consultation ALTER COLUMN name SET NOT NULL`);
        console.log("name 컬럼 추가 완료");
      }
      
      // contact 컬럼이 없으면 추가
      if (!columnNames.includes('contact')) {
        await pool.query(`ALTER TABLE consultation ADD COLUMN contact VARCHAR(50)`);
        await pool.query(`UPDATE consultation SET contact = '' WHERE contact IS NULL`);
        await pool.query(`ALTER TABLE consultation ALTER COLUMN contact SET NOT NULL`);
        console.log("contact 컬럼 추가 완료");
      }
      
      // message 컬럼이 없으면 추가
      if (!columnNames.includes('message')) {
        await pool.query(`ALTER TABLE consultation ADD COLUMN message TEXT`);
        await pool.query(`UPDATE consultation SET message = '' WHERE message IS NULL`);
        await pool.query(`ALTER TABLE consultation ALTER COLUMN message SET NOT NULL`);
        console.log("message 컬럼 추가 완료");
      }
      
      // is_read 컬럼이 없으면 추가
      if (!columnNames.includes('is_read')) {
        await pool.query(`ALTER TABLE consultation ADD COLUMN is_read BOOLEAN DEFAULT false`);
        await pool.query(`UPDATE consultation SET is_read = false WHERE is_read IS NULL`);
        console.log("is_read 컬럼 추가 완료");
      }
      
      console.log("consultation 테이블 구조 확인/수정 완료");
    } else {
      console.log("consultation 테이블이 없어서 생성 중...");
      await pool.query(`
        CREATE TABLE consultation (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          contact VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("consultation 테이블 생성 완료");
    }
  } catch (err) {
    console.error("consultation 테이블 생성/수정 에러:", err);
  }
};

// 서버 시작 시 테이블 생성
(async () => {
  await createConsultationTable();
})();

// 전화번호 형식 검증 함수 (재사용)
const validatePhoneNumberForConsultation = (phone) => {
  const numbersOnly = phone.replace(/-/g, "");
  if (!/^\d+$/.test(numbersOnly)) {
    return false;
  }
  const mobilePattern = /^(010|011|016|017|018|019)\d{7,8}$/;
  const landlinePattern = /^(02|031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)\d{6,8}$/;
  return mobilePattern.test(numbersOnly) || landlinePattern.test(numbersOnly);
};

// 상담 문의 생성
app.post("/consultations", async (req, res) => {
  console.log("=== POST /consultations 요청 받음 ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  const { name, contact, message } = req.body;

  if (!name || !contact || !message) {
    return res.status(400).json({ error: "필수 값 누락 (name, contact, message)" });
  }

  // 전화번호 형식 검증
  if (!validatePhoneNumberForConsultation(contact.trim())) {
    return res.status(400).json({ 
      error: "올바른 전화번호 형식을 입력해주세요. 예: 010-1234-5678, 02-1234-5678" 
    });
  }

  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consultation'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      await createConsultationTable();
    }

    const result = await pool.query(
      `
      INSERT INTO consultation (name, contact, message)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name.trim(), contact.trim(), message.trim()]
    );

    console.log("상담 문의 생성 성공:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("상담 문의 생성 에러:", err);
    res.status(500).json({ 
      error: "상담 문의 생성 실패",
      details: err.message 
    });
  }
});

// 상담 문의 목록 조회 (관리자용)
app.get("/consultations", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM consultation
      ORDER BY created_at DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("상담 문의 목록 조회 에러:", err);
    res.status(500).json({ error: "상담 문의 목록 조회 실패" });
  }
});

// 상담 문의 개수 조회 (관리자 페이지용) - :id 라우트보다 먼저 정의해야 함
app.get("/consultations/count", async (req, res) => {
  try {
    const totalResult = await pool.query("SELECT COUNT(*) as count FROM consultation");
    const unreadResult = await pool.query(
      "SELECT COUNT(*) as count FROM consultation WHERE (is_read IS NULL OR is_read = false)"
    );

    res.json({ 
      count: parseInt(totalResult.rows[0].count),
      unreadCount: parseInt(unreadResult.rows[0].count)
    });
  } catch (err) {
    console.error("상담 문의 개수 조회 에러:", err);
    res.status(500).json({ error: "상담 문의 개수 조회 실패" });
  }
});

// 상담 문의 상세 조회 (자동으로 읽음 처리)
app.get("/consultations/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM consultation WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "상담 문의 없음" });
    }

    // 읽지 않은 문의면 자동으로 읽음 처리
    if (!result.rows[0].is_read) {
      await pool.query(
        "UPDATE consultation SET is_read = true WHERE id = $1",
        [id]
      );
      result.rows[0].is_read = true;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("상담 문의 조회 에러:", err);
    res.status(500).json({ error: "상담 문의 조회 실패" });
  }
});

// 상담 문의 읽음 처리
app.patch("/consultations/:id/read", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_read } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE consultation
      SET is_read = $1
      WHERE id = $2
      RETURNING *
      `,
      [is_read !== undefined ? is_read : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "상담 문의 없음" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("상담 문의 읽음 처리 에러:", err);
    res.status(500).json({ error: "상담 문의 읽음 처리 실패" });
  }
});

// 상담 문의 삭제
app.delete("/consultations/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM consultation WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "상담 문의 없음" });
    }

    res.json({ message: "상담 문의 삭제 완료" });
  } catch (err) {
    console.error("상담 문의 삭제 에러:", err);
    res.status(500).json({ error: "상담 문의 삭제 실패" });
  }
});

// ===== SERVER START (항상 맨 마지막) =====
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
