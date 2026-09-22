import "./globals.css";

export const metadata = {
    title: "Insight Khách hàng — BM SIAM Thailand",
    description: "Report insight khách hàng để lại SĐT qua Messenger cho các Page trong BM SIAM Thailand",
};

export default function RootLayout({ children }) {
    return (
          <html lang="vi">
            <body>{children}</body>
      </html>
    );
}
