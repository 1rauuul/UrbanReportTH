import SidebarGobierno from "@/components/layout/SidebarGobierno";

export default function GobiernoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <SidebarGobierno />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
