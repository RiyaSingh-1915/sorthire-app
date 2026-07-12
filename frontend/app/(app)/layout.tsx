import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60 flex-1 p-8 min-h-screen">{children}</div>
    </div>
  );
}
