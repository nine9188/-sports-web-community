/**
 * 🤖 4590 Football x AliExpress 24시간 자동 핫딜 포스팅 봇 (독립 실행용)
 * 
 * 사장님의 24시간 로컬 윈도우 PC (또는 Backlink Tool.exe 백그라운드)에서
 * node hotdeal-bot.js 로 실행하면 3시간마다 4590 핫딜 게시판에 저절로 포스팅됩니다!
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const ALI_APP_KEY = process.env.ALIEXPRESS_APP_KEY || '540144';
const ALI_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || 'IftlHryLARA6XXBPDytVu7EjceIEGcsr';
const ALI_TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID || '4590fb';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️ Supabase 설정값이 아직 등록되지 않았습니다. .env.local 설정을 확인해주세요.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateAliSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  let baseStr = '';
  for (const key of sortedKeys) {
    baseStr += `${key}${params[key]}`;
  }
  const stringToSign = `${secret}${baseStr}${secret}`;
  return crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex').toUpperCase();
}

async function runHotdealBot() {
  console.log('🚀 [4590 Hotdeal Bot] 핫딜 자동 수집 및 포스팅 시작:', new Date().toLocaleString());
  try {
    // 1. 알리익스프레스 핫딜 상품 조회 API (aliexpress.affiliate.product.query)
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const params = {
      app_key: ALI_APP_KEY,
      method: 'aliexpress.affiliate.product.query',
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      timestamp,
      category_ids: '18,509', // 스포츠/레저, IT/가전
      target_currency: 'KRW',
      target_language: 'KO',
      tracking_id: ALI_TRACKING_ID,
      page_no: '1',
      page_size: '5'
    };

    params.sign = generateAliSignature(params, ALI_APP_SECRET);
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`https://api-sg.aliexpress.com/sync?${queryString}`);
    const data = await res.json();

    const products = data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;

    if (!products || products.length === 0) {
      console.log('ℹ️ 수집된 새로운 알리 핫딜 상품이 없습니다.');
      return;
    }

    console.log(`✅ ${products.length}개의 알리 핫딜 상품을 발견했습니다.`);

    for (const item of products) {
      // 2. Supabase 중복 포스팅 확인 (itemId 기준)
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('title', `[Shop 알리] ${item.product_title}`)
        .maybeSingle();

      if (existing) {
        console.log(`⏩ 중복 핫딜 스킵: ${item.product_title}`);
        continue;
      }

      // 3. Supabase DB 핫딜 게시판에 100% 자동 포스팅 (INSERT)
      const { error } = await supabase.from('posts').insert({
        board_id: 'hotdeal',
        title: `[Shop 알리] ${item.product_title}`,
        content: `<p>${item.product_title}</p><br/><img src="${item.product_main_image_url}" /><br/><p>정가: ₩${item.original_price} ➔ Special Hotdeal: ₩${item.target_sale_price}</p>`,
        deal_info: {
          deal_url: item.promotion_link || item.product_detail_url,
          store: '알리익스프레스',
          product_name: item.product_title,
          price: Number(item.target_sale_price) || 0,
          original_price: Number(item.original_price) || 0,
          shipping: '무료배송',
          is_ended: false
        },
        user_id: '00000000-0000-0000-0000-000000000000', // 시스템 봇 전용 ID
        created_at: new Date().toISOString(),
      });

      if (!error) {
        console.log(`🎉 4590 핫딜 게시판 자동 포스팅 성공: ${item.product_title}`);
      } else {
        console.error('❌ 포스팅 실패:', error.message);
      }
    }
  } catch (err) {
    console.error('❌ 핫딜 봇 구동 중 오류:', err);
  }
}

// 3시간 간격 24시간 자동 실행 스케줄러
setInterval(runHotdealBot, 3 * 60 * 60 * 1000);
runHotdealBot();
