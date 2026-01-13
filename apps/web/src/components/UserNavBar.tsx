import { Navbar } from "@repo/ui"
import { useNavigate } from "react-router-dom"
import routes  from "../routeList"
import { useAuthStore } from "../stores/useAuthStore";

export const UserNavBar = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore()

    const handleNavigateToRoutes = (route: string) => {
        navigate(route);
    }
    return(
        <Navbar handleNavigateToRoutes={handleNavigateToRoutes} routeList={routes} user={user}/>
    )
}