import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui";
import { Bell, LinkIcon, CircleArrowDown } from "lucide-react";
import { IncomingPaymentsList } from "./IncomingPaymentsList";
import { PendingLinksList } from "./PendingLinksList";

export const NotificationCenter = () => {
  const [activeTab, setActiveTab] = useState<"incoming" | "pending">("incoming");

  return (
    <div className="w-full px-3">
      {/* Constrain max width on desktop, center it */}
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-4 mt-4 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 shadow-md p-4">
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                Notification
              </h1>

              <p className="text-xs text-muted-foreground sm:text-sm">
                Manage payments and pending actions
              </p>
            </div>
          </div>
        </div>

        {/* Main content card */}
        <div className="rounded-2xl border bg-card shadow-sm">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            {/* Tabs */}
            <div className="border-b bg-muted/30 px-4 pt-4 sm:px-6">
              <TabsList className="inline-flex h-auto w-full gap-2 bg-transparent p-0 sm:w-auto">
                <TabsTrigger
                  value="incoming"
                  className="flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-none"
                >
                  <CircleArrowDown className="h-4 w-4" />
                  <span className="text-xs font-medium sm:text-sm">
                    Incoming payments
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-none"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-xs font-medium sm:text-sm">
                    Pending links
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content area */}
            <div className="p-4 sm:p-6">
              <TabsContent value="incoming" className="mt-0">
                <IncomingPaymentsList />
              </TabsContent>

              <TabsContent value="pending" className="mt-0">
                <PendingLinksList />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
