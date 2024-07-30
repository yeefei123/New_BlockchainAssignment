import { headers } from "next/headers";
import { ReactNode } from "react";
import { cookieToInitialState } from "wagmi";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import { config } from "./config";
import Web3ModalProvider from "./context";
import { FormProvider } from "./context/FormContext";
import "./styles/globals.css";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const initialState = cookieToInitialState(config, headers().get("cookie"));

  return (
    <html lang="en">
      <head>
        <title>FunFund Crowdfunding</title>
      </head>
      <body
        className="min-h-screen flex flex-col bg-cover bg-no-repeat bg-center"
        style={{
          backgroundImage: `url('/img/background.jpg')`,
          backgroundSize: "cover",
        }}
      >
        <Web3ModalProvider initialState={initialState}>
          <div className="flex-1 flex flex-row">
            <div className="sm:flex hidden mr-10 ml-10 relative">
              <Sidebar />
            </div>
            {/* Button container */}
            <div className="absolute top-4 right-4">
              <w3m-button />
            </div>

            {/* Main content area */}
            <div className="flex-1 max-sm:w-full max-w-[1280px] mx-auto sm:pr-5">
              <FormProvider>
                <main className="flex-1 pt-5 p-4">{children}</main>
              </FormProvider>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </Web3ModalProvider>
      </body>
    </html>
  );
};

export default Layout;
