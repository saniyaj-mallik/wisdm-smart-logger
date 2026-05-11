"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTeamModal } from "./CreateTeamModal";
import { AddMemberModal } from "./AddMemberModal";
import {
  Users, Plus, Crown, UserMinus, Trash2, Loader2, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const roleBadgeClass: Record<string, string> = {
  dev: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0",
  sme: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0",
};

function MemberRow({
  member,
  isLeader,
  canManage,
  onRemove,
  removing,
}: {
  member: TeamMember;
  isLeader: boolean;
  canManage: boolean;
  onRemove: (userId: string) => void;
  removing: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">
            {member.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{member.name}</p>
            {isLeader && (
              <Crown className="h-3 w-3 text-amber-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <Badge variant="outline" className={cn("text-xs", roleBadgeClass[member.role] ?? "")}>
          {member.role}
        </Badge>
        {isLeader && (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
            Leader
          </Badge>
        )}
        {canManage && !isLeader && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={removing}
            onClick={() => onRemove(member._id)}
          >
            {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserMinus className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function TeamCard({
  team,
  currentUserId,
  onTeamUpdate,
  onTeamDelete,
}: {
  team: Team;
  currentUserId: string;
  onTeamUpdate: (team: Team) => void;
  onTeamDelete: (teamId: string) => void;
}) {
  const isLeader = team.leaderId?._id === currentUserId;
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleRemoveMember(userId: string) {
    setRemoving(userId);
    const res = await fetch(`/api/teams/${team._id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const updated: Team = await res.json();
      onTeamUpdate(updated);
    }
    setRemoving(null);
  }

  async function handleDeleteTeam() {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/teams/${team._id}`, { method: "DELETE" });
    if (res.ok) onTeamDelete(team._id);
    setDeleting(false);
  }

  const totalCount = 1 + team.memberIds.length;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm truncate">{team.name}</h3>
            </div>
            {team.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {totalCount} {totalCount === 1 ? "member" : "members"}
            </span>
            {isLeader && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
                disabled={deleting}
                onClick={handleDeleteTeam}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-0.5">
        {team.leaderId && (
          <MemberRow
            member={team.leaderId}
            isLeader
            canManage={false}
            onRemove={() => {}}
            removing={false}
          />
        )}
        {team.memberIds.map((member) => (
          <MemberRow
            key={member._id}
            member={member}
            isLeader={false}
            canManage={isLeader}
            onRemove={handleRemoveMember}
            removing={removing === member._id}
          />
        ))}
        {team.memberIds.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No members yet</p>
        )}
      </div>

      {isLeader && (
        <div className="px-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 gap-1.5"
            onClick={() => setAddMemberOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Member
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

export function TeamManagementSection({ currentUserId }: { currentUserId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/teams");
    if (res.ok) setTeams(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  function handleCreated(team: Team) {
    setTeams((prev) => [team, ...prev]);
  }

  function handleTeamUpdate(updated: Team) {
    setTeams((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }

  function handleTeamDelete(teamId: string) {
    setTeams((prev) => prev.filter((t) => t._id !== teamId));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Teams</h2>
          <p className="text-sm text-muted-foreground">Create and manage teams for collaboration</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded" />
                <div className="h-8 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No teams yet</p>
          <p className="text-xs mt-1">Create a team to start collaborating</p>
          <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create your first team
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              currentUserId={currentUserId}
              onTeamUpdate={handleTeamUpdate}
              onTeamDelete={handleTeamDelete}
            />
          ))}
        </div>
      )}

      <CreateTeamModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
