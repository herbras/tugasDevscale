import { injectable } from "inversify";
import { prisma } from "../../../utils/prisma";

@injectable()
export abstract class BaseRepository<T> {
  protected prisma = prisma;

  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<T | null>;
}
