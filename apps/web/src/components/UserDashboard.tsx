import { Dashboard } from "@repo/ui";
import { useAuthStore } from "../stores/useAuthStore";
import { UserDetails } from "./UserDetails";

export const UserDashboard = () => {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <main className="flex flex-col gap-4 lg:flex-row">
          <section className="lg:sticky lg:top-4 lg:h-fit lg:w-1/3">
            {user && <UserDetails user={user} />}
          </section>
          <section className="lg:w-2/3">
            <div className="rounded-2xl border bg-card/50 p-2 sm:p-3 lg:p-4">
              <Dashboard />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
