import { Optional } from "sequelize";
import { AddictionAttributes } from "../types/addiction";

interface AddictionCreationAttributes
    extends Optional<AddictionAttributes, "id" | "addiction"> {}
