import { SignupForm } from "@repo/ui";
import { useSearchParams } from "react-router-dom";
import { ZodError } from "zod";
import { CreateUserSchema, type AddNewUser, type ApiSuccessResponse, type InputUserForm } from "@repo/types";
import { toast } from "sonner"
import api from "../lib/axios";
import { useEffect, useState } from "react";
import { NewUserDialog } from "../components/NewUserDialog";

type SponsorNameState = {
    name: string;
    status: boolean;
};

export const AddUserPage = () => {
    const [searchParams] = useSearchParams();
    const refCode = searchParams.get('ref');

    const [sponsorName, setSponsorName] = useState<SponsorNameState>({
        name: "",
        status: false,
    });

    const [newUserDetails, setNewUserDetails] = useState<AddNewUser | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleAddNewUser = async (formData: InputUserForm) => {
        try {
            const validatedData = CreateUserSchema.parse(formData)
            const response: ApiSuccessResponse = await api.post("/add-new-user", validatedData)
            if (response.data.success) {
                toast.success(
                    <div className="text-primary">{response.data.message}</div>
                )
                setNewUserDetails(response.data.data)
                setIsDialogOpen(true);
            }
        } catch (error: any) {
            if (error instanceof ZodError) {
                const messages = error.issues.map((issue) => issue.message).join(' & ');
                toast.error(
                    <div className="text-destructive">{messages}</div>
                )
            }
            if (error.response?.data?.error) {
                toast.error(
                    <div className="text-destructive">{error.response?.data?.error}</div>
                )
            }
        }
    }

    const handleFetchSponsorName = async (sponsorPositionId: string) => {
        if (!sponsorPositionId) {
            setSponsorName({ name: "", status: false });
            return;
        }

        try {
            const resData = await api.get(`/fetchSponsorName/${sponsorPositionId}`);

            setSponsorName({
                name: resData.data.name,
                status: true,
            });
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(
                    <div className="text-red-500">
                        {error.response.data.error}
                    </div>
                );
            }

            setSponsorName({
                name: "Invalid Referral code",
                status: false,
            });
        }
    };

    useEffect(() => {
        if (refCode) {
            handleFetchSponsorName(refCode)
        }
    }, [refCode])

    return (
        <>
            <SignupForm
                submitButtonText={"Add User"}
                subHeadingtext={"Fill in the required details below. To add new user!"}
                handleSignUp={handleAddNewUser}
                sponsorPositionId={refCode}
                handleFetchSponsorName={handleFetchSponsorName}
                sponsorName={sponsorName}
            />
            <NewUserDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setNewUserDetails(null)
                    setIsDialogOpen(false)
                }}
                user={newUserDetails}
            />
        </>
    );
}

