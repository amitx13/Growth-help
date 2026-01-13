import { About } from "./About";
import { Footer } from "./Footer";
import { HowItWorks } from "./HowItWorks";


export const Dashboard = () => {
    return (
        <div>
            <About />
            <HowItWorks />
            <Footer/>
        </div>
    );
}