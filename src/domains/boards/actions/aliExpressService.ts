import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// 알리익스프레스 개발자 설정값
const ALI_APP_KEY = process.env.ALIEXPRESS_APP_KEY || '540144';
const ALI_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || 'IftlHryLARA6XXBPDytVu7EjceIEGcsr';
const ALI_TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID || '4590fb';

/**
 * 알리익스프레스 API 호출을 위한 MD5 서명(Signature) 생성 함수
 */
function generateAliSignature(params: Record<string, string>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let baseStr = '';
  for (const key of sortedKeys) {
    baseStr += `${key}${params[key]}`;
  }
  const stringToSign = `${secret}${baseStr}${secret}`;
  return crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex').toUpperCase();
}

/**
 * 일반 알리익스프레스 상품 URL -> 사장님 제휴 트래킹 URL (s.click.aliexpress.com) 변환 함수
 */
export async function convertAliLinkToAffiliate(targetUrl: string): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const params: Record<string, string> = {
      app_key: ALI_APP_KEY,
      method: 'aliexpress.affiliate.link.generate',
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      timestamp,
      promotion_link_type: '0',
      source_values: targetUrl,
      tracking_id: ALI_TRACKING_ID,
    };

    const sign = generateAliSignature(params, ALI_APP_SECRET);
    params.sign = sign;

    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`https://api-sg.aliexpress.com/sync?${queryString}`, {
      method: 'GET',
    });

    const data = await res.json();
    const generatedUrl =
      data?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links
        ?.promotion_link?.[0]?.promotion_link;

    return generatedUrl || targetUrl;
  } catch (error) {
    console.error('AliExpress Link Conversion Error:', error);
    return targetUrl; // 실패 시 원본 유지를 통해 유저 접속 보장
  }
}
