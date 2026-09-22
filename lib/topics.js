import { stripDiacritics } from "./nameGender";

// Từ điển chủ đề mặc định — chỉnh theo ngành thẩm mỹ/y tế cho SIAM Thailand.
// Có thể sửa trực tiếp file này để thêm/bớt chủ đề & từ khoá.
export const TOPIC_KEYWORDS = {
    "Giá cả": ["gia", "bao nhieu tien", "gia bao nhieu", "khuyen mai", "giam gia", "sale", "uu dai", "chi phi"],
    "Dịch vụ/Liệu trình": ["dich vu", "lieu trinh", "phau thuat", "tham my", "hut mo", "nang nguc", "cay mo", "treo sa tre"],
    "Đặt lịch/Tư vấn": ["dat lich", "tu van", "hen", "kham", "lich hen", "goi lai cho em", "goi cho toi", "gap bac si"],
    "Bảo hành/Kết quả": ["bao hanh", "ket qua", "bien chung", "an toan", "rui ro", "hoi phuc", "sung"],
    "Thanh toán": ["thanh toan", "chuyen khoan", "tra gop", "cod", "gia goi"],
    "Địa điểm/Chi nhánh": ["dia chi", "chi nhanh", "o dau", "ha noi", "tphcm", "sai gon"],
    "Khiếu nại": ["khieu nai", "khong hai long", "phan nan", "cham", "tra loi cham", "that vong"],
};

function wordBounded(text) {
    const words = stripDiacritics(text.toLowerCase()).match(/[a-z]+/g) || [];
    return " " + words.join(" ") + " ";
}

export function matchTopics(text, topicKeywords = TOPIC_KEYWORDS) {
    const normalized = wordBounded(text);
    const matched = new Set();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
          for (const kw of keywords) {
                  const kwWords = stripDiacritics(kw.toLowerCase()).match(/[a-z]+/g) || [];
                  const kwNorm = " " + kwWords.join(" ") + " ";
                  if (normalized.includes(kwNorm)) {
                            matched.add(topic);
                            break;
                  }
          }
    }
    return matched;
}

const STOPWORDS = new Set(
    stripDiacritics(`
      va cua la co khong em anh chi a cho minh duoc nay do voi rat thi ma de khi
        se da oi nhe vay nha da ben toi ban cac nhung mot hai ba nguoi rang neu vi
          tu trong ngoai tren duoi sau truoc cung theo qua nen sao gi day the nao
            oi da vang uh um roi luon nay kia ay a
              `).trim().split(/\s+/)
  );

export function tokenize(text) {
    const words = stripDiacritics(text.toLowerCase()).match(/[a-z]+/g) || [];
    return words.filter((w) => w.length > 2 && !STOPWORDS.has(w));
}
