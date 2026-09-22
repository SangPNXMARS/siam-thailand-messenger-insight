"use client";

import { useMemo, useState } from "react";

const GENDER_LABELS = { nam: "Nam (suy luận)", nu: "Nữ (suy luận)", khong_xac_dinh: "Không xác định" };
const SERIES_COLORS = {
  series1: "var(--series-1)",
    series3: "var(--series-3)",
    series5: "var(--series-5)",
    series7: "var(--series-7)",
    baseline: "var(--baseline)",
  };

function fmtDate(iso) {
    if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
}
function fmtDateTime(iso) {
    if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function truncate(str, n) {
    return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function BarList({ items, maxOverride }) {
  if (!items.length) return <div className="empty-state">Chưa có dữ liệu.</div>;
  const max = maxOverride || Math.max(1, ...items.map((i) => i.value));
  return (
        <div>
    {items.map((it) => {
            const pct = Math.max(0, Math.min(100, (it.value / max) * 100));
            return (
                        <div className="barchart-row" key={it.label}>
                          <div className="barchart-label" title={it.label}>{it.label}</div>
                          <div className="barchart-wrap">
                            <div className="barchart-track">
                              <div className="barchart-fill" style={{ width: pct + "%", background: it.color || SERIES_COLORS.series1 }} />
                            </div>
                            <div className="barchart-value">{it.value.toLocaleString("vi-VN")}</div>
                          </div>
                        </div>
                      );
                                                                           })}
    </div>
        );
}

function genderPillClass(g) {
    if (g === "nam") return "gender-nam";
  if (g === "nu") return "gender-nu";
  return "gender-unk";
}

function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi"));
}

export default function Dashboard({ data }) {
  const [search, setSearch] = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState(null);

  const customers = data.customers || [];

  const pageOptions = useMemo(() => uniqueSorted(customers.map((c) => c.pageName)), [customers]);
  const genderOptions = useMemo(
    () => uniqueSorted(customers.map((c) => (c.gender ? GENDER_LABELS[c.gender] || c.gender : null))),
    [customers]
  );
  const carrierOptions = useMemo(() => uniqueSorted(customers.map((c) => c.carrier)), [customers]);
  const topicOptions = useMemo(() => uniqueSorted(customers.flatMap((c) => c.topics)), [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (q && !`${c.name} ${c.phone}`.toLowerCase().includes(q)) return false;
      if (pageFilter && c.pageName !== pageFilter) return false;
      if (genderFilter && (GENDER_LABELS[c.gender] || c.gender) !== genderFilter) return false;
      if (carrierFilter && c.carrier !== carrierFilter) return false;
      if (topicFilter && !c.topics.includes(topicFilter)) return false;
      return true;
});
}, [customers, search, pageFilter, genderFilter, carrierFilter, topicFilter]);

  const genderItems = useMemo(() => {
    return Object.entries(data.demographics.gender)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => ({
              label: GENDER_LABELS[k] || k,
              value: v,
              color: k === "nam" ? SERIES_COLORS.series1 : k === "nu" ? SERIES_COLORS.series5 : SERIES_COLORS.baseline,
      }));
  }, [data]);

  const carrierItems = useMemo(
    () => Object.entries(data.demographics.carrier).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v, color: SERIES_COLORS.series1 })),
        [data]
      );

  const topicItems = useMemo(
    () => Object.entries(data.topics).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v, color: SERIES_COLORS.series3 })),
        [data]
      );

  const keywordItems = useMemo(
    () => (data.topKeywords || []).slice(0, 12).map((k) => ({ label: k.word, value: k.count, color: SERIES_COLORS.series7 })),
        [data]
      );

  const pageSummaryItems = useMemo(
    () =>
      (data.perPageSummary || []).map((p) => ({
            label: truncate(p.pageName || p.pageId, 40),
            value: p.conversationsWithPhone,
            color: p.error ? SERIES_COLORS.baseline : SERIES_COLORS.series1,
    })),
        [data]
      );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      window.location.reload();
    } catch {
      setRefreshing(false);
    }
  }

  function toggleTheme() {
        const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const s = data.summary;

  return (
        <div>
          <div className="page-header">
            <div>
              <h1>Insight Khách hàng — BM SIAM Thailand</h1>
              <div className="meta">
    {s.totalPages} Page kết nối · Dữ liệu cập nhật: {fmtDateTime(data.generatedAt)} (cache ~1 giờ)
          </div>
            </div>
            <div className="header-actions">
              <button className="btn" onClick={toggleTheme}>Chế độ tối/sáng</button>
          <button className="btn" onClick={handleRefresh} disabled={refreshing}>
    {refreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}
          </button>
              <form method="POST" action="/api/logout">
                <button className="btn" type="submit">Đăng xuất</button>
          </form>
        </div>
      </div>

    {data.isSample && (
            <div className="sample-banner">
              ⚠️ Đang hiển thị <strong>dữ liệu mẫu (demo)</strong> — chưa cấu hình biến môi trường{" "}
              <code>META_ACCESS_TOKEN</code> trên Vercel nên chưa kéo được dữ liệu Messenger thật từ 26 Page. Thêm token
          rồi bấm &quot;Làm mới dữ liệu&quot;.
        </div>
          )}

          <div className="wrap">
            <div className="stat-grid">
              <div className="stat-tile">
                <div className="label">Số Page kết nối</div>
                <div className="value">{s.totalPages}</div>
              </div>
              <div className="stat-tile">
                <div className="label">Tổng hội thoại</div>
                <div className="value">{s.totalConversations.toLocaleString("vi-VN")}</div>
              </div>
              <div className="stat-tile">
                <div className="label">Khách để lại SĐT</div>
                <div className="value">{s.conversationsWithPhone.toLocaleString("vi-VN")}</div>
              </div>
              <div className="stat-tile">
                <div className="label">Tỉ lệ thu thập SĐT</div>
            <div className="value">{s.captureRatePercent}%</div>
              </div>
            </div>

            <div className="card">
              <h2>Số khách để lại SĐT theo từng Page</h2>
          <div className="subtitle">{s.totalPages} Page đang kết nối trong BM SIAM Thailand — Page nào lỗi kết nối sẽ hiện 0 và có ghi chú riêng.</div>
              <BarList items={pageSummaryItems} />
            </div>

            <div className="grid-2">
              <div className="card">
                <h2>Nhân khẩu học — Giới tính (suy luận từ tên)</h2>
                <div className="subtitle">Suy luận từ họ tên, không phải dữ liệu xác thực.</div>
            <BarList items={genderItems} />
          </div>
          <div className="card">
            <h2>Nhân khẩu học — Nhà mạng (suy luận từ đầu số)</h2>
            <div className="subtitle">Suy đoán theo đầu số gốc, không phản ánh khu vực địa lý thật.</div>
                <BarList items={carrierItems} />
              </div>
            </div>

            <div className="card">
              <h2>Chủ đề khách quan tâm / trao đổi</h2>
              <div className="subtitle">Số khách hàng có nhắc tới chủ đề trong tin nhắn (một khách có thể thuộc nhiều chủ đề).</div>
              <BarList items={topicItems} />
            </div>

            <div className="card">
              <h2>Top từ khoá được nhắc nhiều nhất</h2>
              <BarList items={keywordItems} />
            </div>

            <div className="card">
              <h2>Danh sách khách hàng đã để lại số điện thoại</h2>
          <div className="filters">
            <input type="text" placeholder="Tìm theo tên hoặc SĐT..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}>
                  <option value="">Tất cả Page ({pageOptions.length})</option>
    {pageOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                  <option value="">Tất cả giới tính</option>
{genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}>
              <option value="">Tất cả nhà mạng</option>
    {carrierOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
                  <option value="">Tất cả chủ đề</option>
    {topicOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="result-count">{filtered.length} / {customers.length} khách hàng</span>
          </div>

          <div className="table-scroll">
            <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>SĐT</th>
                      <th>Page</th>
                      <th>Giới tính</th>
                      <th>Nhà mạng</th>
                  <th>Chủ đề quan tâm</th>
                  <th>Tin nhắn</th>
                  <th>Lần cuối nhắn</th>
                      <th>Trích đoạn</th>
                    </tr>
                  </thead>
                  <tbody>
    {filtered.map((c, i) => {
                      const genderLabel = c.gender ? GENDER_LABELS[c.gender] || c.gender : "Không xác định";
                      const conf = c.genderConfidence === "cao" ? "(độ tin cậy cao)" : c.genderConfidence === "trung_binh" ? "(độ tin cậy trung bình)" : "";
                  return (
                                        <tr key={c.conversationId + i}>
                                          <td>{c.name}</td>
                                          <td className="phone">{c.phone}</td>
                                          <td><span className="pill page-pill" title={c.pageName}>{truncate(c.pageName || c.pageId, 24)}</span></td>
                      <td>
                        <span className={`pill ${genderPillClass(c.gender)}`}>{genderLabel}</span>
                        <br /><span className="conf-badge">{conf}</span>
                      </td>
                      <td>{c.carrier}</td>
                      <td>
{c.topics.length
                          ? c.topics.map((t) => <span className="pill" key={t}>{t}</span>)
                          : <span className="conf-badge">—</span>}
                      </td>
                      <td>{c.messageCount}</td>
                      <td>{fmtDate(c.lastMessageTime)}</td>
                      <td className="msg-sample">
{c.sampleMessages.slice(0, 2).map((m, idx) => (
                          <div key={idx}>&quot;{truncate(m, 70)}&quot;</div>
                                            ))}
                                          </td>
                                        </tr>
                                      );
                                                                                                  })}
              </tbody>
                            </table>
                          </div>
                {!filtered.length && <div className="empty-state">Không tìm thấy khách hàng phù hợp bộ lọc.</div>}
                        </div>
                      </div>
                    </div>
                  );
                                                    }
