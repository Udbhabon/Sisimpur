import Background from "@/components/layout/Background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Background />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
