import { ActivityFeed } from "@/components/team/ActivityFeed";
import TeamHierarchy from "@/components/team/TeamHierarchy";

export default function Team() {
  return (
    <div className="space-y-6">
      <ActivityFeed />
      <TeamHierarchy />
    </div>
  );
}
