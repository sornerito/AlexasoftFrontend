import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code"
import { button as buttonStyles } from "@nextui-org/theme";
import { title, subtitle } from "@/components/primitives";


export default function Home() {

    return (
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <div className="inline-block max-w-lg text-center justify-center">
                <h1 className={title()}>Bienvenido a </h1>
                <br /><br />
                <h1 className={title({ color: "violet" })}>Salón de Belleza Elegancia</h1>
                <br /><br />
                <h1 className={title({ color: "yellow" })}>ALEXASOFT</h1>
                <br />
                <h2 className={subtitle({ class: "mt-4" })}>
                
                    
                </h2>
            </div>

            <div className="flex gap-3">
                <Link
                    className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
                >
                    
                </Link>
                <Link
                    className={buttonStyles({ variant: "bordered", radius: "full" })}
                >
                    Reservar cita
                </Link>
            </div>

            <div className="mt-8">
                <Snippet hideSymbol hideCopyButton variant="flat">
                    <span>
                        Descubre nuestras últimas promociones <Code color="primary">aquí</Code>
                    </span>
                </Snippet>
            </div>
        </section>
    );
}