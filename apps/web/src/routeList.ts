interface Route {
    label: string
    route: string
}

const routes: Route[] = [
    { label: 'Log in', route: '/login' },
    { label: 'Sign up', route: '/signup' },
    { label: 'Dashboard', route: '/dashboard', },
    { label: 'Notifications', route: '/notifications', },
    { label: 'Community', route: '/community', },
    { label: 'Wallet', route: '/wallet', },
    { label: 'Pin', route: '/pin', },
    { label: 'Profile', route: '/profile', },
    { label: 'Logout', route: '/logout', },
]

export default routes