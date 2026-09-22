// Kéo hội thoại Messenger cho một Page qua Facebook Graph API, dùng Page Access
// Token lấy được từ System User Access Token (biến môi trường META_ACCESS_TOKEN).
//
// Giới hạn cố ý để tránh timeout trên serverless function của Vercel:
//   - Tối đa CONVO_LIMIT hội thoại / page (mặc định 60, lấy các hội thoại mới cập nhật nhất trước)
//   - Tối đa MSG_LIMIT tin nhắn / hội thoại (mặc định 60)
//   - Gọi song song nhiều page cùng lúc nhưng giới hạn concurrency để tránh rate limit
//
// Nếu cần quét sâu hơn (toàn bộ lịch sử), nên chuyển sang chạy nền bằng Vercel Cron +
// lưu kết quả vào một DB/KV thay vì fetch trực tiếp trong request — xem README.

const GRAPH_BASE = "https://graph.facebook.com";
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v19.0";

const CONVO_LIMIT = 60;
const MSG_LIMIT = 60;
const CONCURRENCY = 5;

async function graphGet(path, params, { retries = 3 } = {}) {
  const url = new URL(`${GRAPH_BASE}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

      for (let attempt = 1; attempt <= retries; attempt++) {
          const res = await fetch(url.toString(), { cache: "no-store" });
              if (res.ok) return res.json();
                  if (res.status === 429 || res.status === 613) {
                        await new Promise((r) => setTimeout(r, Math.min(4000, 500 * attempt)));
                              continue;
                                  }
                                      const errBody = await res.text();
                                          throw new Error(`Graph API lỗi (status ${res.status}) tại ${path}: ${errBody}`);
                                            }
                                              throw new Error(`Vẫn bị rate limit sau ${retries} lần thử: ${path}`);
                                              }

                                              async function getPageAccessToken(pageId, systemUserToken) {
                                                try {
                                                    const data = await graphGet(`/${GRAPH_API_VERSION}/${pageId}`, {
                                                          fields: "access_token",
                                                                access_token: systemUserToken,
                                                                    });
                                                                        if (data.access_token) return data.access_token;
                                                                          } catch (e) {
                                                                              // fall through — dùng thẳng system user token
                                                                                }
                                                                                  return systemUserToken;
                                                                                  }

                                                                                  function normalizeConversation(conv, pageId) {
                                                                                    const participants = conv.participants?.data || [];
                                                                                      const customer = participants.find((p) => p.id !== pageId) || null;

                                                                                        const rawMessages = conv.messages?.data || [];
                                                                                          const messages = rawMessages
                                                                                              .map((m) => ({
                                                                                                    id: m.id,
                                                                                                          message: m.message || "",
                                                                                                                fromName: m.from?.name || null,
                                                                                                                      fromId: m.from?.id || null,
                                                                                                                            createdTime: m.created_time || null,
                                                                                                                                  isCustomer: m.from?.id !== pageId,
                                                                                                                                      }))
                                                                                                                                          .sort((a, b) => (a.createdTime || "").localeCompare(b.createdTime || ""));
                                                                                                                                          
                                                                                                                                            return {
                                                                                                                                                conversationId: conv.id,
                                                                                                                                                    customerName: customer?.name || null,
                                                                                                                                                        customerId: customer?.id || null,
                                                                                                                                                            updatedTime: conv.updated_time || null,
                                                                                                                                                                messages,
                                                                                                                                                                  };
                                                                                                                                                                  }
                                                                                                                                                                  
                                                                                                                                                                  export async function fetchPageConversations(pageId, systemUserToken) {
                                                                                                                                                                    const pageToken = await getPageAccessToken(pageId, systemUserToken);
                                                                                                                                                                      const data = await graphGet(`/${GRAPH_API_VERSION}/${pageId}/conversations`, {
                                                                                                                                                                          fields: `participants,updated_time,messages.limit(${MSG_LIMIT}){message,from,created_time}`,
                                                                                                                                                                              access_token: pageToken,
                                                                                                                                                                                  limit: String(CONVO_LIMIT),
                                                                                                                                                                                    });
                                                                                                                                                                                      const conversations = (data.data || []).map((c) => normalizeConversation(c, pageId));
                                                                                                                                                                                        return conversations;
                                                                                                                                                                                        }
                                                                                                                                                                                        
                                                                                                                                                                                        async function mapWithConcurrency(items, limit, fn) {
                                                                                                                                                                                          const results = new Array(items.length);
                                                                                                                                                                                            let idx = 0;
                                                                                                                                                                                              async function worker() {
                                                                                                                                                                                                  while (idx < items.length) {
                                                                                                                                                                                                        const current = idx++;
                                                                                                                                                                                                              try {
                                                                                                                                                                                                                      results[current] = await fn(items[current], current);
                                                                                                                                                                                                                            } catch (e) {
                                                                                                                                                                                                                                    results[current] = { error: e.message, item: items[current] };
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
                                                                                                                                                                                                                                                    return results;
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                    // pages: [{ pageId, pageName }]
                                                                                                                                                                                                                                                    export async function fetchAllPages(pages, systemUserToken) {
                                                                                                                                                                                                                                                      const results = await mapWithConcurrency(pages, CONCURRENCY, async (p) => {
                                                                                                                                                                                                                                                          const conversations = await fetchPageConversations(p.pageId, systemUserToken);
                                                                                                                                                                                                                                                              return { pageId: p.pageId, pageName: p.pageName, conversations };
                                                                                                                                                                                                                                                                });
                                                                                                                                                                                                                                                                  return results;
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                  
