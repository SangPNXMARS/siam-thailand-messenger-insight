import { unstable_cache } from "next/cache";
import { SIAM_PAGES } from "./pages";
import { fetchAllPages } from "./metaGraph";
import { extractPhones, carrierOf } from "./phone";
import { inferGender } from "./nameGender";
import { matchTopics, tokenize, TOPIC_KEYWORDS } from "./topics";
import sampleConversations from "./sampleConversations.json";

const REVALIDATE_SECONDS = 60 * 60; // 1 giờ — chỉnh nhỏ hơn nếu cần dữ liệu tươi hơn

function analyzeConversationsForPage(pageId, pageName, conversations) {
    const customers = [];
    const keywordCounter = {};

  for (const conv of conversations) {
        const customerMsgs = (conv.messages || []).filter((m) => m.isCustomer);
        if (!customerMsgs.length) continue;

      const fullText = customerMsgs.map((m) => m.message).join("\n");
        const phones = extractPhones(fullText);
        if (!phones.length) continue; // chỉ giữ khách CÓ để lại SĐT

      const phone = phones[0];
        const topicsFound = new Set();
        for (const m of customerMsgs) {
                for (const t of matchTopics(m.message || "")) topicsFound.add(t);
                for (const w of tokenize(m.message || "")) {
                          keywordCounter[w] = (keywordCounter[w] || 0) + 1;
                }
        }

      const name = conv.customerName || "Không rõ tên";
        const { gender, confidence } = inferGender(name);

      const times = customerMsgs.map((m) => m.createdTime).filter(Boolean).sort();

      customers.push({
              pageId,
              pageName,
              conversationId: conv.conversationId,
              name,
              phone,
              otherPhonesFound: phones.slice(1),
              gender,
              genderConfidence: confidence,
              carrier: carrierOf(phone),
              topics: Array.from(topicsFound).sort(),
              messageCount: customerMsgs.length,
              firstMessageTime: times[0] || null,
              lastMessageTime: times[times.length - 1] || null,
              sampleMessages: customerMsgs.map((m) => m.message).filter(Boolean).slice(0, 3),
      });
  }

  return { customers, keywordCounter, totalConversations: conversations.length };
}

function buildResult(perPageResults, { isSample }) {
    let totalConversations = 0;
    let allCustomers = [];
    const keywordCounter = {};
    const perPageSummary = [];

  for (const r of perPageResults) {
        if (r.error) {
                perPageSummary.push({
                          pageId: r.item?.pageId,
                          pageName: r.item?.pageName,
                          error: r.error,
                          totalConversations: 0,
                          conversationsWithPhone: 0,
                });
                continue;
        }
        const { pageId, pageName, conversations } = r;
        const analyzed = analyzeConversationsForPage(pageId, pageName, conversations);
        totalConversations += analyzed.totalConversations;
        allCustomers = allCustomers.concat(analyzed.customers);
        for (const [w, n] of Object.entries(analyzed.keywordCounter)) {
                keywordCounter[w] = (keywordCounter[w] || 0) + n;
        }
        perPageSummary.push({
                pageId,
                pageName,
                totalConversations: analyzed.totalConversations,
                conversationsWithPhone: analyzed.customers.length,
        });
  }

  const genderCounts = {};
    const carrierCounts = {};
    for (const c of allCustomers) {
          const g = c.gender || "khong_xac_dinh";
          genderCounts[g] = (genderCounts[g] || 0) + 1;
          carrierCounts[c.carrier] = (carrierCounts[c.carrier] || 0) + 1;
    }

  const topicCounts = {};
    for (const c of allCustomers) {
          for (const t of c.topics) topicCounts[t] = (topicCounts[t] || 0) + 1;
    }
    for (const t of Object.keys(TOPIC_KEYWORDS)) {
          if (!(t in topicCounts)) topicCounts[t] = 0;
    }

  const topKeywords = Object.entries(keywordCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

  allCustomers.sort((a, b) => (b.lastMessageTime || "").localeCompare(a.lastMessageTime || ""));

  const withPhone = allCustomers.length;
    const captureRate = totalConversations ? Math.round((withPhone / totalConversations) * 1000) / 10 : 0;

  return {
        generatedAt: new Date().toISOString(),
        isSample: !!isSample,
        summary: {
                totalPages: perPageSummary.length,
                totalConversations,
                conversationsWithPhone: withPhone,
                captureRatePercent: captureRate,
        },
        demographics: { gender: genderCounts, carrier: carrierCounts },
        topics: Object.fromEntries(Object.entries(topicCounts).sort((a, b) => b[1] - a[1])),
        topKeywords,
        perPageSummary: perPageSummary.sort((a, b) => b.conversationsWithPhone - a.conversationsWithPhone),
        customers: allCustomers,
  };
}

async function computeInsightsLive() {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
          // Chưa cấu hình token thật — dùng dữ liệu mẫu (demo) để website vẫn hiển thị được.
      const perPageResults = sampleConversations.map((p) => ({ ...p }));
          return buildResult(perPageResults, { isSample: true });
    }
    const perPageResults = await fetchAllPages(SIAM_PAGES, token);
    return buildResult(perPageResults, { isSample: false });
}

export const getInsights = unstable_cache(computeInsightsLive, ["siam-messenger-insights"], {
    revalidate: REVALIDATE_SECONDS,
    tags: ["messenger-insights"],
});
