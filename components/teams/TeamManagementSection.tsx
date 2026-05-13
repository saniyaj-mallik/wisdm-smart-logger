"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateTeamModal } from "./CreateTeamModal";
import { AddMemberModal } from "./AddMemberModal";
import {
  Users, Plus, Crown, UserMinus, Trash2, Loader2, MoreHorizontal, UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  leaderId: TeamMember | null;
  memberIds: TeamMember[];
}

// ── Accent palette — all class strings are static for Tailwind purge ──────────

const ACCENTS = [
  { border: "border-t-blue-500",    iconBg: "bg-blue-100 dark:bg-blue-900/40",    iconColor: "text-blue-600 dark:text-blue-400"    },
  { border: "border-t-violet-500",  iconBg: "bg-violet-100 dark:bg-violet-900/40", iconColor: "text-violet-600 dark:text-violet-400" },
  { border: "border-t-emerald-500", iconBg: "bg-emerald-100 dark:bg-emerald-900/40", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { border: "border-t-amber-500",   iconBg: "bg-amber-100 dark:bg-amber-900/40",   iconColor: "text-amber-600 dark:text-amber-400"   },
  { border: "border-t-rose-500",    iconBg: "bg-rose-100 dark:bg-rose-900/40",     iconColor: "text-rose-600 dark:text-rose-400"     },
  { border: "border-t-cyan-500",    iconBg: "bg-cyan-100 dark:bg-cyan-900/40",     iconColor: "text-cyan-600 dark:text-cyan-400"     },
] as const;

const ROLE_BADGE: Record<string, string> = {
  dev:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sme:     "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  admin:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const AVATAR_PALETTES = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
];

function avatarColor(name: string) {
  return AVATAR_PALETTES[(name.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length];
}

// ── Member row ─────────────────────────────────────────────────────────────────

function MemberRow({
  member, isLeader, canRemove, onRemove, removing,
}: {
  member: TeamMember;
  isLeader: boolean;
  canRemove: boolean;
  onRemove: (id: string) => void;
  removing: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
      isLeader
        ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40"
        : "hover:bg-muted/50"
    )}>
      {/* Avatar + info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold",
            avatarColor(member.name)
          )}>
            {member.name.charAt(0).toUpperCase()}
          </div>
          {isLeader && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shadow-sm">
              <Crown className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{member.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
        </div>
      </div>

      {/* Role + actions */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className={cn(
          "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
          ROLE_BADGE[member.role] ?? ROLE_BADGE.dev
        )}>
          {member.role}
        </span>
        {isLeader && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Leader
          </span>
        )}
        {canRemove && (
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-0.5"
            disabled={removing}
            onClick={() => onRemove(member._id)}
          >
            {removing
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <UserMinus className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCard({
  team, colorIndex, currentUserId, onTeamUpdate, onTeamDelete,
}: {
  team: Team;
  colorIndex: number;
  currentUserId: string;
  onTeamUpdate: (t: Team) => void;
  onTeamDelete: (id: string) => void;
}) {
  const isLeader = team.leaderId?._id === currentUserId;
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removing, setRemoving]           = useState<string | null>(null);
  const [deleting, setDeleting]           = useState(false);

  const accent     = ACCENTS[colorIndex % ACCENTS.length];
  const totalCount = 1 + team.memberIds.length;

  async function handleRemoveMember(userId: string) {
    setRemoving(userId);
    const res = await fetch(`/api/teams/${team._id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) onTeamUpdate(await res.json());
    setRemoving(null);
  }

  async function handleDeleteTeam() {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/teams/${team._id}`, { method: "DELETE" });
    if (res.ok) onTeamDelete(team._id);
    setDeleting(false);
  }

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card overflow-hidden border-t-[3px] flex flex-col shadow-sm hover:shadow-md transition-shadow",
      accent.border
    )}>
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {/* Icon */}
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", accent.iconBg)}>
          <Users className={cn("h-4 w-4", accent.iconColor)} />
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight">{team.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                {team.description || "No description"}
              </p>
            </div>

            {/* Member count + actions */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                {totalCount} {totalCount === 1 ? "member" : "members"}
              </span>
              {isLeader && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 text-sm"
                      onClick={handleDeleteTeam}
                      disabled={deleting}
                    >
                      {deleting
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                      Delete Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 border-t border-border" />

      {/* ── Members ── */}
      <div className="flex-1 px-3 py-3 space-y-1.5">
        {team.leaderId && (
          <MemberRow
            member={team.leaderId}
            isLeader
            canRemove={false}
            onRemove={() => {}}
            removing={false}
          />
        )}
        {team.memberIds.map((m) => (
          <MemberRow
            key={m._id}
            member={m}
            isLeader={false}
            canRemove={isLeader}
            onRemove={handleRemoveMember}
            removing={removing === m._id}
          />
        ))}
        {!team.leaderId && team.memberIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <UserCircle2 className="h-6 w-6 opacity-30 mb-1" />
            <p className="text-xs">No members yet</p>
          </div>
        )}
      </div>

      {/* ── Add member footer ── */}
      {isLeader && (
        <div className="px-3 pb-3 pt-1">
          <Button
            variant="outline" size="sm"
            className="w-full h-8 text-xs gap-1.5 border-dashed"
            onClick={() => setAddMemberOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add Member
          </Button>
        </div>
      )}

      <AddMemberModal
        teamId={team._id}
        currentMemberIds={team.memberIds.map((m) => m._id)}
        leaderId={team.leaderId?._id ?? ""}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onAdded={onTeamUpdate}
      />
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export function TeamManagementSection({ currentUserId }: { currentUserId: string }) {
  const [teams, setTeams]           = useState<Team[]>([]);
  const [loading, setLoading]       = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/teams");
    if (res.ok) setTeams(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const totalMembers = teams.reduce((s, t) => s + 1 + t.memberIds.length, 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-5">
          <div>
            <p className="text-2xl font-bold font-mono leading-none">{teams.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Teams</p>
          </div>
          {teams.length > 0 && (
            <>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-2xl font-bold font-mono leading-none">{totalMembers}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Members</p>
              </div>
            </>
          )}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create Team
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border border-t-4 border-t-muted bg-card overflow-hidden shadow-sm">
              <div className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-2.5 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="mx-4 border-t border-border" />
              <div className="p-3 space-y-2">
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl text-muted-foreground">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm font-semibold">No teams yet</p>
          <p className="text-xs mt-1 max-w-xs text-center">
            Create a team to group colleagues and track shared work across projects.
          </p>
          <Button size="sm" className="mt-5 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create your first team
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, i) => (
            <TeamCard
              key={team._id}
              team={team}
              colorIndex={i}
              currentUserId={currentUserId}
              onTeamUpdate={(u) => setTeams((p) => p.map((t) => t._id === u._id ? u : t))}
              onTeamDelete={(id) => setTeams((p) => p.filter((t) => t._id !== id))}
            />
          ))}
        </div>
      )}

      <CreateTeamModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(team) => setTeams((p) => [team, ...p])}
      />
    </div>
  );
}
