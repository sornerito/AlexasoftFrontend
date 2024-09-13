import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import clsx from "clsx";


export const metadata: Metadata = {
	title: {
		default: siteConfig.name,
		template: `%s - ${siteConfig.name}`,
	},
	description: siteConfig.description,
	icons: {
		icon:  "/logopestana.png"
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	
	return (
		
		<html lang="en" suppressHydrationWarning>
			<head />
			<body
				className={clsx(
					"min-h-screen bg-background font-sans antialiased",
					fontSans.variable
				)}
			>
				<Providers themeProps={{ attribute: "class", defaultTheme: "dark", children }}>
					<div className="relative flex flex-col h-screen">
						<Navbar />
						<main className="container flex-grow px-6 pt-16 mx-auto max-w-7xl">
							{children}
						</main>
						<footer className="flex items-center justify-center w-full py-3 bg-zinc-900">
							<span className="text-white">Copyright Alexasoft</span>
						</footer>
					</div>
				</Providers>
			</body>
		</html>
		
	);
}
