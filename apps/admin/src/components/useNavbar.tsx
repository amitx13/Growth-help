import { Navbar } from "@repo/ui"
import { useNavigate } from "react-router-dom"
import routes  from "../RouteList"
import { useAdminAuthStore } from "../stores/useAdminAuthStore";

export const UserNavBar = () => {
    const navigate = useNavigate();
    const { user } = useAdminAuthStore()

    const handleNavigateToRoutes = (route: string) => {
        navigate(route);
    }
    return(
        <Navbar handleNavigateToRoutes={handleNavigateToRoutes} routeList={routes} user={user}/>
    )
}