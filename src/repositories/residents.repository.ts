import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateResidentDTO } from "../structs/resident.struct";
import { CreateResidentDto } from "../types/resident.type";

export class ResidentsRepo {
  findByContact = async (contact: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.resident.findUnique({ where: { contact } });
  };

  updateIsRegistered = async (id: string, isRegistered: boolean, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;

    return await client.resident.update({
      where: { id },
      data: { isRegistered },
    });
  };

  createResident = async (
    data: CreateResidentDto,
    apartmentId: string,
    isRegistered: boolean,
    tx?: Prisma.TransactionClient,
  ) => {
    const client = tx || prisma;

    return await client.resident.create({
      data: { ...data, apartmentId, isRegistered },
    });
  };

  checkHouseholderjoined = async (
    apartmentId: string,
    building: string,
    unitNumber: string,
    tx: Prisma.TransactionClient,
  ) => {
    const existingHouseholder = await tx.resident.findFirst({
      where: {
        apartmentId,
        building,
        unitNumber,
        isHouseholder: "HOUSEHOLDER",
        isRegistered: true,
      },
    });
    return existingHouseholder !== null;
  };

  findResidents = async (where: Prisma.ResidentWhereInput, skip: number, take: number, apartmentId: string) => {
    const [totalCount, count, residents] = await Promise.all([
      prisma.resident.count({ where: { apartmentId } }),
      prisma.resident.count({ where }),
      prisma.resident.findMany({
        where,
        skip,
        take,
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { totalCount, count, residents };
  };

  findUser = async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  };

  findAllbyApartmentId = async (apartmentId: string) => {
    return await prisma.resident.findMany({
      where: { apartmentId },
      orderBy: [{ building: "asc" }, { unitNumber: "asc" }],
    });
  };

  getResidentById = async (residentId: string, apartmentId: string) => {
    const resident = await prisma.resident.findUnique({
      where: { id_apartmentId: { id: residentId, apartmentId } },
      include: { user: true },
    });

    return resident;
  };

  updateResident = async (
    residentId: string,
    apartmentId: string,
    data: Prisma.ResidentUpdateInput,
    tx: Prisma.TransactionClient,
  ) => {
    const client = tx || prisma;

    const resident = await client.resident.update({
      where: { id_apartmentId: { id: residentId, apartmentId } },
      data: data,
      include: { user: true },
    });

    return resident;
  };

  deleteResident = async (residentId: string, apartmentId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;

    await client.resident.delete({
      where: { id_apartmentId: { id: residentId, apartmentId } },
    });
  };
}
