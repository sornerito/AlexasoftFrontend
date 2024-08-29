"use client";
import { useState, useEffect, useRef } from 'react';
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenu
} from "@nextui-org/navbar";

import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";
import Logo from "@/public/logobarrasf.png";
import { ShoppingCartIcon, CircleUserRound } from "lucide-react";
import { cerrarSesion, verificarAccesoPorPermiso } from '@/config/peticionesConfig';

export const Navbar = () => {
  const [token, setToken] = useState<string | null>();

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const toggleCategory = (categoryLabel: string) => {
    setOpenCategory(openCategory === categoryLabel ? null : categoryLabel);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpenCategory(null);
    }
  };

  useEffect(() => {
    setToken(typeof window !== 'undefined' ? sessionStorage.getItem('token') : null);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredNavItems = siteConfig.navItems
    .map(category => ({
      ...category,
      items: category.items.filter(item => verificarAccesoPorPermiso(item.permiso))
    }))
    .filter(category => category.items.length > 0);

	const filteredNavMenuItems = siteConfig.navMenuItems
    .map(category => ({
      ...category,
      items: category.items.filter(item => verificarAccesoPorPermiso(item.permiso))
    }))
    .filter(category => category.items.length > 0);

  return (
    <NextUINavbar maxWidth="xl" position="sticky" className="bg-zinc-900 text-white">
      <NavbarContent>
      <NavbarBrand as="li" className="gap-3 max-w-fit">
  <NextLink className="flex justify-start items-center gap-1" href="/">
    <img width={300} className="min-w-[100px]" src={Logo.src} alt="Logo"></img>
  </NextLink>
</NavbarBrand>

        {token ? (
          <ul className="hidden lg:flex gap-4 justify-center ml-2" ref={dropdownRef}>
            {filteredNavItems.map((category, index) => (
              <li key={`${category.categoryLabel}-${index}`} className="relative">
                <button
                  onClick={() => toggleCategory(category.categoryLabel)}
                  className="p-0 bg-transparent data-[hover=true]:bg-transparent"
                >
                  {category.categoryLabel}
                </button>
                {openCategory === category.categoryLabel && (
                  <ul className="absolute bg-zinc-900 text-white mt-2 py-2 w-50 border border-amber-400 shadow rounded-lg ">
                    {category.items.map((item, itemIndex) => (
                      <li
                        key={`${item.label}-${itemIndex}`}
                        className="hover:bg-zinc"
                      >
                        <NextLink href={item.href} passHref>
                          <Button className="bg-zinc-900 text-white w-48 border border-zinc-900" radius="sm" size='lg'>
                            {item.label}
                          </Button>
                        </NextLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : ("")}
      </NavbarContent>
      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {token ? (
          <NavbarItem className="hidden sm:flex gap-2">
            {verificarAccesoPorPermiso("Carrito de compras") ? (
              <Link className="" href="/carrito">
                <ShoppingCartIcon size={24} className="text-yellow-600 hover:text-yellow-800 mr-2" />
              </Link>
            ) : ("")}
            
            <Link className="" href="/acceso/perfil">
              <CircleUserRound size={24} className="text-yellow-600 hover:text-yellow-800 mr-2" />
            </Link>
			<Button size="sm" className="bg-gradient-to-tr from-red-600 to-red-300" onClick={cerrarSesion}>Cerrar Sesión</Button>
          </NavbarItem>
        ) : (
          <NavbarItem className="hidden sm:flex gap-2">
            <Link className="" href="../acceso/iniciarsesion">
              <Button size="sm">Iniciar Sesión</Button>
            </Link>
            <Link href="../acceso/registro">
              <Button size="sm" className="bg-gradient-to-tr from-red-500 to-yellow-500 text-white">
                Crear Cuenta
              </Button>
            </Link>
          </NavbarItem>
        )}
        <ThemeSwitch />
      </NavbarContent>
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>
      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-4">
          {filteredNavMenuItems.map((category, index) => (
            <div key={`${category.categoryLabel}-${index}`}>
              <button
                onClick={() => toggleCategory(category.categoryLabel)}
                className="block w-full text-left py-2 px-4 bg-zinc hover:bg-zinc hover:text-white"
              >
                {category.categoryLabel}
              </button>
              {openCategory === category.categoryLabel && (
                <div className="mt-2 py-2 bg-transparent text-white border-3 border-zinc-900 shadow-lg rounded-lg">
                  {category.items.map((item, itemIndex) => (
                    <div key={`${item.label}-${itemIndex}`}>
                      <NextLink href={item.href} passHref>
                        <Button className="block w-full text-left py-2 px-4 bg-transparent">
                          {item.label}
                        </Button>
                      </NextLink>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {token ? (
            <Button size="sm" className="bg-gradient-to-tr from-red-600 to-red-300" onClick={cerrarSesion}>Cerrar Sesión</Button>
          ) : ("")}
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
