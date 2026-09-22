import { getInsights } from "../lib/analyze";
import Dashboard from "../components/Dashboard";

export const maxDuration = 60;

export default async function HomePage() {
  const data = await getInsights();
    return <Dashboard data={data} />;
    }
    
