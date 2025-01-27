"use client";

import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import { Card, CardBody } from "@nextui-org/react";
import { CircleX } from "lucide-react";

export default function noAcceso() {
  return (
    <div className="items-center text-center  w-80">
      <Card>
        <CardBody className="grid items-center justify-center grid-cols-2">
          <div className="items-center">
            <CircleX size={100} />
          </div>

          <div>
            <h2>¡Error!</h2>
            <p>No tiene acceso</p>
            <Link href="/">
              <Button>Volver al inicio</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
