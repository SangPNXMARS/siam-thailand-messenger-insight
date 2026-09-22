// Trích xuất & chuẩn hoá số điện thoại Việt Nam từ nội dung tin nhắn, và suy luận
// nhà mạng theo đầu số. Port từ analyze_insights.py (bản Python) sang JS.

const CANDIDATE_RE = /(\+?\d[\d\s.\-]{7,14}\d)/g;

export const CARRIER_PREFIXES = {
  "032": "Viettel", "033": "Viettel", "034": "Viettel", "035": "Viettel",
    "036": "Viettel", "037": "Viettel", "038": "Viettel", "039": "Viettel",
      "086": "Viettel", "096": "Viettel", "097": "Viettel", "098": "Viettel",
        "081": "Vinaphone", "082": "Vinaphone", "083": "Vinaphone", "084": "Vinaphone",
          "085": "Vinaphone", "088": "Vinaphone", "091": "Vinaphone", "094": "Vinaphone",
            "070": "Mobifone", "076": "Mobifone", "077": "Mobifone", "078": "Mobifone",
              "079": "Mobifone", "089": "Mobifone", "090": "Mobifone", "093": "Mobifone",
                "052": "Vietnamobile", "056": "Vietnamobile", "058": "Vietnamobile", "092": "Vietnamobile",
                  "059": "Gmobile", "099": "Gmobile",
                    "087": "iTelecom",
                    };

                    export function extractPhones(text) {
                      if (!text) return [];
                        const found = [];
                          const matches = text.match(CANDIDATE_RE) || [];
                            for (const cand of matches) {
                                let digits = cand.replace(/[\s.\-]/g, "").replace(/^\+/, "");
                                    if (digits.startsWith("84") && digits.length === 11) {
                                          digits = "0" + digits.slice(2);
                                              }
                                                  if (!/^\d+$/.test(digits)) continue;
                                                      if (digits.length !== 10) continue;
                                                          if (!digits.startsWith("0")) continue;
                                                              if (!"35789".includes(digits[1])) continue;
                                                                  found.push(digits);
                                                                    }
                                                                      return Array.from(new Set(found));
                                                                      }

                                                                      export function carrierOf(phone) {
                                                                        const prefix = phone.slice(0, 3);
                                                                          return CARRIER_PREFIXES[prefix] || "Không xác định";
                                                                          }
                                                                          
