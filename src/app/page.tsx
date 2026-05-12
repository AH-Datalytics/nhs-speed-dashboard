import SpeedDashboard from "@/components/SpeedDashboard";

export const revalidate = 86400;

const API =
  "https://datahub.transportation.gov/resource/ra4w-8xud.json?$limit=50000";

export interface SpeedRow {
  year: string;
  month: string;
  vehicle_type: string;
  time_period: string;
  area: string;
  f_system: string;
  median_speed: string;
  median_speed_2019: string;
  median_speed_previousmonth?: string;
  median_speed_previousyear?: string;
}

async function fetchData(): Promise<SpeedRow[]> {
  const res = await fetch(API, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch NHS speed data");
  return res.json();
}

export default async function Page() {
  const data = await fetchData();

  return (
    <>
      <div className="shell" style={{ paddingTop: 20, paddingBottom: 20 }}>
        <h1 className="section-title">
          National Highway System <span>Traffic Speeds</span>
        </h1>
        <SpeedDashboard data={data} />
        <div className="footer">
          Data from{" "}
          <a
            href="https://datahub.transportation.gov/Roadways-and-Bridges/Monthly-NHS-Traffic-Speed/ra4w-8xud"
            target="_blank"
            rel="noopener"
          >
            USDOT DataHub
          </a>{" "}
          &middot; Built by AH Datalytics
        </div>
      </div>
    </>
  );
}
