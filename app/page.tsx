import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { title } from "@/components/primitives";
import { Image } from "@nextui-org/react";

export default function Home() {
    return (
        <div>
            {/* Sección de encabezado con imagen de fondo y nombre */}
            <div className="relative h-[500px]">
                <Image
                    src="https://cdn.pixabay.com/photo/2019/03/08/20/17/beauty-salon-4043096_1280.jpg"
                    alt="Imagen Principal"
                    className="z-1 object-cover opacity-90"
                    width="100%"
                    height={500}
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white">Alexandra Torres</h1>
                </div>
            </div>

            {/* Sección de Servicios */}
            <section className="py-12 bg-black">
                <div className="container mx-auto px-4">
                    <h2 className={title({ color: "yellow" })}>Nuestros Servicios</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                        {/* Servicio 1 */}
                        <div className="rounded-lg shadow-md p-6">
                            <Image
                                removeWrapper
                                alt="Relaxing app background"
                                className="z-0 w-full h-full object-cover"
                                src="https://cdn.pixabay.com/photo/2016/07/14/08/39/hairdressing-1516352_1280.jpg"
                                width={300}
                                height={170}
                            />
                            <h3 className="text-xl font-bold text-white mb-2">Corte de Cabello</h3>
                            <p className="text-gray-400" style={{textAlign: "justify"}}>Ofrecemos cortes de cabello modernos y personalizados para realzar tu estilo.</p>
                        </div>

                        {/* Servicio 2 */}
                        <div className="rounded-lg shadow-md p-6">
                            <Image
                                removeWrapper
                                alt="Relaxing app background"
                                className="z-0 w-full h-full object-cover"
                                src="https://cdn.pixabay.com/photo/2020/08/30/14/56/beautician-5529803_1280.jpg"
                                width={300}
                                height={170}
                            />
                            <h3 className="text-xl font-bold text-white mb-2">Manicura y Pedicura</h3>
                            <p className="text-gray-400" style={{textAlign: "justify"}}>Cuidamos tus manos y pies con tratamientos de manicura y pedicura profesionales.</p>
                        </div>

                        {/* Servicio 3 */}
                        <div className="rounded-lg shadow-md p-6">
                            <Image
                                removeWrapper
                                alt="Relaxing app background"
                                className="z-0 w-full h-full object-cover"
                                src="https://cdn.pixabay.com/photo/2020/07/27/19/59/woman-5443384_1280.jpg"
                                width={300}
                                height={170}
                            />
                            <h3 className="text-xl font-bold text-white mb-2">Maquillaje Profesional</h3>
                            <p className="text-gray-400" style={{textAlign: "justify"}}>Realza tu belleza natural con nuestros servicios de maquillaje profesional para cualquier ocasión.</p>
                        </div>
                    </div>
                    {/* Botón para ver más servicios */}
                    <div className="text-center mt-8">
                        <Link
                            href="#"
                            className={buttonStyles({ color: "warning", radius: "full", variant: "shadow" })}
                        >
                            Ver todos los servicios
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sección Quiénes Somos */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <h2 className={title({ color: "yellow" })}>Quiénes Somos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 items-center">
                        <div>
                            <p className="text-gray-600" style={{textAlign: "justify"}}>
                                En Alexandra Torres, nos apasiona la belleza y el bienestar.
                                Nuestro equipo de profesionales altamente calificados está dedicado a brindarte una
                                experiencia excepcional y ayudarte a lucir y sentirte lo mejor posible.
                                Utilizamos productos de alta calidad y las últimas técnicas para garantizar
                                resultados impecables. Tu satisfacción es nuestra prioridad.
                            </p>
                        </div>
                        <div>
                            <Image
                                removeWrapper
                                alt="Relaxing app background"
                                className="z-0 w-full h-full object-cover"
                                src="https://cdn.pixabay.com/photo/2020/05/24/23/44/hands-5216585_1280.jpg"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ... otras secciones como Promociones, Contacto, etc. */}

        </div>
    );
}