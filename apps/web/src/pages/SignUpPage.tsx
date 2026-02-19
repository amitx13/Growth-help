import { SignupForm } from "@repo/ui";
import { useNavigate, useSearchParams } from "react-router-dom";
import { type ApiSuccessResponse, type InputUserForm } from "@repo/types";
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
        if (!formData.name || formData.name.trim().length < 2) {
            toast.error(
                <div className="text-destructive">
                    Name must be at least 2 characters
                </div>
            );
            return;
        }

        if (!formData.mobile || formData.mobile.trim().length < 10) {
            toast.error(
                <div className="text-destructive">
                    Mobile number must be at least 10 digits
                </div>
            );
            return;
        }

        if (
            !formData.email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            toast.error(
                <div className="text-destructive">
                    Invalid email address
                </div>
            );
            return;
        }

        if (!formData.password || formData.password.length < 8) {
            toast.error(
                <div className="text-destructive">
                    Password must be at least 8 characters
                </div>
            );
            return;
        }

        if (!formData.sponsorPositionId) {
            toast.error(
                <div className="text-destructive">
                    Sponsor Position ID is required
                </div>
            );
            return;
        }

        if (!formData.activationPin) {
            toast.error(
                <div className="text-destructive">
                    Activation pin is required
                </div>
            );
            return;
        }
        try {
            const response: ApiSuccessResponse = await api.post("/sign-up", formData)
            if (response.data.success) {
                await fetchUser()
                toast.success(
                    <div className="text-primary">{response.data.message}</div>
                )
                navigate("/dashboard")
            }
        } catch (error: any) {
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