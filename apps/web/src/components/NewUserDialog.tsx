import type { AddNewUser } from "@repo/types"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Button,
    Separator
} from "@repo/ui"
import {
    CheckCircle2,
    User,
    Mail,
    Phone,
    Key,
    Hash,
    UserCheck,
    ExternalLink
} from "lucide-react"

interface NewUserDialogProps {
    isOpen: boolean
    onClose: () => void
    user: AddNewUser | null
}

export function NewUserDialog({ isOpen, onClose, user }: NewUserDialogProps) {
    if (!user) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md w-[95vw]">
                <DialogHeader className="space-y-2 pb-3">
                    <DialogTitle className="text-xl font-bold text-center justify-center">User Created!</DialogTitle>
                    <DialogDescription className="text-sm flex items-center gap-2 justify-center text-center">
                        <div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="text-green-500" />
                        </div>
                        New user registered successfully.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    {/* Personal Info - Compact */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                            <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <div className="text-xs min-w-0 flex-1">
                                <p className="text-muted-foreground">Name</p>
                                <p className="font-semibold truncate">{user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                            <div className="text-xs min-w-0 flex-1">
                                <p className="text-muted-foreground">ID</p>
                                <p className="font-mono font-semibold truncate">{user.id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <div className="text-xs min-w-0 flex-1">
                                <p className="text-muted-foreground">Email</p>
                                <p className=" font-semibold truncate">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <div className="text-xs min-w-0 flex-1">
                                <p className="text-muted-foreground">Mobile</p>
                                <p className="font-semibold truncate">{user.mobile}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                            <Key className="w-3.5 h-3.5 flex-shrink-0" />
                            <div className="text-xs min-w-0 flex-1">
                                <p className="font-medium text-muted-foreground">Password</p>
                                <p className="font-mono font-bold truncate">{user.password}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sponsor Info - Compact */}
                    {(user.sponsorUserId || user.sponsorName || user.sponsorMobile) && (
                        <>
                            <Separator className="my-2" />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50/50 border border-emerald-200/50">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    <p className="text-xs font-semibold">Sponsor</p>
                                </div>

                                {user.sponsorUserId && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 ml-6">
                                        <Hash className="w-3 h-3 flex-shrink-0" />
                                        <p className="text-xs font-mono truncate">ID: {user.sponsorUserId}</p>
                                    </div>
                                )}

                                {user.sponsorName && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 ml-6">
                                        <User className="w-3 h-3 flex-shrink-0" />
                                        <p className="text-xs font-semibold truncate">Name: {user.sponsorName}</p>
                                    </div>
                                )}
                                {user.sponsorMobile && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 ml-6">
                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                        <p className="text-xs font-semibold truncate">Phone: {user.sponsorMobile}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                    <Button
                        variant="default"
                        className="flex-1 gap-1.5 text-sm"
                        onClick={onClose}
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}