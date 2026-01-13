interface Route {
    label: string
    route: string
}

const routes: Route[] = [
    { label: 'Dashboard', route: '/dashboard', },
    { label: 'Users', route: '/users', },
    { label: 'Payments', route: '/payments', },
    { label: 'Pin', route: '/pin', },
    { label: 'Settings', route: '/settings', },
    { label: 'Log in', route: '/login' },
    { label: 'Logout', route: '/logout', },
]

export default routes