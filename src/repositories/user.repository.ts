import { JoinStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export class UserRepo {
  findSessionUserById = async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        managedApartment: { include: { boards: true } },
        resident: {
          include: { apartment: { include: { boards: true } } },
        },
      },
    });
  };

  findByUserId = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, password: true },
    });
    return user;
  };

  updatePassword = async (userId: string, newPassword: string, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  };

  updateProfile = async (userId: string, imageUrl: string, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { avatar: imageUrl },
    });
  };

  findByNameAndContact = async (name: string, contact: string) => {
    return await prisma.user.findFirst({
      where: { name, contact },
    });
  };

  updateUserJoinStatus = async (
    id: string,
    joinStatus: JoinStatus,
    residentId: string,
    tx: Prisma.TransactionClient,
  ) => {
    return await tx.user.update({
      where: { id },
      data: { joinStatus, residentId },
    });
  };

  updateUser = async (id: string, data: Prisma.UserUpdateInput, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    await client.user.update({
      where: { id },
      data: data,
    });
  };

  revokeUserAccess = async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;

    await client.user.update({
      where: { id },
      data: { joinStatus: "REJECTED", isActive: false },
    });
  };
}

export async function findUserResidentBuilding(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { resident: { select: { building: true } } },
  });
  return user?.resident?.building ?? null;
}

export async function findNotificationTargetUserIdsByApartmentId({
  apartmentId,
  buildingPermission,
}: {
  apartmentId: string;
  buildingPermission?: number;
}): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      joinStatus: "APPROVED",
      resident: {
        apartmentId,
        isRegistered: true,
        ...(buildingPermission !== undefined && buildingPermission !== 0
          ? { building: String(buildingPermission) }
          : {}),
      },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
