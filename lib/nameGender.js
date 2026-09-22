// Suy luận giới tính từ tên tiếng Việt. Port từ name_gender_vn.py.
// KHÔNG chính xác 100% — chỉ dùng để có gợi ý nhân khẩu học tương đối.

const MALE_MIDDLE_NAMES = new Set(["van", "huu", "duc", "quoc", "cong", "ba", "manh", "xuan", "trong", "dinh"]);
const FEMALE_MIDDLE_NAMES = new Set(["thi"]);

const MALE_FIRST_NAMES = new Set([
    "hung", "dung", "tuan", "nam", "minh", "duy", "hai", "long", "khanh", "quang",
    "phong", "son", "tung", "thanh", "trung", "kien", "hoang", "phuc", "binh",
    "loc", "dat", "khoi", "vinh", "cuong", "toan", "tai", "phat", "an", "bao",
    "tin", "huy", "viet", "chien", "thang", "duc", "hieu", "khang", "nghia",
  ]);
const FEMALE_FIRST_NAMES = new Set([
    "lan", "huong", "hoa", "linh", "trang", "thu", "hang", "anh", "ha", "my",
    "ngoc", "yen", "nhi", "chi", "thao", "phuong", "quyen", "diep", "van",
    "xuan", "hanh", "giang", "tam", "nga", "loan", "kim", "tuyet", "nhung",
    "oanh", "quynh", "thuy", "dao", "vy", "suong", "trinh", "uyen", "mai",
  ]);

export function stripDiacritics(text) {
    return text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
}

export function inferGender(fullName) {
    if (!fullName || !fullName.trim()) return { gender: null, confidence: null };
    const parts = stripDiacritics(fullName.trim().toLowerCase()).split(/\s+/).filter(Boolean);
    if (!parts.length) return { gender: null, confidence: null };

  const middleWords = parts.length > 2 ? parts.slice(1, -1) : [];
    for (const w of middleWords) {
          if (FEMALE_MIDDLE_NAMES.has(w)) return { gender: "nu", confidence: "cao" };
          if (MALE_MIDDLE_NAMES.has(w)) return { gender: "nam", confidence: "cao" };
    }

  const lastWord = parts[parts.length - 1];
    if (FEMALE_FIRST_NAMES.has(lastWord) && !MALE_FIRST_NAMES.has(lastWord)) {
          return { gender: "nu", confidence: "trung_binh" };
    }
    if (MALE_FIRST_NAMES.has(lastWord) && !FEMALE_FIRST_NAMES.has(lastWord)) {
          return { gender: "nam", confidence: "trung_binh" };
    }
    return { gender: null, confidence: null };
}
