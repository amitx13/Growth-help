import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui'
import { LayoutGrid, Wallet, Users } from 'lucide-react'
import { AutopoolPaymentsTab } from './AutopoolPaymentsTab'
import { AutopoolAccountsTab } from './AutopoolAccountsTab'
import { EligibleUsersTab } from './EligibleUsersTab'

export const AdminAutopoolPage = () => {
    return (
        <div className="space-y-6 pb-8 px-3">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Autopool Management</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage autopool payments, accounts and eligible users
                </p>
            </div>

            <Tabs defaultValue="payments">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="payments" className="gap-1.5">
                        <Wallet className="w-4 h-4" />
                        Payments
                    </TabsTrigger>
                    <TabsTrigger value="accounts" className="gap-1.5">
                        <LayoutGrid className="w-4 h-4" />
                        Accounts
                    </TabsTrigger>
                    <TabsTrigger value="eligible" className="gap-1.5">
                        <Users className="w-4 h-4" />
                        Eligible Accounts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="payments">
                    <AutopoolPaymentsTab />
                </TabsContent>
                <TabsContent value="accounts">
                    <AutopoolAccountsTab />
                </TabsContent>
                <TabsContent value="eligible">
                    <EligibleUsersTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
