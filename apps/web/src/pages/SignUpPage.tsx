import { SignupForm } from "@repo/ui";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreateUserSchema, ZodError, type ApiSuccessResponse, type InputUserForm } from "@repo/types";
import { toast } from "sonner"
import api from "../lib/axios";
import { useAuthStore } from "../stores/useAuthStore";
import { useEffect, useState } from "react";

type SponsorNameState = {
  name: string;
  status: boolean;
};

export const SignUpPage = () => {
    const navigate = useNavigate()

    const [searchParams] = useSearchParams();
    const refCode = searchParams.get('ref');

    const [sponsorName, setSponsorName] = useState<SponsorNameState>({
        name: "",
        status: false,
    });

    const fetchUser = useAuthStore((state) => state.fetchUser);

    const handleNavigateToLogin = () => {
        navigate('/login');
    };

    const handleSignUp = async (formData: InputUserForm) => {
        try {
            const validatedData = CreateUserSchema.parse(formData)
            const response: ApiSuccessResponse = await api.post("/sign-up", validatedData)
            if (response.data.success) {
                await fetchUser()
                toast.success(
                    <div className="text-primary">{response.data.message}</div>
                )
                navigate("/dashboard")
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
        <SignupForm onNavigateToLogin={handleNavigateToLogin} handleSignUp={handleSignUp} sponsorPositionId={refCode} handleFetchSponsorName={handleFetchSponsorName} sponsorName={sponsorName} />
    );
}