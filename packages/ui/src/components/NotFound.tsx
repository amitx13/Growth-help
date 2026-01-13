import { Button } from "@/components/ui/button"
import { Home } from 'lucide-react'
import { Link } from "react-router-dom"

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-extrabold text-destructive">404</h1>
          <p className="text-4xl font-bold mt-4 text-destructive">Page not found</p>
          <p className="mt-2 text-lg text-muted-foreground">Oops! The page you're looking for doesn't exist.</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Button asChild size="lg" className="w-full sm:w-auto" >
            <Link to="/">
              <Home className="mr-2 h-4 w-4 text-card-foreground" /> <div className="text-card-foreground">Home</div>
            </Link>
          </Button>
        </div>
        <div className="mt-8 ">
          <svg
            className="mx-auto h-32 w-auto text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}