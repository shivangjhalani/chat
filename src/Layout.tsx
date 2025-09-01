import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Layout({
  menu,
  children,
}: {
  menu?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex min-h-20 border-b bg-background/80 backdrop-blur">
        <nav className="container w-full justify-between flex flex-row items-center gap-6">
          <div className="flex items-center gap-6 md:gap-10">
            <a href="/">
              <h1 className="text-base font-semibold">Chat</h1>
            </a>
          </div>
          <div className="flex items-center gap-2">
            {menu}
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="flex grow flex-col overflow-hidden">{children}</main>
      <Toaster />
    </div>
  );
}

