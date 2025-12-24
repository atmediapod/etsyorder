
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Mục tiêu:
Khi tôi nhập thông tin một đơn hàng Mỹ, hãy chuyển thành đúng 1 dòng tab-separated gồm 13 cột theo layout Google Sheet của tôi. Dòng đó không được chứa bất kỳ ký tự nào ngoài dữ liệu được phân tách bằng tab. Sau đó xuất đúng 1 dòng cảnh báo USPS. Tuyệt đối không thêm bất kỳ câu giải thích, tiêu đề, hoặc văn bản nào khác ngoài 2 dòng này.

THỨ TỰ 13 CỘT TRONG GOOGLE SHEET:
A = trống (tab)
B = trống (tab)
C = trống (tab)
D = ShipToName
E = trống (tab)
F = ShipToAddress1
G = ShipToCity
H = ShipToState
I = ShipToZip
J = Country (US)
K = ShipToPhone
L = Color-Size (COLOR-WT-SIZE)
M = Quantity

LUẬT OUTPUT (KHÓA):
1. Dòng đầu tiên phải là duy nhất, chứa chính xác 13 cột cách nhau bằng TAB.
2. Bốn cột A, B, C, E luôn bắt buộc để trống.
3. Không bao giờ thêm giải thích, ký hiệu, tiêu đề, markdown, ghi chú trong dòng đầu tiên.
4. Không tự bịa dữ liệu nếu thiếu. Nếu input thiếu thông tin nào → giữ nguyên phần có dữ liệu và để trống phần thiếu.
5. Address phải chuẩn USPS: Apartment/Unit luôn ghép vào Address1. Không dùng Address2.
6. City: Chữ cái đầu in hoa, còn lại viết thường.
7. State: 2 chữ cái USPS.
8. ZIP: dạng 5 số hoặc 9 số.
9. Country: luôn US.
10. COLOR: Viết hoa hoàn toàn. Đổi GRAY thành GREY.
11. SIZE: Chuyển về dạng chuẩn S, M, L, XL, 2XL, 3XL, 4XL, 5XL.
12. Cột L luôn = COLOR-WT-SIZE.
13. Dòng 13 cột TAB-separated luôn đặt trong một khung code (\`\`\`) để copy.
14. Dòng USPS Validation nằm bên ngoài khung code, ngay bên dưới.
15. Nếu đơn hàng có nhiều sản phẩm, tách thành nhiều khối output riêng biệt (mỗi khối gồm 1 khung code và 1 dòng validation).

DÒNG THỨ HAI (USPS VALIDATION):
- Nếu hợp lệ: "✅ Địa chỉ hợp lệ, đúng chuẩn USPS."
- Nếu nghi ngờ: "⚠️ Dữ liệu có thể sai. Vui lòng kiểm tra lại ZIP, City hoặc State."
`;

export async function parseOrder(inputText: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: inputText,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0, // Keep it deterministic for parsing
    },
  });

  const text = response.text || "";
  
  // Logic to parse the AI response into blocks
  const blocks: { tabData: string; validation: string }[] = [];
  
  // Regex to match code blocks and the following validation line
  const blockRegex = /```(?:\w+)?\n([\s\S]*?)\n```\n?([^\n]*)/g;
  let match;
  
  while ((match = blockRegex.exec(text)) !== null) {
    blocks.push({
      tabData: match[1].trim(),
      validation: match[2].trim()
    });
  }

  // Fallback if formatting is slightly off
  if (blocks.length === 0 && text.trim()) {
      // Basic split as a safety net
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
          blocks.push({
              tabData: lines[0].replace(/```/g, '').trim(),
              validation: lines[1].trim()
          });
      }
  }

  return blocks;
}
