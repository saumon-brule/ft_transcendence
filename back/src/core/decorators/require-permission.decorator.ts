import { Permission } from "@flex/shared";
import { Reflector } from "@nestjs/core";

export const RequirePermission = Reflector.createDecorator<Permission>();
