export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Alexandra Torres",
  description: "",
  navItems: [
    /*{
      categoryLabel: "General",
      items: [
        { label: "Inicio", href: "/" }
      ]
    },*/
    
    {
      categoryLabel: "Administración",
      items: [
        { label: "Roles", href: "/admin/roles", permiso:"Gestionar Roles" },
        { label: "Usuarios", href: "/admin/usuarios", permiso:"Gestionar Usuarios" },
        { label: "Clientes", href: "/admin/clientes", permiso:"Gestionar Clientes" }
      ]
    },
    {
      categoryLabel: "Ventas",
      items: [
        { label: "Ventas", href: "/admin/ventas", permiso:"Gestionar Ventas" },
        // { label: "Detalles Productos", href: "/admin/ventas/dp" },
        //{ label: "Detalles Servicios", href: "/admin/ventas/ds" }
      ]
    },
    {
      categoryLabel: "Compras",
      items: [
        { label: "Proveedores", href: "/admin/compras/proveedores", permiso:"Gestionar Proveedores" },
        { label: "Salida Insumos", href: "/admin/compras/SalidaInusmos", permiso:"Gestionar Insumos" },
        { label: "Categoría Producto", href: "/admin/compras/categoriaProducto", permiso:"Gestionar Categoria de Productos" },
        { label: "Producto", href: "/admin/compras/producto", permiso:"Gestionar Producto" },
        { label: "Compra", href: "/admin/compras/compra", permiso:"Gestionar Compras" }
      ]
    },
    {
      categoryLabel: "Agendamiento",
      items: [
        { label: "Citas", href: "/admin/Agendamiento/citas", permiso:"Gestionar Agendamiento" },
        { label: "Colaboradores", href: "/admin/Agendamiento/colaboradores", permiso:"Gestionar Colaboradores" },
        { label: "Horarios", href: "/admin/Agendamiento/horario", permiso:"Gestionar Horario" },
        { label: "Motivos", href: "/admin/Agendamiento/motivo", permiso:"Gestionar Agendamiento" },
        { label: "Horarios", href: "/colaborador", permiso:"Gestionar C Horario" },
      ]
    },
    {
      categoryLabel: "Servicios",
      items: [
        { label: "Servicios", href: "/admin/servicios", permiso:"Gestionar Servicios" },
        { label: "Paquetes", href: "/admin/paquetes", permiso:"Gestionar Paquetes" }
      ]
    },
    {
      categoryLabel: "Clientes",
      items: [
        { label: "Citas", href: "/cliente", permiso:"Gestionar Cita" },
      ]
    }
    
  ],
  navMenuItems: [
    /*{
      categoryLabel: "General",
      items: [
        { label: "Inicio", href: "/" }
      ]
    },*/
    {
      categoryLabel: "Administración",
      items: [
        { label: "Roles", href: "/admin/roles", permiso:"Gestionar Roles" },
        { label: "Usuarios", href: "/admin/usuarios", permiso:"Gestionar Usuarios" },
        { label: "Clientes", href: "/admin/clientes", permiso:"Gestionar Clientes" }
      ]
    },
    {
      categoryLabel: "Ventas",
      items: [
        { label: "Ventas", href: "/admin/ventas", permiso:"Gestionar Ventas" },
        //{ label: "Detalles Productos", href: "/admin/ventas/dp" },
        //{ label: "Detalles Servicios", href: "/admin/ventas/ds" }
      ]
    },
    {
      categoryLabel: "Compras",
      items: [
        { label: "Proveedores", href: "/admin/compras/proveedores", permiso:"Gestionar Proveedores" },
        { label: "Salida Insumos", href: "/admin/compras/SalidaInusmos", permiso:"Gestionar Insumos" },
        { label: "Categoría Producto", href: "/admin/compras/categoriaProducto", permiso:"Gestionar Categoria de Productos" },
        { label: "Producto", href: "/admin/compras/producto", permiso:"Gestionar Producto" },
        { label: "Compra", href: "/admin/compras/compra", permiso:"Gestionar Compras" }
      ]
    },
    {
      categoryLabel: "Agendamiento",
      items: [
        { label: "Citas", href: "/admin/Agendamiento/citas", permiso:"Gestionar Agendamiento" },
        { label: "Colaboradores", href: "/admin/Agendamiento/colaboradores", permiso:"Gestionar Colaboradores" },
        { label: "Horarios", href: "/admin/Agendamiento/horario", permiso:"Gestionar Horario" },
        { label: "Motivos", href: "/admin/Agendamiento/motivo", permiso:"Gestionar Agendamiento" }
      ]
    },
    {
      categoryLabel: "Servicios",
      items: [
        { label: "Servicios", href: "/admin/servicios", permiso:"Gestionar Sevicios" },
        { label: "Paquetes", href: "/admin/paquetes", permiso:"Gestionar Paquetes" }
      ]
    },
    {
      categoryLabel: "Cuenta",
      items: [
        { label: "Crear Cuenta", href: "/acceso/registro", permiso:"noToken" },
        { label: "Iniciar Sesión", href: "/acceso/iniciarsesion", permiso:"noToken" }
      ]
    }
  ],
  links: {},
};
