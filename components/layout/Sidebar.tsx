"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  ListChecks,
  BarChart3,
  Users,
  FileText,
  UserCog,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navGroups = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Logs", href: "/logs", icon: Clock },
    ],
  },
  {
    label: "PROJECTS",
    items: [
      { label: "All Projects", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { label: "Summary", href: "/reports/summary", icon: BarChart3 },
      {
        label: "Team Overview",
        href: "/reports/team",
        icon: Users,
      },
      {
        label: "Block Generator",
        href: "/reports/block-generator",
        icon: FileText,
      },
      {
        label: "AI Summary",
        href: "/reports/ai-summary",
        icon: Sparkles,
      },
    ],
  },
  {
    label: "ADMIN",
    adminOnly: true,
    items: [{ label: "Users", href: "/admin/users", icon: UserCog }],
  },
];

const roleBadgeClass: Record<string, string> = {
  dev: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sme: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  manager:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function SidebarContent() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "dev";

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <Clock className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm">Smart Logger</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => {
            const visibleItems = group.items;
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[1px] pl-[calc(0.75rem+1px)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <span
              className={cn(
                "inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                roleBadgeClass[role] ?? roleBadgeClass.dev
              )}
            >
              {role}
            </span>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
